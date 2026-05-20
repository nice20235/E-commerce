from __future__ import annotations

import time
import logging
from typing import Any, Dict, Tuple, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud import transaction as transaction_crud
from app.crud.order import update_order_status
from app.models.transaction import Transaction
from app.models.order import Order, OrderStatus
from app.models.cart import Cart
from app.models.stepup import StepUp


# Error codes from specification
ERROR_INVALID_ACCOUNT = -31001
ERROR_TRANSACTION_NOT_FOUND = -31003
ERROR_CANNOT_CANCEL = -31007
ERROR_TRANSACTION_FINISHED = -31008
ERROR_INVALID_REQUEST = -31050


def now_ms() -> int:
    """Return current Unix time in milliseconds."""
    return int(time.time() * 1000)


class RpcHandler:
    """Handler for JSON-RPC methods.

    Supported methods:
    - CheckPerformTransaction
    - CreateTransaction
    - PerformTransaction
    - CancelTransaction
    - CheckTransaction
    - GetStatement
    """

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self._logger = logging.getLogger(__name__)

    async def handle(self, method: str, params: Dict[str, Any]) -> Tuple[Optional[Dict[str, Any]], Optional[Dict[str, Any]]]:
        """Route method to handler.

        Returns (result, error) where one of them is None.
        error has shape {"code": int, "message": str}.
        """

        if method == "CheckPerformTransaction":
            return await self._check_perform_transaction(params)
        if method == "CreateTransaction":
            return await self._create_transaction(params)
        if method == "PerformTransaction":
            return await self._perform_transaction(params)
        if method == "CancelTransaction":
            return await self._cancel_transaction(params)
        if method == "CheckTransaction":
            return await self._check_transaction(params)
        if method == "GetStatement":
            return await self._get_statement(params)

        return None, {"code": ERROR_INVALID_REQUEST, "message": "Method not found"}

    async def _check_perform_transaction(self, params: Dict[str, Any]) -> Tuple[Dict[str, Any], None] | Tuple[None, Dict[str, Any]]:
        amount = params.get("amount")
        account = params.get("account", {}) or {}

        if not isinstance(amount, int) or amount <= 0:
            return None, {"code": ERROR_INVALID_REQUEST, "message": "Invalid amount"}

        # account must contain either phone or at least order id
        phone = account.get("phone")
        # Accept both "order" and legacy/alternative key "order_id" for compatibility
        order = account.get("order") or account.get("order_id")
        if not (phone or order):
            return None, {"code": ERROR_INVALID_ACCOUNT, "message": "Invalid account"}

        # If order is provided, validate it and the amount against the order in DB.
        # We accept public ids like "order_1" as well as raw numeric ids/strings.
        if order:
            order_db_id: Optional[int] = None

            # Public id style: "order_1"
            if isinstance(order, str) and order.startswith("order_"):
                _, _, maybe_id = order.partition("_")
                try:
                    order_db_id = int(maybe_id)
                except (TypeError, ValueError):
                    order_db_id = None
            # Plain numeric id (int or numeric string)
            elif isinstance(order, int):
                order_db_id = order
            elif isinstance(order, str) and order.isdigit():
                order_db_id = int(order)

            if order_db_id is not None:
                result = await self.db.execute(select(Order).where(Order.id == order_db_id))
                db_order = result.scalar_one_or_none()
                if not db_order:
                    # Заказ не найден — явно запрещаем выполнение платежа
                    return {"allow": False, "error": "Order not found"}, None

                # Проверка статуса заказа перед проверкой суммы
                status_raw = getattr(db_order, "status", None)
                if isinstance(status_raw, OrderStatus):
                    status_name = status_raw.value
                else:
                    status_name = str(status_raw or "")
                status_upper = status_name.upper()

                if status_upper == "PAID":
                    # Заказ уже оплачен
                    return {"allow": False, "error": "Order already paid"}, None

                # Обрабатываем возможные промежуточные статусы как "оплата в процессе"
                if status_upper in {"PROCESSING", "CONFIRMED", "PREPARING", "READY", "DELIVERED"}:
                    return {"allow": False, "error": "Payment already in progress"}, None

                # Order totals in our system are stored as integer minor units (tiyin).
                # The acquiring protocol also sends integer tiyin, so compare as ints.
                order_total_int = int(db_order.total_amount or 0)
                if amount != order_total_int:
                    return None, {"code": ERROR_INVALID_REQUEST, "message": "Invalid amount"}

        # Если все проверки прошли — позволяем выполнить транзакцию
        return {"allow": True}, None

    async def _create_transaction(self, params: Dict[str, Any]) -> Tuple[Dict[str, Any], None] | Tuple[None, Dict[str, Any]]:
        acquirer_id = params.get("id")
        amount = params.get("amount")
        account = params.get("account", {}) or {}

        if not isinstance(acquirer_id, str) or not acquirer_id:
            return None, {"code": ERROR_INVALID_REQUEST, "message": "Invalid id"}
        if not isinstance(amount, int) or amount <= 0:
            return None, {"code": ERROR_INVALID_REQUEST, "message": "Invalid amount"}

        # Idempotent: if tx already exists, return existing state
        existing = await transaction_crud.get_by_acquirer_id(self.db, acquirer_id)
        if existing:
            return {
                "create_time": existing.create_time,
                "transaction": existing.transaction,
                "state": existing.state,
            }, None

        create_time = now_ms()
        merchant_tx_id = acquirer_id  # simple mapping 1:1

        tx = await transaction_crud.create_transaction(
            self.db,
            acquirer_id=acquirer_id,
            merchant_transaction_id=merchant_tx_id,
            amount=amount,
            state=1,
            create_time=create_time,
            account_data=account,
        )
        await self.db.commit()

        return {
            "create_time": tx.create_time,
            "transaction": tx.transaction,
            "state": tx.state,
        }, None

    async def _perform_transaction(self, params: Dict[str, Any]) -> Tuple[Dict[str, Any], None] | Tuple[None, Dict[str, Any]]:
        acquirer_id = params.get("id")
        if not isinstance(acquirer_id, str) or not acquirer_id:
            return None, {"code": ERROR_INVALID_REQUEST, "message": "Invalid id"}

        tx = await transaction_crud.get_by_acquirer_id(self.db, acquirer_id)
        if not tx:
            return None, {"code": ERROR_TRANSACTION_NOT_FOUND, "message": "Transaction not found"}

        if tx.state == 2:
            # Already paid - idempotent
            return {
                "transaction": tx.transaction,
                "perform_time": tx.perform_time,
            }, None

        if tx.state == -2:
            return None, {"code": ERROR_TRANSACTION_FINISHED, "message": "Transaction finished"}

        perform_time = now_ms()
        tx = await transaction_crud.update_transaction_state(
            self.db,
            tx=tx,
            state=2,
            perform_time=perform_time,
        )

        # Try to mark the related order as PAID based on tx.account_data["order"]
        try:
            await self._mark_order_paid_from_transaction(tx)
        except Exception as exc:  # pragma: no cover - defensive logging
            self._logger.error("Failed to update order status from transaction %s: %s", tx.id, exc)

        await self.db.commit()

        return {
            "transaction": tx.transaction,
            "perform_time": tx.perform_time,
        }, None

    async def _cancel_transaction(self, params: Dict[str, Any]) -> Tuple[Dict[str, Any], None] | Tuple[None, Dict[str, Any]]:
        acquirer_id = params.get("id")
        reason = params.get("reason")

        if not isinstance(acquirer_id, str) or not acquirer_id:
            return None, {"code": ERROR_INVALID_REQUEST, "message": "Invalid id"}

        tx = await transaction_crud.get_by_acquirer_id(self.db, acquirer_id)
        if not tx:
            return None, {"code": ERROR_TRANSACTION_NOT_FOUND, "message": "Transaction not found"}

        if tx.state == -2:
            # Already cancelled - idempotent
            return {
                "transaction": tx.transaction,
                "cancel_time": tx.cancel_time,
                "state": tx.state,
            }, None

        if tx.state == 2:
            # Service already provided, cannot cancel
            return None, {"code": ERROR_CANNOT_CANCEL, "message": "Cannot cancel transaction"}

        cancel_time = now_ms()
        tx = await transaction_crud.update_transaction_state(
            self.db,
            tx=tx,
            state=-2,
            cancel_time=cancel_time,
            reason=reason if isinstance(reason, int) else None,
        )
        await self.db.commit()

        return {
            "transaction": tx.transaction,
            "cancel_time": tx.cancel_time,
            "state": tx.state,
        }, None

    async def _check_transaction(self, params: Dict[str, Any]) -> Tuple[Dict[str, Any], None] | Tuple[None, Dict[str, Any]]:
        acquirer_id = params.get("id")
        if not isinstance(acquirer_id, str) or not acquirer_id:
            return None, {"code": ERROR_INVALID_REQUEST, "message": "Invalid id"}

        tx = await transaction_crud.get_by_acquirer_id(self.db, acquirer_id)
        if not tx:
            return None, {"code": ERROR_TRANSACTION_NOT_FOUND, "message": "Transaction not found"}

        return {
            "create_time": tx.create_time,
            "perform_time": tx.perform_time,
            "cancel_time": tx.cancel_time,
            "transaction": tx.transaction,
            "state": tx.state,
            "reason": tx.reason,
        }, None

    async def _get_statement(self, params: Dict[str, Any]) -> Tuple[Dict[str, Any], None] | Tuple[None, Dict[str, Any]]:
        from_time = params.get("from")
        to_time = params.get("to")

        if not isinstance(from_time, int) or not isinstance(to_time, int):
            return None, {"code": ERROR_INVALID_REQUEST, "message": "Invalid period"}

        txs = await transaction_crud.get_statement(self.db, from_time=from_time, to_time=to_time)

        items: list[Dict[str, Any]] = []
        for tx in txs:
            items.append(
                {
                    "id": tx.id,
                    "time": tx.create_time,
                    "amount": tx.amount,
                    "account": tx.account_data,
                    "create_time": tx.create_time,
                    "perform_time": tx.perform_time,
                    "cancel_time": tx.cancel_time,
                    "transaction": tx.transaction,
                    "state": tx.state,
                    "reason": tx.reason,
                }
            )

        return {"transactions": items}, None

    async def _mark_order_paid_from_transaction(self, tx: Transaction) -> None:
        """Best-effort helper to mark an order as PAID when a transaction is performed.

        Uses the same semantics as CheckPerformTransaction: account.order may be
        a public id like "order_1" or a raw numeric id / numeric string.
        """

        account = tx.account_data or {}
        # Accept both "order" and "order_id" for compatibility with different client payloads
        order = account.get("order") or account.get("order_id")
        if not order:
            return

        order_db_id: Optional[int] = None

        # Special case: some client flows pass cart public id like "cart_1".
        # In that case we either find an existing PENDING order for the user+amount,
        # or create a new order from the cart, then mark it PAID.
        if isinstance(order, str) and order.startswith("cart_"):
            await self._mark_order_paid_from_cart_reference(tx, order)
            return

        if isinstance(order, str) and order.startswith("order_"):
            _, _, maybe_id = order.partition("_")
            try:
                order_db_id = int(maybe_id)
            except (TypeError, ValueError):
                order_db_id = None
        elif isinstance(order, int):
            order_db_id = order
        elif isinstance(order, str) and order.isdigit():
            order_db_id = int(order)

        if order_db_id is None:
            # Fallback: try to find an order whose public `order_id` string
            # matches the provided account value (covers cases where the
            # client sent '25' or 'order_25' or a custom merchant id).
            try:
                if isinstance(order, (str, int)):
                    from app.models.order import Order as _Order
                    res = await self.db.execute(select(_Order).where(_Order.order_id == str(order)).limit(1))
                    found = res.scalar_one_or_none()
                    if found:
                        order_db_id = int(found.id)
                        self._logger.info("Fallback matched order by order_id string: %s -> db id %s", order, order_db_id)
            except Exception as exc:  # pragma: no cover - defensive
                self._logger.warning("Fallback order lookup failed for %s: %s", order, exc)

            if order_db_id is None:
                self._logger.warning("No order id resolved from transaction account data: %s (tx=%s)", account, getattr(tx, 'id', None))
                return

        # Update order status to PAID
        from app.crud.cart import clear_cart  # local import to avoid cycles

        self._logger.info("Attempting to mark order %s as PAID (tx=%s)", order_db_id, getattr(tx, 'id', None))
        updated_order = await update_order_status(self.db, order_id=order_db_id, status=OrderStatus.PAID)
        if not updated_order:
            # If update failed, log for investigation
            self._logger.warning("Failed to update order status to PAID for order id %s (tx=%s)", order_db_id, getattr(tx, 'id', None))
            return
        self._logger.info("Order %s marked as PAID (tx=%s)", updated_order.id, getattr(tx, 'id', None))

        # After successful payment, clear the user's cart so they start fresh
        try:
            await clear_cart(self.db, updated_order.user_id)
        except Exception as exc:  # pragma: no cover - defensive logging
            self._logger.warning("Failed to clear cart after payment for order %s: %s", updated_order.id, exc)

    async def _mark_order_paid_from_cart_reference(self, tx: Transaction, cart_ref: str) -> None:
        """Handle tx.account_data.order like 'cart_1'.

        Contract:
        - cart_ref is a public cart id: 'cart_{cart_id}'
        - tx.amount is in tiyin

        Behaviour:
        - Try to map to an existing pending order (same user, matching amount)
        - Otherwise create an order from cart items
        - Mark order PAID and clear cart
        """

        from app.crud.cart import clear_cart
        from app.crud.order import create_order
        from app.schemas.order import OrderCreate, OrderItemCreate
        from app.models.cart import CartItem

        try:
            _, _, maybe_id = cart_ref.partition("_")
            cart_id = int(maybe_id)
        except Exception:
            self._logger.warning("Invalid cart reference in tx account data: %s (tx=%s)", cart_ref, getattr(tx, "id", None))
            return

        cart = (
            await self.db.execute(
                select(Cart).where(Cart.id == cart_id).limit(1)
            )
        ).scalar_one_or_none()
        if not cart:
            self._logger.warning("Cart not found for %s (tx=%s)", cart_ref, getattr(tx, "id", None))
            return

        # Load items explicitly to avoid MissingGreenlet (relationship lazy-load)
        items = (
            await self.db.execute(
                select(CartItem)
                .where(CartItem.cart_id == cart.id)
                .order_by(CartItem.id.asc())
            )
        ).scalars().all()
        if not items:
            self._logger.warning("Cart %s has no items; can't create/find order (tx=%s)", cart_ref, getattr(tx, "id", None))
            return

        # Try to find an existing PENDING order for this user that matches tx amount.
        # (order.total_amount stored in tiyin)
        expected_amount = int(getattr(tx, "amount", 0) or 0)
        matched_order = None
        try:
            q = (
                select(Order)
                .where(
                    Order.user_id == cart.user_id,
                    Order.status == OrderStatus.PENDING,
                )
                .order_by(Order.id.desc())
            )
            user_orders = (await self.db.execute(q)).scalars().all()
            for o in user_orders:
                try:
                    if int(o.total_amount or 0) == expected_amount:
                        matched_order = o
                        break
                except Exception:
                    continue
        except Exception as exc:
            self._logger.warning("Pending order lookup failed for cart %s: %s", cart_ref, exc)

        if matched_order is None:
            # Fetch actual prices for all cart items before building the order.
            slipper_ids = [ci.slipper_id for ci in items]
            price_result = await self.db.execute(select(StepUp).where(StepUp.id.in_(slipper_ids)))
            slippers_map = {s.id: s for s in price_result.scalars().all()}
            items_source = [
                OrderItemCreate(
                    slipper_id=ci.slipper_id,
                    quantity=int(ci.quantity),
                    unit_price=float(slippers_map[ci.slipper_id].price),
                    notes=None,
                )
                for ci in items
                if ci.slipper_id in slippers_map
            ]
            if not items_source:
                self._logger.warning(
                    "No valid cart items found for %s (all products missing from DB, tx=%s)",
                    cart_ref, getattr(tx, "id", None),
                )
                return
            internal_order = OrderCreate(
                order_id=None,
                user_id=cart.user_id,
                items=items_source,
                notes=f"Auto-created from {cart_ref} after payment",
            )
            try:
                matched_order = await create_order(
                    self.db,
                    internal_order,
                    idempotency_key=None,
                    merge_fallback=False,
                )
                self._logger.info("Created order %s from %s (tx=%s)", matched_order.id, cart_ref, getattr(tx, "id", None))
            except Exception as exc:
                self._logger.exception("Failed to create order from %s (tx=%s): %s", cart_ref, getattr(tx, "id", None), exc)
                return

        # Mark PAID
        self._logger.info("Attempting to mark order %s as PAID (from %s, tx=%s)", matched_order.id, cart_ref, getattr(tx, "id", None))
        updated_order = await update_order_status(self.db, order_id=int(matched_order.id), status=OrderStatus.PAID)
        if not updated_order:
            self._logger.warning("Failed to update order status to PAID for order id %s (tx=%s)", matched_order.id, getattr(tx, "id", None))
            return

        # Clear cart after successful payment
        try:
            await clear_cart(self.db, updated_order.user_id)
        except Exception as exc:  # pragma: no cover
            self._logger.warning("Failed to clear cart after payment for order %s: %s", updated_order.id, exc)

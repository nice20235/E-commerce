from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.orm import selectinload, joinedload
from sqlalchemy import func, and_
from app.models.order import Order, OrderItem, OrderStatus
from app.models.stepup import StepUp
from app.schemas.order import OrderCreate, OrderUpdate, OrderItemCreate
from app.core.cache import invalidate_cache_pattern
from typing import Optional, List, Tuple
import logging
from datetime import datetime, timedelta, timezone
import uuid

logger = logging.getLogger(__name__)


def _compute_total_tiyin_from_items(items: list[OrderItem]) -> int:
    """Compute total amount in tiyin from a list of OrderItems.

    OrderItem.total_price is stored in UZS as Decimal. The acquiring/bank protocol
    expects integer amounts in tiyin, so we multiply by 100 and round.
    """

    total_uzs = sum(
        (it.total_price if it.total_price is not None else Decimal("0"))
        for it in (items or [])
    )
    return int(round(float(total_uzs) * 100))


async def _restock_order_items(db: AsyncSession, order_id: int) -> None:
    """Return reserved stock to inventory for every item of an order.

    Called when a stock reservation is released: a still-PENDING order is
    deleted, or an order transitions to REFUNDED. Increments are atomic
    (``quantity = quantity + n``) so they are safe under concurrency, and the
    callers guard against running this twice for the same release.
    """
    rows = (
        await db.execute(
            select(OrderItem.slipper_id, OrderItem.quantity).where(OrderItem.order_id == order_id)
        )
    ).all()
    for slipper_id, qty in rows:
        if not qty:
            continue
        await db.execute(
            update(StepUp)
            .where(StepUp.id == slipper_id)
            .values(quantity=StepUp.quantity + int(qty))
            .execution_options(synchronize_session=False)
        )


async def get_order(db: AsyncSession, order_id: int, load_relationships: bool = True) -> Optional[Order]:
    """Get order by ID with optional relationship loading"""
    query = select(Order).where(Order.id == order_id)
    
    if load_relationships:
        query = query.options(
            joinedload(Order.user),
            selectinload(Order.items).selectinload(OrderItem.slipper)
        )
    
    result = await db.execute(query)
    return result.scalar_one_or_none()

async def get_orders(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 100,
    user_id: Optional[int] = None,
    status: Optional[OrderStatus] = None,
    load_relationships: bool = True
) -> Tuple[List[Order], int]:
    """Get orders with pagination and filters - optimized"""
    # Build base query
    query = select(Order)
    conditions = []
    
    # Apply filters
    if user_id is not None:
        conditions.append(Order.user_id == user_id)
    if status is not None:
        conditions.append(Order.status == status)
    
    if conditions:
        query = query.where(and_(*conditions))
    
    # Order by created_at for consistent results (apply before adding eager loaders)
    query = query.order_by(Order.created_at.desc())

    # Count on the plain filtered query *before* adding eager-load options so
    # that joinedload joins don't multiply rows and inflate the total.
    count_query = select(func.count()).select_from(query.subquery())

    # Add relationships to the data query (count must stay clean)
    data_query = query.offset(skip).limit(limit)
    if load_relationships:
        data_query = data_query.options(
            joinedload(Order.user),
            selectinload(Order.items).selectinload(OrderItem.slipper)
        )

    count_result = await db.execute(count_query)
    total = count_result.scalar() or 0
    data_result = await db.execute(data_query)
    orders = data_result.unique().scalars().all()

    return orders, total


# Payment-specific helpers removed as payments have been deleted from the project.

async def create_order(
    db: AsyncSession,
    order: OrderCreate,
    idempotency_key: str | None = None,
    *,
    merge_fallback: bool = False,
) -> Order:
    """Create new order with items"""
    # If idempotency_key is provided, return existing order to avoid duplicates
    if idempotency_key:
        # Scope idempotency to the same user to prevent cross-user leakage
        existing_q = select(Order).where(
            Order.idempotency_key == idempotency_key,
            Order.user_id == order.user_id,
        )
        existing = (await db.execute(existing_q)).scalar_one_or_none()
        if existing:
            # Load relationships and return
            result = await db.execute(
                select(Order)
                .options(
                    selectinload(Order.user),
                    selectinload(Order.items).selectinload(OrderItem.slipper)
                )
                .where(Order.id == existing.id)
            )
            reloaded = result.scalar_one_or_none()
            if reloaded is not None:
                return reloaded
            # Order was deleted between the two queries; fall through to create a new one

    # Optional: merge into latest pending order within a recent window only if explicitly enabled.
    merge_target = None
    if merge_fallback:
        try:
            cutoff = datetime.now(timezone.utc) - timedelta(minutes=5)
            merge_q = (
                select(Order)
                .where(
                    Order.user_id == order.user_id,
                    Order.status == OrderStatus.PENDING,
                    Order.created_at >= cutoff,
                )
                .order_by(Order.created_at.desc())
                .options(selectinload(Order.items))
            )
            merge_target = (await db.execute(merge_q)).scalars().first()
        except Exception:
            merge_target = None

    if merge_target is not None:
        # Build index of existing items by slipper_id
        existing_by_slipper = {it.slipper_id: it for it in (merge_target.items or [])}
        new_items_total: Decimal = Decimal("0")
        # For each incoming item, merge into existing or create new
        for item_data in order.items:
            incoming_qty = int(item_data.quantity)
            # Atomically reserve the incremental quantity against current stock.
            # The previously-ordered units for this slipper are already reserved,
            # so only the new units need deducting. RETURNING gives us the price
            # in the same statement (removes the prior per-item N+1 SELECT).
            reserve = await db.execute(
                update(StepUp)
                .where(StepUp.id == item_data.slipper_id, StepUp.quantity >= incoming_qty)
                .values(quantity=StepUp.quantity - incoming_qty)
                .returning(StepUp.price)
                .execution_options(synchronize_session=False)
            )
            price_row = reserve.first()
            if price_row is None:
                exists = (
                    await db.execute(select(StepUp.id).where(StepUp.id == item_data.slipper_id))
                ).scalar_one_or_none()
                if exists is None:
                    raise ValueError(f"StepUp with ID {item_data.slipper_id} not found")
                raise ValueError(
                    f"Requested quantity exceeds available stock for item {item_data.slipper_id} (requested={incoming_qty})"
                )
            unit_price = price_row[0]
            if item_data.slipper_id in existing_by_slipper:
                existing_item = existing_by_slipper[item_data.slipper_id]
                existing_item.quantity += incoming_qty
                existing_item.unit_price = unit_price  # keep current price snapshot
                existing_item.total_price = unit_price * existing_item.quantity
                db.add(existing_item)
            else:
                oi = OrderItem(
                    order_id=merge_target.id,
                    slipper_id=item_data.slipper_id,
                    quantity=incoming_qty,
                    unit_price=unit_price,
                    total_price=unit_price * incoming_qty,
                    notes=item_data.notes,
                )
                db.add(oi)
                new_items_total += oi.total_price
        # Recalculate total_amount in tiyin (sum of item totals in UZS * 100)
        current_total_uzs = sum((it.total_price or Decimal("0")) for it in (merge_target.items or []))
        merged_total_uzs = current_total_uzs + new_items_total
        merge_target.total_amount = int(round(float(merged_total_uzs) * 100))
        db.add(merge_target)
        await db.commit()
        await db.refresh(merge_target)
        # Second pass: re-load items to ensure totals reflect DB state, then recompute precise total
        reloaded = await db.execute(
            select(Order).options(selectinload(Order.items)).where(Order.id == merge_target.id)
        )
        merge_obj = reloaded.scalar_one_or_none()
        if merge_obj is None:
            raise ValueError(f"Order {merge_target.id} not found during total recompute")
        merge_obj.total_amount = _compute_total_tiyin_from_items(merge_obj.items or [])
        db.add(merge_obj)
        await db.commit()
        await db.refresh(merge_obj)
        # Load relationships for response
        result = await db.execute(
            select(Order)
            .options(
                selectinload(Order.user),
                selectinload(Order.items).selectinload(OrderItem.slipper)
            )
            .where(Order.id == merge_target.id)
        )
        merged_final = result.scalar_one_or_none()
        if merged_final is None:
            raise ValueError(f"Order {merge_target.id} not found after merge")
        return merged_final
    # First pass: aggregate requested quantities and validate against stock
    requested: dict[int, int] = {}
    item_ids: list[int] = []
    for it in order.items:
        q = int(it.quantity)
        requested[it.slipper_id] = requested.get(it.slipper_id, 0) + q
        if it.slipper_id not in item_ids:
            item_ids.append(it.slipper_id)

    step_by_id: dict[int, tuple[int, Decimal]] = {}
    if item_ids:
        rows = await db.execute(select(StepUp.id, StepUp.quantity, StepUp.price).where(StepUp.id.in_(item_ids)))
        step_by_id = {int(r[0]): (int(r[1] or 0), Decimal(str(r[2] or "0"))) for r in rows.all()}
        # Verify all requested products exist (clear error before touching stock).
        for sid in requested:
            if sid not in step_by_id:
                raise ValueError(f"StepUp with ID {sid} not found")
        # Atomically reserve stock. The conditional UPDATE only succeeds while
        # enough stock remains, so two concurrent checkouts can never both
        # decrement past zero (closes the check-then-act / overselling race).
        # These run inside the same transaction as the INSERTs below, so any
        # later failure rolls the reservation back (get_db rolls back on error).
        for sid, qty in requested.items():
            reserve = await db.execute(
                update(StepUp)
                .where(StepUp.id == sid, StepUp.quantity >= qty)
                .values(quantity=StepUp.quantity - qty)
                .execution_options(synchronize_session=False)
            )
            if reserve.rowcount != 1:
                available = step_by_id[sid][0]
                raise ValueError(
                    f"Requested quantity exceeds available stock for item {sid} (requested={qty}, available={available})"
                )

    # Calculate total amount in tiyin (1 UZS = 100 tiyin).
    # Prices were already fetched in the batch validation step above; reuse
    # step_by_id to avoid an N+1 query loop (one SELECT per order item).
    total_amount_tiyin = 0
    order_items = []

    for item_data in order.items:
        if item_data.slipper_id not in step_by_id:
            raise ValueError(f"StepUp with ID {item_data.slipper_id} not found")
        _available, _unit_price = step_by_id[item_data.slipper_id]
        # Quantity is only limited by actual stock (validated earlier)
        qty = int(item_data.quantity)

        # Use current slipper price in UZS (sourced from batch fetch above)
        unit_price = _unit_price  # in UZS
        total_price = unit_price * qty  # in UZS
        # Accumulate total in tiyin to satisfy bank requirements
        price_tiyin = int(round(unit_price * 100))
        total_amount_tiyin += price_tiyin * qty

        # Create order item (use slipper_id)
        # Consolidate by slipper_id within this creation batch
        existing = next((oi for oi in order_items if oi.slipper_id == item_data.slipper_id), None)
        if existing:
            existing.quantity += qty
            existing.unit_price = unit_price
            existing.total_price = existing.unit_price * existing.quantity
            if item_data.notes and not existing.notes:
                existing.notes = item_data.notes
        else:
            order_item = OrderItem(
                slipper_id=item_data.slipper_id,
                quantity=qty,
                unit_price=unit_price,
                total_price=total_price,
                notes=item_data.notes
            )
            order_items.append(order_item)
    
    # Create order with temporary unique placeholder order_id if none provided
    provided_order_id = order.order_id
    temp_placeholder = None
    if not provided_order_id:
        # Use a unique temp value to satisfy unique constraint at INSERT time,
        # but keep it well within the VARCHAR(32) limit of the column.
        # uuid4().hex -> 32 chars; we take only 16 and prefix with 'tmp-' (4+16=20).
        temp_placeholder = f"tmp-{uuid.uuid4().hex[:16]}"
    db_order = Order(
        order_id=provided_order_id if provided_order_id else temp_placeholder,
        user_id=order.user_id,
        total_amount=total_amount_tiyin,
        notes=order.notes,
        status=OrderStatus.PENDING,
        idempotency_key=idempotency_key
    )
    db.add(db_order)
    await db.flush()  # obtain primary key

    # If no order_id provided, set sequential numeric based on primary key
    if not provided_order_id:
        db_order.order_id = str(db_order.id)
        db.add(db_order)

    # Attach items
    # Upsert items honoring unique (order_id, slipper_id)
    # Avoid lazy-loading relationship in async context (MissingGreenlet). Fetch explicitly.
    existing_items_result = await db.execute(
        select(OrderItem).where(OrderItem.order_id == db_order.id)
    )
    existing_items = existing_items_result.scalars().all()
    existing_items_db = {it.slipper_id: it for it in existing_items}
    for item in order_items:
        item.order_id = db_order.id
        if item.slipper_id in existing_items_db:
            db_item = existing_items_db[item.slipper_id]
            db_item.quantity += item.quantity
            db_item.unit_price = item.unit_price
            db_item.total_price = db_item.unit_price * db_item.quantity
            if item.notes and not db_item.notes:
                db_item.notes = item.notes
            db.add(db_item)
        else:
            db.add(item)

    await db.commit()
    await db.refresh(db_order)

    # Load relationships for response
    result = await db.execute(
        select(Order)
        .options(
            selectinload(Order.user),
            selectinload(Order.items).selectinload(OrderItem.slipper)
        )
        .where(Order.id == db_order.id)
    )
    created_final = result.scalar_one_or_none()
    if created_final is None:
        raise ValueError(f"Order {db_order.id} not found after creation")
    return created_final

async def update_order(db: AsyncSession, db_order: Order, order_update: OrderUpdate) -> Order:
    """Update an existing order and return with relationships."""
    previous_status = db_order.status
    update_data = order_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_order, field, value)
    db.add(db_order)
    # Release reserved stock when an admin refunds an order (guarded so the
    # restock fires only on the PENDING/PAID -> REFUNDED transition).
    if previous_status != OrderStatus.REFUNDED and db_order.status == OrderStatus.REFUNDED:
        await _restock_order_items(db, db_order.id)
    await db.commit()
    await db.refresh(db_order)
    result = await db.execute(
        select(Order)
        .options(
            selectinload(Order.user),
            selectinload(Order.items).selectinload(OrderItem.slipper)
        )
        .where(Order.id == db_order.id)
    )
    refreshed = result.scalar_one_or_none()
    if refreshed is None:
        raise ValueError(f"Order {db_order.id} not found after update")
    return refreshed

async def update_order_status(db: AsyncSession, order_id: int, status: OrderStatus) -> Optional[Order]:
    """Update order status"""
    order = await get_order(db, order_id)
    if not order:
        return None

    previous_status = order.status
    order.status = status
    db.add(order)
    # Release reserved stock when an order becomes REFUNDED. Guarded on the
    # previous status so repeated REFUNDED writes never restock more than once.
    if previous_status != OrderStatus.REFUNDED and status == OrderStatus.REFUNDED:
        await _restock_order_items(db, order.id)
    await db.commit()
    await db.refresh(order)
    # Invalidate relevant caches so list/get endpoints see fresh data
    await invalidate_cache_pattern("orders:")
    # Invalidate any cached single-order entries. Cached keys use the
    # prefix 'order' followed by the function name and argument string
    # (e.g. 'order:get_order_endpoint:a0=123'), so clearing by the
    # 'order:' prefix reliably removes those entries.
    await invalidate_cache_pattern("order:")
    
    # Load relationships
    result = await db.execute(
        select(Order)
        .options(
            selectinload(Order.user),
            selectinload(Order.items).selectinload(OrderItem.slipper)
        )
        .where(Order.id == order.id)
    )
    refreshed = result.scalar_one_or_none()
    if refreshed is None:
        raise ValueError(f"Order {order.id} not found after status update")
    return refreshed

async def delete_order(db: AsyncSession, db_order: Order) -> bool:
    """Delete order (cascade will delete items)"""
    # A still-PENDING order holds a stock reservation that was never converted
    # to a sale; deleting it must return that stock to inventory. PAID orders
    # are left alone (stock stays sold) and REFUNDED orders already restocked
    # at refund time, so only PENDING triggers a release here.
    if db_order.status == OrderStatus.PENDING:
        await _restock_order_items(db, db_order.id)
    await db.delete(db_order)
    await db.commit()
    return True


async def get_user_orders(
    db: AsyncSession,
    user_id: int,
    skip: int = 0,
    limit: int = 100
) -> Tuple[List[Order], int]:
    """Get orders for specific user"""
    return await get_orders(db, skip, limit, user_id=user_id) 
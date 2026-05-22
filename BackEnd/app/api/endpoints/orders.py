from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
import hashlib  # noqa: S324 — sha256 used below; md5 not used
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.schemas.order import (
    OrderCreate,
    OrderUpdate,
    OrderItemCreate,
    OrderFromCartRequest,
)
from app.crud.order import (
    get_orders,
    get_order,
    create_order,
    update_order,
    delete_order,
)
from app.crud.cart import get_cart, get_cart_totals, clear_cart as clear_cart_fn
from app.models.order import OrderItem, OrderStatus
from app.models.stepup import StepUp
from app.models.user import User as _User
from app.core.timezone import format_tashkent_compact
from app.auth.dependencies import get_current_user, get_current_admin
from app.core.cache import cache as _cache, invalidate_cache_pattern
import logging

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/from-cart")
async def create_order_from_cart(
    payload: OrderFromCartRequest,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    """Create a new order from the current user's cart items.

    Cart behaviour:
    - Cart contents persist in the database indefinitely by default.
    - After a **successful** order creation from this cart, the backend
      automatically clears the cart for this user so items are not duplicated
      on the next order.
    """
    # Basic validation of client-provided amount (integer UZS)
    if payload.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    cart = await get_cart(db, user.id)
    if not cart or not cart.items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    # Validate that provided cart_id matches current user's cart public id
    public_cart_id = f"cart_{cart.id}"
    if payload.cart_id != public_cart_id:
        raise HTTPException(status_code=400, detail="cart_id does not match current user's cart")

    # Use the authoritative integer UZS total (exactly matching the public cart contract).
    # NOTE: StepUp.price is stored as float, but both public cart response and DB aggregation
    # cast it to INTEGER UZS before computing totals.
    total_items, total_quantity, total_amount = await get_cart_totals(db, user.id)

    # Defensive checks
    if total_items <= 0 or total_quantity <= 0 or total_amount <= 0:
        raise HTTPException(status_code=400, detail="Cart total is zero")

    # get_cart_totals already mirrors public cart rounding/casting; keep it deterministic
    server_total_uzs = round(total_amount)
    client_amount_int = round(payload.amount)

    if client_amount_int != server_total_uzs:
        # Typical cause: cart changed (items/qty/price) but client used a stale total.
        # Return an actionable message.
        raise HTTPException(
            status_code=400,
            detail=(
                "Amount does not match cart total "
                f"(client={client_amount_int}, server={server_total_uzs}, cart_id={public_cart_id}). "
                "Refresh cart and retry."
            ),
        )

    # Build items from cart lines; unit_price is determined from DB at creation time
    # Validate that all cart items still have a loaded product (could be deleted between
    # cart load and order creation). Raise early rather than silently using 0.0 price.
    missing = [ci.slipper_id for ci in cart.items if ci.slipper is None]
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"One or more products in cart no longer exist: {missing}",
        )

    items_source: list[OrderItemCreate] = [
        OrderItemCreate(
            slipper_id=ci.slipper_id,
            quantity=ci.quantity,
            unit_price=float(ci.slipper.price),
            notes=None,
        )
        for ci in cart.items
    ]

    # Generate a stable idempotency key so duplicate submissions (double-click,
    # retry) return the same order rather than creating a second one.
    idempotency_key = hashlib.sha256(
        f"{user.id}:{payload.cart_id}:{round(total_amount)}".encode()
    ).hexdigest()[:64]

    internal_order = OrderCreate(
        order_id=None,
        user_id=user.id,
        items=items_source,
        notes=None,
    )
    try:
        new_order = await create_order(
            db,
            internal_order,
            idempotency_key=idempotency_key,
            merge_fallback=False,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    # At this point, cart total (in integer UZS) has already been checked
    # against payload.amount. The actual order.total_amount is computed and
    # stored in tiyin (UZS * 100) inside create_order, so we don't override it here.

    # Clear cart after successful order creation so items don't reappear on refresh
    try:
        await clear_cart_fn(db, user.id)
    except Exception:
        # Best-effort; order is already created
        pass

    # Invalidate caches
    await invalidate_cache_pattern("orders:")
    await invalidate_cache_pattern("Cart:get_my_cart")

    created_compact = format_tashkent_compact(new_order.created_at)
    # Explicitly fetch items for response
    items_result = await db.execute(
        select(OrderItem, StepUp)
        .join(StepUp, StepUp.id == OrderItem.slipper_id)
        .where(OrderItem.order_id == new_order.id)
        .order_by(OrderItem.id.asc())
    )
    items = items_result.all()
    return {
        # Public order identifier, similar to cart_1 pattern
        "order_id": f"order_{new_order.id}",
        "status": new_order.status.value if hasattr(new_order.status, 'value') else str(new_order.status),
        "total_amount": int(new_order.total_amount or 0),
        "notes": new_order.notes,
        "created_at": created_compact,
        "items": [
            {
                "slipper_id": oi.slipper_id,
                "quantity": oi.quantity,
                "unit_price": oi.unit_price,
                "total_price": oi.total_price,
                "notes": oi.notes,
                "name": getattr(sl, "name", None),
                "size": getattr(sl, "size", None),
                "image": getattr(sl, "image", None),
            }
            for oi, sl in items
        ],
    }

@router.get("/")
async def list_orders(
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    status: str | None = Query(default=None),
):
    """List orders.
    - Regular user: only their own orders (pagination applies).
    - Admin: all users' orders with pagination and optional status filter.
    """
    # Parse optional status filter
    status_filter: OrderStatus | None = None
    if status is not None:
        try:
            status_filter = OrderStatus(status.upper())
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid status value: {status}")

    # Build a per-user cache key that encodes all query parameters
    _cache_key = f"orders:list:uid={user.id}:admin={user.is_admin}:skip={skip}:limit={limit}:status={status}"
    _cached = await _cache.get(_cache_key)
    if _cached is not None:
        return _cached

    try:
        if user.is_admin:
            logger.info(f"Admin {user.name} listing ALL orders (skip={skip}, limit={limit}, status={status})")
            orders, total = await get_orders(db, skip=skip, limit=limit, status=status_filter, load_relationships=False)
        else:
            logger.info(f"User {user.name} listing OWN orders (skip={skip}, limit={limit})")
            orders, total = await get_orders(db, skip=skip, limit=limit, user_id=user.id, status=status_filter, load_relationships=False)

        # Batch load users and items for these orders to avoid N+1
        order_ids = [o.id for o in orders]
        user_ids = list({o.user_id for o in orders})

        async def _fetch_users():
            if not user_ids:
                return {}
            rows = await db.execute(select(_User.id, _User.name, _User.surname).where(_User.id.in_(user_ids)))
            return {int(uid): (nm, sn) for uid, nm, sn in rows.all()}

        async def _fetch_items():
            if not order_ids:
                return {}
            result = await db.execute(
                select(OrderItem, StepUp)
                .join(StepUp, StepUp.id == OrderItem.slipper_id)
                .where(OrderItem.order_id.in_(order_ids))
            )
            by_order: dict[int, list[dict]] = {}
            for oi, sl in result.all():
                by_order.setdefault(oi.order_id, []).append({
                    "slipper_id": oi.slipper_id,
                    "quantity": oi.quantity,
                    "unit_price": oi.unit_price,
                    "total_price": oi.total_price,
                    "name": getattr(sl, "name", None),
                    "size": getattr(sl, "size", None),
                    "image": getattr(sl, "image", None),
                })
            return by_order

        users_by_id = await _fetch_users()
        items_by_order = await _fetch_items()

        orders_out = [
            {
                # Public order identifier in the same style as cart_1
                "order_id": f"order_{order.id}",
                "user_id": order.user_id,
                "user_name": (f"{users_by_id[order.user_id][0]} {users_by_id[order.user_id][1]}".strip() if order.user_id in users_by_id else None),
                "status": order.status.value if hasattr(order.status, 'value') else str(order.status),
                "total_amount": int(order.total_amount or 0),
                "created_at": format_tashkent_compact(order.created_at),
                "updated_at": format_tashkent_compact(order.updated_at),
                "items": items_by_order.get(order.id, []),
            }
            for order in orders
        ]
        result = {"orders": orders_out, "total": total, "skip": skip, "limit": limit}
        await _cache.set(_cache_key, result, ttl=60)
        return result
    except HTTPException:
        raise
    except Exception:
        logger.exception("Error fetching orders")
        raise HTTPException(status_code=500, detail="Error fetching orders")

@router.get("/{order_id}")
async def get_order_endpoint(
    order_id: int, 
    db: AsyncSession = Depends(get_db), 
    user=Depends(get_current_user)
):
    """Get a specific order by ID"""
    try:
        db_order = await get_order(db, order_id, load_relationships=False)
        if not db_order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        # Check permissions
        if not user.is_admin and db_order.user_id != user.id:
            logger.warning(f"User {user.name} attempted to access order {order_id} belonging to user {db_order.user_id}")
            raise HTTPException(status_code=403, detail="Not authorized to access this order")
        
        # Fetch items explicitly to avoid any lazy-load issues and ensure correctness
        items_data = await db.execute(
            select(OrderItem, StepUp)
            .join(StepUp, StepUp.id == OrderItem.slipper_id)
            .where(OrderItem.order_id == db_order.id)
            .order_by(OrderItem.id.asc())
        )
        items = [
            {
                "id": oi.id,
                "slipper_id": oi.slipper_id,
                "quantity": oi.quantity,
                "unit_price": oi.unit_price,
                "total_price": oi.total_price,
                "notes": oi.notes,
                "name": getattr(sl, "name", None),
                "size": getattr(sl, "size", None),
                "image": getattr(sl, "image", None),
            }
            for oi, sl in items_data.all()
        ]

        return {
            # Public order identifier in the same style as cart_1
            "order_id": f"order_{db_order.id}",
            "user_id": db_order.user_id,
            "status": db_order.status.value if hasattr(db_order.status, 'value') else str(db_order.status),
            "total_amount": int(db_order.total_amount or 0),
            "notes": db_order.notes,
            "created_at": format_tashkent_compact(db_order.created_at),
            "updated_at": format_tashkent_compact(db_order.updated_at),
            "items": items,
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error fetching order %s", order_id)
        raise HTTPException(status_code=500, detail="Error fetching order")

@router.put("/{order_id}")
async def update_order_endpoint(order_id: int, order_update: OrderUpdate, db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    """
    Update an order. Admins can update any order, users can only update their own orders.
    """
    db_order = await get_order(db, order_id)
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Check permissions
    if not user.is_admin and db_order.user_id != user.id:
        logger.warning(f"User {user.name} attempted to update order {order_id} belonging to user {db_order.user_id}")
        raise HTTPException(status_code=403, detail="You can only update your own orders")

    # Regular users may only update notes on PENDING orders
    if not user.is_admin:
        if db_order.status != OrderStatus.PENDING:
            raise HTTPException(status_code=403, detail="Only admins can modify non-pending orders")
        if order_update.status is not None:
            raise HTTPException(status_code=403, detail="Only admins can change order status")
        if order_update.total_amount is not None:
            raise HTTPException(status_code=403, detail="Only admins can change order total")

    logger.info(f"Updating order {order_id} by user: {user.name} (Admin: {user.is_admin})")
    updated_order = await update_order(db, db_order, order_update)

    # Clear cache after updating order
    await invalidate_cache_pattern("orders:")
    await invalidate_cache_pattern(f"order:{order_id}:")

    # Explicitly reload items for this order to avoid any async lazy-load pitfalls
    items_data = await db.execute(
        select(OrderItem, StepUp)
        .join(StepUp, StepUp.id == OrderItem.slipper_id)
        .where(OrderItem.order_id == updated_order.id)
        .order_by(OrderItem.id.asc())
    )
    items = [
        {
            "id": oi.id,
            "slipper_id": oi.slipper_id,
            "quantity": oi.quantity,
            "unit_price": oi.unit_price,
            "total_price": oi.total_price,
            "notes": oi.notes,
            "name": getattr(sl, "name", None),
            "size": getattr(sl, "size", None),
            "image": getattr(sl, "image", None),
        }
        for oi, sl in items_data.all()
    ]

    return {
        # Public order identifier in the same style as cart_1
        "order_id": f"order_{updated_order.id}",
        "user_id": updated_order.user_id,
        "status": updated_order.status.value if hasattr(updated_order.status, 'value') else str(updated_order.status),
        "total_amount": int(updated_order.total_amount or 0),
        "notes": updated_order.notes,
        "created_at": format_tashkent_compact(updated_order.created_at),
        "updated_at": format_tashkent_compact(updated_order.updated_at),
        "items": items,
    }

@router.delete("/{order_id}")
async def delete_order_endpoint(order_id: int, db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    """
    Delete an order. Admins can delete any order, users can only delete their own orders.
    """
    db_order = await get_order(db, order_id)
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check permissions
    if not user.is_admin and db_order.user_id != user.id:
        logger.warning(f"User {user.name} attempted to delete order {order_id} belonging to user {db_order.user_id}")
        raise HTTPException(status_code=403, detail="You can only delete your own orders")

    # Users can only delete PENDING orders — paid/refunded orders are financial records
    if not user.is_admin and db_order.status != OrderStatus.PENDING:
        raise HTTPException(status_code=403, detail="Only pending orders can be deleted")

    logger.info(f"Deleting order {order_id} by user {user.id} (admin={user.is_admin})")
    await delete_order(db, db_order)
    
    # Clear cache after deleting order
    await invalidate_cache_pattern("orders:")
    await invalidate_cache_pattern(f"order:{order_id}:")
    
    return {"msg": "Order deleted"} 
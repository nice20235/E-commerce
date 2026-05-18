from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse

from app.services.acquiring import AcquiringClient
from app.auth.dependencies import get_current_user
from app.db.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession


router = APIRouter(prefix="/payment", tags=["Payment"])


@router.get("/init/{order_id}")
async def init_payment(
    order_id: int,
    amount: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
) -> RedirectResponse:
    """Initialize payment for given order and redirect user to bank page.

    This endpoint:
    - accepts order_id as path parameter and amount (in tiyin) as query parameter
    - calls AcquiringClient.get_payment_link(order_id, amount)
    - redirects the client to the returned payment_url
    """
    if amount <= 0:
        raise HTTPException(status_code=400, detail="amount must be positive")

    from sqlalchemy import select
    from app.models.order import Order
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if not current_user.is_admin and order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to pay for this order")

    # Validate amount matches stored order total to prevent manipulation
    if amount != int(order.total_amount or 0):
        raise HTTPException(
            status_code=400,
            detail=f"Amount mismatch: expected {int(order.total_amount or 0)} tiyin, got {amount}",
        )

    client = AcquiringClient()

    try:
        payment_url = await client.get_payment_link(order_id=order_id, amount=amount)
    except Exception as exc:  # pragma: no cover - network/error details handled generically
        # Hide internal details from client; log can be added if needed
        raise HTTPException(status_code=502, detail="Failed to initialize payment") from exc

    return RedirectResponse(url=payment_url, status_code=302)

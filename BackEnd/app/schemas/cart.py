from pydantic import BaseModel, Field
from typing import List, Optional, Literal

class CartItemCreate(BaseModel):
    """Internal schema used by cart CRUD layer.

    Field name `slipper_id` matches DB model and existing logic.
    """

    slipper_id: int = Field(..., ge=1)
    quantity: int = Field(1, ge=1, le=999)


class CartAddItemRequest(BaseModel):
    """Public request schema for POST /cart/items.

    Uses `product_id` as in the external API contract.
    """

    product_id: int = Field(..., ge=1)
    quantity: int = Field(..., ge=1, le=999)

class CartItemUpdate(BaseModel):
    quantity: int = Field(..., ge=0, le=999)  # quantity 0 => remove

class CartItemOut(BaseModel):
    id: int
    slipper_id: int
    quantity: int
    name: Optional[str] = None
    price: Optional[float] = None
    total_price: Optional[float] = None

    model_config = {"from_attributes": True}

class CartOut(BaseModel):
    id: int
    items: List[CartItemOut]
    total_items: int
    total_quantity: int
    total_amount: float

    model_config = {"from_attributes": True}


class CartTotalOut(BaseModel):
    total_items: int = Field(..., description="Number of distinct items in cart")
    total_quantity: int = Field(..., description="Sum of quantities across items")
    total_amount: float = Field(..., description="Sum of price*quantity for all items")


class CartItemPublic(BaseModel):
    """Public cart item representation for API responses.

    All monetary values are in UZS.
    """

    cart_item_id: int
    product_id: int
    name: str
    price: float
    quantity: int
    subtotal: float
    image: Optional[str] = None


class CartPublicData(BaseModel):
    id: str
    items: List[CartItemPublic]
    total_amount: float
    currency: str = "UZS"
    items_count: int


class CartPublicResponse(BaseModel):
    status: Literal["success"]
    data: CartPublicData



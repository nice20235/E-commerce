from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from .stepup_image import StepUpImageResponse


class StepUpBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, examples=["Cozy Home StepUp"])
    size: str = Field(..., min_length=1, max_length=20, examples=["42"])
    price: float = Field(..., gt=0, examples=[25.99])
    quantity: int = Field(..., ge=0, examples=[50])


class StepUpCreate(StepUpBase):
    model_config = {
        "json_schema_extra": {
            "examples": [{"name": "Cozy Home StepUp", "size": "42", "price": 25.99, "quantity": 50}]
        }
    }


class StepUpUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    size: Optional[str] = Field(None, min_length=1, max_length=20)
    price: Optional[float] = Field(None, gt=0)
    quantity: Optional[int] = Field(None, ge=0)


class StepUpInDB(StepUpBase):
    id: int
    created_at: datetime
    updated_at: datetime
    images: List[StepUpImageResponse] = Field(default=[])

    model_config = {"from_attributes": True}


class StepUpResponse(StepUpInDB):
    pass


class StepUpList(BaseModel):
    stepups: List[StepUpResponse]
    total: int
    skip: int
    limit: int

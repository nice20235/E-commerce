from pydantic import BaseModel, Field, field_validator, model_validator
from app.core.config import settings
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    name: str = Field(..., description="User's first name", min_length=2, max_length=100, examples=["John"])
    surname: str = Field(..., description="User's last name", min_length=2, max_length=100, examples=["Doe"])
    phone_number: str = Field(..., description="User's phone number", min_length=7, max_length=20, examples=["+79991234567"])

class UserCreate(UserBase):
    password: str = Field(
        ...,
        description="User's password",
        min_length=8,
        max_length=1000,
        examples=["securepassword123"],
    )
    confirm_password: str = Field(
        ...,
        description="Confirm password",
        max_length=1000,
        examples=["securepassword123"],
    )

    @field_validator('phone_number')
    @classmethod
    def validate_phone_number(cls, v: str) -> str:
        v = v.strip()
        if not v.startswith('+'):
            raise ValueError('Phone number must start with +')
        body = v[1:]
        if not body.isdigit():
            raise ValueError('Phone number must contain only digits after +')
        if len(body) < 6 or len(body) > 15:
            raise ValueError('Phone number length invalid (6-15 digits after +)')
        return v

    @model_validator(mode='after')
    def passwords_match(self) -> 'UserCreate':
        if self.password != self.confirm_password:
            raise ValueError('Passwords do not match')
        return self

    model_config = {
        "json_schema_extra": {
            "examples": [{
                "name": "John",
                "surname": "Doe",
                "phone_number": "+79991234567",
                "password": "securepassword123",
                "confirm_password": "securepassword123",
            }]
        }
    }

class UserUpdate(BaseModel):
    """Admin-only user update schema. is_admin can only be set by admins."""
    name: Optional[str] = Field(None, min_length=2, max_length=100, examples=["John"])
    surname: Optional[str] = Field(None, min_length=2, max_length=100, examples=["Doe"])
    phone_number: Optional[str] = Field(None, min_length=7, max_length=20, examples=["+79991234567"])
    is_admin: Optional[bool] = Field(None, description="Admin-only: change user role")

    @field_validator('phone_number')
    @classmethod
    def validate_phone_number(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip()
        if not v.startswith('+'):
            raise ValueError('Phone number must start with +')
        body = v[1:]
        if not body.isdigit():
            raise ValueError('Phone number must contain only digits after +')
        if len(body) < 6 or len(body) > 15:
            raise ValueError('Phone number length invalid (6-15 digits after +)')
        return v

class UserInDB(UserBase):
    id: int = Field(..., description="User ID", examples=[1])
    is_admin: bool = Field(default=False, description="Whether user is an admin")
    created_at: datetime = Field(..., description="Account creation timestamp", examples=["2024-01-15T10:30:00Z"])
    updated_at: datetime = Field(..., description="Last update timestamp", examples=["2024-01-15T10:30:00Z"])

    model_config = {"from_attributes": True}

class UserResponse(UserInDB):
    """User response schema for API endpoints"""
    pass

class UserList(BaseModel):
    """Schema for list of users"""
    users: List[UserResponse] = Field(..., description="List of users")
    total: int = Field(..., description="Total number of users")
    skip: int = Field(..., description="Number of users skipped")
    limit: int = Field(..., description="Maximum number of users returned")

class UserLogin(BaseModel):
    name: str = Field(
        ...,
        description="User's name for login",
        min_length=2,
        max_length=100,
        examples=["John"],
    )
    # max_length=1000 prevents bcrypt DoS: passlib/bcrypt silently truncates at
    # 72 bytes but an unbounded field lets an attacker send megabyte payloads
    # that exhaust CPU before truncation occurs at the Python layer.
    password: str = Field(
        ...,
        description="User's password",
        min_length=1,
        max_length=1000,
        examples=["securepassword123"],
    )

    model_config = {
        "json_schema_extra": {
            "examples": [{"name": "John", "password": "securepassword123"}]
        }
    }

class RefreshTokenRequest(BaseModel):
    refresh_token: Optional[str] = Field(None, description="JWT refresh token (can also be provided in headers)")

    model_config = {"extra": "ignore"}

class ForgotPasswordRequest(BaseModel):
    name: str = Field(
        ...,
        description="User's login name",
        min_length=2,
        max_length=100,
        examples=["John"]
    )
    new_password: str = Field(
        ...,
        description="New password",
        min_length=8,
        max_length=1000,
        examples=["newsecurepassword123"],
    )
    confirm_new_password: str = Field(
        ...,
        description="Confirm new password",
        max_length=1000,
        examples=["newsecurepassword123"],
    )

    @model_validator(mode='after')
    def passwords_match(self) -> 'ForgotPasswordRequest':
        if self.new_password != self.confirm_new_password:
            raise ValueError('New passwords do not match')
        return self


class UserSelfUpdate(BaseModel):
    """Self-profile update. is_admin is intentionally excluded — cannot be changed by the user."""
    name: Optional[str] = Field(None, min_length=2, max_length=100, examples=["John"])
    surname: Optional[str] = Field(None, min_length=2, max_length=100, examples=["Doe"])
    phone_number: Optional[str] = Field(None, min_length=7, max_length=20, examples=["+79991234567"])
    current_password: Optional[str] = Field(None, max_length=1000, description="Required when changing password", examples=["oldpassword123"])
    new_password: Optional[str] = Field(None, min_length=8, max_length=1000, examples=["newsecurepassword123"])
    confirm_new_password: Optional[str] = Field(None, max_length=1000, examples=["newsecurepassword123"])

    @field_validator('phone_number')
    @classmethod
    def validate_phone_number(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip()
        if not v.startswith('+'):
            raise ValueError('Phone number must start with +')
        body = v[1:]
        if not body.isdigit():
            raise ValueError('Phone number must contain only digits after +')
        if len(body) < 6 or len(body) > 15:
            raise ValueError('Phone number length invalid (6-15 digits after +)')
        return v

    @model_validator(mode='after')
    def validate_password_change(self) -> 'UserSelfUpdate':
        if self.new_password is not None:
            if not self.current_password:
                raise ValueError('Current password is required to change password')
            if self.confirm_new_password != self.new_password:
                raise ValueError('New passwords do not match')
        return self


class UserProfileResponse(BaseModel):
    """Public user profile returned by /users/me endpoints"""
    name: str
    surname: Optional[str] = None
    phone_number: Optional[str] = None
    is_admin: bool = False

    model_config = {
        "json_schema_extra": {
            "examples": [{
                "name": "John",
                "surname": "Doe",
                "phone_number": "+79991234567",
                "is_admin": False
            }]
        }
    }

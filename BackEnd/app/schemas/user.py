from pydantic import BaseModel, Field, validator
from app.core.config import settings
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    name: str = Field(..., description="User's first name", min_length=2, max_length=100, example="John")
    surname: str = Field(..., description="User's last name", min_length=2, max_length=100, example="Doe")
    phone_number: str = Field(..., description="User's phone number", min_length=7, max_length=20, example="+79991234567")

class UserCreate(UserBase):
    password: str = Field(
        ...,
        description="User's password",
        min_length=8,
        max_length=1000,
        example="securepassword123",
    )
    confirm_password: str = Field(
        ...,
        description="Confirm password",
        max_length=1000,
        example="securepassword123",
    )

    @validator('confirm_password')
    def passwords_match(cls, v, values):
        if 'password' in values and v != values['password']:
            raise ValueError('Passwords do not match')
        return v

    @validator('phone_number')
    def validate_phone_number(cls, v):
        if not v:
            raise ValueError('Phone number required')
        v = v.strip()
        if not v.startswith('+'):
            raise ValueError('Phone number must start with +')
        body = v[1:]
        if not body.isdigit():
            raise ValueError('Phone number must contain only digits after +')
        if len(body) < 6 or len(body) > 15:
            raise ValueError('Phone number length invalid (6-15 digits after +)')
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "name": "John",
                "surname": "Doe",
                "phone_number": "+79991234567",
                "password": "securepassword123",
                "confirm_password": "securepassword123",
            }
        }

class UserUpdate(BaseModel):
    """Admin-only user update schema. is_admin can only be set by admins."""
    name: Optional[str] = Field(None, min_length=2, max_length=100, example="John")
    surname: Optional[str] = Field(None, min_length=2, max_length=100, example="Doe")
    phone_number: Optional[str] = Field(None, min_length=7, max_length=20, example="+79991234567")
    is_admin: Optional[bool] = Field(None, description="Admin-only: change user role")

    @validator('phone_number')
    def validate_phone_number(cls, v):
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
    id: int = Field(..., description="User ID", example=1)
    is_admin: bool = Field(default=False, description="Whether user is an admin")
    created_at: datetime = Field(..., description="Account creation timestamp", example="2024-01-15T10:30:00Z")
    updated_at: datetime = Field(..., description="Last update timestamp", example="2024-01-15T10:30:00Z")

    class Config:
        from_attributes = True
        json_encoders = {datetime: lambda v: v.isoformat()}

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
        example="John",
    )
    # max_length=1000 prevents bcrypt DoS: passlib/bcrypt silently truncates at
    # 72 bytes but an unbounded field lets an attacker send megabyte payloads
    # that exhaust CPU before truncation occurs at the Python layer.
    password: str = Field(
        ...,
        description="User's password",
        min_length=1,
        max_length=1000,
        example="securepassword123",
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "John",
                "password": "securepassword123"
            }
        }

class RefreshTokenRequest(BaseModel):
    refresh_token: Optional[str] = Field(None, description="JWT refresh token (can also be provided in headers)")
    
    class Config:
        # Allow request with empty body when token is in headers
        extra = "ignore"

class ForgotPasswordRequest(BaseModel):
    name: str = Field(
        ..., 
        description="User's login name", 
        min_length=2, 
        max_length=100,
        example="John"
    )
    new_password: str = Field(
        ...,
        description="New password",
        min_length=8,
        max_length=1000,
        example="newsecurepassword123",
    )
    confirm_new_password: str = Field(
        ...,
        description="Confirm new password",
        max_length=1000,
        example="newsecurepassword123",
    )
    
    @validator('confirm_new_password')
    def passwords_match(cls, v, values):
        if 'new_password' in values and v != values['new_password']:
            raise ValueError('New passwords do not match')
        return v 


class UserSelfUpdate(BaseModel):
    """Self-profile update. is_admin is intentionally excluded — cannot be changed by the user."""
    name: Optional[str] = Field(None, min_length=2, max_length=100, example="John")
    surname: Optional[str] = Field(None, min_length=2, max_length=100, example="Doe")
    phone_number: Optional[str] = Field(None, min_length=7, max_length=20, example="+79991234567")
    current_password: Optional[str] = Field(None, max_length=1000, description="Required when changing password", example="oldpassword123")
    new_password: Optional[str] = Field(None, min_length=8, max_length=1000, example="newsecurepassword123")
    confirm_new_password: Optional[str] = Field(None, max_length=1000, example="newsecurepassword123")

    @validator('phone_number')
    def validate_phone_number(cls, v):
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

    @validator('confirm_new_password')
    def self_passwords_match(cls, v, values):
        if values.get('new_password') is not None and v != values.get('new_password'):
            raise ValueError('New passwords do not match')
        return v

    @validator('current_password')
    def require_current_when_changing(cls, v, values):
        if values.get('new_password') is not None and not v:
            raise ValueError('Current password is required to change password')
        return v


class UserProfileResponse(BaseModel):
    """Public user profile returned by /users/me endpoints"""
    name: str
    surname: str
    phone_number: str
    is_admin: bool = False

    class Config:
        json_schema_extra = {
            "example": {
                "name": "John",
                "surname": "Doe",
                "phone_number": "+79991234567",
                "is_admin": False
            }
        }
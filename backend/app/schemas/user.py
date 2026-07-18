from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, Dict, Any
import uuid

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    role: Optional[str] = None
    avatar_url: Optional[str] = None

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    avatar_url: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v):
        if v is not None and len(v) > 255:
            raise ValueError("full_name must be 255 characters or less")
        return v

    @field_validator("role")
    @classmethod
    def validate_role(cls, v):
        if v is not None and len(v) > 255:
            raise ValueError("role must be 255 characters or less")
        return v

    @field_validator("avatar_url")
    @classmethod
    def validate_avatar_url(cls, v):
        if v is not None and len(v) > 2048:
            raise ValueError("avatar_url must be 2048 characters or less")
        return v

class UserResponse(UserBase):
    id: uuid.UUID
    credits: int
    plan: str
    settings: Optional[Dict[str, Any]] = None

    model_config = {"from_attributes": True}

from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any
import uuid

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    role: Optional[str] = None

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None

class UserResponse(UserBase):
    id: uuid.UUID
    credits: int
    plan: str
    settings: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

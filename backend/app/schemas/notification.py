from datetime import datetime
import uuid
from typing import Optional
from pydantic import BaseModel

class NotificationBase(BaseModel):
    type: str
    message: str
    is_read: bool = False

class NotificationCreate(NotificationBase):
    user_id: uuid.UUID

class NotificationUpdate(BaseModel):
    is_read: bool

class NotificationResponse(NotificationBase):
    id: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}

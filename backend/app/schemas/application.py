from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field
from enum import Enum


class StatusEnum(str, Enum):
    wishlist = "wishlist"
    applied = "applied"
    interviewing = "interviewing"
    offer = "offer"
    rejected = "rejected"


class ApplicationCreate(BaseModel):
    company: str = Field(..., min_length=1, max_length=255)
    role: str = Field(..., min_length=1, max_length=255)
    status: StatusEnum = StatusEnum.applied
    link: str | None = None
    notes: str | None = None
    follow_up: str | None = Field(None, alias="followUp")

    model_config = {"populate_by_name": True}


class ApplicationUpdate(BaseModel):
    company: str | None = Field(None, max_length=255)
    role: str | None = Field(None, max_length=255)
    status: StatusEnum | None = None
    link: str | None = None
    notes: str | None = None
    follow_up: str | None = Field(None, alias="followUp")

    model_config = {"populate_by_name": True}


class ApplicationResponse(BaseModel):
    id: UUID
    user_id: UUID
    company: str
    role: str
    status: StatusEnum
    link: str | None = None
    notes: str | None = None
    follow_up: str | None = Field(None, serialization_alias="followUp")
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True, "populate_by_name": True}

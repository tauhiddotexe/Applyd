import uuid
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator

from app.core.auth import create_dev_token
from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["Auth"])


class DevLoginRequest(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, v):
        if len(v) > 254:
            raise ValueError("Email too long")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if len(v) > 128:
            raise ValueError("Password too long")
        return v


class DevLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


@router.post("/dev-login", response_model=DevLoginResponse)
def dev_login(body: DevLoginRequest):
    if not settings.DEV_MODE:
        raise HTTPException(status_code=403, detail="Dev login not available in production")

    if not body.email or not body.password:
        raise HTTPException(status_code=400, detail="Email and password required")

    user_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, body.email))
    token = create_dev_token(user_id, body.email)

    return DevLoginResponse(
        access_token=token,
        user={"id": user_id, "email": body.email},
    )

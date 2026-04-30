import uuid

import jwt as _jwt
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.auth import decode_claims
from app.core.logging import logger
from app.db.session import get_db
from app.models import User

security = HTTPBearer(auto_error=False)


async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
) -> uuid.UUID:
    auth_header = request.headers.get("authorization")
    logger.debug(f"Authorization header present: {bool(auth_header)}")

    if not credentials or not credentials.credentials:
        logger.warning("401 Unauthorized: missing token")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing token",
        )

    token = credentials.credentials

    try:
        payload = decode_claims(token)
    except _jwt.ExpiredSignatureError:
        logger.warning("401 Unauthorized: token expired")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
        )
    except _jwt.PyJWTError as e:
        logger.warning(f"401 Unauthorized: JWT decode failed: {e} | token_start={token[:20]}...")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

    try:
        sub = payload["sub"]
    except KeyError:
        logger.warning("401 Unauthorized: missing sub claim")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: missing sub",
        )

    try:
        user_id = uuid.UUID(sub)
    except ValueError:
        logger.warning(f"401 Unauthorized: invalid user id in token: {sub}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID in token",
        )

    logger.debug(f"Decoded user_id: {user_id}")
    print(f"DEBUG: Incoming request for user_id (type {type(user_id)}): {user_id}")

    try:
        result = db.execute(select(User).where(User.id == user_id))
        existing = result.scalar_one_or_none()
        print(f"DEBUG: DB query result for {user_id}: {existing}")
        if not existing:
            email = payload.get("email", f"{user_id}@supabase.user")
            new_user = User(id=user_id, email=email)
            db.add(new_user)
            db.commit()
            logger.info(f"Auto-provisioned local user row: {user_id} ({email})")
    except Exception as exc:
        db.rollback()
        logger.error(f"DB query error during user provisioning for {user_id}: {exc}")
        result = db.execute(select(User).where(User.id == user_id))
        if not result.scalar_one_or_none():
            logger.error(f"Failed to provision user {user_id} and user does not exist")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="User provisioning failed",
            )

    return user_id

import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.deps import get_current_user
from app.services import user_service

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/profile")
def get_profile(db: Session = Depends(get_db), user_id: uuid.UUID = Depends(get_current_user)):
    user = user_service.get_user_by_id(db, user_id)
    return {
        "id": str(user.id),
        "email": user.email,
        "credits": user.credits,
        "plan": user.plan
    }

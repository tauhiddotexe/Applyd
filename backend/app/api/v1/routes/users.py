import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.deps import get_current_user
from app.services import user_service

from app.schemas.user import UserUpdate, UserResponse

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/profile", response_model=UserResponse)
def get_profile(db: Session = Depends(get_db), user_id: uuid.UUID = Depends(get_current_user)):
    user = user_service.get_user_by_id(db, user_id)
    return user

@router.put("/profile", response_model=UserResponse)
def update_profile(
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user)
):
    user = user_service.update_user(db, user_id, user_data.model_dump(exclude_unset=True))
    return user

@router.delete("/account")
def delete_account(db: Session = Depends(get_db), user_id: uuid.UUID = Depends(get_current_user)):
    success = user_service.delete_user(db, user_id)
    if not success:
        return {"error": "Failed to delete account"}
    return {"message": "Account deleted successfully"}

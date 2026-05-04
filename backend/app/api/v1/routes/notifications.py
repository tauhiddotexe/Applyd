import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.deps import get_current_user
from app.schemas.notification import NotificationResponse, NotificationUpdate
from app.services import notification_service

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("/", response_model=List[NotificationResponse])
async def get_notifications(
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user)
):
    return notification_service.get_user_notifications(db, user_id)

@router.put("/{notification_id}/read")
async def mark_notification_read(
    notification_id: uuid.UUID,
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user)
):
    success = notification_service.mark_as_read(db, user_id, notification_id)
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"status": "success"}

@router.put("/read-all")
async def mark_all_notifications_read(
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user)
):
    notification_service.mark_all_as_read(db, user_id)
    return {"status": "success"}

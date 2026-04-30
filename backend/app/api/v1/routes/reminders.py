import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.schemas import ReminderResponse
from app.services import application_service

router = APIRouter(tags=["Reminders"])


@router.get("/reminders", response_model=list[ReminderResponse])
def list_reminders(
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user),
):
    return application_service.get_reminders(db, user_id)

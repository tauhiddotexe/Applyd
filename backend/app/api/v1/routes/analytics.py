import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.schemas import AnalyticsResponse
from app.services import application_service

router = APIRouter(tags=["Analytics"])


@router.get("/analytics", response_model=AnalyticsResponse)
def get_analytics(
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user),
):
    return application_service.get_analytics_data(db, user_id)

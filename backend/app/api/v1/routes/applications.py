import uuid
from typing import Literal

from fastapi import APIRouter, Depends, File, Query, UploadFile, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas import (
    ApplicationCreate,
    ApplicationDetailResponse,
    ApplicationDocumentResponse,
    ApplicationEventCreate,
    ApplicationEventResponse,
    ApplicationUpdate,
    ApplicationResponse,
    StatusEnum,
)
from app.services import application_service, notification_service
from app.core.deps import get_current_user
from app.core.logging import logger

router = APIRouter(prefix="/applications", tags=["Applications"])


@router.post("", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
def create(data: ApplicationCreate, db: Session = Depends(get_db), user_id: uuid.UUID = Depends(get_current_user)):
    logger.info(f"POST /applications | user={user_id} | payload={data.model_dump()}")
    app = application_service.create_application(db, user_id, data)
    notification_service.create_notification(
        db, user_id, "application_added", 
        f"New application added: {app.role} at {app.company}"
    )
    return app


@router.get("", response_model=list[ApplicationResponse])
def list_all(
    search: str | None = Query(None),
    status_filter: StatusEnum | None = Query(None, alias="status"),
    sort: Literal["newest", "oldest"] = Query("newest"),
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user),
):
    return application_service.get_applications(db, user_id, search, status_filter, sort)


@router.get("/{app_id}", response_model=ApplicationDetailResponse)
def get_one(app_id: uuid.UUID, db: Session = Depends(get_db), user_id: uuid.UUID = Depends(get_current_user)):
    return application_service.get_application_detail(db, app_id, user_id)


@router.put("/{app_id}", response_model=ApplicationResponse)
def update(app_id: uuid.UUID, data: ApplicationUpdate, db: Session = Depends(get_db), user_id: uuid.UUID = Depends(get_current_user)):
    logger.info(f"PUT /applications/{app_id} | payload={data.model_dump(exclude_unset=True)}")
    updated_app = application_service.update_application(db, app_id, user_id, data)
    if data.status:
        notification_service.create_notification(
            db, user_id, "status_change",
            f"Status updated for {updated_app.company}: {data.status}"
        )
    return updated_app


@router.delete("/{app_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete(app_id: uuid.UUID, db: Session = Depends(get_db), user_id: uuid.UUID = Depends(get_current_user)):
    application_service.delete_application(db, app_id, user_id)


@router.get("/{app_id}/events", response_model=list[ApplicationEventResponse])
def list_events(app_id: uuid.UUID, db: Session = Depends(get_db), user_id: uuid.UUID = Depends(get_current_user)):
    return application_service.list_application_events(db, app_id, user_id)


@router.post("/{app_id}/events", response_model=ApplicationEventResponse, status_code=status.HTTP_201_CREATED)
def create_event(
    app_id: uuid.UUID,
    data: ApplicationEventCreate,
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user),
):
    return application_service.create_application_event(db, app_id, user_id, data)


@router.post("/{app_id}/documents", response_model=ApplicationDocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    app_id: uuid.UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user),
):
    file_bytes = await file.read()
    return application_service.create_application_document(
        db,
        app_id,
        user_id,
        file.filename or "document",
        file_bytes,
        file.content_type,
    )

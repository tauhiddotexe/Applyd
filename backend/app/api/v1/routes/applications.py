import uuid
from pathlib import Path
from typing import Literal

from fastapi import APIRouter, Depends, File, Query, UploadFile, status
from fastapi.concurrency import run_in_threadpool
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
    safe_data = data.model_dump(exclude={"notes"})
    logger.info(f"POST /applications | user={user_id} | company={safe_data.get('company')} | role={safe_data.get('role')}")
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
    safe_data = data.model_dump(exclude_unset=True, exclude={"notes"})
    logger.info(f"PUT /applications/{app_id} | fields={list(safe_data.keys())}")
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


ALLOWED_DOCUMENT_TYPES = {"application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


@router.post("/{app_id}/documents", response_model=ApplicationDocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    app_id: uuid.UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user),
):
    if file.content_type not in ALLOWED_DOCUMENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF and DOCX files are supported",
        )

    ext = Path(file.filename or "").suffix.lower()
    if ext not in {".pdf", ".docx"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file extension: {ext}",
        )

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB",
        )

    return await run_in_threadpool(
        application_service.create_application_document,
        db,
        app_id,
        user_id,
        file.filename or "document",
        contents,
        file.content_type,
    )

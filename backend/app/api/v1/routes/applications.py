import uuid
from fastapi import APIRouter, Depends, status, Header
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas import ApplicationCreate, ApplicationUpdate, ApplicationResponse
from app.services import application_service
from app.core.logging import logger

router = APIRouter(prefix="/applications", tags=["Applications"])

# Temp: extract user_id from header until auth is implemented
DEMO_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")


async def get_current_user_id(x_user_id: str | None = Header(None)) -> uuid.UUID:
    if x_user_id:
        try:
            return uuid.UUID(x_user_id)
        except ValueError:
            pass
    return DEMO_USER_ID


@router.post("", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
async def create(data: ApplicationCreate, db: AsyncSession = Depends(get_db), user_id: uuid.UUID = Depends(get_current_user_id)):
    logger.info(f"POST /applications | user={user_id} | payload={data.model_dump()}")
    app = await application_service.create_application(db, user_id, data)
    return app


@router.get("", response_model=list[ApplicationResponse])
async def list_all(db: AsyncSession = Depends(get_db), user_id: uuid.UUID = Depends(get_current_user_id)):
    return await application_service.get_applications(db, user_id)


@router.get("/{app_id}", response_model=ApplicationResponse)
async def get_one(app_id: uuid.UUID, db: AsyncSession = Depends(get_db), user_id: uuid.UUID = Depends(get_current_user_id)):
    return await application_service.get_application(db, app_id, user_id)


@router.put("/{app_id}", response_model=ApplicationResponse)
async def update(app_id: uuid.UUID, data: ApplicationUpdate, db: AsyncSession = Depends(get_db), user_id: uuid.UUID = Depends(get_current_user_id)):
    logger.info(f"PUT /applications/{app_id} | payload={data.model_dump(exclude_unset=True)}")
    return await application_service.update_application(db, app_id, user_id, data)


@router.delete("/{app_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete(app_id: uuid.UUID, db: AsyncSession = Depends(get_db), user_id: uuid.UUID = Depends(get_current_user_id)):
    await application_service.delete_application(db, app_id, user_id)

import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.models import Application
from app.schemas import ApplicationCreate, ApplicationUpdate
from app.core.logging import logger


async def create_application(db: AsyncSession, user_id: uuid.UUID, data: ApplicationCreate) -> Application:
    app = Application(
        user_id=user_id,
        company=data.company,
        role=data.role,
        status=data.status.value,
        link=data.link,
        notes=data.notes,
        follow_up=data.follow_up,
    )
    db.add(app)
    await db.commit()
    await db.refresh(app)
    logger.info(f"Created application {app.id} for user {user_id} | {data.company} - {data.role}")
    return app


async def get_applications(db: AsyncSession, user_id: uuid.UUID) -> list[Application]:
    result = await db.execute(
        select(Application).where(Application.user_id == user_id).order_by(Application.created_at.desc())
    )
    return list(result.scalars().all())


async def get_application(db: AsyncSession, app_id: uuid.UUID, user_id: uuid.UUID) -> Application:
    result = await db.execute(
        select(Application).where(Application.id == app_id, Application.user_id == user_id)
    )
    app = result.scalar_one_or_none()
    if not app:
        logger.warning(f"Application {app_id} not found for user {user_id}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    return app


async def update_application(db: AsyncSession, app_id: uuid.UUID, user_id: uuid.UUID, data: ApplicationUpdate) -> Application:
    app = await get_application(db, app_id, user_id)
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(app, field, value.value if hasattr(value, "value") else value)
    await db.commit()
    await db.refresh(app)
    logger.info(f"Updated application {app_id} | fields: {list(update_data.keys())}")
    return app


async def delete_application(db: AsyncSession, app_id: uuid.UUID, user_id: uuid.UUID) -> None:
    app = await get_application(db, app_id, user_id)
    await db.delete(app)
    await db.commit()
    logger.info(f"Deleted application {app_id} for user {user_id}")

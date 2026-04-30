import uuid
from datetime import datetime, timedelta
from pathlib import Path
from sqlalchemy import func, or_, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, selectinload
from fastapi import HTTPException, status
from app.models import Application, ApplicationDocument, ApplicationEvent
from app.schemas import ApplicationCreate, ApplicationEventCreate, ApplicationUpdate, StatusEnum
from app.core.logging import logger

UPLOADS_DIR = Path(__file__).resolve().parents[2] / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)


def create_application(db: Session, user_id: uuid.UUID, data: ApplicationCreate) -> Application:
    app = Application(
        user_id=user_id,
        company=data.company,
        role=data.role,
        status=data.status.value,
        link=data.link,
        salary_min=data.salary_min,
        salary_max=data.salary_max,
        currency=data.currency,
        location=data.location,
        recruiter=data.recruiter,
        notes=data.notes,
        follow_up=data.follow_up,
    )
    db.add(app)
    db.commit()
    db.refresh(app)
    logger.info(f"Created application {app.id} for user {user_id} | {data.company} - {data.role}")
    return app


def get_applications(
    db: Session,
    user_id: uuid.UUID,
    search: str | None = None,
    status_filter: StatusEnum | None = None,
    sort: str = "newest",
) -> list[Application]:
    query = select(Application).where(Application.user_id == user_id)

    if search:
        pattern = f"%{search.strip()}%"
        query = query.where(
            or_(
                Application.company.ilike(pattern),
                Application.role.ilike(pattern),
            )
        )

    if status_filter:
        query = query.where(Application.status == status_filter.value)

    if sort == "oldest":
        query = query.order_by(Application.created_at.asc())
    else:
        query = query.order_by(Application.created_at.desc())

    result = db.execute(query)
    return list(result.scalars().all())


def get_application(db: Session, app_id: uuid.UUID, user_id: uuid.UUID) -> Application:
    result = db.execute(
        select(Application)
        .options(selectinload(Application.events), selectinload(Application.documents))
        .where(Application.id == app_id, Application.user_id == user_id)
    )
    app = result.scalar_one_or_none()
    if not app:
        logger.warning(f"Application {app_id} not found for user {user_id}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    return app


def update_application(db: Session, app_id: uuid.UUID, user_id: uuid.UUID, data: ApplicationUpdate) -> Application:
    app = get_application(db, app_id, user_id)
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(app, field, value.value if hasattr(value, "value") else value)
    db.commit()
    db.refresh(app)
    logger.info(f"Updated application {app_id} | fields: {list(update_data.keys())}")
    return app


def get_application_detail(db: Session, app_id: uuid.UUID, user_id: uuid.UUID) -> dict:
    app = get_application(db, app_id, user_id)
    return {
        "id": app.id,
        "user_id": app.user_id,
        "company": app.company,
        "role": app.role,
        "status": app.status,
        "link": app.link,
        "salary_min": app.salary_min,
        "salary_max": app.salary_max,
        "currency": app.currency,
        "location": app.location,
        "recruiter": app.recruiter,
        "notes": app.notes,
        "follow_up": app.follow_up,
        "created_at": app.created_at,
        "updated_at": app.updated_at,
        "events": app.events,
        "documents": app.documents,
    }


def list_application_events(db: Session, app_id: uuid.UUID, user_id: uuid.UUID) -> list[ApplicationEvent]:
    app = get_application(db, app_id, user_id)
    return app.events


def create_application_event(db: Session, app_id: uuid.UUID, user_id: uuid.UUID, data: ApplicationEventCreate) -> ApplicationEvent:
    app = get_application(db, app_id, user_id)
    event = ApplicationEvent(
        application_id=app.id,
        type=data.type,
        date=data.date,
        notes=data.notes,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


def delete_application_event(db: Session, event_id: uuid.UUID, user_id: uuid.UUID) -> None:
    result = db.execute(
        select(ApplicationEvent)
        .join(Application, Application.id == ApplicationEvent.application_id)
        .where(ApplicationEvent.id == event_id, Application.user_id == user_id)
    )
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    db.delete(event)
    db.commit()


def create_application_document(
    db: Session,
    app_id: uuid.UUID,
    user_id: uuid.UUID,
    filename: str,
    file_bytes: bytes,
) -> ApplicationDocument:
    app = get_application(db, app_id, user_id)
    extension = Path(filename).suffix
    stored_name = f"{uuid.uuid4()}{extension}"
    destination = UPLOADS_DIR / stored_name
    destination.write_bytes(file_bytes)

    document = ApplicationDocument(
        application_id=app.id,
        name=filename,
        file_url=f"/uploads/{stored_name}",
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    return document


def delete_application(db: Session, app_id: uuid.UUID, user_id: uuid.UUID) -> None:
    app = get_application(db, app_id, user_id)
    db.delete(app)
    db.commit()
    logger.info(f"Deleted application {app_id} for user {user_id}")


def get_dashboard_data(db: Session, user_id: uuid.UUID) -> dict:
    try:
        total_result = db.execute(
            select(func.count()).select_from(Application).where(Application.user_id == user_id)
        )
        total_applications = total_result.scalar_one()

        status_counts = {
            "applied": 0,
            "interviewing": 0,
            "offer": 0,
            "rejected": 0,
            "wishlist": 0,
        }
        status_result = db.execute(
            select(Application.status, func.count())
            .where(Application.user_id == user_id)
            .group_by(Application.status)
        )
        for status_value, count in status_result.all():
            key = status_value.value if hasattr(status_value, "value") else str(status_value)
            status_counts[key] = count

        recent_result = db.execute(
            select(Application)
            .where(Application.user_id == user_id)
            .order_by(Application.created_at.desc())
            .limit(5)
        )

        return {
            "total_applications": total_applications,
            "status_counts": status_counts,
            "recent_applications": list(recent_result.scalars().all()),
        }
    except SQLAlchemyError as exc:
        logger.error(f"DB query error in dashboard for user {user_id}: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load dashboard",
        )


def get_analytics_data(db: Session, user_id: uuid.UUID) -> dict:
    try:
        total_result = db.execute(
            select(func.count()).select_from(Application).where(Application.user_id == user_id)
        )
        total = total_result.scalar_one()

        by_status = {
            "applied": 0,
            "interviewing": 0,
            "offer": 0,
            "rejected": 0,
            "wishlist": 0,
        }
        status_result = db.execute(
            select(Application.status, func.count())
            .where(Application.user_id == user_id)
            .group_by(Application.status)
        )
        for status_value, count in status_result.all():
            key = status_value.value if hasattr(status_value, "value") else str(status_value)
            by_status[key] = count

        month_expr = func.to_char(func.date_trunc("month", Application.created_at), "YYYY-MM")
        month_result = db.execute(
            select(month_expr.label("month"), func.count().label("count"))
            .where(Application.user_id == user_id)
            .group_by(month_expr)
            .order_by(month_expr.asc())
        )
        by_month = [
            {"month": month or "", "count": count}
            for month, count in month_result.all()
        ]

        recent_result = db.execute(
            select(Application)
            .where(Application.user_id == user_id)
            .order_by(Application.created_at.desc())
            .limit(5)
        )

        return {
            "total": total,
            "by_status": by_status,
            "by_month": by_month,
            "recent": list(recent_result.scalars().all()),
        }
    except SQLAlchemyError as exc:
        logger.error(f"DB query error in analytics for user {user_id}: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load analytics",
        )


def get_reminders(db: Session, user_id: uuid.UUID) -> list[Application]:
    today = datetime.now().date().isoformat()
    upcoming_limit = (datetime.now().date() + timedelta(days=3)).isoformat()
    result = db.execute(
        select(Application)
        .where(
            Application.user_id == user_id,
            Application.follow_up.is_not(None),
            Application.follow_up != "",
            Application.follow_up <= upcoming_limit,
            Application.status != StatusEnum.rejected.value,
        )
        .order_by(Application.follow_up.asc(), Application.created_at.desc())
    )
    return list(result.scalars().all())

import uuid
from sqlalchemy import select, update, desc
from sqlalchemy.orm import Session
from app.models.models import Notification
from app.core.logging import logger

def create_notification(db: Session, user_id: uuid.UUID, type: str, message: str):
    try:
        notification = Notification(
            user_id=user_id,
            type=type,
            message=message
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)
        return notification
    except Exception as e:
        logger.error(f"Failed to create notification: {e}")
        return None

def get_user_notifications(db: Session, user_id: uuid.UUID, limit: int = 20):
    return db.execute(
        select(Notification)
        .where(Notification.user_id == user_id)
        .order_by(desc(Notification.created_at))
        .limit(limit)
    ).scalars().all()

def mark_as_read(db: Session, user_id: uuid.UUID, notification_id: uuid.UUID):
    db.execute(
        update(Notification)
        .where(Notification.id == notification_id)
        .where(Notification.user_id == user_id)
        .values(is_read=True)
    )
    db.commit()
    return True

def mark_all_as_read(db: Session, user_id: uuid.UUID):
    db.execute(
        update(Notification)
        .where(Notification.user_id == user_id)
        .values(is_read=True)
    )
    db.commit()
    return True

import uuid
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.models import User, ProcessedPayment
from app.core.logging import logger
from app.services import notification_service

def get_user_by_id(db: Session, user_id: uuid.UUID) -> User | None:
    return db.execute(select(User).where(User.id == user_id)).scalar_one_or_none()

def check_credits(db: Session, user_id: uuid.UUID) -> bool:
    user = get_user_by_id(db, user_id)
    if not user:
        return False
    if user.plan == "unlimited":
        return True
    return user.credits > 0

def deduct_credit(db: Session, user_id: uuid.UUID) -> bool:
    user = get_user_by_id(db, user_id)
    if not user:
        return False
    if user.plan == "unlimited":
        return True

    from sqlalchemy import update
    result = db.execute(
        update(User)
        .where(User.id == user_id, User.credits > 0)
        .values(credits=User.credits - 1)
        .returning(User.credits)
    )
    row = result.fetchone()
    db.commit()
    if row is None:
        return False

    remaining = row[0]
    if remaining <= 1:
        notification_service.create_notification(
            db, user_id, "low_credits",
            f"You have {remaining} credits remaining. Upgrade now to continue using AI features!"
        )

    logger.info(f"Credit deducted for user {user_id}. Remaining: {remaining}")
    return True

def add_credits(db: Session, user_id: uuid.UUID, amount: int, plan_type: str, session_id: str):
    # Check if this session has already been processed (idempotency)
    existing_payment = db.execute(
        select(ProcessedPayment).where(ProcessedPayment.stripe_session_id == session_id)
    ).scalar_one_or_none()
    
    if existing_payment:
        logger.warning(f"Payment session {session_id} already processed. Skipping.")
        return False

    user = get_user_by_id(db, user_id)
    if user:
        user.credits += amount
        user.plan = plan_type
        
        # Record the processed payment
        payment = ProcessedPayment(
            stripe_session_id=session_id,
            user_id=user_id,
            amount_credits=amount
        )
        db.add(user)
        db.add(payment)
        db.commit()
        logger.info(f"Added {amount} credits to user {user_id}. New total: {user.credits}. Plan: {plan_type}. Session: {session_id}")
        return True
    return False
def update_user(db: Session, user_id: uuid.UUID, user_data: dict) -> User | None:
    user = get_user_by_id(db, user_id)
    if not user:
        return None
    
    for key, value in user_data.items():
        if hasattr(user, key) and value is not None:
            setattr(user, key, value)
    
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def delete_user(db: Session, user_id: uuid.UUID) -> bool:
    user = get_user_by_id(db, user_id)
    if not user:
        return False
    
    db.delete(user)
    db.commit()
    return True

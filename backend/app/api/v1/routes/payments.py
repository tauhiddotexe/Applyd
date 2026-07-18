import uuid
import stripe
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.deps import get_current_user
from app.core.config import settings
from app.core.logging import logger
from app.services import user_service, notification_service

router = APIRouter(prefix="/payments", tags=["Payments"])

stripe.api_key = settings.STRIPE_API_KEY

@router.post("/create-checkout-session")
def create_checkout_session(
    plan_type: str,
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user),
):
    if plan_type == "basic":
        price_id = settings.STRIPE_BASIC_PRICE_ID
    elif plan_type == "pro":
        price_id = settings.STRIPE_PRO_PRICE_ID
    else:
        raise HTTPException(status_code=400, detail="Invalid plan type")

    if not price_id:
        raise HTTPException(status_code=500, detail="Stripe price ID not configured")

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price": price_id,
                "quantity": 1,
            }],
            mode="payment",
            success_url=f"{settings.FRONTEND_URL}/payment-success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{settings.FRONTEND_URL}/payment-cancelled",
            metadata={
                "user_id": str(user_id),
                "plan_type": plan_type,
            },
        )
        return {"url": session.url}
    except Exception as e:
        logger.error(f"Stripe session creation failed: {e}")
        raise HTTPException(status_code=500, detail="Payment session creation failed")

@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Webhook endpoint for Stripe events.
    Does NOT require authentication (validated via Stripe signature).
    """
    payload = await request.body()
    sig_header = request.headers.get("Stripe-Signature")
    
    if not sig_header:
        logger.warning("Webhook received without Stripe-Signature header")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing signature")

    if not settings.STRIPE_WEBHOOK_SECRET:
        logger.error("STRIPE_WEBHOOK_SECRET not configured in environment")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Webhook configuration error")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError as e:
        logger.error(f"Invalid webhook payload: {e}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        logger.error(f"Invalid webhook signature: {e}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid signature")

    event_type = event["type"]
    logger.info(f"Stripe Webhook Received: {event_type}")

    if event_type == "checkout.session.completed":
        session = event["data"]["object"]
        session_id = session.get("id")
        metadata = session.get("metadata", {})
        user_id_str = metadata.get("user_id")
        plan_type = metadata.get("plan_type")

        logger.info(f"Processing Checkout Completed | Session: {session_id} | User: {user_id_str} | Plan: {plan_type}")

        if user_id_str and plan_type:
            try:
                user_id = uuid.UUID(user_id_str)
                credits_to_add = 15 if plan_type == "basic" else 40
                
                # Use run_in_threadpool since this is an async route
                success = await run_in_threadpool(user_service.add_credits, db, user_id, credits_to_add, plan_type, session_id)
                
                if success:
                    logger.info(f"Successfully fulfilled {plan_type} plan for user {user_id}")
                    await run_in_threadpool(notification_service.create_notification,
                        db, user_id, "plan_upgrade",
                        f"Plan upgraded to {plan_type.upper()}! {credits_to_add} credits added."
                    )
                else:
                    logger.warning(f"Fulfillment skipped or failed for user {user_id}")
            except Exception as e:
                logger.error(f"Error processing credit fulfillment: {e}")
                # We return 500 so Stripe retries later
                raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal processing error")

    return {"status": "success"}

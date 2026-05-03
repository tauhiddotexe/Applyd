from pathlib import Path
from contextlib import asynccontextmanager
from sqlalchemy import text
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.core.logging import logger
from app.db.session import engine, Base
from app.api.v1.routes import ai, analytics, applications, dashboard, events, reminders, payments, users

UPLOADS_DIR = Path(__file__).resolve().parents[1] / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 3"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS plan VARCHAR(32) DEFAULT 'free'"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255)"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(255)"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{\"notifications\": true}'::jsonb"))
        conn.execute(text("ALTER TABLE applications ADD COLUMN IF NOT EXISTS salary_min INTEGER"))
        conn.execute(text("ALTER TABLE applications ADD COLUMN IF NOT EXISTS salary_max INTEGER"))
        conn.execute(text("ALTER TABLE applications ADD COLUMN IF NOT EXISTS currency VARCHAR(8)"))
        conn.execute(text("ALTER TABLE applications ADD COLUMN IF NOT EXISTS location VARCHAR(255)"))
        conn.execute(text("ALTER TABLE applications ADD COLUMN IF NOT EXISTS recruiter VARCHAR(255)"))
        conn.execute(text("ALTER TABLE applications ADD COLUMN IF NOT EXISTS link VARCHAR(2048)"))
        conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS application_events (
                    id UUID PRIMARY KEY,
                    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
                    type VARCHAR(255) NOT NULL,
                    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    notes TEXT NULL
                )
                """
            )
        )
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_application_events_application_id ON application_events (application_id)"))
        conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS application_documents (
                    id UUID PRIMARY KEY,
                    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
                    name VARCHAR(255) NOT NULL,
                    file_url VARCHAR(2048) NOT NULL,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
                """
            )
        )
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_application_documents_application_id ON application_documents (application_id)"))
        conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS processed_payments (
                    id UUID PRIMARY KEY,
                    stripe_session_id VARCHAR(255) UNIQUE NOT NULL,
                    user_id UUID NOT NULL REFERENCES users(id),
                    amount_credits INTEGER NOT NULL,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
                """
            )
        )
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_processed_payments_stripe_session_id ON processed_payments (stripe_session_id)"))
    logger.info(f"CORS Origins: {settings.cors_origins_list}")
    logger.info("Applyd API started")
    yield
    engine.dispose()
    logger.info("Applyd API shutdown")


app = FastAPI(
    title="Applyd API",
    version="1.0.0",
    description="Backend API for the Applyd job application tracker",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {exc} | path={request.url.path} | method={request.method}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"},
    )


# Mount routes
app.include_router(applications.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")
app.include_router(analytics.router, prefix="/api/v1")
app.include_router(events.router, prefix="/api/v1")
app.include_router(reminders.router, prefix="/api/v1")
app.include_router(ai.router, prefix="/api/v1")
app.include_router(payments.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "applyd-api"}

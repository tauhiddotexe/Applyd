import time
from pathlib import Path
from contextlib import asynccontextmanager
from sqlalchemy import text
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse, FileResponse, Response
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.core.logging import logger
from app.db.session import engine, Base, is_sqlite
from app.api.v1.routes import ai, analytics, applications, auth, dashboard, events, jobs, reminders, payments, users, notifications

UPLOADS_DIR = Path(__file__).resolve().parents[1] / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)


def run_migrations():
    """Create tables if using SQLite, run PG migrations otherwise."""
    try:
        if is_sqlite:
            logger.info("SQLite mode: creating all tables via SQLAlchemy...")
            Base.metadata.create_all(bind=engine)
            logger.info("SQLite tables created successfully")
            return
        logger.info("Running database migrations...")
        with engine.begin() as conn:
            # User table updates
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 3"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS plan VARCHAR(32) DEFAULT 'free'"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255)"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(255)"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(2048)"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{\"notifications\": true}'::jsonb"))
            
            # Application table updates
            conn.execute(text("ALTER TABLE applications ADD COLUMN IF NOT EXISTS salary_min INTEGER"))
            conn.execute(text("ALTER TABLE applications ADD COLUMN IF NOT EXISTS salary_max INTEGER"))
            conn.execute(text("ALTER TABLE applications ADD COLUMN IF NOT EXISTS currency VARCHAR(8)"))
            conn.execute(text("ALTER TABLE applications ADD COLUMN IF NOT EXISTS location VARCHAR(255)"))
            conn.execute(text("ALTER TABLE applications ADD COLUMN IF NOT EXISTS recruiter VARCHAR(255)"))
            conn.execute(text("ALTER TABLE applications ADD COLUMN IF NOT EXISTS link VARCHAR(2048)"))
            
            # Table creations
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
            
            conn.execute(
                text(
                    """
                    CREATE TABLE IF NOT EXISTS notifications (
                        id UUID PRIMARY KEY,
                        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        type VARCHAR(50) NOT NULL,
                        message TEXT NOT NULL,
                        is_read BOOLEAN DEFAULT FALSE,
                        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                    )
                    """
                )
            )
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_notifications_user_id ON notifications (user_id)"))
        logger.info("Database migrations completed successfully")
    except Exception as e:
        logger.error(f"Database migration failed: {e}")
        logger.warning("Application starting in degraded mode (DB features may fail)")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Applyd API lifecycle starting...")
    # Run migrations in a way that doesn't block startup if DB is down
    try:
        run_migrations()
    except Exception as e:
        logger.error(f"Post-migration failure in lifespan: {e}")
    
    logger.info(f"CORS Origins: {settings.cors_origins_list}")
    logger.info("Applyd API fully initialized and ready to serve requests")
    yield
    engine.dispose()
    logger.info("Applyd API shutdown complete")


app = FastAPI(
    title="Applyd API",
    version="1.0.0",
    description="Backend API for the Applyd job application tracker",
    lifespan=lifespan,
)

# Request body size limit middleware (1MB for non-upload routes)
MAX_BODY_SIZE = 1 * 1024 * 1024  # 1 MB


@app.middleware("http")
async def limit_request_body(request: Request, call_next):
    if request.method in ("POST", "PUT", "PATCH") and not request.url.path.startswith("/uploads"):
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > MAX_BODY_SIZE:
            return JSONResponse(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                content={"detail": "Request body too large"},
            )
    return await call_next(request)


# Security headers middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response: Response = await call_next(request)
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    if settings.DEV_MODE:
        response.headers["Content-Security-Policy"] = "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; script-src 'self' 'unsafe-inline'"
    else:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Content-Security-Policy"] = "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; script-src 'self'"
    return response

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    
    # Extract user ID if available in request state (set by get_current_user)
    # Note: get_current_user runs as a dependency, so it's not available in middleware 
    # unless we parse the JWT ourselves or use a different approach.
    # For now, we'll log what we can.
    
    response = await call_next(request)
    
    duration = time.time() - start_time
    
    extra = {
        "method": request.method,
        "path": request.url.path,
        "status_code": response.status_code,
        "duration_ms": f"{duration*1000:.2f}ms",
        "ip": request.client.host if request.client else "unknown",
    }
    
    logger.info(f"REQ_END: {request.method} {request.url.path} {response.status_code} ({duration*1000:.2f}ms)", extra={"extra_info": extra})
    return response

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    tb = traceback.format_exc()
    error_info = {
        "path": request.url.path,
        "method": request.method,
        "error": str(exc),
        "type": type(exc).__name__,
    }
    logger.error(f"Unhandled error: {exc}", extra={"extra_info": error_info})
    logger.error(f"Traceback:\n{tb}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": f"Internal server error: {exc}", "traceback": tb},
    )


# Mount routes
app.include_router(applications.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")
app.include_router(analytics.router, prefix="/api/v1")
app.include_router(events.router, prefix="/api/v1")
app.include_router(reminders.router, prefix="/api/v1")
app.include_router(ai.router, prefix="/api/v1")
app.include_router(jobs.router, prefix="/api/v1")
app.include_router(payments.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(notifications.router, prefix="/api/v1")
app.include_router(auth.router, prefix="/api/v1")
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "applyd-api"}


# Serve static files for frontend
STATIC_DIR = Path(__file__).resolve().parents[1] / "static"
RESOLVED_STATIC = STATIC_DIR.resolve()


@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    # 1. If path is empty, return index.html
    if not full_path:
        return FileResponse(STATIC_DIR / "index.html")

    # 2. If it's a real file in static, return it (with path traversal protection)
    candidate = (STATIC_DIR / full_path).resolve()
    try:
        candidate.relative_to(RESOLVED_STATIC)
    except ValueError:
        return JSONResponse(status_code=404, content={"detail": "Not found"})

    if candidate.is_file():
        return FileResponse(candidate)

    # 3. If it's an API route that didn't match, 404
    if full_path.startswith("api/"):
        return JSONResponse(status_code=404, content={"detail": "Not found"})

    # 4. Otherwise, return index.html for SPA routing
    index_path = STATIC_DIR / "index.html"
    if index_path.is_file():
        return FileResponse(index_path)

    return JSONResponse(status_code=404, content={"detail": "Frontend not found"})

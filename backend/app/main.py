from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.logging import logger
from app.db.session import engine, Base
from app.api.v1.routes import applications


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables if they don't exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables verified")
    logger.info("Applyd API started")
    yield
    # Shutdown
    await engine.dispose()
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


@app.get("/health")
async def health():
    return {"status": "ok", "service": "applyd-api"}

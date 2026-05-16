import time
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings
from app.core.logging import logger

logger.info(f"Initializing database engine with pool_size=10, max_overflow=20")
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10, # Increased from 5
    max_overflow=20, # Increased from 10
    pool_timeout=30, # Increased to 30s to be more patient during bursts
    connect_args={
        "connect_timeout": 10,
        "application_name": "applyd-api-prod"
    }
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db() -> Session:
    t_start = time.time()
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
        # logger.debug(f"DB_SESSION_RELEASED: {time.time()-t_start:.4f}s")

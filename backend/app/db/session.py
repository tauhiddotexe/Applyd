import time
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from sqlalchemy.pool import NullPool

from app.core.config import settings
from app.core.logging import logger

is_sqlite = settings.DATABASE_URL.startswith("sqlite")
logger.info(f"Initializing database engine (SQLite: {is_sqlite})")
if is_sqlite:
    engine = create_engine(
        settings.DATABASE_URL,
        poolclass=NullPool,
        connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
        pool_timeout=30,
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

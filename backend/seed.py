"""Seed the database with a demo user for local development."""
import asyncio
import uuid
from app.db.session import engine, async_session, Base
from app.models import User

DEMO_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")
DEMO_EMAIL = "demo@applyd.dev"


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        from sqlalchemy import select
        result = await session.execute(select(User).where(User.id == DEMO_USER_ID))
        if result.scalar_one_or_none():
            print(f"Demo user already exists: {DEMO_EMAIL}")
            return

        user = User(id=DEMO_USER_ID, email=DEMO_EMAIL)
        session.add(user)
        await session.commit()
        print(f"Created demo user: {DEMO_EMAIL} ({DEMO_USER_ID})")


if __name__ == "__main__":
    asyncio.run(seed())

"""Standalone database initializer (used for one-off migrations, not app startup).

The application startup uses app.db.database.init_db() via the lifespan handler.
This script is only for manual/CLI use outside the FastAPI process.
"""
from app.db.database import engine, Base
from app.models import user, order  # noqa: F401
from app.models import stepup, cart, transaction  # noqa: F401
import asyncio


async def init_db():
    """Initialize database by creating all tables"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    print("Database tables created successfully!")


if __name__ == "__main__":
    asyncio.run(init_db())

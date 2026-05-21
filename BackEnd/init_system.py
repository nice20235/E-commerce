#!/usr/bin/env python3
"""
StepUp — one-off system initializer.
Creates the database schema and an admin user.

Usage:
    ADMIN_PASSWORD=changeme ADMIN_PHONE=+998901234567 python init_system.py
"""

import asyncio
import os
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent))

from app.db.database import init_db, AsyncSessionLocal
from app.crud.user import create_user, get_user_by_phone_number
from app.schemas.user import UserCreate


async def create_admin_user():
    admin_phone = os.environ.get("ADMIN_PHONE", "+998000000000")
    admin_password = os.environ.get("ADMIN_PASSWORD")
    if not admin_password:
        raise SystemExit("ADMIN_PASSWORD environment variable must be set")

    async with AsyncSessionLocal() as db:
        existing = await get_user_by_phone_number(db, admin_phone)
        if existing:
            print(f"Admin already exists: {existing.name} (is_admin={existing.is_admin})")
            return

        admin_data = UserCreate(
            name=os.environ.get("ADMIN_NAME", "Admin"),
            surname=os.environ.get("ADMIN_SURNAME", "User"),
            phone_number=admin_phone,
            password=admin_password,
            confirm_password=admin_password,
        )
        user = await create_user(db, admin_data)
        user.is_admin = True
        await db.commit()
        print(f"Admin created: {user.name} | phone: {admin_phone}")


async def main():
    print("Initializing database…")
    await init_db()
    print("Database ready.")
    await create_admin_user()
    print("Done.")


if __name__ == "__main__":
    asyncio.run(main())

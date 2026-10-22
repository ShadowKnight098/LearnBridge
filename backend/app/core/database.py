import sys
from typing import AsyncGenerator
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import event
from app.core.config import settings

# Psycopg on Windows requires WindowsSelectorEventLoopPolicy
if sys.platform == "win32":
    try:
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    except Exception:
        pass

# Configure async engine
connect_args = {}
db_url = settings.DATABASE_URL

# Auto-adapt PostgreSQL URI from Supabase/Postgres to async psycopg driver
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+psycopg://", 1)
elif db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+psycopg://", 1)

# Auto-detect Supabase direct IPv6 domain and adapt to IPv4 pooler for Render/IPv4 hosts
import re
supabase_match = re.search(r"@db\.([a-z0-9]+)\.supabase\.co(?::5432)?", db_url)
if supabase_match:
    project_ref = supabase_match.group(1)
    db_url = re.sub(
        r"://([^:]+):",
        lambda m: f"://{m.group(1)}.{project_ref}:" if f".{project_ref}" not in m.group(1) else f"://{m.group(1)}:",
        db_url,
        count=1
    )
    db_url = re.sub(
        r"@db\.[a-z0-9]+\.supabase\.co(?::5432)?",
        "@aws-0-ap-south-1.pooler.supabase.com:5432",
        db_url
    )

if db_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_async_engine(
    db_url,
    echo=(settings.ENVIRONMENT == "development" and False),
    future=True,
    connect_args=connect_args
)

# Enable foreign keys for SQLite
if settings.DATABASE_URL.startswith("sqlite"):
    @event.listens_for(engine.sync_engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

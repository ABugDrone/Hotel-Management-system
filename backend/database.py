"""
Developer: DroneBug Technologies
GitHub: https://github.com/ABugDrone
App: Amirable Hotel Management System
License: Proprietary
"""

import os
import json
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import event

# Load config from root (or _MEIPASS when bundled with PyInstaller)
base_dir = os.environ.get("AMIRABLE_BASE_DIR")
if not base_dir:
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

CONFIG_PATH = os.path.join(base_dir, "config.json")

with open(CONFIG_PATH, "r") as f:
    config = json.load(f)

DB_PATH = config.get("db_path", "C:/AmirableHotel/data/amirable.db")
DB_DIR = os.path.dirname(DB_PATH)

# Ensure DB directory exists for offline-first local storage
if DB_DIR and not os.path.exists(DB_DIR):
    os.makedirs(DB_DIR, exist_ok=True)

SQLALCHEMY_DATABASE_URL = f"sqlite+aiosqlite:///{DB_PATH}"

engine = create_async_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
)

async_session = async_sessionmaker(
    engine, 
    class_=AsyncSession, 
    expire_on_commit=False
)

class Base(DeclarativeBase):
    pass

@event.listens_for(engine.sync_engine, "connect")
def set_sqlite_pragma(dbapi_conn, connection_record):
    """
    Enable WAL mode and other performance optimizations for concurrent local access.
    """
    cursor = dbapi_conn.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA synchronous=NORMAL")
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.execute("PRAGMA cache_size=-64000")
    cursor.close()

async def get_db():
    """
    Dependency to get async database session.
    """
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()

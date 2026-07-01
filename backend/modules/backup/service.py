"""
Developer: DroneBug Technologies
GitHub: https://github.com/ABugDrone
App: Amirable Hotel Management System
License: Proprietary
"""

import os
import shutil
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import List, Optional
from .models import Backup, BackupType, RestoreStatus
from backend.database import DB_PATH, DB_DIR

BACKUP_DIR = os.path.join(os.path.dirname(DB_PATH), "backups")
if not os.path.exists(BACKUP_DIR):
    os.makedirs(BACKUP_DIR, exist_ok=True)

async def get_all_backups(db: AsyncSession):
    result = await db.execute(select(Backup).order_by(Backup.created_at.desc()))
    return result.scalars().all()

async def get_backup_by_id(db: AsyncSession, backup_id: str):
    result = await db.execute(select(Backup).where(Backup.id == backup_id))
    return result.scalar_one_or_none()

async def create_backup(db: AsyncSession, notes: Optional[str] = None, user_id: Optional[str] = None):
    timestamp = datetime.utcnow().strftime("%Y-%m-%d_%H-%M")
    filename = f"amirable_{timestamp}.db"
    file_path = os.path.join(BACKUP_DIR, filename)

    if os.path.exists(DB_PATH):
        shutil.copy2(DB_PATH, file_path)

    backup = Backup(
        filename=filename,
        file_path=file_path,
        size=os.path.getsize(file_path) if os.path.exists(file_path) else 0,
        backup_type=BackupType.MANUAL,
        created_by=user_id,
        notes=notes or f"Manual backup {timestamp}"
    )
    db.add(backup)
    await db.commit()
    return backup

async def restore_backup(db: AsyncSession, backup_id: str, notes: Optional[str] = None):
    backup = await get_backup_by_id(db, backup_id)
    if not backup:
        return None
    if backup.restore_status != RestoreStatus.AVAILABLE:
        return None

    if os.path.exists(backup.file_path):
        os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
        shutil.copy2(backup.file_path, DB_PATH)

    backup.restore_status = RestoreStatus.RESTORED
    backup.notes = (backup.notes or "") + f" | Restored: {datetime.utcnow().isoformat()} - {notes or 'No notes'}"
    await db.commit()
    return backup

async def delete_backup(db: AsyncSession, backup_id: str):
    backup = await get_backup_by_id(db, backup_id)
    if not backup:
        return False
    if os.path.exists(backup.file_path):
        os.remove(backup.file_path)
    await db.execute(delete(Backup).where(Backup.id == backup_id))
    await db.commit()
    return True

async def get_system_info():
    db_size = os.path.getsize(DB_PATH) if os.path.exists(DB_PATH) else 0
    free_space = shutil.disk_usage(os.path.dirname(DB_PATH)).free if os.path.dirname(DB_PATH) else 0
    return {
        "db_size": db_size,
        "free_space": free_space,
        "backup_path": BACKUP_DIR,
        "last_check": datetime.utcnow().isoformat()
    }

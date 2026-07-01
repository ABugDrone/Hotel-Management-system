"""
Developer: DroneBug Technologies
GitHub: https://github.com/ABugDrone
App: Amirable Hotel Management System
License: Proprietary
"""

import uuid
import enum
from datetime import datetime
from sqlalchemy import String, Float, DateTime, Enum, Integer
from sqlalchemy.orm import Mapped, mapped_column
from backend.database import Base

class BackupType(str, enum.Enum):
    AUTO = "AUTO"
    MANUAL = "MANUAL"
    SCHEDULED = "SCHEDULED"

class RestoreStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    RESTORED = "RESTORED"
    CORRUPTED = "CORRUPTED"

class Backup(Base):
    __tablename__ = "backups"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    filename: Mapped[str] = mapped_column(String, nullable=False)
    file_path: Mapped[str] = mapped_column(String, nullable=False)
    size: Mapped[int] = mapped_column(Integer, default=0)
    backup_type: Mapped[BackupType] = mapped_column(Enum(BackupType), nullable=False, default=BackupType.MANUAL)
    created_by: Mapped[str] = mapped_column(String, nullable=True)
    notes: Mapped[str] = mapped_column(String, nullable=True)
    restore_status: Mapped[RestoreStatus] = mapped_column(Enum(RestoreStatus), nullable=False, default=RestoreStatus.AVAILABLE)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

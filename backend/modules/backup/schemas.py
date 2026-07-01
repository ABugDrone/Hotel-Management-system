"""
Developer: DroneBug Technologies
GitHub: https://github.com/ABugDrone
App: Amirable Hotel Management System
License: Proprietary
"""

from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional
from .models import BackupType, RestoreStatus

class BackupBase(BaseModel):
    filename: str
    file_path: str
    size: int = 0
    backup_type: BackupType = BackupType.MANUAL
    notes: Optional[str] = None

class BackupCreate(BaseModel):
    notes: Optional[str] = None

class BackupRead(BackupBase):
    id: str
    created_by: Optional[str] = None
    restore_status: RestoreStatus
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class RestoreRequest(BaseModel):
    notes: Optional[str] = None

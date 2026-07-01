"""
Developer: DroneBug Technologies
GitHub: https://github.com/ABugDrone
App: Amirable Hotel Management System
License: Proprietary
"""

from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional
from .models import AttendanceStatus

class AttendanceBase(BaseModel):
    staff_id: str
    date: datetime
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None
    status: AttendanceStatus = AttendanceStatus.PRESENT
    notes: Optional[str] = None

class AttendanceCreate(AttendanceBase):
    pass

class AttendanceRead(AttendanceBase):
    id: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

"""
Developer: DroneBug Technologies
GitHub: https://github.com/ABugDrone
App: Amirable Hotel Management System
License: Proprietary
"""

import uuid
import enum
from datetime import datetime
from sqlalchemy import String, DateTime, Enum, Date
from sqlalchemy.orm import Mapped, mapped_column
from backend.database import Base

class AttendanceStatus(str, enum.Enum):
    PRESENT = "PRESENT"
    ABSENT = "ABSENT"
    LATE = "LATE"
    ON_LEAVE = "ON_LEAVE"
    HALF_DAY = "HALF_DAY"

class Attendance(Base):
    __tablename__ = "attendance"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    staff_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    check_in: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    check_out: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    status: Mapped[AttendanceStatus] = mapped_column(Enum(AttendanceStatus), nullable=False, default=AttendanceStatus.PRESENT)
    notes: Mapped[str] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

"""
Developer: DroneBug Technologies
GitHub: https://github.com/ABugDrone
App: Amirable Hotel Management System
License: Proprietary
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, date
from typing import List, Optional
from .models import Attendance, AttendanceStatus
from .schemas import AttendanceCreate

async def get_all_attendance(db: AsyncSession, date_filter: Optional[datetime] = None, status: Optional[str] = None):
    query = select(Attendance).order_by(Attendance.date.desc())
    if date_filter:
        day_start = datetime(date_filter.year, date_filter.month, date_filter.day, 0, 0, 0)
        day_end = datetime(date_filter.year, date_filter.month, date_filter.day, 23, 59, 59)
        query = query.where(Attendance.date >= day_start, Attendance.date <= day_end)
    if status:
        query = query.where(Attendance.status == status)
    result = await db.execute(query)
    return result.scalars().all()

async def create_attendance(db: AsyncSession, data: AttendanceCreate):
    record = Attendance(**data.model_dump())
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record

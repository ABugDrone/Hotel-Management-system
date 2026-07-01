"""
Developer: DroneBug Technologies
GitHub: https://github.com/ABugDrone
App: Amirable Hotel Management System
License: Proprietary
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from typing import List, Optional
from .models import Staff, Department, StaffStatus
from .schemas import StaffCreate

async def get_all_staff(db: AsyncSession, department: Optional[str] = None, status: Optional[str] = None):
    query = select(Staff).order_by(Staff.full_name)
    if department:
        query = query.where(Staff.department == department)
    if status:
        query = query.where(Staff.status == status)
    result = await db.execute(query)
    return result.scalars().all()

async def get_staff_by_id(db: AsyncSession, staff_id: str):
    result = await db.execute(select(Staff).where(Staff.id == staff_id))
    return result.scalar_one_or_none()

async def create_staff(db: AsyncSession, data: StaffCreate):
    staff = Staff(**data.model_dump())
    db.add(staff)
    await db.commit()
    await db.refresh(staff)
    return staff

async def update_staff(db: AsyncSession, staff_id: str, data: dict):
    await db.execute(update(Staff).where(Staff.id == staff_id).values(**data))
    await db.commit()
    return await get_staff_by_id(db, staff_id)

async def delete_staff(db: AsyncSession, staff_id: str):
    await db.execute(delete(Staff).where(Staff.id == staff_id))
    await db.commit()
    return True

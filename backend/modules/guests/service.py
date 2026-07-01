"""
Developer: DroneBug Technologies
GitHub: https://github.com/ABugDrone
App: Amirable Hotel Management System
License: Proprietary
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, or_
from backend.modules.guests.models import Guest
from backend.modules.guests.schemas import GuestCreate, GuestUpdate

async def get_all_guests(db: AsyncSession, search: str = None):
    query = select(Guest)
    if search:
        query = query.where(
            or_(
                Guest.full_name.ilike(f"%{search}%"),
                Guest.phone.ilike(f"%{search}%")
            )
        )
    result = await db.execute(query)
    return result.scalars().all()

async def get_guest_by_id(db: AsyncSession, guest_id: str):
    result = await db.execute(select(Guest).where(Guest.id == guest_id))
    return result.scalar_one_or_none()

async def get_guest_by_phone(db: AsyncSession, phone: str):
    result = await db.execute(select(Guest).where(Guest.phone == phone))
    return result.scalar_one_or_none()

async def create_guest(db: AsyncSession, guest_data: GuestCreate):
    new_guest = Guest(**guest_data.model_dump())
    db.add(new_guest)
    await db.commit()
    await db.refresh(new_guest)
    return new_guest

async def update_guest(db: AsyncSession, guest_id: str, guest_data: GuestUpdate):
    await db.execute(
        update(Guest)
        .where(Guest.id == guest_id)
        .values(**guest_data.model_dump(exclude_unset=True))
    )
    await db.commit()
    return await get_guest_by_id(db, guest_id)

async def delete_guest(db: AsyncSession, guest_id: str):
    await db.execute(delete(Guest).where(Guest.id == guest_id))
    await db.commit()
    return True

"""
Developer: DroneBug Technologies
GitHub: https://github.com/ABugDrone
App: Amirable Hotel Management System
License: Proprietary
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func
from backend.modules.rooms.models import Room, RoomStatus
from backend.modules.rooms.schemas import RoomCreate, RoomUpdate

async def get_all_rooms(db: AsyncSession, status: str = None):
    query = select(Room)
    if status:
        query = query.where(Room.status == status)
    result = await db.execute(query)
    return result.scalars().all()

async def get_room_by_id(db: AsyncSession, room_id: str):
    result = await db.execute(select(Room).where(Room.id == room_id))
    return result.scalar_one_or_none()

async def get_room_by_number(db: AsyncSession, number: str):
    result = await db.execute(select(Room).where(Room.number == number))
    return result.scalar_one_or_none()

async def create_room(db: AsyncSession, room_data: RoomCreate):
    new_room = Room(**room_data.model_dump())
    db.add(new_room)
    await db.commit()
    await db.refresh(new_room)
    return new_room

async def update_room(db: AsyncSession, room_id: str, room_data: RoomUpdate):
    await db.execute(
        update(Room)
        .where(Room.id == room_id)
        .values(**room_data.model_dump(exclude_unset=True))
    )
    await db.commit()
    return await get_room_by_id(db, room_id)

async def delete_room(db: AsyncSession, room_id: str):
    await db.execute(delete(Room).where(Room.id == room_id))
    await db.commit()
    return True

async def update_room_status(db: AsyncSession, room_id: str, status: RoomStatus):
    await db.execute(
        update(Room)
        .where(Room.id == room_id)
        .values(status=status)
    )
    await db.commit()
    return await get_room_by_id(db, room_id)

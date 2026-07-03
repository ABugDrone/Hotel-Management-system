"""
Developer: DroneBug Technologies
GitHub: https://github.com/ABugDrone
App: Amirable Hotel Management System
License: Proprietary
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime
from typing import List, Optional
from backend.database import get_db
from backend.modules.rooms import service, schemas, check_schemas, check_service
from backend.modules.rooms.models import Room, RoomStatus, RoomAssignment

router = APIRouter(prefix="/rooms", tags=["rooms"])

@router.get("/", response_model=List[schemas.RoomRead])
async def list_rooms(
    status: Optional[RoomStatus] = None, 
    db: AsyncSession = Depends(get_db)
):
    return await service.get_all_rooms(db, status=status)

@router.post("/", response_model=schemas.RoomRead, status_code=status.HTTP_201_CREATED)
async def create_room(
    room: schemas.RoomCreate, 
    db: AsyncSession = Depends(get_db)
):
    existing = await service.get_room_by_number(db, room.number)
    if existing:
        raise HTTPException(status_code=400, detail="Room number already exists")
    return await service.create_room(db, room)

@router.get("/{room_id}", response_model=schemas.RoomRead)
async def get_room(
    room_id: str, 
    db: AsyncSession = Depends(get_db)
):
    room = await service.get_room_by_id(db, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return room

@router.patch("/{room_id}", response_model=schemas.RoomRead)
async def update_room(
    room_id: str, 
    room_data: schemas.RoomUpdate, 
    db: AsyncSession = Depends(get_db)
):
    room = await service.get_room_by_id(db, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return await service.update_room(db, room_id, room_data)

@router.delete("/{room_id}")
async def delete_room(
    room_id: str, 
    db: AsyncSession = Depends(get_db)
):
    room = await service.get_room_by_id(db, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    await service.delete_room(db, room_id)
    return {"success": True, "message": "Room deleted successfully"}

@router.patch("/{room_id}/status", response_model=schemas.RoomRead)
async def update_status(
    room_id: str, 
    status: RoomStatus, 
    db: AsyncSession = Depends(get_db)
):
    room = await service.get_room_by_id(db, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return await service.update_room_status(db, room_id, status)

# Check-in / Check-out Endpoints
@router.post("/check-in", status_code=status.HTTP_201_CREATED)
async def room_check_in(
    data: check_schemas.CheckInRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    return await check_service.check_in(db, "system", data, request)

@router.post("/check-out")
async def room_check_out(
    data: check_schemas.CheckOutRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    return await check_service.check_out(db, "system", data, request)

@router.get("/assignments/active", response_model=List[check_schemas.StaySummary])
async def get_active_assignments(
    db: AsyncSession = Depends(get_db)
):
    # This is a bit complex for a single query, but I'll implement a basic version
    from backend.modules.guests.models import Guest
    from backend.modules.rooms.models import RoomAssignment, Room
    
    query = select(RoomAssignment, Guest.full_name, Room.number).join(
        Guest, RoomAssignment.guest_id == Guest.id
    ).join(
        Room, RoomAssignment.room_id == Room.id
    ).where(RoomAssignment.status == "active")
    
    result = await db.execute(query)
    stays = []
    for row in result:
        assignment, guest_name, room_number = row
        balance = await check_service.calculate_balance(db, assignment.id)
        stays.append(check_schemas.StaySummary(
            assignment_id=assignment.id,
            guest_name=guest_name,
            room_number=room_number,
            check_in_date=assignment.check_in_date,
            balance=balance
        ))
    return stays

@router.get("/assignments/guest/{guest_id}", response_model=List[check_schemas.StaySummary])
async def get_assignments_by_guest(
    guest_id: str,
    db: AsyncSession = Depends(get_db)
):
    from backend.modules.guests.models import Guest
    from backend.modules.rooms.models import RoomAssignment, Room
    
    query = select(RoomAssignment, Guest.full_name, Room.number).join(
        Guest, RoomAssignment.guest_id == Guest.id
    ).join(
        Room, RoomAssignment.room_id == Room.id
    ).where(RoomAssignment.guest_id == guest_id)
    
    result = await db.execute(query)
    stays = []
    for row in result:
        assignment, guest_name, room_number = row
        balance = await check_service.calculate_balance(db, assignment.id)
        stays.append(check_schemas.StaySummary(
            assignment_id=assignment.id,
            guest_name=guest_name,
            room_number=room_number,
            check_in_date=assignment.check_in_date,
            balance=balance
        ))
    return stays

@router.get("/stats/summary")
async def get_dashboard_summary(
    db: AsyncSession = Depends(get_db)
):
    from backend.modules.payments.models import GuestLedger, LedgerEntryType
    
    # Total Rooms
    total_rooms_res = await db.execute(select(func.count(Room.id)))
    total_rooms = total_rooms_res.scalar() or 0
    
    # Available Rooms
    available_rooms_res = await db.execute(select(func.count(Room.id)).where(Room.status == RoomStatus.AVAILABLE))
    available_rooms = available_rooms_res.scalar() or 0
    
    # Occupied Rooms
    occupied_rooms_res = await db.execute(select(func.count(Room.id)).where(Room.status == RoomStatus.OCCUPIED))
    occupied_rooms = occupied_rooms_res.scalar() or 0
    
    # Today's Revenue (simplified: sum of all payments today)
    from datetime import date
    today_start = datetime.combine(date.today(), datetime.min.time())
    revenue_res = await db.execute(
        select(func.sum(GuestLedger.amount))
        .where(GuestLedger.entry_type == LedgerEntryType.PAYMENT, GuestLedger.created_at >= today_start)
    )
    today_revenue = revenue_res.scalar() or 0.0
    
    # Outstanding Debts
    # (Sum of all charges for active assignments) - (Sum of all payments for active assignments)
    # This is simplified for summary
    assignment_query = select(RoomAssignment.id).where(RoomAssignment.status == "active")
    active_assign_ids = (await db.execute(assignment_query)).scalars().all()
    
    total_debt = 0.0
    for aid in active_assign_ids:
        total_debt += await check_service.calculate_balance(db, aid)
        
    return {
        "total_rooms": total_rooms,
        "available_rooms": available_rooms,
        "occupied_rooms": occupied_rooms,
        "today_revenue": today_revenue,
        "total_debt": total_debt,
        "occupancy_rate": (occupied_rooms / total_rooms * 100) if total_rooms > 0 else 0
    }

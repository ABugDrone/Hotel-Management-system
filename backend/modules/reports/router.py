"""
Developer: DroneBug Technologies
GitHub: https://github.com/ABugDrone
App: Amirable Hotel Management System
License: Proprietary
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, date
from backend.database import get_db
from backend.modules.rooms.models import Room, RoomAssignment, RoomStatus
from backend.modules.payments.models import GuestLedger, LedgerEntryType

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("/daily")
async def get_daily_report(
    report_date: str = None,
    db: AsyncSession = Depends(get_db)
):
    if not report_date:
        report_date = date.today().isoformat()
    try:
        day = datetime.strptime(report_date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")

    day_start = datetime(day.year, day.month, day.day, 0, 0, 0)
    day_end = datetime(day.year, day.month, day.day, 23, 59, 59)

    room_revenue = await db.execute(
        select(func.coalesce(func.sum(GuestLedger.amount), 0))
        .where(GuestLedger.entry_type == LedgerEntryType.CHARGE, GuestLedger.created_at >= day_start, GuestLedger.created_at <= day_end)
    )
    total_payments = await db.execute(
        select(func.coalesce(func.sum(GuestLedger.amount), 0))
        .where(GuestLedger.entry_type == LedgerEntryType.PAYMENT, GuestLedger.created_at >= day_start, GuestLedger.created_at <= day_end)
    )
    check_ins = await db.execute(
        select(func.count(RoomAssignment.id))
        .where(RoomAssignment.check_in_date >= day_start, RoomAssignment.check_in_date <= day_end)
    )
    check_outs = await db.execute(
        select(func.count(RoomAssignment.id))
        .where(RoomAssignment.actual_check_out_date >= day_start, RoomAssignment.actual_check_out_date <= day_end)
    )

    ledger_entries = await db.execute(
        select(GuestLedger).where(GuestLedger.created_at >= day_start, GuestLedger.created_at <= day_end).order_by(GuestLedger.created_at)
    )

    total_rooms_res = await db.execute(select(func.count(Room.id)))
    total_rooms = total_rooms_res.scalar() or 0
    occupied_res = await db.execute(select(func.count(Room.id)).where(Room.status == RoomStatus.OCCUPIED))
    occupied = occupied_res.scalar() or 0

    return {
        "date": report_date,
        "room_revenue": round(room_revenue.scalar() or 0, 2),
        "food_revenue": 0,
        "total_payments": round(total_payments.scalar() or 0, 2),
        "check_ins": check_ins.scalar() or 0,
        "check_outs": check_outs.scalar() or 0,
        "occupancy": round((occupied / total_rooms * 100) if total_rooms > 0 else 0, 1),
        "transactions": [
            {"id": e.id, "type": e.entry_type.value, "description": e.description, "amount": e.amount, "created_at": e.created_at.isoformat() if e.created_at else None}
            for e in ledger_entries.scalars().all()
        ]
    }

@router.get("/monthly")
async def get_monthly_report(
    month: str = None,
    db: AsyncSession = Depends(get_db)
):
    if not month:
        month = date.today().isoformat()[:7]
    try:
        year, mon = month.split("-")
        start = datetime(int(year), int(mon), 1)
        if int(mon) == 12:
            end = datetime(int(year) + 1, 1, 1)
        else:
            end = datetime(int(year), int(mon) + 1, 1)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid month format. Use YYYY-MM")

    total_revenue = await db.execute(
        select(func.coalesce(func.sum(GuestLedger.amount), 0))
        .where(GuestLedger.entry_type == LedgerEntryType.PAYMENT, GuestLedger.created_at >= start, GuestLedger.created_at < end)
    )

    total_charged = await db.execute(
        select(func.coalesce(func.sum(GuestLedger.amount), 0))
        .where(GuestLedger.entry_type == LedgerEntryType.CHARGE, GuestLedger.created_at >= start, GuestLedger.created_at < end)
    )

    guest_count = await db.execute(
        select(func.count(func.distinct(RoomAssignment.guest_id)))
        .where(RoomAssignment.check_in_date >= start, RoomAssignment.check_in_date < end)
    )

    room_nights = await db.execute(
        select(func.count(RoomAssignment.id))
        .where(RoomAssignment.check_in_date >= start, RoomAssignment.check_in_date < end)
    )

    total_rooms_res = await db.execute(select(func.count(Room.id)))
    total_rooms = total_rooms_res.scalar() or 0

    return {
        "month": month,
        "total_revenue": round(total_revenue.scalar() or 0, 2),
        "total_charged": round(total_charged.scalar() or 0, 2),
        "total_guests": guest_count.scalar() or 0,
        "room_nights": room_nights.scalar() or 0,
        "avg_occupancy": 0,
        "revenue_breakdown": [],
        "daily_performance": []
    }

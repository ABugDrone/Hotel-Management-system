"""
Developer: DroneBug Technologies
GitHub: https://github.com/ABugDrone
App: Amirable Hotel Management System
License: Proprietary
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import date, datetime, timedelta
from typing import Optional

from backend.modules.payments.models import GuestLedger, LedgerEntryType
from backend.modules.rooms.models import Room, RoomAssignment, RoomStatus

async def get_daily_report(db: AsyncSession, report_date: date) -> dict:
    start = datetime.combine(report_date, datetime.min.time())
    end = datetime.combine(report_date, datetime.max.time())

    # Room revenue (charges for assignments)
    room_rev = await db.execute(
        select(func.coalesce(func.sum(GuestLedger.amount), 0))
        .where(
            GuestLedger.entry_type == LedgerEntryType.CHARGE,
            GuestLedger.created_at >= start,
            GuestLedger.created_at <= end,
            GuestLedger.description.ilike("%Room%"),
        )
    )

    # Food revenue
    food_rev = await db.execute(
        select(func.coalesce(func.sum(GuestLedger.amount), 0))
        .where(
            GuestLedger.entry_type == LedgerEntryType.CHARGE,
            GuestLedger.created_at >= start,
            GuestLedger.created_at <= end,
            GuestLedger.description.ilike("%Food%"),
        )
    )

    # Check-ins / check-outs
    check_ins = await db.execute(
        select(func.count(RoomAssignment.id))
        .where(
            func.date(RoomAssignment.check_in_date) == report_date,
            RoomAssignment.status == "active",
        )
    )
    check_outs = await db.execute(
        select(func.count(RoomAssignment.id))
        .where(func.date(RoomAssignment.actual_check_out_date) == report_date)
    )

    # Occupancy
    total_rooms = await db.execute(select(func.count(Room.id)))
    occupied = await db.execute(
        select(func.count(Room.id)).where(Room.status == RoomStatus.OCCUPIED)
    )
    total = total_rooms.scalar() or 1
    occ_rate = (occupied.scalar() or 0) / total * 100

    # Transactions
    tx_query = await db.execute(
        select(GuestLedger)
        .where(GuestLedger.created_at >= start, GuestLedger.created_at <= end)
        .order_by(GuestLedger.created_at.desc())
        .limit(50)
    )
    transactions = []
    for tx in tx_query.scalars().all():
        transactions.append({
            "id": tx.id,
            "type": tx.entry_type,
            "description": tx.description,
            "amount": tx.amount,
            "created_at": tx.created_at.isoformat(),
        })

    room_revenue = room_rev.scalar() or 0
    food_revenue = food_rev.scalar() or 0

    return {
        "date": report_date,
        "room_revenue": room_revenue,
        "food_revenue": food_revenue,
        "other_revenue": 0,
        "total_revenue": room_revenue + food_revenue,
        "check_ins": check_ins.scalar() or 0,
        "check_outs": check_outs.scalar() or 0,
        "occupancy_rate": round(occ_rate, 1),
        "transactions": transactions,
    }

async def get_monthly_report(db: AsyncSession, month: str) -> dict:
    year, mon = month.split("-")
    start = datetime(int(year), int(mon), 1)
    if int(mon) == 12:
        end = datetime(int(year) + 1, 1, 1) - timedelta(seconds=1)
    else:
        end = datetime(int(year), int(mon) + 1, 1) - timedelta(seconds=1)

    # Total revenue
    total_res = await db.execute(
        select(func.coalesce(func.sum(GuestLedger.amount), 0))
        .where(
            GuestLedger.entry_type == LedgerEntryType.PAYMENT,
            GuestLedger.created_at >= start,
            GuestLedger.created_at <= end,
        )
    )

    # Total guests
    guests = await db.execute(
        select(func.count(RoomAssignment.id))
        .where(
            RoomAssignment.created_at >= start,
            RoomAssignment.created_at <= end,
        )
    )

    return {
        "month": month,
        "total_revenue": total_res.scalar() or 0,
        "room_revenue": 0,
        "food_revenue": 0,
        "avg_occupancy": 0,
        "total_guests": guests.scalar() or 0,
        "room_nights": 0,
        "revenue_breakdown": [],
        "daily_performance": [],
    }

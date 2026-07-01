"""
Developer: DroneBug Technologies
GitHub: https://github.com/ABugDrone
App: Amirable Hotel Management System
License: Proprietary
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime
from typing import List, Optional
from .models import PayrollRecord, SalaryAdvance, PayrollStatus
from .schemas import PayrollProcessRequest, AdvanceCreate
from backend.modules.staff.models import Staff

async def get_all_payroll(db: AsyncSession, month: Optional[str] = None, status: Optional[str] = None):
    query = select(PayrollRecord).order_by(PayrollRecord.created_at.desc())
    if month:
        try:
            year, mon = month.split("-")
            start = datetime(int(year), int(mon), 1)
            if int(mon) == 12:
                end = datetime(int(year) + 1, 1, 1)
            else:
                end = datetime(int(year), int(mon) + 1, 1)
            query = query.where(PayrollRecord.period_start >= start, PayrollRecord.period_start < end)
        except ValueError:
            pass
    if status:
        query = query.where(PayrollRecord.status == status)
    result = await db.execute(query)
    return result.scalars().all()

async def process_payroll(db: AsyncSession, data: PayrollProcessRequest):
    staff_result = await db.execute(select(Staff).where(Staff.status == "ACTIVE"))
    staff_members = staff_result.scalars().all()

    records = []
    for staff in staff_members:
        record = PayrollRecord(
            staff_id=staff.id,
            period_start=data.period_start,
            period_end=data.period_end,
            basic_salary=staff.salary,
            allowances=0,
            deductions=0,
            net_salary=staff.salary,
            status=PayrollStatus.PROCESSED
        )
        db.add(record)
        records.append(record)

    await db.commit()
    return records

async def get_all_advances(db: AsyncSession):
    result = await db.execute(select(SalaryAdvance).order_by(SalaryAdvance.created_at.desc()))
    return result.scalars().all()

async def create_advance(db: AsyncSession, data: AdvanceCreate):
    advance = SalaryAdvance(**data.model_dump())
    db.add(advance)
    await db.commit()
    await db.refresh(advance)
    return advance

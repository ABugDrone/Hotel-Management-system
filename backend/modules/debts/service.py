"""
Developer: DroneBug Technologies
GitHub: https://github.com/ABugDrone
App: Amirable Hotel Management System
License: Proprietary
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from datetime import datetime, timedelta
from typing import List, Optional, Tuple, Dict, Any
import uuid

from .models import DebtRecovery, DebtStatus
from .schemas import DebtRecoveryCreate, DebtRecoveryUpdate, DebtRecoverySummary, DebtGuestInfo
from backend.modules.guests.models import Guest
from backend.modules.rooms.models import RoomAssignment, Room
from backend.modules.payments.models import GuestLedger, LedgerEntryType
from backend.modules.rooms.check_service import calculate_balance

async def create_debt_recovery(db: AsyncSession, debt_data: DebtRecoveryCreate, user_id: str) -> DebtRecovery:
    """
    Create a new debt recovery record
    """
    debt = DebtRecovery(
        id=str(uuid.uuid4()),
        guest_id=debt_data.guest_id,
        assignment_id=debt_data.assignment_id,
        amount_owed=debt_data.amount_owed,
        status=debt_data.status,
        last_contact_date=debt_data.last_contact_date,
        next_follow_up=debt_data.next_follow_up,
        contact_method=debt_data.contact_method,
        contact_notes=debt_data.contact_notes,
        promised_payment_date=debt_data.promised_payment_date,
        promised_amount=debt_data.promised_amount,
        created_by=user_id
    )
    
    db.add(debt)
    await db.commit()
    await db.refresh(debt)
    return debt

async def get_debt_by_id(db: AsyncSession, debt_id: str) -> Optional[DebtRecovery]:
    result = await db.execute(select(DebtRecovery).where(DebtRecovery.id == debt_id))
    return result.scalar_one_or_none()

async def get_debts_by_guest(db: AsyncSession, guest_id: str) -> List[DebtRecovery]:
    result = await db.execute(
        select(DebtRecovery)
        .where(DebtRecovery.guest_id == guest_id)
        .order_by(DebtRecovery.created_at.desc())
    )
    return result.scalars().all()

async def get_all_debts(
    db: AsyncSession, 
    status: Optional[DebtStatus] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
    days_overdue: Optional[int] = None
) -> List[DebtRecovery]:
    query = select(DebtRecovery)
    
    if status:
        query = query.where(DebtRecovery.status == status)
    
    if min_amount is not None:
        query = query.where(DebtRecovery.amount_owed >= min_amount)
    
    if max_amount is not None:
        query = query.where(DebtRecovery.amount_owed <= max_amount)
    
    if days_overdue:
        cutoff_date = datetime.utcnow() - timedelta(days=days_overdue)
        query = query.where(DebtRecovery.created_at <= cutoff_date)
    
    query = query.order_by(DebtRecovery.amount_owed.desc())
    
    result = await db.execute(query)
    return result.scalars().all()

async def update_debt_recovery(
    db: AsyncSession, 
    debt_id: str, 
    debt_data: DebtRecoveryUpdate
) -> Optional[DebtRecovery]:
    debt = await get_debt_by_id(db, debt_id)
    if not debt:
        return None
    
    update_dict = debt_data.model_dump(exclude_unset=True)
    
    # If marking as paid, set actual payment date
    if update_dict.get('status') == DebtStatus.PAID and not debt.actual_payment_date:
        update_dict['actual_payment_date'] = datetime.utcnow()
    
    # If updating actual amount paid
    if 'actual_amount_paid' in update_dict and update_dict['actual_amount_paid']:
        # Update amount owed
        debt.amount_owed = max(0, debt.amount_owed - update_dict['actual_amount_paid'])
        if debt.amount_owed == 0 and debt.status != DebtStatus.PAID:
            update_dict['status'] = DebtStatus.PAID
    
    for field, value in update_dict.items():
        setattr(debt, field, value)
    
    await db.commit()
    await db.refresh(debt)
    return debt

async def delete_debt_recovery(db: AsyncSession, debt_id: str) -> bool:
    debt = await get_debt_by_id(db, debt_id)
    if not debt:
        return False
    
    await db.delete(debt)
    await db.commit()
    return True

async def get_debt_summary(db: AsyncSession) -> DebtRecoverySummary:
    """
    Get summary statistics for debt recovery
    """
    # Get counts and totals by status
    result = await db.execute(
        select(
            DebtRecovery.status,
            func.sum(DebtRecovery.amount_owed).label("total_amount"),
            func.count(DebtRecovery.id).label("count")
        )
        .group_by(DebtRecovery.status)
    )
    
    summary = DebtRecoverySummary()
    
    for status, amount, count in result:
        if status == DebtStatus.OUTSTANDING:
            summary.total_outstanding = amount or 0.0
        elif status == DebtStatus.CONTACTED:
            summary.total_contacted = amount or 0.0
        elif status == DebtStatus.PROMISED_PAYMENT:
            summary.total_promised = amount or 0.0
        elif status == DebtStatus.PAID:
            summary.total_recovered = amount or 0.0
        elif status == DebtStatus.WRITTEN_OFF:
            summary.total_written_off = amount or 0.0
        
        summary.debt_count += count or 0
    
    # Calculate average debt
    if summary.debt_count > 0:
        total_all = (summary.total_outstanding + summary.total_contacted + 
                    summary.total_promised + summary.total_recovered + 
                    summary.total_written_off)
        summary.average_debt = total_all / summary.debt_count
    
    return summary

async def find_outstanding_debts_from_assignments(db: AsyncSession) -> List[Tuple[str, str, float]]:
    """
    Find assignments with outstanding balances that don't have debt records
    Returns list of (assignment_id, guest_id, balance)
    """
    # Get all active assignments
    result = await db.execute(
        select(
            RoomAssignment.id,
            RoomAssignment.guest_id,
            RoomAssignment.status
        ).where(RoomAssignment.status == "active")
    )
    active_assignments = result.all()
    
    outstanding_debts = []
    
    for assignment_id, guest_id, _ in active_assignments:
        # Calculate balance for this assignment
        balance = await calculate_balance(db, assignment_id)
        
        if balance < 0:  # Negative balance means guest owes money
            # Check if debt record already exists
            existing_debt_result = await db.execute(
                select(DebtRecovery)
                .where(DebtRecovery.assignment_id == assignment_id)
                .where(DebtRecovery.status != DebtStatus.PAID)
            )
            existing_debt = existing_debt_result.scalar_one_or_none()
            
            if not existing_debt:
                outstanding_debts.append((
                    assignment_id,
                    guest_id,
                    abs(balance)  # Convert to positive amount owed
                ))
    
    return outstanding_debts

async def get_debts_with_guest_info(db: AsyncSession) -> List[DebtGuestInfo]:
    """
    Get debts with detailed guest information
    """
    query = (
        select(
            DebtRecovery,
            Guest.full_name,
            Guest.phone,
            Room.number,
            RoomAssignment.check_out_date
        )
        .join(Guest, DebtRecovery.guest_id == Guest.id)
        .join(RoomAssignment, DebtRecovery.assignment_id == RoomAssignment.id)
        .join(Room, RoomAssignment.room_id == Room.id)
        .where(DebtRecovery.status != DebtStatus.PAID)
        .order_by(DebtRecovery.amount_owed.desc())
    )
    
    result = await db.execute(query)
    debts_info = []
    
    for debt, guest_name, guest_phone, room_number, check_out_date in result:
        days_outstanding = 0
        if check_out_date:
            days_outstanding = (datetime.utcnow() - check_out_date).days
        
        debts_info.append(DebtGuestInfo(
            guest_id=debt.guest_id,
            guest_name=guest_name,
            guest_phone=guest_phone,
            room_number=room_number,
            check_out_date=check_out_date,
            amount_owed=debt.amount_owed,
            days_outstanding=days_outstanding,
            last_contact=debt.last_contact_date,
            status=debt.status
        ))
    
    return debts_info
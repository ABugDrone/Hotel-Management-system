"""
Developer: DroneBug Technologies
GitHub: https://github.com/ABugDrone
App: Amirable Hotel Management System
License: Proprietary
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from backend.database import get_db
from . import service, schemas
from .models import DebtStatus

router = APIRouter(prefix="/debts", tags=["debt-recovery"])

@router.get("/", response_model=List[schemas.DebtRecoveryRead])
async def list_debts(
    status: Optional[DebtStatus] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
    days_overdue: Optional[int] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    List all debt recovery records with optional filters.
    """
    return await service.get_all_debts(
        db, 
        status=status,
        min_amount=min_amount,
        max_amount=max_amount,
        days_overdue=days_overdue
    )

@router.get("/summary", response_model=schemas.DebtRecoverySummary)
async def get_debt_summary(
    db: AsyncSession = Depends(get_db)
):
    """
    Get debt recovery summary statistics.
    """
    return await service.get_debt_summary(db)

@router.get("/guest/{guest_id}", response_model=List[schemas.DebtRecoveryRead])
async def get_guest_debts(
    guest_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get all debt records for a specific guest.
    """
    return await service.get_debts_by_guest(db, guest_id)

@router.get("/with-guest-info", response_model=List[schemas.DebtGuestInfo])
async def get_debts_with_guest_info(
    db: AsyncSession = Depends(get_db)
):
    """
    Get debts with detailed guest information for recovery dashboard.
    """
    return await service.get_debts_with_guest_info(db)

@router.post("/", response_model=schemas.DebtRecoveryRead, status_code=status.HTTP_201_CREATED)
async def create_debt(
    debt: schemas.DebtRecoveryCreate,
    db: AsyncSession = Depends(get_db)
):
    return await service.create_debt_recovery(db, debt, "system")

@router.get("/{debt_id}", response_model=schemas.DebtRecoveryRead)
async def get_debt(
    debt_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific debt recovery record.
    """
    debt = await service.get_debt_by_id(db, debt_id)
    if not debt:
        raise HTTPException(status_code=404, detail="Debt record not found")
    return debt

@router.patch("/{debt_id}", response_model=schemas.DebtRecoveryRead)
async def update_debt(
    debt_id: str,
    debt_update: schemas.DebtRecoveryUpdate,
    db: AsyncSession = Depends(get_db)
):
    updated_debt = await service.update_debt_recovery(db, debt_id, debt_update)
    if not updated_debt:
        raise HTTPException(status_code=404, detail="Debt record not found")
    
    return updated_debt

@router.delete("/{debt_id}")
async def delete_debt(
    debt_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a debt recovery record.
    """
    success = await service.delete_debt_recovery(db, debt_id)
    if not success:
        raise HTTPException(status_code=404, detail="Debt record not found")
    
    return {"success": True, "message": "Debt record deleted successfully"}

@router.get("/find-outstanding")
async def find_outstanding_debts(
    db: AsyncSession = Depends(get_db)
):
    """
    Find assignments with outstanding balances that need debt records.
    """
    outstanding = await service.find_outstanding_debts_from_assignments(db)
    
    return {
        "count": len(outstanding),
        "outstanding_assignments": [
            {
                "assignment_id": assignment_id,
                "guest_id": guest_id,
                "amount_owed": amount_owed
            }
            for assignment_id, guest_id, amount_owed in outstanding
        ]
    }

@router.get("/overdue-followups")
async def get_overdue_followups(
    days_overdue: int = 7,
    db: AsyncSession = Depends(get_db)
):
    """
    Get debts with overdue follow-ups.
    """
    from datetime import datetime, timedelta
    from sqlalchemy import select
    
    cutoff_date = datetime.utcnow() - timedelta(days=days_overdue)
    
    query = (
        select(service.DebtRecovery)
        .where(
            service.DebtRecovery.next_follow_up <= datetime.utcnow(),
            service.DebtRecovery.status.in_([DebtStatus.OUTSTANDING, DebtStatus.CONTACTED, DebtStatus.PROMISED_PAYMENT])
        )
        .order_by(service.DebtRecovery.next_follow_up)
    )
    
    result = await db.execute(query)
    overdue_debts = result.scalars().all()
    
    return {
        "count": len(overdue_debts),
        "overdue_followups": overdue_debts
    }
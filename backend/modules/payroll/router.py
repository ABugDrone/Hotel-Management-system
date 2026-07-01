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
from backend.auth.dependencies import require_role
from backend.auth.models import UserRole
from . import service, schemas

router = APIRouter(prefix="/payroll", tags=["payroll"])

@router.get("/", response_model=List[schemas.PayrollRead])
async def list_payroll(
    month: Optional[str] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_role([UserRole.SUPER_ADMIN, UserRole.ACCOUNTANT]))
):
    return await service.get_all_payroll(db, month=month, status=status)

@router.post("/process")
async def process_payroll(
    data: schemas.PayrollProcessRequest,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_role([UserRole.SUPER_ADMIN, UserRole.ACCOUNTANT]))
):
    records = await service.process_payroll(db, data)
    return {"success": True, "message": f"Payroll processed for {len(records)} staff", "count": len(records)}

@router.get("/advances", response_model=List[schemas.AdvanceRead])
async def list_advances(
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_role([UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.ACCOUNTANT]))
):
    return await service.get_all_advances(db)

@router.post("/advances", response_model=schemas.AdvanceRead, status_code=status.HTTP_201_CREATED)
async def create_advance(
    data: schemas.AdvanceCreate,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_role([UserRole.SUPER_ADMIN, UserRole.MANAGER]))
):
    return await service.create_advance(db, data)

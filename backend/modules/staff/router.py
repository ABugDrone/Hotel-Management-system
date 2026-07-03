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

router = APIRouter(prefix="/staff", tags=["staff"])

@router.get("/", response_model=List[schemas.StaffRead])
async def list_staff(
    department: Optional[str] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    return await service.get_all_staff(db, department=department, status=status)

@router.post("/", response_model=schemas.StaffRead, status_code=status.HTTP_201_CREATED)
async def create_staff(
    data: schemas.StaffCreate,
    db: AsyncSession = Depends(get_db)
):
    return await service.create_staff(db, data)

@router.get("/{staff_id}", response_model=schemas.StaffRead)
async def get_staff(
    staff_id: str,
    db: AsyncSession = Depends(get_db)
):
    staff = await service.get_staff_by_id(db, staff_id)
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")
    return staff

@router.patch("/{staff_id}", response_model=schemas.StaffRead)
async def update_staff(
    staff_id: str,
    data: schemas.StaffCreate,
    db: AsyncSession = Depends(get_db)
):
    staff = await service.get_staff_by_id(db, staff_id)
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")
    return await service.update_staff(db, staff_id, data.model_dump(exclude_unset=True))

@router.delete("/{staff_id}")
async def delete_staff(
    staff_id: str,
    db: AsyncSession = Depends(get_db)
):
    staff = await service.get_staff_by_id(db, staff_id)
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")
    await service.delete_staff(db, staff_id)
    return {"success": True, "message": "Staff deleted"}

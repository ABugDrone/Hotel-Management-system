"""
Developer: DroneBug Technologies
GitHub: https://github.com/ABugDrone
App: Amirable Hotel Management System
License: Proprietary
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from backend.database import get_db
from backend.auth.dependencies import require_role
from backend.auth.models import UserRole
from backend.modules.guests import service, schemas

router = APIRouter(prefix="/guests", tags=["guests"])

@router.get("/", response_model=List[schemas.GuestRead])
async def list_guests(
    search: Optional[str] = Query(None), 
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_role([UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.RECEPTIONIST]))
):
    return await service.get_all_guests(db, search=search)

@router.post("/", response_model=schemas.GuestRead, status_code=status.HTTP_201_CREATED)
async def create_guest(
    guest: schemas.GuestCreate, 
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_role([UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.RECEPTIONIST]))
):
    existing = await service.get_guest_by_phone(db, guest.phone)
    if existing:
        raise HTTPException(status_code=400, detail="Guest with this phone number already exists")
    return await service.create_guest(db, guest)

@router.get("/{guest_id}", response_model=schemas.GuestRead)
async def get_guest(
    guest_id: str, 
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_role([UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.RECEPTIONIST]))
):
    guest = await service.get_guest_by_id(db, guest_id)
    if not guest:
        raise HTTPException(status_code=404, detail="Guest not found")
    return guest

@router.patch("/{guest_id}", response_model=schemas.GuestRead)
async def update_guest(
    guest_id: str, 
    guest_data: schemas.GuestUpdate, 
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_role([UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.RECEPTIONIST]))
):
    guest = await service.get_guest_by_id(db, guest_id)
    if not guest:
        raise HTTPException(status_code=404, detail="Guest not found")
    return await service.update_guest(db, guest_id, guest_data)

@router.delete("/{guest_id}")
async def delete_guest(
    guest_id: str, 
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_role([UserRole.SUPER_ADMIN, UserRole.MANAGER]))
):
    guest = await service.get_guest_by_id(db, guest_id)
    if not guest:
        raise HTTPException(status_code=404, detail="Guest not found")
    await service.delete_guest(db, guest_id)
    return {"success": True, "message": "Guest deleted successfully"}

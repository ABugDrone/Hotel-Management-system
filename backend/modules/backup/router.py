"""
Developer: DroneBug Technologies
GitHub: https://github.com/ABugDrone
App: Amirable Hotel Management System
License: Proprietary
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from backend.database import get_db
from backend.auth.dependencies import require_role, get_current_user
from backend.auth.models import User, UserRole
from . import service, schemas

router = APIRouter(prefix="/backup", tags=["backup"])

@router.get("/", response_model=List[schemas.BackupRead])
async def list_backups(
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_role([UserRole.SUPER_ADMIN]))
):
    return await service.get_all_backups(db)

@router.post("/create", response_model=schemas.BackupRead, status_code=status.HTTP_201_CREATED)
async def create_backup(
    data: schemas.BackupCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Only Super Admin can create backups")
    return await service.create_backup(db, notes=data.notes, user_id=current_user.id)

@router.get("/system-info")
async def get_system_info(
    _ = Depends(require_role([UserRole.SUPER_ADMIN]))
):
    return await service.get_system_info()

@router.post("/{backup_id}/restore")
async def restore_backup(
    backup_id: str,
    data: schemas.RestoreRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Only Super Admin can restore backups")
    result = await service.restore_backup(db, backup_id, notes=data.notes)
    if not result:
        raise HTTPException(status_code=404, detail="Backup not found or not available for restore")
    return {"success": True, "message": "Backup restored successfully"}

@router.delete("/{backup_id}")
async def delete_backup(
    backup_id: str,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_role([UserRole.SUPER_ADMIN]))
):
    success = await service.delete_backup(db, backup_id)
    if not success:
        raise HTTPException(status_code=404, detail="Backup not found")
    return {"success": True, "message": "Backup deleted"}

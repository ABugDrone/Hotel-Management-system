"""
Developer: DroneBug Technologies
GitHub: https://github.com/ABugDrone
App: Amirable Hotel Management System
License: Proprietary
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from backend.database import get_db
from . import service

router = APIRouter(prefix="/settings", tags=["settings"])

@router.get("/")
async def get_settings(
    db: AsyncSession = Depends(get_db)
):
    return await service.get_all_settings(db)

@router.patch("/")
async def update_settings(
    data: dict,
    db: AsyncSession = Depends(get_db)
):
    return await service.update_settings(db, data)

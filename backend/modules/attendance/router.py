"""
Developer: DroneBug Technologies
GitHub: https://github.com/ABugDrone
App: Amirable Hotel Management System
License: Proprietary
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from datetime import datetime
from backend.database import get_db
from . import service, schemas

router = APIRouter(prefix="/attendance", tags=["attendance"])

@router.get("/", response_model=List[schemas.AttendanceRead])
async def list_attendance(
    date: Optional[str] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    date_filter = None
    if date:
        try:
            date_filter = datetime.strptime(date, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    return await service.get_all_attendance(db, date_filter=date_filter, status=status)

@router.post("/", response_model=schemas.AttendanceRead, status_code=status.HTTP_201_CREATED)
async def create_attendance(
    data: schemas.AttendanceCreate,
    db: AsyncSession = Depends(get_db)
):
    return await service.create_attendance(db, data)

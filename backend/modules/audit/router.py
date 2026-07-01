"""
Developer: DroneBug Technologies
GitHub: https://github.com/ABugDrone
App: Amirable Hotel Management System
License: Proprietary
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from datetime import datetime
from backend.database import get_db
from backend.auth.dependencies import require_role
from backend.auth.models import UserRole
from backend.modules.audit.models import AuditLog
from backend.auth.models import User

router = APIRouter(prefix="/audit", tags=["audit"])

@router.get("/")
async def list_audit_logs(
    action: Optional[str] = None,
    entity: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_role([UserRole.SUPER_ADMIN]))
):
    query = select(AuditLog).order_by(AuditLog.created_at.desc())
    if action:
        query = query.where(AuditLog.action == action)
    if entity:
        query = query.where(AuditLog.entity == entity)
    if start_date:
        try:
            sd = datetime.strptime(start_date, "%Y-%m-%d")
            query = query.where(AuditLog.created_at >= sd)
        except ValueError:
            pass
    if end_date:
        try:
            ed = datetime.strptime(end_date, "%Y-%m-%d")
            query = query.where(AuditLog.created_at <= ed)
        except ValueError:
            pass

    result = await db.execute(query.offset((page - 1) * per_page).limit(per_page))
    logs = result.scalars().all()

    logs_with_users = []
    for log in logs:
        user_result = await db.execute(select(User).where(User.id == log.user_id))
        user = user_result.scalar_one_or_none()
        logs_with_users.append({
            "id": log.id,
            "user_id": log.user_id,
            "action": log.action,
            "entity": log.entity,
            "entity_id": log.entity_id,
            "details": log.details,
            "ip_address": log.ip_address,
            "user_agent": log.user_agent if hasattr(log, 'user_agent') else None,
            "created_at": log.created_at.isoformat() if log.created_at else None,
            "user": {
                "username": user.username if user else "Unknown",
                "full_name": user.full_name if user else "Unknown",
                "role": user.role.value if user else "unknown"
            } if user else None
        })

    return logs_with_users

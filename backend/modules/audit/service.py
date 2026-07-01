"""
Developer: DroneBug Technologies
GitHub: https://github.com/ABugDrone
App: Amirable Hotel Management System
License: Proprietary
"""

from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Request
from backend.modules.audit.models import AuditLog

async def log(
    db: AsyncSession,
    user_id: str,
    action: str,
    entity: str,
    entity_id: str = None,
    details: dict = None,
    request: Request = None
):
    ip_address = request.client.host if request else None
    new_log = AuditLog(
        user_id=user_id,
        action=action,
        entity=entity,
        entity_id=entity_id,
        details=details,
        ip_address=ip_address
    )
    db.add(new_log)
    await db.commit()
    return new_log

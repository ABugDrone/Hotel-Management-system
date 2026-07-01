"""
Developer: DroneBug Technologies
GitHub: https://github.com/ABugDrone
App: Amirable Hotel Management System
License: Proprietary
"""

from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional
from backend.modules.rooms.models import RoomStatus

class RoomBase(BaseModel):
    number: str
    room_type: str
    price_per_night: float
    description: Optional[str] = None
    status: RoomStatus = RoomStatus.AVAILABLE

class RoomCreate(RoomBase):
    pass

class RoomUpdate(BaseModel):
    number: Optional[str] = None
    room_type: Optional[str] = None
    price_per_night: Optional[float] = None
    description: Optional[str] = None
    status: Optional[RoomStatus] = None

class RoomRead(RoomBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

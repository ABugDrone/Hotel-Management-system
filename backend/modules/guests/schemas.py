"""
Developer: DroneBug Technologies
GitHub: https://github.com/ABugDrone
App: Amirable Hotel Management System
License: Proprietary
"""

from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class GuestBase(BaseModel):
    full_name: str
    phone: str
    email: Optional[str] = None
    id_type: Optional[str] = None
    id_number: Optional[str] = None
    address: Optional[str] = None

class GuestCreate(GuestBase):
    pass

class GuestUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    id_type: Optional[str] = None
    id_number: Optional[str] = None
    address: Optional[str] = None

class GuestRead(GuestBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

"""
Developer: DroneBug Technologies
GitHub: https://github.com/ABugDrone
App: Amirable Hotel Management System
License: Proprietary
"""

from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional
from backend.auth.models import UserRole

class UserBase(BaseModel):
    username: str
    full_name: str
    role: UserRole

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    password: Optional[str] = None

class UserRead(UserBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserRead

class LoginRequest(BaseModel):
    username: str
    password: str

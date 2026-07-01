"""
Developer: DroneBug Technologies
GitHub: https://github.com/ABugDrone
App: Amirable Hotel Management System
License: Proprietary
"""

from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional
from .models import Department, EmploymentType, StaffStatus

class StaffBase(BaseModel):
    employee_id: str
    full_name: str
    position: str
    department: Department = Department.RECEPTION
    employment_type: EmploymentType = EmploymentType.FULL_TIME
    hire_date: Optional[datetime] = None
    salary: float = 0
    status: StaffStatus = StaffStatus.ACTIVE
    contact_number: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    notes: Optional[str] = None

class StaffCreate(StaffBase):
    pass

class StaffRead(StaffBase):
    id: str
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

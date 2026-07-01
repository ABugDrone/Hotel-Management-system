"""
Developer: DroneBug Technologies
GitHub: https://github.com/ABugDrone
App: Amirable Hotel Management System
License: Proprietary
"""

from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional
from .models import PayrollStatus, AdvanceStatus

class PayrollBase(BaseModel):
    staff_id: str
    period_start: datetime
    period_end: datetime
    basic_salary: float = 0
    allowances: float = 0
    deductions: float = 0
    net_salary: float = 0
    status: PayrollStatus = PayrollStatus.PENDING
    payment_date: Optional[datetime] = None
    payment_method: Optional[str] = None
    notes: Optional[str] = None

class PayrollProcessRequest(BaseModel):
    period_start: datetime
    period_end: datetime

class PayrollRead(PayrollBase):
    id: str
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class AdvanceBase(BaseModel):
    staff_id: str
    amount: float
    repayment_date: Optional[datetime] = None
    notes: Optional[str] = None

class AdvanceCreate(AdvanceBase):
    pass

class AdvanceRead(AdvanceBase):
    id: str
    status: AdvanceStatus
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

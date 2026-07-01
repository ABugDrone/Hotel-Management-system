"""
Developer: DroneBug Technologies
GitHub: https://github.com/ABugDrone
App: Amirable Hotel Management System
License: Proprietary
"""

from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Optional
from enum import Enum
from .models import DebtStatus

class DebtStatusEnum(str, Enum):
    OUTSTANDING = "outstanding"
    CONTACTED = "contacted"
    PROMISED_PAYMENT = "promised_payment"
    PAID = "paid"
    WRITTEN_OFF = "written_off"

class DebtRecoveryBase(BaseModel):
    guest_id: str = Field(..., description="ID of the guest with outstanding debt")
    assignment_id: str = Field(..., description="ID of the assignment with debt")
    amount_owed: float = Field(..., gt=0, description="Amount owed by guest")
    status: DebtStatusEnum = Field(default=DebtStatusEnum.OUTSTANDING, description="Current debt status")
    
    # Contact information
    last_contact_date: Optional[datetime] = None
    next_follow_up: Optional[datetime] = None
    contact_method: Optional[str] = None
    contact_notes: Optional[str] = None
    
    # Recovery details
    promised_payment_date: Optional[datetime] = None
    promised_amount: Optional[float] = None

class DebtRecoveryCreate(DebtRecoveryBase):
    pass

class DebtRecoveryUpdate(BaseModel):
    status: Optional[DebtStatusEnum] = None
    last_contact_date: Optional[datetime] = None
    next_follow_up: Optional[datetime] = None
    contact_method: Optional[str] = None
    contact_notes: Optional[str] = None
    promised_payment_date: Optional[datetime] = None
    promised_amount: Optional[float] = None
    actual_payment_date: Optional[datetime] = None
    actual_amount_paid: Optional[float] = None
    
    @field_validator('actual_amount_paid')
    @classmethod
    def validate_actual_amount(cls, v):
        if v is not None and v < 0:
            raise ValueError("Actual amount paid cannot be negative")
        return v

class DebtRecoveryRead(DebtRecoveryBase):
    id: str
    created_by: str
    created_at: datetime
    updated_at: datetime
    actual_payment_date: Optional[datetime] = None
    actual_amount_paid: Optional[float] = None
    
    model_config = {"from_attributes": True}

class DebtRecoverySummary(BaseModel):
    total_outstanding: float = 0.0
    total_contacted: float = 0.0
    total_promised: float = 0.0
    total_recovered: float = 0.0
    total_written_off: float = 0.0
    debt_count: int = 0
    average_debt: float = 0.0

class DebtGuestInfo(BaseModel):
    guest_id: str
    guest_name: str
    guest_phone: str
    room_number: Optional[str] = None
    check_out_date: Optional[datetime] = None
    amount_owed: float
    days_outstanding: int
    last_contact: Optional[datetime] = None
    status: DebtStatusEnum
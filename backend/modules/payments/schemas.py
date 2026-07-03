"""
Developer: DroneBug Technologies
GitHub: https://github.com/ABugDrone
App: Amirable Hotel Management System
License: Proprietary
"""

from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional
from .models import PaymentMethod

class AdditionalChargeCreate(BaseModel):
    assignment_id: str
    guest_id: str
    description: str
    amount: float

class PaymentBase(BaseModel):
    method: PaymentMethod
    amount: float
    description: Optional[str] = None
    assignment_id: str
    guest_id: str

class PaymentCreate(PaymentBase):
    pass

class PaymentUpdate(BaseModel):
    method: Optional[PaymentMethod] = None
    amount: Optional[float] = None
    description: Optional[str] = None

class PaymentRead(PaymentBase):
    id: str
    ledger_id: str
    recorded_by: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class PaymentReceiptRequest(BaseModel):
    payment_id: str
    include_ledger: bool = True
    include_guest_info: bool = True

class GuestLedgerRead(BaseModel):
    id: str
    assignment_id: str
    guest_id: str
    entry_type: str
    description: str
    amount: float
    running_balance: float
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
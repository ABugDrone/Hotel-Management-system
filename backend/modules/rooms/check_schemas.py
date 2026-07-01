"""
Developer: DroneBug Technologies
GitHub: https://github.com/ABugDrone
App: Amirable Hotel Management System
License: Proprietary
"""

from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List
from backend.modules.payments.models import PaymentMethod

class CheckInRequest(BaseModel):
    guest_id: str
    room_id: str
    expected_check_out_date: datetime

class CheckOutRequest(BaseModel):
    assignment_id: str
    payment_method: Optional[PaymentMethod] = None
    amount_paid: float = 0.0

class LedgerRead(BaseModel):
    id: str
    entry_type: str
    description: str
    amount: float
    created_at: datetime

class StaySummary(BaseModel):
    assignment_id: str
    guest_name: str
    room_number: str
    check_in_date: datetime
    balance: float

class GuestLedgerSummary(BaseModel):
    charges: List[LedgerRead]
    payments: List[LedgerRead]
    balance: float

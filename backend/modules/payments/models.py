"""
Developer: DroneBug Technologies
GitHub: https://github.com/ABugDrone
App: Amirable Hotel Management System
License: Proprietary
"""

import uuid
import enum
from datetime import datetime
from sqlalchemy import String, Float, DateTime, Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from backend.database import Base

class LedgerEntryType(str, enum.Enum):
    CHARGE = "charge"
    PAYMENT = "payment"
    ADJUSTMENT = "adjustment"

class PaymentMethod(str, enum.Enum):
    CASH = "cash"
    BANK_TRANSFER = "bank_transfer"
    POS = "pos"

class GuestLedger(Base):
    __tablename__ = "guest_ledger"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    assignment_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    guest_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    entry_type: Mapped[LedgerEntryType] = mapped_column(Enum(LedgerEntryType), nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False) # Positive for charge, negative for payment? 
    # Let's say positive amount. The type determines if it increases or decreases balance.
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    ledger_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    assignment_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    guest_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    method: Mapped[PaymentMethod] = mapped_column(Enum(PaymentMethod), nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=True)
    recorded_by: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

"""
Developer: DroneBug Technologies
GitHub: https://github.com/ABugDrone
App: Amirable Hotel Management System
License: Proprietary
"""

import uuid
import enum
from datetime import datetime
from sqlalchemy import String, Float, DateTime, Enum
from sqlalchemy.orm import Mapped, mapped_column
from backend.database import Base

class PayrollStatus(str, enum.Enum):
    PENDING = "PENDING"
    PROCESSED = "PROCESSED"
    PAID = "PAID"
    CANCELLED = "CANCELLED"

class AdvanceStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    REPAID = "REPAID"

class PayrollRecord(Base):
    __tablename__ = "payroll_records"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    staff_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    period_start: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    period_end: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    basic_salary: Mapped[float] = mapped_column(Float, default=0)
    allowances: Mapped[float] = mapped_column(Float, default=0)
    deductions: Mapped[float] = mapped_column(Float, default=0)
    net_salary: Mapped[float] = mapped_column(Float, default=0)
    status: Mapped[PayrollStatus] = mapped_column(Enum(PayrollStatus), nullable=False, default=PayrollStatus.PENDING)
    payment_date: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    payment_method: Mapped[str] = mapped_column(String, nullable=True)
    notes: Mapped[str] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class SalaryAdvance(Base):
    __tablename__ = "salary_advances"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    staff_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    repayment_date: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    status: Mapped[AdvanceStatus] = mapped_column(Enum(AdvanceStatus), nullable=False, default=AdvanceStatus.PENDING)
    notes: Mapped[str] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

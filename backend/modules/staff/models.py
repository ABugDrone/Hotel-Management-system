"""
Developer: DroneBug Technologies
GitHub: https://github.com/ABugDrone
App: Amirable Hotel Management System
License: Proprietary
"""

import uuid
import enum
from datetime import datetime
from sqlalchemy import String, Float, DateTime, Enum, Date
from sqlalchemy.orm import Mapped, mapped_column
from backend.database import Base

class Department(str, enum.Enum):
    RECEPTION = "RECEPTION"
    HOUSEKEEPING = "HOUSEKEEPING"
    KITCHEN = "KITCHEN"
    MAINTENANCE = "MAINTENANCE"
    MANAGEMENT = "MANAGEMENT"

class EmploymentType(str, enum.Enum):
    FULL_TIME = "FULL_TIME"
    PART_TIME = "PART_TIME"
    CONTRACT = "CONTRACT"

class StaffStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    ON_LEAVE = "ON_LEAVE"

class Staff(Base):
    __tablename__ = "staff"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    employee_id: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    full_name: Mapped[str] = mapped_column(String, nullable=False)
    position: Mapped[str] = mapped_column(String, nullable=False)
    department: Mapped[Department] = mapped_column(Enum(Department), nullable=False, default=Department.RECEPTION)
    employment_type: Mapped[EmploymentType] = mapped_column(Enum(EmploymentType), nullable=False, default=EmploymentType.FULL_TIME)
    hire_date: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    salary: Mapped[float] = mapped_column(Float, default=0)
    status: Mapped[StaffStatus] = mapped_column(Enum(StaffStatus), nullable=False, default=StaffStatus.ACTIVE)
    contact_number: Mapped[str] = mapped_column(String, nullable=True)
    email: Mapped[str] = mapped_column(String, nullable=True)
    address: Mapped[str] = mapped_column(String, nullable=True)
    emergency_contact: Mapped[str] = mapped_column(String, nullable=True)
    notes: Mapped[str] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

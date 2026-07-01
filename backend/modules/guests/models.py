"""
Developer: DroneBug Technologies
GitHub: https://github.com/ABugDrone
App: Amirable Hotel Management System
License: Proprietary
"""

import uuid
from datetime import datetime
from sqlalchemy import String, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.database import Base

class Guest(Base):
    __tablename__ = "guests"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    full_name: Mapped[str] = mapped_column(String, nullable=False, index=True)
    phone: Mapped[str] = mapped_column(String, nullable=False, index=True, unique=True)
    email: Mapped[str] = mapped_column(String, nullable=True)
    id_type: Mapped[str] = mapped_column(String, nullable=True) # Passport, National ID, etc.
    id_number: Mapped[str] = mapped_column(String, nullable=True)
    address: Mapped[str] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    debts = relationship("DebtRecovery", back_populates="guest", cascade="all, delete-orphan")

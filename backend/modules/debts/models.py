"""
Developer: DroneBug Technologies
GitHub: https://github.com/ABugDrone
App: Amirable Hotel Management System
License: Proprietary
"""

from sqlalchemy import Column, String, Float, DateTime, Enum, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum as PyEnum
import uuid
from backend.database import Base

class DebtStatus(PyEnum):
    OUTSTANDING = "outstanding"
    CONTACTED = "contacted"
    PROMISED_PAYMENT = "promised_payment"
    PAID = "paid"
    WRITTEN_OFF = "written_off"

class DebtRecovery(Base):
    __tablename__ = "debt_recovery"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    guest_id = Column(String, ForeignKey("guests.id"), nullable=False)
    assignment_id = Column(String, ForeignKey("room_assignments.id"), nullable=False)
    amount_owed = Column(Float, nullable=False, default=0.0)
    status = Column(Enum(DebtStatus), nullable=False, default=DebtStatus.OUTSTANDING)
    
    # Contact information
    last_contact_date = Column(DateTime, nullable=True)
    next_follow_up = Column(DateTime, nullable=True)
    contact_method = Column(String, nullable=True)  # phone, email, in_person
    contact_notes = Column(Text, nullable=True)
    
    # Recovery details
    promised_payment_date = Column(DateTime, nullable=True)
    promised_amount = Column(Float, nullable=True)
    actual_payment_date = Column(DateTime, nullable=True)
    actual_amount_paid = Column(Float, nullable=True)
    
    # Audit fields
    created_by = Column(String, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    guest = relationship("Guest", back_populates="debts")
    assignment = relationship("RoomAssignment")
    
    def __repr__(self):
        return f"<DebtRecovery {self.id}: {self.amount_owed} - {self.status}>"
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

class RoomStatus(str, enum.Enum):
    AVAILABLE = "available"
    OCCUPIED = "occupied"
    DIRTY = "dirty"
    MAINTENANCE = "maintenance"
    RESERVED = "reserved"

class Room(Base):
    __tablename__ = "rooms"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    number: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    room_type: Mapped[str] = mapped_column(String, nullable=False)
    price_per_night: Mapped[float] = mapped_column(Float, nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=True)
    status: Mapped[RoomStatus] = mapped_column(Enum(RoomStatus), nullable=False, default=RoomStatus.AVAILABLE)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class RoomAssignment(Base):
    __tablename__ = "room_assignments"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    room_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    guest_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    check_in_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    expected_check_out_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    actual_check_out_date: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    status: Mapped[str] = mapped_column(String, default="active") # active, completed, cancelled
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

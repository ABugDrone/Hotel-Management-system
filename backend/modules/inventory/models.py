"""
Developer: DroneBug Technologies
GitHub: https://github.com/ABugDrone
App: Amirable Hotel Management System
License: Proprietary
"""

import uuid
import enum
from datetime import datetime
from sqlalchemy import String, Float, DateTime, Enum, Boolean, Integer
from sqlalchemy.orm import Mapped, mapped_column
from backend.database import Base

class InvCategory(str, enum.Enum):
    FOOD = "FOOD"
    BEVERAGE = "BEVERAGE"
    CLEANING = "CLEANING"
    AMENITIES = "AMENITIES"
    MAINTENANCE = "MAINTENANCE"
    OFFICE = "OFFICE"

class InvTransactionType(str, enum.Enum):
    RESTOCK = "RESTOCK"
    CONSUMPTION = "CONSUMPTION"
    ADJUSTMENT = "ADJUSTMENT"
    DAMAGE = "DAMAGE"
    TRANSFER = "TRANSFER"

class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=True)
    category: Mapped[InvCategory] = mapped_column(Enum(InvCategory), nullable=False, default=InvCategory.FOOD)
    unit: Mapped[str] = mapped_column(String, nullable=False, default="pcs")
    current_quantity: Mapped[float] = mapped_column(Float, default=0)
    minimum_quantity: Mapped[float] = mapped_column(Float, default=10)
    unit_cost: Mapped[float] = mapped_column(Float, default=0)
    supplier: Mapped[str] = mapped_column(String, nullable=True)
    location: Mapped[str] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    @property
    def total_value(self):
        return self.current_quantity * self.unit_cost

    @property
    def low_stock(self):
        return self.current_quantity <= self.minimum_quantity

class InventoryTransaction(Base):
    __tablename__ = "inventory_transactions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    item_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    transaction_type: Mapped[InvTransactionType] = mapped_column(Enum(InvTransactionType), nullable=False)
    quantity: Mapped[float] = mapped_column(Float, nullable=False)
    unit_cost: Mapped[float] = mapped_column(Float, default=0)
    reference: Mapped[str] = mapped_column(String, nullable=True)
    notes: Mapped[str] = mapped_column(String, nullable=True)
    created_by: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

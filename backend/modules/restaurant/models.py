"""
Developer: DroneBug Technologies
GitHub: https://github.com/ABugDrone
App: Amirable Hotel Management System
License: Proprietary
"""

import uuid
import enum
from datetime import datetime
from sqlalchemy import String, Float, DateTime, Enum, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.database import Base

class FoodCategory(str, enum.Enum):
    APPETIZER = "APPETIZER"
    MAIN_COURSE = "MAIN_COURSE"
    DESSERT = "DESSERT"
    BEVERAGE = "BEVERAGE"
    SNACK = "SNACK"

class OrderStatus(str, enum.Enum):
    PENDING = "PENDING"
    PREPARING = "PREPARING"
    READY = "READY"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"
    PAID = "PAID"

class FoodItem(Base):
    __tablename__ = "food_items"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=True)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    category: Mapped[FoodCategory] = mapped_column(Enum(FoodCategory), nullable=False, default=FoodCategory.MAIN_COURSE)
    available: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class FoodOrder(Base):
    __tablename__ = "food_orders"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    guest_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    assignment_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    status: Mapped[OrderStatus] = mapped_column(Enum(OrderStatus), nullable=False, default=OrderStatus.PENDING)
    total_amount: Mapped[float] = mapped_column(Float, default=0.0)
    notes: Mapped[str] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    items = relationship("FoodOrderItem", backref="order", lazy="selectin")

class FoodOrderItem(Base):
    __tablename__ = "food_order_items"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    food_order_id: Mapped[str] = mapped_column(String, ForeignKey("food_orders.id"), nullable=False, index=True)
    food_item_id: Mapped[str] = mapped_column(String, ForeignKey("food_items.id"), nullable=False)
    quantity: Mapped[int] = mapped_column(Float, nullable=False, default=1)
    unit_price: Mapped[float] = mapped_column(Float, nullable=False)
    subtotal: Mapped[float] = mapped_column(Float, nullable=False)

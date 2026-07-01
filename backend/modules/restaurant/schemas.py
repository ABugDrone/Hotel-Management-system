"""
Developer: DroneBug Technologies
GitHub: https://github.com/ABugDrone
App: Amirable Hotel Management System
License: Proprietary
"""

from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List
from .models import FoodCategory, OrderStatus

class FoodItemBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    category: FoodCategory = FoodCategory.MAIN_COURSE
    available: bool = True

class FoodItemCreate(FoodItemBase):
    pass

class FoodItemRead(FoodItemBase):
    id: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class FoodOrderItemCreate(BaseModel):
    food_item_id: str
    quantity: int = 1

class FoodOrderCreate(BaseModel):
    guest_id: str
    assignment_id: str
    notes: Optional[str] = None
    items: List[FoodOrderItemCreate]

class FoodOrderItemRead(BaseModel):
    id: str
    food_item_id: str
    quantity: int
    unit_price: float
    subtotal: float
    food_item: Optional[FoodItemRead] = None
    model_config = ConfigDict(from_attributes=True)

class FoodOrderRead(BaseModel):
    id: str
    guest_id: str
    assignment_id: str
    status: OrderStatus
    total_amount: float
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    items: Optional[List[FoodOrderItemRead]] = None
    model_config = ConfigDict(from_attributes=True)

class FoodOrderStatusUpdate(BaseModel):
    status: OrderStatus

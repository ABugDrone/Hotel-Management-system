"""
Developer: DroneBug Technologies
GitHub: https://github.com/ABugDrone
App: Amirable Hotel Management System
License: Proprietary
"""

from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional
from .models import InvCategory, InvTransactionType

class InventoryItemBase(BaseModel):
    name: str
    description: Optional[str] = None
    category: InvCategory = InvCategory.FOOD
    unit: str = "pcs"
    current_quantity: float = 0
    minimum_quantity: float = 10
    unit_cost: float = 0
    supplier: Optional[str] = None
    location: Optional[str] = None

class InventoryItemCreate(InventoryItemBase):
    pass

class InventoryItemRead(InventoryItemBase):
    id: str
    total_value: float
    low_stock: bool
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class TransactionBase(BaseModel):
    item_id: str
    transaction_type: InvTransactionType
    quantity: float
    unit_cost: float = 0
    reference: Optional[str] = None
    notes: Optional[str] = None

class TransactionCreate(TransactionBase):
    pass

class TransactionRead(TransactionBase):
    id: str
    total_cost: float
    created_by: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

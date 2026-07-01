"""
Developer: DroneBug Technologies
GitHub: https://github.com/ABugDrone
App: Amirable Hotel Management System
License: Proprietary
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func
from typing import List, Optional
from .models import InventoryItem, InventoryTransaction, InvTransactionType
from .schemas import InventoryItemCreate, TransactionCreate

async def get_all_items(db: AsyncSession, category: Optional[str] = None, low_stock: bool = False):
    query = select(InventoryItem).order_by(InventoryItem.name)
    if category:
        query = query.where(InventoryItem.category == category)
    if low_stock:
        query = query.where(InventoryItem.current_quantity <= InventoryItem.minimum_quantity)
    result = await db.execute(query)
    return result.scalars().all()

async def get_item_by_id(db: AsyncSession, item_id: str):
    result = await db.execute(select(InventoryItem).where(InventoryItem.id == item_id))
    return result.scalar_one_or_none()

async def create_item(db: AsyncSession, data: InventoryItemCreate):
    item = InventoryItem(**data.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item

async def update_item(db: AsyncSession, item_id: str, data: dict):
    await db.execute(update(InventoryItem).where(InventoryItem.id == item_id).values(**data))
    await db.commit()
    return await get_item_by_id(db, item_id)

async def delete_item(db: AsyncSession, item_id: str):
    await db.execute(delete(InventoryItem).where(InventoryItem.id == item_id))
    await db.commit()
    return True

async def get_all_transactions(db: AsyncSession, limit: int = 50):
    result = await db.execute(
        select(InventoryTransaction).order_by(InventoryTransaction.created_at.desc()).limit(limit)
    )
    return result.scalars().all()

async def create_transaction(db: AsyncSession, data: TransactionCreate, user_id: str):
    item = await get_item_by_id(db, data.item_id)
    if not item:
        return None

    total_cost = data.quantity * data.unit_cost
    transaction = InventoryTransaction(
        item_id=data.item_id,
        transaction_type=data.transaction_type,
        quantity=data.quantity,
        unit_cost=data.unit_cost or item.unit_cost,
        reference=data.reference,
        notes=data.notes,
        created_by=user_id
    )
    db.add(transaction)

    if data.transaction_type == InvTransactionType.RESTOCK:
        item.current_quantity += data.quantity
        if data.unit_cost > 0:
            item.unit_cost = data.unit_cost
    elif data.transaction_type in [InvTransactionType.CONSUMPTION, InvTransactionType.DAMAGE]:
        item.current_quantity -= data.quantity

    await db.commit()
    return transaction

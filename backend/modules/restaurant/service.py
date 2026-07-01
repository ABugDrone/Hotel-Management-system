"""
Developer: DroneBug Technologies
GitHub: https://github.com/ABugDrone
App: Amirable Hotel Management System
License: Proprietary
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from typing import List, Optional
from .models import FoodItem, FoodOrder, FoodOrderItem, OrderStatus
from .schemas import FoodItemCreate, FoodOrderCreate

async def get_all_food_items(db: AsyncSession, available_only: bool = False):
    query = select(FoodItem)
    if available_only:
        query = query.where(FoodItem.available == True)
    result = await db.execute(query)
    return result.scalars().all()

async def get_food_item_by_id(db: AsyncSession, item_id: str):
    result = await db.execute(select(FoodItem).where(FoodItem.id == item_id))
    return result.scalar_one_or_none()

async def create_food_item(db: AsyncSession, data: FoodItemCreate):
    item = FoodItem(**data.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item

async def update_food_item(db: AsyncSession, item_id: str, data: dict):
    await db.execute(update(FoodItem).where(FoodItem.id == item_id).values(**data))
    await db.commit()
    return await get_food_item_by_id(db, item_id)

async def delete_food_item(db: AsyncSession, item_id: str):
    await db.execute(delete(FoodItem).where(FoodItem.id == item_id))
    await db.commit()
    return True

async def get_all_orders(db: AsyncSession, status: Optional[OrderStatus] = None):
    query = select(FoodOrder).order_by(FoodOrder.created_at.desc())
    if status:
        query = query.where(FoodOrder.status == status)
    result = await db.execute(query)
    return result.scalars().all()

async def get_order_by_id(db: AsyncSession, order_id: str):
    result = await db.execute(select(FoodOrder).where(FoodOrder.id == order_id))
    return result.scalar_one_or_none()

async def create_order(db: AsyncSession, data: FoodOrderCreate):
    order = FoodOrder(
        guest_id=data.guest_id,
        assignment_id=data.assignment_id,
        notes=data.notes
    )
    db.add(order)
    await db.flush()

    total = 0.0
    for item_data in data.items:
        food_item = await get_food_item_by_id(db, item_data.food_item_id)
        if not food_item:
            continue
        subtotal = food_item.price * item_data.quantity
        order_item = FoodOrderItem(
            food_order_id=order.id,
            food_item_id=item_data.food_item_id,
            quantity=item_data.quantity,
            unit_price=food_item.price,
            subtotal=subtotal
        )
        db.add(order_item)
        total += subtotal

    order.total_amount = total
    await db.commit()
    return order

async def update_order_status(db: AsyncSession, order_id: str, status: OrderStatus):
    await db.execute(update(FoodOrder).where(FoodOrder.id == order_id).values(status=status))
    await db.commit()
    return await get_order_by_id(db, order_id)

async def get_order_items(db: AsyncSession, order_id: str):
    result = await db.execute(
        select(FoodOrderItem).where(FoodOrderItem.food_order_id == order_id)
    )
    return result.scalars().all()

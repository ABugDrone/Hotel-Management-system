"""
Developer: DroneBug Technologies
GitHub: https://github.com/ABugDrone
App: Amirable Hotel Management System
License: Proprietary
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from backend.database import get_db
from . import service, schemas
from .models import OrderStatus

router = APIRouter(prefix="/restaurant", tags=["restaurant"])

@router.get("/items", response_model=List[schemas.FoodItemRead])
async def list_food_items(
    available_only: bool = False,
    db: AsyncSession = Depends(get_db)
):
    return await service.get_all_food_items(db, available_only=available_only)

@router.post("/items", response_model=schemas.FoodItemRead, status_code=status.HTTP_201_CREATED)
async def create_food_item(
    data: schemas.FoodItemCreate,
    db: AsyncSession = Depends(get_db)
):
    return await service.create_food_item(db, data)

@router.patch("/items/{item_id}", response_model=schemas.FoodItemRead)
async def update_food_item(
    item_id: str,
    data: schemas.FoodItemCreate,
    db: AsyncSession = Depends(get_db)
):
    item = await service.get_food_item_by_id(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Food item not found")
    return await service.update_food_item(db, item_id, data.model_dump(exclude_unset=True))

@router.delete("/items/{item_id}")
async def delete_food_item(
    item_id: str,
    db: AsyncSession = Depends(get_db)
):
    item = await service.get_food_item_by_id(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Food item not found")
    await service.delete_food_item(db, item_id)
    return {"success": True, "message": "Food item deleted"}

@router.get("/orders", response_model=List[schemas.FoodOrderRead])
async def list_orders(
    status: Optional[OrderStatus] = None,
    assignment_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    return await service.get_all_orders(db, status=status, assignment_id=assignment_id)

@router.post("/orders", response_model=schemas.FoodOrderRead, status_code=status.HTTP_201_CREATED)
async def create_order(
    data: schemas.FoodOrderCreate,
    db: AsyncSession = Depends(get_db)
):
    return await service.create_order(db, data)

@router.patch("/orders/{order_id}/status", response_model=schemas.FoodOrderRead)
async def update_order_status(
    order_id: str,
    data: schemas.FoodOrderStatusUpdate,
    db: AsyncSession = Depends(get_db)
):
    order = await service.get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return await service.update_order_status(db, order_id, data.status)

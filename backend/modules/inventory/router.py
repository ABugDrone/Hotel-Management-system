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

router = APIRouter(prefix="/inventory", tags=["inventory"])

@router.get("/items", response_model=List[schemas.InventoryItemRead])
async def list_items(
    category: Optional[str] = None,
    low_stock: bool = False,
    db: AsyncSession = Depends(get_db)
):
    return await service.get_all_items(db, category=category, low_stock=low_stock)

@router.post("/items", response_model=schemas.InventoryItemRead, status_code=status.HTTP_201_CREATED)
async def create_item(
    data: schemas.InventoryItemCreate,
    db: AsyncSession = Depends(get_db)
):
    return await service.create_item(db, data)

@router.patch("/items/{item_id}", response_model=schemas.InventoryItemRead)
async def update_item(
    item_id: str,
    data: schemas.InventoryItemCreate,
    db: AsyncSession = Depends(get_db)
):
    item = await service.get_item_by_id(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return await service.update_item(db, item_id, data.model_dump(exclude_unset=True))

@router.delete("/items/{item_id}")
async def delete_item(
    item_id: str,
    db: AsyncSession = Depends(get_db)
):
    item = await service.get_item_by_id(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    await service.delete_item(db, item_id)
    return {"success": True, "message": "Item deleted"}

@router.get("/transactions", response_model=List[schemas.TransactionRead])
async def list_transactions(
    db: AsyncSession = Depends(get_db)
):
    return await service.get_all_transactions(db)

@router.post("/transactions", response_model=schemas.TransactionRead, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    data: schemas.TransactionCreate,
    db: AsyncSession = Depends(get_db)
):
    transaction = await service.create_transaction(db, data, "system")
    if not transaction:
        raise HTTPException(status_code=404, detail="Item not found")
    return transaction

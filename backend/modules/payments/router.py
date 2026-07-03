"""
Developer: DroneBug Technologies
GitHub: https://github.com/ABugDrone
App: Amirable Hotel Management System
License: Proprietary
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from datetime import datetime

from backend.database import get_db
from . import service, schemas
from .models import PaymentMethod, LedgerEntryType

router = APIRouter(prefix="/payments", tags=["payments"])

@router.post("/charge", status_code=status.HTTP_201_CREATED)
async def add_charge(
    charge: schemas.AdditionalChargeCreate,
    db: AsyncSession = Depends(get_db)
):
    from backend.modules.payments.models import GuestLedger
    ledger = GuestLedger(
        assignment_id=charge.assignment_id,
        guest_id=charge.guest_id,
        entry_type=LedgerEntryType.CHARGE,
        description=charge.description,
        amount=charge.amount
    )
    db.add(ledger)
    await db.commit()
    await db.refresh(ledger)
    return ledger

@router.post("/", response_model=schemas.PaymentRead, status_code=status.HTTP_201_CREATED)
async def create_payment(
    payment: schemas.PaymentCreate,
    db: AsyncSession = Depends(get_db)
):
    try:
        return await service.create_payment(db, payment, "system")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create payment: {str(e)}"
        )

@router.get("/", response_model=List[schemas.PaymentRead])
async def list_payments(
    assignment_id: Optional[str] = None,
    guest_id: Optional[str] = None,
    method: Optional[PaymentMethod] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    List payments with optional filters.
    """
    # This is a simplified implementation - in production you'd build a dynamic query
    # For now, we'll handle filtering at the application level
    
    if assignment_id:
        payments = await service.get_payments_by_assignment(db, assignment_id)
    elif guest_id:
        payments = await service.get_payments_by_guest(db, guest_id)
    else:
        # Get all payments (in production, add pagination)
        from sqlalchemy import select
        result = await db.execute(select(service.Payment))
        payments = result.scalars().all()
    
    # Filter by method if specified
    if method:
        payments = [p for p in payments if p.method == method]
    
    return payments

@router.get("/{payment_id}", response_model=schemas.PaymentRead)
async def get_payment(
    payment_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific payment by ID.
    """
    payment = await service.get_payment_by_id(db, payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment

@router.delete("/{payment_id}")
async def delete_payment(
    payment_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a payment record.
    Requires: SUPER_ADMIN or ACCOUNTANT (for audit trail)
    """
    success = await service.delete_payment(db, payment_id)
    if not success:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    return {"success": True, "message": "Payment deleted successfully"}

@router.get("/assignment/{assignment_id}/summary")
async def get_assignment_payment_summary(
    assignment_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get payment summary for a specific assignment.
    """
    total = await service.get_total_payments_by_assignment(db, assignment_id)
    payments = await service.get_payments_by_assignment(db, assignment_id)
    
    return {
        "assignment_id": assignment_id,
        "total_paid": total,
        "payment_count": len(payments),
        "payments": payments
    }

@router.get("/daily-summary")
async def get_daily_payment_summary(
    date: Optional[str] = None,  # Format: YYYY-MM-DD
    db: AsyncSession = Depends(get_db)
):
    """
    Get daily payment summary.
    """
    target_date = None
    if date:
        try:
            target_date = datetime.strptime(date, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    return await service.get_daily_payment_summary(db, target_date)

@router.post("/receipt")
async def generate_payment_receipt(
    receipt_request: schemas.PaymentReceiptRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Generate receipt data for a payment.
    Returns structured data for frontend to format as PDF.
    """
    receipt_data = await service.get_payment_receipt_data(db, receipt_request.payment_id)
    if not receipt_data:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    # For now, return structured data
    # In Phase 3, we'll implement actual PDF generation
    return {
        "success": True,
        "receipt_data": receipt_data,
        "message": "Receipt data ready for formatting"
    }

# Guest Ledger endpoints
@router.get("/ledger/assignment/{assignment_id}", response_model=List[schemas.GuestLedgerRead])
async def get_assignment_ledger(
    assignment_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get full ledger for a specific assignment with running balance.
    """
    from sqlalchemy import select
    
    result = await db.execute(
        select(service.GuestLedger)
        .where(service.GuestLedger.assignment_id == assignment_id)
        .order_by(service.GuestLedger.created_at)
    )
    entries = result.scalars().all()
    
    balance = 0.0
    ledger_reads = []
    for entry in entries:
        if entry.entry_type == LedgerEntryType.CHARGE:
            balance += entry.amount
        elif entry.entry_type == LedgerEntryType.PAYMENT:
            balance -= entry.amount
        elif entry.entry_type == LedgerEntryType.ADJUSTMENT:
            balance += entry.amount
        
        ledger_reads.append(schemas.GuestLedgerRead(
            id=entry.id,
            assignment_id=entry.assignment_id,
            guest_id=entry.guest_id,
            entry_type=entry.entry_type.value,
            description=entry.description,
            amount=entry.amount,
            running_balance=balance,
            created_at=entry.created_at
        ))
    
    return ledger_reads

@router.get("/ledger/guest/{guest_id}", response_model=List[schemas.GuestLedgerRead])
async def get_guest_ledger(
    guest_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get all ledger entries for a specific guest with running balance.
    """
    from sqlalchemy import select
    
    result = await db.execute(
        select(service.GuestLedger)
        .where(service.GuestLedger.guest_id == guest_id)
        .order_by(service.GuestLedger.created_at)
    )
    entries = result.scalars().all()
    
    balance = 0.0
    ledger_reads = []
    for entry in entries:
        if entry.entry_type == LedgerEntryType.CHARGE:
            balance += entry.amount
        elif entry.entry_type == LedgerEntryType.PAYMENT:
            balance -= entry.amount
        elif entry.entry_type == LedgerEntryType.ADJUSTMENT:
            balance += entry.amount
        
        ledger_reads.append(schemas.GuestLedgerRead(
            id=entry.id,
            assignment_id=entry.assignment_id,
            guest_id=entry.guest_id,
            entry_type=entry.entry_type.value,
            description=entry.description,
            amount=entry.amount,
            running_balance=balance,
            created_at=entry.created_at
        ))
    
    return ledger_reads

@router.get("/methods/stats")
async def get_payment_method_stats(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Get statistics on payment method usage.
    """
    # Simplified implementation - in production, use date ranges
    from sqlalchemy import select, func
    
    result = await db.execute(
        select(
            service.Payment.method,
            func.sum(service.Payment.amount).label("total_amount"),
            func.count(service.Payment.id).label("payment_count")
        )
        .group_by(service.Payment.method)
    )
    
    stats = []
    for method, amount, count in result:
        stats.append({
            "method": method.value,
            "total_amount": amount or 0.0,
            "payment_count": count or 0,
            "percentage": 0  # Would calculate in production
        })
    
    return stats
@router.get("/{payment_id}/receipt-pdf")
async def get_payment_receipt_pdf(
    payment_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Generate and download PDF receipt for a payment.
    """
    receipt_data = await service.generate_payment_receipt_pdf(db, payment_id)
    if not receipt_data:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    if "pdf_bytes" in receipt_data:
        # Return PDF file
        from fastapi.responses import Response
        return Response(
            content=receipt_data["pdf_bytes"],
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={receipt_data['file_name']}"
            }
        )
    else:
        # Return HTML fallback
        return {
            "success": True,
            "html_content": receipt_data["html_content"],
            "file_name": receipt_data["file_name"],
            "message": "PDF generation failed, HTML receipt provided"
        }
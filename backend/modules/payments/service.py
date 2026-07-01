"""
Developer: DroneBug Technologies
GitHub: https://github.com/ABugDrone
App: Amirable Hotel Management System
License: Proprietary
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime
from typing import List, Optional

from .models import Payment, PaymentMethod, GuestLedger, LedgerEntryType
from .schemas import PaymentCreate, PaymentUpdate, GuestLedgerRead
from backend.modules.guests.models import Guest
from backend.modules.rooms.models import RoomAssignment, Room

async def create_payment(db: AsyncSession, payment_data: PaymentCreate, user_id: str):
    """
    Create a payment and corresponding ledger entry
    """
    # Create ledger entry first
    ledger_entry = GuestLedger(
        assignment_id=payment_data.assignment_id,
        guest_id=payment_data.guest_id,
        entry_type=LedgerEntryType.PAYMENT,
        description=payment_data.description or f"Payment via {payment_data.method.value}",
        amount=payment_data.amount
    )
    db.add(ledger_entry)
    await db.flush()  # Get the ID
    
    # Create payment record
    payment = Payment(
        ledger_id=ledger_entry.id,
        method=payment_data.method,
        amount=payment_data.amount,
        recorded_by=user_id
    )
    db.add(payment)
    
    await db.commit()
    await db.refresh(payment)
    return payment

async def get_payment_by_id(db: AsyncSession, payment_id: str) -> Optional[Payment]:
    result = await db.execute(select(Payment).where(Payment.id == payment_id))
    return result.scalar_one_or_none()

async def get_payments_by_assignment(db: AsyncSession, assignment_id: str) -> List[Payment]:
    # Get all ledger entries that are payments for this assignment
    subquery = select(GuestLedger.id).where(
        GuestLedger.assignment_id == assignment_id,
        GuestLedger.entry_type == LedgerEntryType.PAYMENT
    )
    
    result = await db.execute(
        select(Payment).where(Payment.ledger_id.in_(subquery))
    )
    return result.scalars().all()

async def get_payments_by_guest(db: AsyncSession, guest_id: str) -> List[Payment]:
    # Get all ledger entries that are payments for this guest
    subquery = select(GuestLedger.id).where(GuestLedger.guest_id == guest_id)
    
    result = await db.execute(
        select(Payment).where(Payment.ledger_id.in_(subquery))
    )
    return result.scalars().all()

async def get_total_payments_by_assignment(db: AsyncSession, assignment_id: str) -> float:
    result = await db.execute(
        select(func.sum(Payment.amount))
        .join(GuestLedger, Payment.ledger_id == GuestLedger.id)
        .where(GuestLedger.assignment_id == assignment_id)
    )
    total = result.scalar() or 0.0
    return total

async def update_payment(db: AsyncSession, payment_id: str, payment_data: PaymentUpdate) -> Optional[Payment]:
    payment = await get_payment_by_id(db, payment_id)
    if not payment:
        return None
    
    update_data = payment_data.model_dump(exclude_unset=True)
    
    # Update payment record
    if update_data:
        for field, value in update_data.items():
            setattr(payment, field, value)
    
    await db.commit()
    await db.refresh(payment)
    return payment

async def delete_payment(db: AsyncSession, payment_id: str) -> bool:
    payment = await get_payment_by_id(db, payment_id)
    if not payment:
        return False
    
    # Also delete the corresponding ledger entry
    result = await db.execute(
        select(GuestLedger).where(GuestLedger.id == payment.ledger_id)
    )
    ledger_entry = result.scalar_one_or_none()
    
    if ledger_entry:
        await db.delete(ledger_entry)
    
    await db.delete(payment)
    await db.commit()
    return True

async def get_payment_receipt_data(db: AsyncSession, payment_id: str):
    """
    Get comprehensive data for receipt generation
    """
    payment = await get_payment_by_id(db, payment_id)
    if not payment:
        return None
    
    # Get ledger entry
    result = await db.execute(
        select(GuestLedger).where(GuestLedger.id == payment.ledger_id)
    )
    ledger_entry = result.scalar_one_or_none()
    
    if not ledger_entry:
        return None
    
    # Get assignment details
    result = await db.execute(
        select(RoomAssignment).where(RoomAssignment.id == ledger_entry.assignment_id)
    )
    assignment = result.scalar_one_or_none()
    
    # Get guest details
    result = await db.execute(
        select(Guest).where(Guest.id == ledger_entry.guest_id)
    )
    guest = result.scalar_one_or_none()
    
    # Get room details if assignment exists
    room = None
    if assignment:
        result = await db.execute(
            select(Room).where(Room.id == assignment.room_id)
        )
        room = result.scalar_one_or_none()
    
    return {
        "payment": payment,
        "ledger_entry": ledger_entry,
        "assignment": assignment,
        "guest": guest,
        "room": room
    }

async def get_daily_payment_summary(db: AsyncSession, date: datetime = None):
    """
    Get payment summary for a specific day (or today if not specified)
    """
    if date is None:
        date = datetime.utcnow()
    
    # Start and end of day
    start_date = datetime(date.year, date.month, date.day, 0, 0, 0)
    end_date = datetime(date.year, date.month, date.day, 23, 59, 59)
    
    # Get total payments for the day
    result = await db.execute(
        select(func.sum(Payment.amount))
        .join(GuestLedger, Payment.ledger_id == GuestLedger.id)
        .where(GuestLedger.created_at >= start_date, GuestLedger.created_at <= end_date)
    )
    total_amount = result.scalar() or 0.0
    
    # Get payment breakdown by method
    result = await db.execute(
        select(Payment.method, func.sum(Payment.amount), func.count(Payment.id))
        .join(GuestLedger, Payment.ledger_id == GuestLedger.id)
        .where(GuestLedger.created_at >= start_date, GuestLedger.created_at <= end_date)
        .group_by(Payment.method)
    )
    
    breakdown = {}
    for method, amount, count in result:
        breakdown[method.value] = {
            "amount": amount or 0.0,
            "count": count or 0
        }
    
    return {
        "date": date.date(),
        "total_amount": total_amount,
        "breakdown": breakdown
    }
async def generate_payment_receipt_pdf(db: AsyncSession, payment_id: str):
    """
    Generate receipt for a payment.
    Returns HTML receipt (PDF generation requires wkhtmltopdf system dependency).
    """
    receipt_data = await get_payment_receipt_data(db, payment_id)
    if not receipt_data:
        return None
    
    payment = receipt_data["payment"]
    guest = receipt_data["guest"]
    assignment = receipt_data["assignment"]
    room = receipt_data["room"]
    guest_name = guest.full_name if guest else "N/A"
    room_number = room.number if room else "N/A"
    method_label = payment.method.value.upper() if hasattr(payment.method, 'value') else str(payment.method)
    
    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8">
<title>Receipt - Amirable Hotel</title>
<style>
body{{font-family:Arial,sans-serif;margin:40px;color:#333;font-size:14px}}
.header{{text-align:center;margin-bottom:30px;border-bottom:3px solid #4F7FFF;padding-bottom:20px}}
.hotel-name{{font-size:26px;font-weight:bold;color:#4F7FFF}}
.receipt-title{{font-size:16px;margin:8px 0;letter-spacing:2px;text-transform:uppercase;color:#666}}
.details{{margin:30px 0}}
.row{{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee}}
.label{{font-weight:bold;color:#555}}
.amount-box{{margin:20px 0;padding:15px;background:#f0f9f4;border:1px solid #2ECC71;border-radius:4px}}
.amount-label{{font-size:12px;color:#555;text-transform:uppercase}}
.amount-value{{font-size:24px;font-weight:bold;color:#2ECC71}}
.amount-words{{font-size:12px;color:#888;margin-top:5px}}
.footer{{margin-top:40px;text-align:center;font-size:11px;color:#999;border-top:1px solid #ddd;padding-top:20px}}
</style></head>
<body>
<div class="header">
<div class="hotel-name">Amirable Hotel</div>
<div class="receipt-title">Official Payment Receipt</div>
</div>
<div class="details">
<div class="row"><span class="label">Receipt No:</span><span>{payment.id[:8].upper()}</span></div>
<div class="row"><span class="label">Date:</span><span>{payment.created_at.strftime('%Y-%m-%d %H:%M') if hasattr(payment.created_at, 'strftime') else str(payment.created_at)}</span></div>
<div class="row"><span class="label">Guest:</span><span>{guest_name}</span></div>
<div class="row"><span class="label">Room:</span><span>{room_number}</span></div>
<div class="row"><span class="label">Payment Method:</span><span>{method_label}</span></div>
<div class="row"><span class="label">Description:</span><span>{receipt_data["ledger_entry"].description}</span></div>
</div>
<div class="amount-box">
<div class="amount-label">Amount Paid</div>
<div class="amount-value">&#8358;{payment.amount:,.2f}</div>
</div>
<div class="footer">
<p>Thank you for your patronage!</p>
<p>Amirable Hotel Management System &mdash; DroneBug Technologies</p>
<p style="font-size:10px">Generated {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}</p>
</div>
</body></html>"""
    
    return {
        "html_content": html_content,
        "file_name": f"receipt_{payment.id}.html",
        "payment_id": payment.id,
        "amount": payment.amount,
        "guest_name": guest_name,
        "fallback": False
    }
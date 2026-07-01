"""
Developer: DroneBug Technologies
GitHub: https://github.com/ABugDrone
App: Amirable Hotel Management System
License: Proprietary
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func
from fastapi import HTTPException, status, Request
from datetime import datetime

from backend.modules.rooms.models import Room, RoomStatus, RoomAssignment
from backend.modules.guests.models import Guest
from backend.modules.payments.models import GuestLedger, LedgerEntryType, Payment, PaymentMethod
from backend.modules.audit import service as audit_service
from backend.modules.rooms.check_schemas import CheckInRequest, CheckOutRequest

async def calculate_balance(db: AsyncSession, assignment_id: str):
    # Sum charges
    charge_query = select(func.sum(GuestLedger.amount)).where(
        GuestLedger.assignment_id == assignment_id,
        GuestLedger.entry_type == LedgerEntryType.CHARGE
    )
    # Sum payments
    payment_query = select(func.sum(GuestLedger.amount)).where(
        GuestLedger.assignment_id == assignment_id,
        GuestLedger.entry_type == LedgerEntryType.PAYMENT
    )
    
    charges_res = await db.execute(charge_query)
    payments_res = await db.execute(payment_query)
    
    charges = charges_res.scalar() or 0.0
    payments = payments_res.scalar() or 0.0
    
    return charges - payments

async def check_in(db: AsyncSession, user_id: str, data: CheckInRequest, request: Request):
    # 1. Verify Room
    room_res = await db.execute(select(Room).where(Room.id == data.room_id))
    room = room_res.scalar_one_or_none()
    if not room or room.status != RoomStatus.AVAILABLE:
        raise HTTPException(status_code=400, detail="Room is not available")
    
    # 2. Verify Guest
    guest_res = await db.execute(select(Guest).where(Guest.id == data.guest_id))
    guest = guest_res.scalar_one_or_none()
    if not guest:
        raise HTTPException(status_code=404, detail="Guest not found")

    # 3. Create Assignment
    assignment = RoomAssignment(
        room_id=data.room_id,
        guest_id=data.guest_id,
        expected_check_out_date=data.expected_check_out_date
    )
    db.add(assignment)
    await db.flush() # Get assignment ID

    # 4. Update Room Status
    room.status = RoomStatus.OCCUPIED
    
    # 5. Post first night charge
    ledger_entry = GuestLedger(
        assignment_id=assignment.id,
        guest_id=data.guest_id,
        entry_type=LedgerEntryType.CHARGE,
        description=f"Room Charge: {room.number} - First Night",
        amount=room.price_per_night
    )
    db.add(ledger_entry)
    
    # 6. Audit Log
    await audit_service.log(
        db=db,
        user_id=user_id,
        action="GUEST_CHECKIN",
        entity="assignments",
        entity_id=assignment.id,
        details={"room": room.number, "guest": guest.full_name},
        request=request
    )
    
    await db.commit()
    return assignment

async def check_out(db: AsyncSession, user_id: str, data: CheckOutRequest, request: Request):
    # 1. Get Assignment
    assign_res = await db.execute(select(RoomAssignment).where(RoomAssignment.id == data.assignment_id))
    assignment = assign_res.scalar_one_or_none()
    if not assignment or assignment.status != "active":
        raise HTTPException(status_code=400, detail="Active assignment not found")
    
    # 2. Get Room
    room_res = await db.execute(select(Room).where(Room.id == assignment.room_id))
    room = room_res.scalar_one_or_none()
    
    # 3. Compute Balance
    balance = await calculate_balance(db, assignment.id)
    
    # 4. Handle Final Payment if any provided
    if data.amount_paid > 0:
        if not data.payment_method:
            raise HTTPException(status_code=400, detail="Payment method required for payment")
        
        ledger_payment = GuestLedger(
            assignment_id=assignment.id,
            guest_id=assignment.guest_id,
            entry_type=LedgerEntryType.PAYMENT,
            description="Final Check-out Payment",
            amount=data.amount_paid
        )
        db.add(ledger_payment)
        await db.flush()
        
        payment_record = Payment(
            ledger_id=ledger_payment.id,
            method=data.payment_method,
            amount=data.amount_paid,
            recorded_by=user_id
        )
        db.add(payment_record)
        
        # Re-verify balance after payment
        balance -= data.amount_paid

    if balance > 0.01: # Small epsilon for float comparison
        raise HTTPException(status_code=400, detail=f"Outstanding balance of ₦{balance:.2f} must be cleared")

    # 5. Complete Assignment
    assignment.status = "completed"
    assignment.actual_check_out_date = datetime.utcnow()
    
    # 6. Set Room Status to Dirty
    if room:
        room.status = RoomStatus.DIRTY
    
    # 7. Audit Log
    await audit_service.log(
        db=db,
        user_id=user_id,
        action="GUEST_CHECKOUT",
        entity="assignments",
        entity_id=assignment.id,
        details={"room": room.number if room else "Unknown", "final_balance": balance},
        request=request
    )
    
    await db.commit()
    return {"success": True, "message": "Check-out successful"}

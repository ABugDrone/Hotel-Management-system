"""
Developer: DroneBug Technologies
GitHub: https://github.com/ABugDrone
App: Amirable Hotel Management System
License: Proprietary
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from backend.auth.router import router as auth_router
from backend.modules.rooms.router import router as rooms_router
from backend.modules.guests.router import router as guests_router
from backend.modules.payments.router import router as payments_router
from backend.modules.debts.router import router as debts_router
from backend.modules.restaurant.router import router as restaurant_router
from backend.modules.inventory.router import router as inventory_router
from backend.modules.staff.router import router as staff_router
from backend.modules.attendance.router import router as attendance_router
from backend.modules.payroll.router import router as payroll_router
from backend.modules.audit.router import router as audit_router
from backend.modules.reports.router import router as reports_router
from backend.modules.backup.router import router as backup_router
from backend.modules.settings.router import router as settings_router
from backend.auth.models import User, UserRole
from backend.modules.rooms.models import Room, RoomAssignment
from backend.modules.guests.models import Guest
from backend.modules.payments.models import GuestLedger, Payment
from backend.modules.restaurant.models import FoodItem, FoodOrder, FoodOrderItem
from backend.modules.inventory.models import InventoryItem, InventoryTransaction
from backend.modules.staff.models import Staff
from backend.modules.attendance.models import Attendance
from backend.modules.payroll.models import PayrollRecord, SalaryAdvance
from backend.modules.audit.models import AuditLog
from backend.modules.backup.models import Backup
from backend.modules.settings.models import AppSetting
from backend.auth.service import get_password_hash
from backend.database import engine, Base, async_session
from sqlalchemy import select

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables if they don't exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Seed initial super admin if no users exist
    async with async_session() as session:
        result = await session.execute(select(User))
        user_exists = result.first()
        if not user_exists:
            admin_user = User(
                username="admin",
                password_hash=get_password_hash("password"),
                full_name="System Administrator",
                role=UserRole.SUPER_ADMIN
            )
            session.add(admin_user)
            await session.commit()
            print("INFO: Initial super_admin user created: admin / password")
            
    yield

app = FastAPI(title="Amirable Hotel Management API", lifespan=lifespan)

# CORS configuration for development and local network access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production/tauri build
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/api/v1")
app.include_router(rooms_router, prefix="/api/v1")
app.include_router(guests_router, prefix="/api/v1")
app.include_router(payments_router, prefix="/api/v1")
app.include_router(debts_router, prefix="/api/v1")
app.include_router(restaurant_router, prefix="/api/v1")
app.include_router(inventory_router, prefix="/api/v1")
app.include_router(staff_router, prefix="/api/v1")
app.include_router(attendance_router, prefix="/api/v1")
app.include_router(payroll_router, prefix="/api/v1")
app.include_router(audit_router, prefix="/api/v1")
app.include_router(reports_router, prefix="/api/v1")
app.include_router(backup_router, prefix="/api/v1")
app.include_router(settings_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"message": "Amirable Hotel Management API is running", "developer": "DroneBug Technologies"}

@app.get("/health")
async def health():
    return {"status": "OK", "message": "Hotel Management API is healthy", "timestamp": "2024-01-01T00:00:00Z"}

# Serve static files from frontend/dist if it exists (for sidecar/production)
frontend_dist = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="static")

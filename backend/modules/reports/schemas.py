"""
Developer: DroneBug Technologies
GitHub: https://github.com/ABugDrone
App: Amirable Hotel Management System
License: Proprietary
"""

from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional, List

class DailyReport(BaseModel):
    date: date
    room_revenue: float
    food_revenue: float
    other_revenue: float
    total_revenue: float
    check_ins: int
    check_outs: int
    occupancy_rate: float
    transactions: List[dict] = []

class MonthlyReport(BaseModel):
    month: str
    total_revenue: float
    room_revenue: float
    food_revenue: float
    avg_occupancy: float
    total_guests: int
    room_nights: int
    revenue_breakdown: List[dict] = []
    daily_performance: List[dict] = []

"""
Developer: DroneBug Technologies
GitHub: https://github.com/ABugDrone
App: Amirable Hotel Management System
License: Proprietary
"""

from pydantic import BaseModel
from typing import Optional

class AppSettings(BaseModel):
    hotel_name: str = "Amirable Hotel"
    hotel_address: Optional[str] = None
    hotel_phone: Optional[str] = None
    hotel_email: Optional[str] = None
    currency: str = "NGN"
    timezone: str = "Africa/Lagos"
    check_in_time: str = "14:00"
    check_out_time: str = "12:00"
    tax_rate: float = 7.5
    late_checkout_fee: float = 5000
    auto_backup_enabled: bool = True
    auto_backup_time: str = "02:00"
    retention_days: int = 30
    theme_primary_color: str = "#1e40af"
    theme_secondary_color: str = "#64748b"
    theme_accent_color: str = "#f59e0b"
    theme_background_color: str = "#ffffff"
    theme_sidebar_color: str = "#1e293b"
    theme_font_family: str = "Inter"
    theme_dark_mode: bool = False

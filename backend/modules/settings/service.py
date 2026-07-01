"""
Developer: DroneBug Technologies
GitHub: https://github.com/ABugDrone
App: Amirable Hotel Management System
License: Proprietary
"""

import json
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from .models import AppSetting

DEFAULT_SETTINGS = {
    "hotel_name": "Amirable Hotel",
    "hotel_address": "",
    "hotel_phone": "",
    "hotel_email": "",
    "currency": "NGN",
    "timezone": "Africa/Lagos",
    "check_in_time": "14:00",
    "check_out_time": "12:00",
    "tax_rate": "7.5",
    "late_checkout_fee": "5000",
    "auto_backup_enabled": "true",
    "auto_backup_time": "02:00",
    "retention_days": "30",
    "smtp_host": "",
    "smtp_port": "587",
    "smtp_username": "",
    "smtp_password": "",
    "theme_primary_color": "#1e40af",
    "theme_secondary_color": "#64748b",
    "theme_accent_color": "#f59e0b",
    "theme_background_color": "#ffffff",
    "theme_sidebar_color": "#1e293b",
    "theme_font_family": "Inter",
    "theme_dark_mode": "false"
}

async def get_all_settings(db: AsyncSession):
    result = await db.execute(select(AppSetting))
    db_settings = result.scalars().all()

    settings_dict = {}
    for s in db_settings:
        settings_dict[s.key] = s.value

    for key, default_value in DEFAULT_SETTINGS.items():
        if key not in settings_dict:
            new_setting = AppSetting(key=key, value=default_value)
            db.add(new_setting)
            settings_dict[key] = default_value

    if db_settings:
        await db.commit()

    settings = {}
    for k, v in settings_dict.items():
        if v == "true":
            settings[k] = True
        elif v == "false":
            settings[k] = False
        else:
            try:
                if "." in v:
                    settings[k] = float(v)
                else:
                    settings[k] = int(v)
            except (ValueError, TypeError):
                settings[k] = v

    return settings

async def update_settings(db: AsyncSession, settings_data: dict):
    for key, value in settings_data.items():
        str_value = str(value).lower() if isinstance(value, bool) else str(value)
        existing = await db.execute(select(AppSetting).where(AppSetting.key == key))
        setting = existing.scalar_one_or_none()
        if setting:
            setting.value = str_value
        else:
            db.add(AppSetting(key=key, value=str_value))

    await db.commit()
    return await get_all_settings(db)

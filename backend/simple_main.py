"""
Simple FastAPI server for testing CORS and basic functionality
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI(title="Amirable Hotel Management API - Test")

# CORS configuration for development and local network access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Amirable Hotel Management API is running", "developer": "DroneBug Technologies"}

@app.get("/api/v1/health")
async def health():
    return {
        "status": "OK",
        "message": "Hotel Management API is healthy",
        "timestamp": "2024-01-01T00:00:00Z",
        "version": "1.0.0"
    }

@app.get("/api/v1/dashboard")
async def get_dashboard():
    """Mock dashboard data for testing"""
    return {
        "totalRooms": 20,
        "occupiedRooms": 8,
        "availableRooms": 10,
        "dirtyRooms": 2,
        "maintenanceRooms": 0,
        "occupancyPercentage": 40,
        "todayCheckIns": 3,
        "todayCheckOuts": 2,
        "outstandingDebts": 1250.75,
        "todayRevenue": 850.50,
        "rooms": [
            {
                "roomNumber": 101 + i,
                "roomType": "Standard" if i < 10 else "Deluxe",
                "dailyRate": 80 if i < 10 else 120,
                "status": ["available", "occupied", "dirty", "maintenance"][i % 4],
                "currentGuest": f"Guest {i}" if i % 4 == 1 else None,
                "checkInDate": "2024-01-01" if i % 4 == 1 else None,
                "checkOutDate": "2024-01-03" if i % 4 == 1 else None
            }
            for i in range(20)
        ]
    }

@app.get("/api/v1/rooms")
async def get_rooms():
    """Mock room data"""
    return [
        {
            "id": i + 1,
            "roomNumber": 101 + i,
            "roomType": "Standard" if i < 10 else "Deluxe",
            "dailyRate": 80 if i < 10 else 120,
            "status": ["available", "occupied", "dirty", "maintenance", "reserved"][i % 5],
            "currentGuest": f"Guest {i}" if i % 5 == 1 else None
        }
        for i in range(20)
    ]

@app.get("/api/v1/guests")
async def get_guests():
    """Mock guest data"""
    return [
        {
            "id": 1,
            "fullName": "John Smith",
            "phoneNumber": "+1234567890",
            "address": "123 Main St, City",
            "nationality": "American",
            "gender": "Male",
            "occupation": "Business",
            "idType": "Passport",
            "idNumber": "AB123456",
            "vehiclePlate": "ABC123",
            "emergencyContact": "+0987654321",
            "checkInDate": "2024-01-01",
            "checkOutDate": "2024-01-04",
            "assignedRoom": 101,
            "outstandingBalance": 0
        },
        {
            "id": 2,
            "fullName": "Maria Garcia",
            "phoneNumber": "+1987654321",
            "address": "456 Oak Ave, Town",
            "nationality": "Spanish",
            "gender": "Female",
            "occupation": "Tourist",
            "idType": "ID Card",
            "idNumber": "XYZ789",
            "vehiclePlate": "XYZ789",
            "emergencyContact": "+1122334455",
            "checkInDate": "2024-01-01",
            "checkOutDate": "2024-01-06",
            "assignedRoom": 105,
            "outstandingBalance": 120.50
        }
    ]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
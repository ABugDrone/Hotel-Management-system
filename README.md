# Amirable Hotel Management System

A professional, offline-first hotel management system designed for desktop use with local network access capabilities.

**Developer:** DroneBug Technologies  
**GitHub:** [github.com/ABugDrone](https://github.com/ABugDrone)  
**License:** Proprietary

## 🏨 Overview

Amirable is a comprehensive hotel management system built for 20-room hotels with multi-role staff access. The application operates entirely offline with optional local network access for other devices.

## 🚀 Quick Start

### Prerequisites
- **Python 3.11+** (for backend)
- **Node.js 18+** (for frontend)
- **SQLite** (embedded, no installation needed)

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Access the Application
1. **Backend API:** http://localhost:8000
2. **Frontend App:** http://localhost:5173
3. **Default Login:**
   - Username: `admin`
   - Password: `password`
   - Role: `SUPER_ADMIN`

## 🏗️ Architecture

### System Topology
```
[ Main PC — Server Node ]
  ├── Tauri .exe (future desktop wrapper)
  ├── FastAPI backend (Python, port 8000)
  │     └── Serves React build as static files
  └── SQLite DB → C:\AmirableHotel\data\amirable.db

[ Other LAN PCs / Android Devices ]
  └── Browser → http://192.168.x.x:8000
```

### Core Features
- ✅ **Authentication** - JWT-based RBAC with 6 user roles
- ✅ **Rooms Management** - 20-room grid with real-time status
- ✅ **Guests Management** - Registration, search, and history
- ✅ **Check-in/Check-out** - Complete guest stay workflow
- ✅ **Payments Module** - Cash, bank transfer, POS payments
- ✅ **Guest Ledger** - Automated charge posting and balance tracking
- ✅ **Dashboard** - Real-time stats and room grid

### Technical Stack
- **Desktop Shell:** Tauri v2 (future)
- **Frontend:** React 18 + TypeScript + Vite 5
- **Styling:** TailwindCSS v3 (desktop-first)
- **State Management:** Zustand
- **Backend:** FastAPI (Python async)
- **Database:** SQLite 3 with WAL mode
- **Authentication:** JWT + bcrypt hashing

## 📁 Project Structure

```
amirable/
├── backend/              # FastAPI Python backend
│   ├── auth/            # Authentication module
│   ├── modules/         # Business modules
│   │   ├── rooms/       # Rooms management
│   │   ├── guests/      # Guests management
│   │   ├── payments/    # Payments processing
│   │   └── audit/       # Audit logging
│   ├── main.py          # App entry point
│   └── requirements.txt # Python dependencies
│
├── frontend/            # React + TypeScript frontend
│   ├── src/
│   │   ├── pages/       # Application pages
│   │   ├── components/  # Reusable components
│   │   ├── store/       # Zustand stores
│   │   ├── api/         # API client
│   │   └── types/       # TypeScript definitions
│   ├── package.json     # Frontend dependencies
│   └── vite.config.ts   # Build configuration
│
├── config.json          # Runtime configuration
└── README.md           # This file
```

## 👥 User Roles & Permissions

| Role | Description | Access Level |
|------|-------------|--------------|
| **Super Admin** | Full system control | All modules |
| **Manager** | Day-to-day operations | Most modules |
| **Receptionist** | Front desk operations | Rooms, Guests, Payments |
| **Housekeeping** | Room maintenance | Room status updates |
| **Kitchen** | Restaurant operations | Restaurant module only |
| **Accountant** | Financial operations | Payments, Reports, Payroll |

## 🎨 Design System

### Color Palette
- `--color-bg-base: #0F1117` - Deep space background
- `--color-accent-primary: #4F7FFF` - Amirable blue
- `--color-status-green: #2ECC71` - Available rooms
- `--color-status-red: #E74C3C` - Occupied rooms

### Typography
- **Headers:** Inter (700, 600)
- **Body:** Inter (400, 500)
- **Monospace:** JetBrains Mono

## 🔧 Development Notes

### Build Order
The application follows a strict build order:
1. **Phase 1 - Foundation** (✅ Complete)
2. **Phase 2 - Core Operations** (✅ Complete)
3. **Phase 3 - Financial** (✅ Complete - Payments, Debts, Restaurant)
4. **Phase 4 - Operations** (🔄 In Progress)
5. **Phase 5 - Reporting & Admin** (⏳ Planned)
6. **Phase 6 - Desktop Packaging** (⏳ Future)

### Code Quality Rules
- TypeScript strict mode enabled
- No `any` types permitted
- Service layer separation enforced
- Audit logging on all write operations
- Desktop-first UI design

## 📊 Database Schema

Key tables include:
- `users` - Staff accounts with role-based access
- `rooms` - Room inventory with status tracking
- `guests` - Guest information and history
- `room_assignments` - Active guest stays
- `guest_ledger` - Financial transactions
- `payments` - Payment records
- `audit_logs` - System audit trail

## 🔒 Security Features
- JWT token authentication (8-hour expiry)
- Password hashing with bcrypt
- Role-based access control
- SQLite WAL mode for concurrent access
- Audit logging for all state changes

## 🚀 Next Steps

1. **Inventory Management** - Stock tracking and alerts (Backend ready, frontend needs API hookup)
2. **Staff Management** - Employee records and scheduling (Backend ready, frontend needs API hookup)
3. **Attendance Tracking** - Staff attendance module (Backend ready, frontend needs API hookup)
4. **Payroll Module** - Salary processing (Backend ready, frontend needs API hookup)
5. **Report Generation** - PDF exports and analytics
6. **Tauri Integration** - Desktop application packaging

## 📞 Support

For issues or questions, please contact:
- **GitHub Issues:** [github.com/ABugDrone/amirable/issues](https://github.com/ABugDrone/amirable/issues)
- **Developer:** DroneBug Technologies

---

*Built by DroneBug Technologies - Professional software for professional hotels.*
@echo off
echo ======================================================
echo   Amirable Hotel Management App - Development Server
echo ======================================================
echo.
echo Starting all servers for hotel management system...
echo.

REM Start Frontend (React + Vite)
echo [1/3] Starting Frontend Development Server...
echo Frontend will run on: http://localhost:5173
echo.
start "Frontend Server" cmd /k "cd /d frontend && npm run dev"

REM Wait a moment for frontend to start
timeout /t 3 /nobreak > nul

REM Start Backend (FastAPI)
echo [2/3] Starting Backend API Server...
echo Backend will run on: http://localhost:8000
echo API Documentation: http://localhost:8000/docs
echo.
start "Backend Server" cmd /k "cd /d . && python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000"

REM Wait a moment for backend to start
timeout /t 5 /nobreak > nul

REM Open test page
echo [3/3] Opening CORS Test Page...
echo This will test communication between frontend and backend
echo.
start "" "cors-test.html"

echo ======================================================
echo   All Servers Started Successfully!
echo ======================================================
echo.
echo Frontend:  http://localhost:5173
echo Backend:   http://localhost:8000
echo API Docs:  http://localhost:8000/docs
echo CORS Test: cors-test.html
echo.
echo Press any key to stop all servers...
pause > nul

REM Kill all processes
echo.
echo Stopping all servers...
taskkill /F /IM node.exe /T > nul 2>&1
taskkill /F /IM python.exe /T > nul 2>&1
echo.
echo All servers stopped.
echo.
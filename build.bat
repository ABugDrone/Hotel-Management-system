@echo off
title Amirable Hotel Management - Build System
color 0B
echo ======================================================
echo   Amirable Hotel Management - Production Build
echo ======================================================
echo.

REM --- Step 1: Install dependencies ---
echo [1/4] Installing Python dependencies...
pip install -r backend\requirements.txt --quiet
pip install pyinstaller --quiet
echo Done.

REM --- Step 2: Build Frontend ---
echo.
echo [2/4] Building React frontend...
cd frontend
call npm install --silent
call npm run build
if %ERRORLEVEL% neq 0 (
    echo ERROR: Frontend build failed!
    pause
    exit /b 1
)
cd ..
echo Done.

REM --- Step 3: Prepare production files ---
echo.
echo [3/4] Preparing production files...
copy /Y frontend\config.prod.json frontend\dist\config.json > nul
echo Done.

REM --- Step 4: Build both .exe files ---
echo.
echo [4/4] Packaging into executables...

REM --- 4a. Desktop WebView2 build ---
echo Building desktop build (webview2) ...
"%USERPROFILE%\AppData\Roaming\Python\Python314\Scripts\pyinstaller.exe" --clean build.spec
if %ERRORLEVEL% neq 0 (
    echo ERROR: Desktop PyInstaller build failed!
    pause
    exit /b 1
)

REM --- 4b. Win7 server-only build ---
echo Building Win7 build (server-only)...
& "%USERPROFILE%\AppData\Roaming\Python\Python314\Scripts\pyinstaller.exe" --clean build_win7.spec
if %ERRORLEVEL% neq 0 (
    echo ERROR: Win7 PyInstaller build failed!
    pause
    exit /b 1
)

echo.
echo ======================================================
echo   Build Complete!
echo ======================================================
echo.
echo Outputs:
echo   dist\AmirableHM\AmirableHM.exe
echo   dist\AmirableHM_Win7.exe
echo.
echo Access the app at: http://localhost:8000
echo.
pause

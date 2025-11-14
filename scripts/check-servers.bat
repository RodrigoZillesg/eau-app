@echo off
echo ======================================
echo EAU React Servers Status
echo ======================================
echo.

echo Checking Frontend Server (Port 5180)...
netstat -ano | findstr ":5180" >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Frontend is RUNNING on port 5180
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5180"') do (
        echo     PID: %%a
    )
) else (
    echo [X] Frontend is NOT running
)

echo.
echo Checking Backend Server (Port 3001)...
netstat -ano | findstr ":3001" >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Backend is RUNNING on port 3001
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001"') do (
        echo     PID: %%a
    )
) else (
    echo [X] Backend is NOT running
)

echo.
echo ======================================
pause

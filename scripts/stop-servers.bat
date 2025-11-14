@echo off
echo ======================================
echo Stopping EAU React Servers
echo ======================================
echo.

REM Find and kill processes on specific ports only
echo Stopping Frontend Server (Port 5180)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5180" 2^>nul') do (
    echo Killing PID: %%a
    taskkill /F /PID %%a 2>nul
)

echo.
echo Stopping Backend Server (Port 3001)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001" 2^>nul') do (
    echo Killing PID: %%a
    taskkill /F /PID %%a 2>nul
)

echo.
echo ======================================
echo Servers Stopped!
echo ======================================
echo.
pause

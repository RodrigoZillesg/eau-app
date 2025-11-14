@echo off
echo ======================================
echo Starting EAU React Servers
echo ======================================
echo.

REM Kill any existing servers on our ports
echo Checking for existing servers...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5180" 2^>nul') do (
    echo Killing process on port 5180: %%a
    taskkill /F /PID %%a 2>nul
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001" 2^>nul') do (
    echo Killing process on port 3001: %%a
    taskkill /F /PID %%a 2>nul
)

echo.
echo Waiting 2 seconds...
timeout /t 2 /nobreak >nul

echo.
echo Starting Backend Server (Port 3001)...
start "EAU Backend" cmd /k "cd eau-backend && npm start"

echo.
echo Waiting 3 seconds for backend to initialize...
timeout /t 3 /nobreak >nul

echo.
echo Starting Frontend Server (Port 5180)...
start "EAU Frontend" cmd /k "cd eau-members && npm run dev"

echo.
echo ======================================
echo Servers Started!
echo ======================================
echo Frontend: http://localhost:5180
echo Backend:  http://localhost:3001
echo.
echo Two new windows were opened with the servers.
echo Close those windows to stop the servers.
echo ======================================

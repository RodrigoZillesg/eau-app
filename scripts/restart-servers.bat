@echo off
echo ======================================
echo Restarting EAU React Servers
echo ======================================
echo.

call stop-servers.bat

echo.
echo Waiting 3 seconds before restarting...
timeout /t 3 /nobreak >nul

call start-servers.bat

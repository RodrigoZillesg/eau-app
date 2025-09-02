@echo off
echo Stopping all Node.js processes...

REM Try to kill node processes gracefully first
tasklist /FI "IMAGENAME eq node.exe" 2>NUL | find /I /N "node.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo Found Node.js processes, stopping them...
    
    REM Use WMIC for more stable process termination
    wmic process where name="node.exe" delete >NUL 2>&1
    
    REM Wait for processes to terminate
    timeout /t 2 /nobreak >NUL
    echo Node.js processes stopped
) else (
    echo No Node.js processes found
)

REM Check and free port 5180
echo Checking port 5180...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5180 ^| findstr LISTENING') do (
    echo Freeing port 5180 PID: %%a
    taskkill /PID %%a /F >NUL 2>&1
)

echo Ready to start development server!
pause
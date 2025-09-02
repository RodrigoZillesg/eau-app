@echo off
echo Fechando servidor de desenvolvimento...

REM Kill all Node.js processes
taskkill /F /IM node.exe 2>nul

REM Small delay to ensure processes are terminated
timeout /t 1 /nobreak >nul

echo Servidor fechado com sucesso!
echo.
echo Pressione qualquer tecla para continuar...
pause >nul

REM Exit back to command prompt
exit /b 0
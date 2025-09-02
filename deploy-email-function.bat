@echo off
echo ========================================
echo   DEPLOY DA FUNCAO DE EMAIL - BREVO
echo ========================================
echo.

REM Navegar para a pasta do projeto
cd /d "C:\Users\rrzil\Documents\Projetos\EAU React"

echo [1/4] Fazendo login no Supabase...
echo.
echo IMPORTANTE: O navegador vai abrir. Faca login e autorize o acesso.
echo.
pause
npx supabase login

echo.
echo [2/4] Conectando ao projeto...
echo.
echo Digite o Reference ID do seu projeto Supabase
echo (Encontre em: Supabase Dashboard > Settings > General > Reference ID)
echo.
set /p PROJECT_ID="Reference ID: "
npx supabase link --project-ref %PROJECT_ID%

echo.
echo [3/4] Deployando a funcao de email...
npx supabase functions deploy send-email-smtp

echo.
echo [4/4] Verificando se funcionou...
npx supabase functions list

echo.
echo ========================================
echo   DEPLOY CONCLUIDO!
echo ========================================
echo.
echo Agora teste o envio de email em:
echo http://localhost:5180/admin/smtp-settings
echo.
echo Se houver erros, execute:
echo npx supabase functions logs send-email-smtp
echo.
pause
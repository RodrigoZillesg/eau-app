@echo off
REM Script Windows para Configurar SSH Passwordless
REM Usa PuTTY/Pageant ou OpenSSH nativo do Windows

echo ==========================================
echo Configuracao SSH Passwordless - Windows
echo ==========================================
echo.

set SERVER_IP=91.108.104.122
set SERVER_USER=root
set SSH_KEY_PATH=%USERPROFILE%\.ssh\eau_server_rsa

echo Verificando SSH no Windows...
where ssh >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] OpenSSH nao esta instalado no Windows!
    echo.
    echo Instale via: Configuracoes ^> Aplicativos ^> Recursos Opcionais ^> OpenSSH Client
    pause
    exit /b 1
)

echo [OK] OpenSSH encontrado
echo.

REM Criar diretorio .ssh se nao existir
if not exist "%USERPROFILE%\.ssh" (
    mkdir "%USERPROFILE%\.ssh"
    echo [OK] Diretorio .ssh criado
)

REM Verificar se chave ja existe
if exist "%SSH_KEY_PATH%" (
    echo [!] Chave SSH ja existe em: %SSH_KEY_PATH%
    echo.
    set /p RECREATE="Deseja recriar a chave? (S/N): "
    if /i "%RECREATE%" NEQ "S" (
        echo [OK] Usando chave existente
        goto COPY_KEY
    )
    echo [!] Removendo chave antiga...
    del /f /q "%SSH_KEY_PATH%" "%SSH_KEY_PATH%.pub" 2>nul
)

echo.
echo Criando nova chave SSH...
ssh-keygen -t rsa -b 4096 -f "%SSH_KEY_PATH%" -N "" -C "eau-server-access"

if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Falha ao criar chave SSH
    pause
    exit /b 1
)

echo [OK] Chave SSH criada com sucesso!
echo.

:COPY_KEY
echo ==========================================
echo Copiando chave publica para o servidor
echo ==========================================
echo.
echo IMPORTANTE: Voce precisara digitar a senha pela ULTIMA VEZ:
echo Senha: Y#n9nah@=E@6ws8m!F/q
echo.
pause

REM Copiar chave para servidor
type "%SSH_KEY_PATH%.pub" | ssh %SERVER_USER%@%SERVER_IP% "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERRO] Falha ao copiar chave. Verifique a senha e conexao.
    pause
    exit /b 1
)

echo.
echo [OK] Chave publica copiada com sucesso!
echo.

REM Configurar SSH config
echo Configurando arquivo SSH config...
set SSH_CONFIG=%USERPROFILE%\.ssh\config

REM Criar config se não existir
if not exist "%SSH_CONFIG%" (
    type nul > "%SSH_CONFIG%"
)

REM Adicionar configuração
echo. >> "%SSH_CONFIG%"
echo Host eau-server >> "%SSH_CONFIG%"
echo     HostName %SERVER_IP% >> "%SSH_CONFIG%"
echo     User %SERVER_USER% >> "%SSH_CONFIG%"
echo     IdentityFile %SSH_KEY_PATH% >> "%SSH_CONFIG%"
echo     IdentitiesOnly yes >> "%SSH_CONFIG%"
echo. >> "%SSH_CONFIG%"
echo Host %SERVER_IP% >> "%SSH_CONFIG%"
echo     User %SERVER_USER% >> "%SSH_CONFIG%"
echo     IdentityFile %SSH_KEY_PATH% >> "%SSH_CONFIG%"
echo     IdentitiesOnly yes >> "%SSH_CONFIG%"

echo [OK] SSH config atualizado
echo.

REM Testar conexão
echo Testando conexao SSH sem senha...
ssh -o BatchMode=yes -i "%SSH_KEY_PATH%" %SERVER_USER%@%SERVER_IP% "echo '[OK] SSH funcionando sem senha!'"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ==========================================
    echo [SUCESSO] CONFIGURACAO CONCLUIDA!
    echo ==========================================
    echo.
    echo Agora voce pode usar SSH sem digitar senha:
    echo.
    echo   ssh root@%SERVER_IP%
    echo   ssh eau-server
    echo.
    echo Claude Code tambem podera executar comandos automaticamente!
    echo.
) else (
    echo.
    echo [AVISO] Teste falhou. Pode ser necessario configurar manualmente.
    echo.
    echo Tente executar: ssh -v root@%SERVER_IP%
    echo.
)

pause

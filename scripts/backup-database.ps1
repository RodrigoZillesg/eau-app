# Script para fazer backup do banco de dados Supabase auto-hospedado
# Execute este script no PowerShell como administrador

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   BACKUP DO BANCO DE DADOS EAU" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configurações do banco atual
$DB_HOST = "91.108.104.122"
$DB_PORT = "5432"
$DB_NAME = "postgres"
$DB_USER = "postgres"
$DB_PASSWORD = "your_password_here"  # ATUALIZE COM A SENHA CORRETA

# Nome do arquivo de backup
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_FILE = "eau_backup_$timestamp.sql"

Write-Host "[1/4] Conectando ao servidor..." -ForegroundColor Yellow

# Verifica se pg_dump está instalado
if (!(Get-Command pg_dump -ErrorAction SilentlyContinue)) {
    Write-Host "ERRO: pg_dump não encontrado!" -ForegroundColor Red
    Write-Host "Por favor, instale o PostgreSQL client tools:" -ForegroundColor Yellow
    Write-Host "https://www.postgresql.org/download/windows/" -ForegroundColor Cyan
    exit 1
}

Write-Host "[2/4] Iniciando backup do banco de dados..." -ForegroundColor Yellow
Write-Host "Isso pode levar alguns minutos..." -ForegroundColor Gray

# Executa o backup
$env:PGPASSWORD = $DB_PASSWORD
$backupCommand = "pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME --no-owner --no-acl --clean --if-exists --schema=public --schema=auth --schema=storage -f $BACKUP_FILE"

try {
    Invoke-Expression $backupCommand

    if (Test-Path $BACKUP_FILE) {
        $fileSize = (Get-Item $BACKUP_FILE).Length / 1MB
        Write-Host "[3/4] Backup concluído com sucesso!" -ForegroundColor Green
        Write-Host "Arquivo: $BACKUP_FILE" -ForegroundColor Cyan
        Write-Host "Tamanho: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Cyan

        Write-Host ""
        Write-Host "[4/4] Criando versão limpa para importação..." -ForegroundColor Yellow

        # Cria uma versão limpa removendo comandos específicos do Supabase auto-hospedado
        $CLEAN_FILE = "eau_clean_$timestamp.sql"
        $content = Get-Content $BACKUP_FILE -Raw

        # Remove linhas problemáticas
        $content = $content -replace "CREATE ROLE postgres;", "-- CREATE ROLE postgres;"
        $content = $content -replace "ALTER ROLE postgres", "-- ALTER ROLE postgres"
        $content = $content -replace "CREATE ROLE authenticator;", "-- CREATE ROLE authenticator;"
        $content = $content -replace "ALTER ROLE authenticator", "-- ALTER ROLE authenticator"
        $content = $content -replace "CREATE ROLE anon;", "-- CREATE ROLE anon;"
        $content = $content -replace "ALTER ROLE anon", "-- ALTER ROLE anon"
        $content = $content -replace "CREATE ROLE service_role;", "-- CREATE ROLE service_role;"
        $content = $content -replace "ALTER ROLE service_role", "-- ALTER ROLE service_role"

        # Salva arquivo limpo
        $content | Out-File -FilePath $CLEAN_FILE -Encoding UTF8

        Write-Host "Arquivo limpo criado: $CLEAN_FILE" -ForegroundColor Green
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "   BACKUP CONCLUÍDO COM SUCESSO!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "PRÓXIMOS PASSOS:" -ForegroundColor Yellow
        Write-Host "1. Use o arquivo '$CLEAN_FILE' para importar no Supabase Cloud" -ForegroundColor White
        Write-Host "2. Guarde o arquivo '$BACKUP_FILE' como backup de segurança" -ForegroundColor White

    } else {
        Write-Host "ERRO: Backup falhou!" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "ERRO ao executar backup: $_" -ForegroundColor Red
    exit 1
}
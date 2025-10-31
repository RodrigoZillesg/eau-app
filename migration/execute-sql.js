// Script para executar SQL diretamente via API do Supabase
const fs = require('fs').promises;
const path = require('path');

// Configurações
const SUPABASE_URL = 'https://ypsvoxelitgceclohxfu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlwc3ZveGVsaXRnY2VjbG9oeGZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MDE3NTUsImV4cCI6MjA3NDI3Nzc1NX0.-NO0-hrp4GajpOK9WnryqIeyEtS9iUiv03qkp9ScL9w';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlwc3ZveGVsaXRnY2VjbG9oeGZ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODcwMTc1NSwiZXhwIjoyMDc0Mjc3NzU1fQ.y_k4b4TlAev9R4TTFqHA08EjdZA-7Ymm5V1zMl-CYhA';
const ACCESS_TOKEN = 'sbp_a5330e805111a66d792e1c6464bdfef684ceb3d2';

// SQL simples para testar
const testSQL = `
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create test table
CREATE TABLE IF NOT EXISTS test_migration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert test data
INSERT INTO test_migration (name) VALUES ('Migration Test');

-- Select to verify
SELECT * FROM test_migration;
`;

async function executeSQL() {
    try {
        console.log('🚀 Testando execução de SQL no Supabase Cloud...\n');

        // Usar Management API do Supabase
        const response = await fetch(`https://api.supabase.com/v1/projects/ypsvoxelitgceclohxfu/database/query`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: testSQL
            })
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('❌ Erro na API:', response.status, error);

            // Tentar alternativa - usar o SQL Editor endpoint
            console.log('\n🔄 Tentando método alternativo...\n');

            // Vamos criar as tabelas uma a uma
            await createTablesIndividually();
        } else {
            const result = await response.json();
            console.log('✅ SQL executado com sucesso!');
            console.log('Resultado:', result);
        }

    } catch (error) {
        console.error('❌ Erro:', error.message);
        console.log('\n🔄 Tentando criar tabelas individualmente...\n');
        await createTablesIndividually();
    }
}

async function createTablesIndividually() {
    console.log('📋 Vou criar um script SQL simplificado para você executar...\n');

    // Ler o arquivo de tabelas
    const tablesSQL = await fs.readFile(path.join(__dirname, '01_create_tables.sql'), 'utf8');

    // Criar versão simplificada
    const simplifiedSQL = `
-- ========================================
-- SCRIPT SIMPLIFICADO PARA EXECUÇÃO MANUAL
-- ========================================

-- Passo 1: Execute isto primeiro no SQL Editor do Supabase Dashboard
-- Vá para: SQL Editor > New Query

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create institutions table first (no dependencies)
CREATE TABLE IF NOT EXISTS institutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(500) NOT NULL,
    code VARCHAR(100) UNIQUE,
    email VARCHAR(255),
    phone VARCHAR(50),
    website VARCHAR(500),
    address TEXT,
    city VARCHAR(200),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Australia',
    postal_code VARCHAR(20),
    membership_type VARCHAR(100),
    membership_status VARCHAR(50) DEFAULT 'active',
    membership_start_date DATE,
    membership_renewal_date DATE,
    membership_fee_amount DECIMAL(10,2),
    membership_fee_gst DECIMAL(10,2),
    membership_fee_total DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Após executar o acima com sucesso, execute o resto das tabelas
-- que estão no arquivo 01_create_tables.sql
`;

    // Salvar versão simplificada
    await fs.writeFile(
        path.join(__dirname, '00_quick_start.sql'),
        simplifiedSQL,
        'utf8'
    );

    console.log('✅ Arquivo criado: migration/00_quick_start.sql');
    console.log('\n📝 INSTRUÇÕES:');
    console.log('1. Acesse o SQL Editor no Supabase Dashboard');
    console.log('2. Cole o conteúdo do arquivo 00_quick_start.sql');
    console.log('3. Execute (clique em RUN)');
    console.log('4. Depois execute os outros arquivos SQL na ordem');
    console.log('\nOu me forneça as credenciais corretas do projeto para eu executar via API.');
}

// Executar
executeSQL().catch(console.error);
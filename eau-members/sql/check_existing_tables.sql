-- Script para verificar quais tabelas existem relacionadas a membros

-- 1. Verificar todas as tabelas que existem
SELECT table_name, table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name LIKE '%event%' 
   OR table_name LIKE '%member%' 
   OR table_name LIKE '%cpd%'
   OR table_name LIKE '%registration%'
ORDER BY table_name;

-- 2. Se event_registrations existir, verificar suas colunas
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'event_registrations' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Verificar colunas da tabela cpd_activities
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'cpd_activities' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Verificar se há outras tabelas relacionadas a eventos
SELECT table_name
FROM information_schema.tables 
WHERE table_schema = 'public'
AND (table_name LIKE '%event%' OR table_name LIKE '%registration%')
ORDER BY table_name;
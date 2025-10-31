-- DIAGNÓSTICO E CORREÇÃO DO PROBLEMA DE IMPORTAÇÃO CPD
-- =====================================================

-- 1. VERIFICAR QUANTAS ATIVIDADES EXISTEM NO BANCO
SELECT COUNT(*) as total_activities FROM cpd_activities;

-- 2. VERIFICAR DISTRIBUIÇÃO POR STATUS
SELECT status, COUNT(*) as count
FROM cpd_activities
GROUP BY status;

-- 3. VERIFICAR SE HÁ ATIVIDADES SEM USER_ID
SELECT COUNT(*) as activities_without_user
FROM cpd_activities
WHERE user_id IS NULL;

-- 4. LISTAR PRIMEIRAS 50 ATIVIDADES PARA ANÁLISE
SELECT
    id,
    user_id,
    activity_title,
    activity_date,
    cpd_points,
    cpd_category,
    status,
    created_at
FROM cpd_activities
ORDER BY created_at DESC
LIMIT 50;

-- 5. VERIFICAR SE EXISTE ÍNDICE NO USER_ID (IMPORTANTE PARA PERFORMANCE)
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'cpd_activities'
AND schemaname = 'public';

-- 6. CRIAR ÍNDICE SE NÃO EXISTIR (MELHORA PERFORMANCE)
CREATE INDEX IF NOT EXISTS idx_cpd_activities_user_id
ON cpd_activities(user_id);

CREATE INDEX IF NOT EXISTS idx_cpd_activities_status
ON cpd_activities(status);

CREATE INDEX IF NOT EXISTS idx_cpd_activities_activity_date
ON cpd_activities(activity_date);

-- 7. VERIFICAR RLS (Row Level Security)
-- Se estiver ativo, pode estar bloqueando visualização
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'cpd_activities';

-- 8. VERIFICAR SE HÁ ATIVIDADES IMPORTADAS HOJE
SELECT
    DATE(created_at) as import_date,
    COUNT(*) as activities_imported
FROM cpd_activities
WHERE DATE(created_at) = CURRENT_DATE
GROUP BY DATE(created_at);

-- 9. BUSCAR POR PADRÃO DE ATIVIDADES IMPORTADAS
-- (baseado no provider que seria 'External' ou 'Self-directed')
SELECT
    provider,
    COUNT(*) as imported_activities
FROM cpd_activities
WHERE provider IN ('External', 'Self-directed')
GROUP BY provider;

-- 10. ANÁLISE DE USUÁRIOS COM ATIVIDADES
SELECT
    au.email,
    COUNT(ca.id) as activity_count
FROM auth.users au
LEFT JOIN cpd_activities ca ON ca.user_id = au.id
GROUP BY au.email
HAVING COUNT(ca.id) > 0
ORDER BY activity_count DESC
LIMIT 20;
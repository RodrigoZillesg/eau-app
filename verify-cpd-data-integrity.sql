-- VERIFICAR INTEGRIDADE DOS DADOS CPD
-- ===================================

-- 1. VERIFICAR RELACIONAMENTOS ENTRE user_id e member_id
SELECT
    'Activities with user_id but no member_id' as issue_type,
    COUNT(*) as count
FROM cpd_activities
WHERE user_id IS NOT NULL AND member_id IS NULL

UNION ALL

SELECT
    'Activities with member_id but no user_id' as issue_type,
    COUNT(*) as count
FROM cpd_activities
WHERE member_id IS NOT NULL AND user_id IS NULL

UNION ALL

SELECT
    'Activities with both user_id and member_id' as issue_type,
    COUNT(*) as count
FROM cpd_activities
WHERE user_id IS NOT NULL AND member_id IS NOT NULL

UNION ALL

SELECT
    'Activities with neither user_id nor member_id' as issue_type,
    COUNT(*) as count
FROM cpd_activities
WHERE user_id IS NULL AND member_id IS NULL;

-- 2. VERIFICAR SE OS RELACIONAMENTOS SÃO CONSISTENTES
SELECT
    'Inconsistent user_id/member_id relationships' as issue_type,
    COUNT(*) as count
FROM cpd_activities ca
LEFT JOIN members m ON ca.member_id = m.id
WHERE ca.member_id IS NOT NULL
AND ca.user_id IS NOT NULL
AND ca.user_id != m.user_id;

-- 3. ATIVIDADES QUE PODEM SER VISUALIZADAS NO CPD MANAGEMENT
-- (têm member_id válido e relacionamento correto)
SELECT
    'Activities visible in CPD Management' as info_type,
    COUNT(*) as count
FROM cpd_activities ca
INNER JOIN members m ON ca.member_id = m.id
WHERE ca.member_id IS NOT NULL;

-- 4. VERIFICAR ÚLTIMAS ATIVIDADES IMPORTADAS
SELECT
    DATE(created_at) as import_date,
    COUNT(*) as activities_count,
    COUNT(CASE WHEN member_id IS NOT NULL THEN 1 END) as with_member_id,
    COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as with_user_id
FROM cpd_activities
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY import_date DESC;

-- 5. SAMPLE DE ATIVIDADES COM PROBLEMAS
SELECT
    id,
    user_id,
    member_id,
    activity_title,
    created_at,
    CASE
        WHEN user_id IS NULL AND member_id IS NULL THEN 'Missing both IDs'
        WHEN user_id IS NULL THEN 'Missing user_id'
        WHEN member_id IS NULL THEN 'Missing member_id'
        ELSE 'Has both IDs'
    END as issue
FROM cpd_activities
WHERE user_id IS NULL OR member_id IS NULL
ORDER BY created_at DESC
LIMIT 10;
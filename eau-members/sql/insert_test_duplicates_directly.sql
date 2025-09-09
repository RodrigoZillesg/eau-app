-- Script para inserir duplicatas de teste diretamente na tabela member_duplicates
-- Use isso se o scan automático não estiver funcionando

-- Primeiro, vamos pegar alguns IDs de membros existentes
WITH member_pairs AS (
    SELECT 
        m1.id as member1_id,
        m2.id as member2_id,
        m1.first_name as fn1,
        m1.last_name as ln1,
        m2.first_name as fn2,
        m2.last_name as ln2,
        m1.email as email1,
        m2.email as email2
    FROM members m1
    CROSS JOIN members m2
    WHERE m1.id < m2.id  -- Evita duplicatas e auto-comparação
    AND (
        -- Mesmo nome
        (m1.first_name = m2.first_name AND m1.last_name = m2.last_name)
        OR 
        -- Nomes muito similares
        (m1.last_name = m2.last_name AND (
            m1.first_name LIKE 'John%' AND m2.first_name LIKE 'John%'
            OR m1.first_name LIKE 'Maria%' AND m2.first_name LIKE 'Maria%'
            OR m1.first_name LIKE 'Sarah%' AND m2.first_name LIKE 'Sarah%'
            OR (m1.first_name = 'Robert' AND m2.first_name = 'Bob')
            OR (m1.first_name = 'Bob' AND m2.first_name = 'Robert')
            OR (m1.first_name = 'Michael' AND m2.first_name = 'Mike')
            OR (m1.first_name = 'Mike' AND m2.first_name = 'Michael')
        ))
        OR
        -- Emails de teste similares
        (m1.email LIKE '%.test%' AND m2.email LIKE '%.test%' 
         AND m1.last_name = m2.last_name)
    )
    LIMIT 10
)
-- Inserir as duplicatas detectadas
INSERT INTO member_duplicates (
    member1_id,
    member2_id,
    similarity_score,
    match_details,
    status
)
SELECT 
    member1_id,
    member2_id,
    CASE 
        WHEN fn1 = fn2 AND ln1 = ln2 THEN 95  -- Nome exato
        WHEN ln1 = ln2 AND (
            (fn1 = 'Robert' AND fn2 = 'Bob') OR 
            (fn1 = 'Bob' AND fn2 = 'Robert') OR
            (fn1 = 'Michael' AND fn2 = 'Mike') OR
            (fn1 = 'Mike' AND fn2 = 'Michael')
        ) THEN 85  -- Apelidos
        WHEN ln1 = ln2 AND (fn1 LIKE '%' || fn2 || '%' OR fn2 LIKE '%' || fn1 || '%') THEN 80  -- Nome contido
        WHEN ln1 = ln2 THEN 70  -- Mesmo sobrenome
        ELSE 60  -- Outros casos
    END as similarity_score,
    jsonb_build_object(
        'exact_name', fn1 = fn2 AND ln1 = ln2,
        'similar_name', ln1 = ln2,
        'name_similarity_score', 
            CASE 
                WHEN fn1 = fn2 AND ln1 = ln2 THEN 100
                WHEN ln1 = ln2 THEN 70
                ELSE 50
            END,
        'same_company', false,
        'similar_email', email1 LIKE '%test%' AND email2 LIKE '%test%',
        'same_phone', false,
        'same_address', false
    ) as match_details,
    'pending' as status
FROM member_pairs
ON CONFLICT (member1_id, member2_id) DO NOTHING;

-- Verificar quantas duplicatas foram inseridas
SELECT 
    COUNT(*) as total_duplicates_inserted,
    'Duplicatas inseridas com sucesso!' as message
FROM member_duplicates
WHERE status = 'pending';

-- Mostrar algumas das duplicatas inseridas
SELECT 
    md.similarity_score,
    m1.first_name || ' ' || m1.last_name as member1_name,
    m1.email as member1_email,
    m2.first_name || ' ' || m2.last_name as member2_name,
    m2.email as member2_email,
    md.match_details
FROM member_duplicates md
JOIN members m1 ON m1.id = md.member1_id
JOIN members m2 ON m2.id = md.member2_id
WHERE md.status = 'pending'
ORDER BY md.similarity_score DESC
LIMIT 5;
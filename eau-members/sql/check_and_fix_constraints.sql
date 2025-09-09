-- Verificar quais constraints existem na tabela members
SELECT 
    con.conname AS constraint_name,
    con.contype AS constraint_type,
    pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_namespace nsp ON nsp.oid = con.connamespace
JOIN pg_class cls ON cls.oid = con.conrelid
WHERE cls.relname = 'members'
AND con.contype = 'c'  -- Check constraints
ORDER BY con.conname;

-- Se necessário, remover a constraint problemática
-- ALTER TABLE members DROP CONSTRAINT IF EXISTS members_membership_type_check;

-- Verificar valores únicos atuais de membership_type
SELECT DISTINCT membership_type, COUNT(*) as count
FROM members
GROUP BY membership_type
ORDER BY count DESC;
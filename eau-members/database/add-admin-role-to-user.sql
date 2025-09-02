-- Adicionar role admin ao usuário rrzillesg@gmail.com
-- Execute este SQL no Supabase Studio

-- 1. Verificar usuário atual
SELECT 'Usuário atual:' as info, email, id
FROM auth.users 
WHERE email = 'rrzillesg@gmail.com';

-- 2. Verificar membro atual
SELECT 'Membro atual:' as info, m.email, m.id, m.first_name, m.last_name
FROM members m
WHERE m.email = 'rrzillesg@gmail.com';

-- 3. Verificar roles atuais
SELECT 'Roles atuais:' as info, mr.role
FROM members m
JOIN member_roles mr ON m.id = mr.member_id
WHERE m.email = 'rrzillesg@gmail.com';

-- 4. Adicionar roles de admin
INSERT INTO member_roles (member_id, role)
SELECT m.id, 'admin'
FROM members m
WHERE m.email = 'rrzillesg@gmail.com'
AND NOT EXISTS (
    SELECT 1 FROM member_roles mr 
    WHERE mr.member_id = m.id AND mr.role = 'admin'
);

INSERT INTO member_roles (member_id, role)
SELECT m.id, 'super_admin'
FROM members m
WHERE m.email = 'rrzillesg@gmail.com'
AND NOT EXISTS (
    SELECT 1 FROM member_roles mr 
    WHERE mr.member_id = m.id AND mr.role = 'super_admin'
);

-- 5. Verificar resultado final
SELECT 'Resultado final:' as info, mr.role
FROM members m
JOIN member_roles mr ON m.id = mr.member_id
WHERE m.email = 'rrzillesg@gmail.com';
-- Debug: Verificar se as roles foram criadas corretamente
-- Execute este SQL no Supabase Studio

-- 1. Verificar usuário na tabela auth.users
SELECT 'AUTH USERS:' as info, id, email, created_at
FROM auth.users 
WHERE email = 'rrzillesg@gmail.com';

-- 2. Verificar membro na tabela members
SELECT 'MEMBERS:' as info, id, email, first_name, last_name, created_by
FROM members 
WHERE email = 'rrzillesg@gmail.com';

-- 3. Verificar member_roles
SELECT 'MEMBER_ROLES:' as info, mr.*, m.email
FROM member_roles mr
JOIN members m ON mr.member_id = m.id
WHERE m.email = 'rrzillesg@gmail.com';

-- 4. Query completa que o código está tentando fazer
WITH user_info AS (
  SELECT id as user_id FROM auth.users WHERE email = 'rrzillesg@gmail.com'
)
SELECT 
  'QUERY COMPLETA:' as info,
  m.id as member_id,
  m.email,
  mr.role,
  ui.user_id,
  m.created_by
FROM user_info ui
LEFT JOIN members m ON m.created_by = ui.user_id
LEFT JOIN member_roles mr ON mr.member_id = m.id;

-- 5. Forçar inserção se não existir
INSERT INTO member_roles (member_id, role)
SELECT m.id, 'admin'
FROM members m
WHERE m.email = 'rrzillesg@gmail.com'
ON CONFLICT DO NOTHING;

INSERT INTO member_roles (member_id, role) 
SELECT m.id, 'super_admin'
FROM members m
WHERE m.email = 'rrzillesg@gmail.com'
ON CONFLICT DO NOTHING;
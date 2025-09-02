-- Criar membro admin após criar usuário no Auth
-- Execute este SQL depois de criar o usuário admin@englishaustralia.com.au

-- Primeiro, pegue o ID do usuário criado
WITH user_info AS (
  SELECT id 
  FROM auth.users 
  WHERE email = 'admin@englishaustralia.com.au'
  LIMIT 1
)
-- Inserir o membro
INSERT INTO public.members (
  first_name, 
  last_name, 
  email, 
  membership_status,
  membership_type,
  created_by,
  updated_by
) 
SELECT 
  'Admin',
  'User',
  'admin@englishaustralia.com.au',
  'active',
  'premium',
  id,
  id
FROM user_info
ON CONFLICT (email) DO NOTHING;

-- Adicionar role de admin
WITH member_info AS (
  SELECT id 
  FROM public.members 
  WHERE email = 'admin@englishaustralia.com.au'
  LIMIT 1
)
INSERT INTO public.member_roles (member_id, role)
SELECT id, 'admin' FROM member_info
ON CONFLICT DO NOTHING;

-- Adicionar role de super_admin
WITH member_info AS (
  SELECT id 
  FROM public.members 
  WHERE email = 'admin@englishaustralia.com.au'
  LIMIT 1
)
INSERT INTO public.member_roles (member_id, role)
SELECT id, 'super_admin' FROM member_info
ON CONFLICT DO NOTHING;

-- Verificar se foi criado
SELECT 
  m.*,
  array_agg(mr.role) as roles
FROM members m
LEFT JOIN member_roles mr ON m.id = mr.member_id
WHERE m.email = 'admin@englishaustralia.com.au'
GROUP BY m.id;
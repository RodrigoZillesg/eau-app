-- Criar usuário diretamente no banco de dados
-- Execute este SQL no Supabase Studio

-- 1. Primeiro, vamos criar o usuário diretamente na tabela auth.users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@englishaustralia.com.au',
  crypt('admin123', gen_salt('bf')),
  now(),
  null,
  null,
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now(),
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- 2. Criar o membro correspondente
INSERT INTO public.members (
  first_name, 
  last_name, 
  email, 
  membership_status,
  membership_type,
  created_by,
  updated_by
) VALUES (
  'Admin',
  'User',
  'admin@englishaustralia.com.au',
  'active',
  'premium',
  (SELECT id FROM auth.users WHERE email = 'admin@englishaustralia.com.au'),
  (SELECT id FROM auth.users WHERE email = 'admin@englishaustralia.com.au')
) ON CONFLICT (email) DO NOTHING;

-- 3. Adicionar roles de admin
INSERT INTO public.member_roles (member_id, role)
SELECT id, 'admin' 
FROM public.members 
WHERE email = 'admin@englishaustralia.com.au'
ON CONFLICT DO NOTHING;

INSERT INTO public.member_roles (member_id, role)
SELECT id, 'super_admin' 
FROM public.members 
WHERE email = 'admin@englishaustralia.com.au'
ON CONFLICT DO NOTHING;

-- 4. Verificar se foi criado
SELECT 'Usuário Auth:' as info, email, email_confirmed_at 
FROM auth.users 
WHERE email = 'admin@englishaustralia.com.au'
UNION ALL
SELECT 'Membro:' as info, email, membership_status::text
FROM public.members 
WHERE email = 'admin@englishaustralia.com.au';
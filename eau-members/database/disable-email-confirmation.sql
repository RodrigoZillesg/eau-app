-- Desabilitar confirmação por email temporariamente
-- Execute isso no SQL Editor do Supabase Studio

-- NOTA: No Supabase hospedado, você precisa mudar isso no painel de configurações:
-- 1. Vá para Authentication > Providers > Email
-- 2. Desmarque "Confirm email"
-- 3. Salve as configurações

-- Alternativa: Confirmar usuário manualmente após criação
UPDATE auth.users 
SET email_confirmed_at = now() 
WHERE email = 'admin@englishaustralia.com.au';

-- Para ver todos os usuários
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users;
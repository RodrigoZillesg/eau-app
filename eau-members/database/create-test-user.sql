-- Criar usuário de teste no Supabase Auth
-- NOTA: Execute este SQL no SQL Editor do Supabase Studio

-- Este comando cria um usuário de teste
-- Email: admin@englishaustralia.com.au
-- Senha: admin123

-- IMPORTANTE: No Supabase, você precisa criar usuários através do painel de Authentication
-- ou usando a API de signup. Este é apenas um guia.

-- Alternativa: Use o dashboard do Supabase:
-- 1. Vá para Authentication > Users
-- 2. Clique em "Invite user"
-- 3. Digite o email: admin@englishaustralia.com.au
-- 4. O usuário receberá um email para definir a senha

-- Ou crie através da aplicação:
-- 1. Adicione uma página de registro temporária
-- 2. Use supabase.auth.signUp() para criar o usuário
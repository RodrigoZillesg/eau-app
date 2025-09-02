-- SQL para corrigir usuário existente sem permissões
-- Execute este SQL no Supabase Studio

-- 1. Primeiro, vamos ver todos os usuários criados
SELECT 'Usuários existentes:' as info, email, id, created_at 
FROM auth.users 
ORDER BY created_at DESC;

-- 2. Para cada usuário que não tem membro correspondente, vamos criar:
-- (Substitua SEU_EMAIL_AQUI pelo email do usuário que você criou)

-- Exemplo para o usuário que você acabou de criar:
-- Substitua 'seu-email@example.com' pelo email real
DO $$
DECLARE
    user_record RECORD;
    member_id UUID;
BEGIN
    -- Para cada usuário sem membro correspondente
    FOR user_record IN 
        SELECT u.id as user_id, u.email
        FROM auth.users u
        LEFT JOIN members m ON u.email = m.email
        WHERE m.id IS NULL
    LOOP
        -- Criar membro
        INSERT INTO members (
            email,
            first_name,
            last_name,
            membership_status,
            membership_type,
            created_by,
            updated_by
        ) VALUES (
            user_record.email,
            split_part(user_record.email, '@', 1), -- Nome baseado no email
            'User',
            'active',
            'standard',
            user_record.user_id,
            user_record.user_id
        ) RETURNING id INTO member_id;

        -- Adicionar role padrão
        INSERT INTO member_roles (member_id, role)
        VALUES (member_id, 'member');

        -- Se o email contém 'admin', adicionar roles de admin
        IF user_record.email ILIKE '%admin%' THEN
            INSERT INTO member_roles (member_id, role)
            VALUES 
                (member_id, 'admin'),
                (member_id, 'super_admin');
        END IF;

        RAISE NOTICE 'Criado membro para usuário: %', user_record.email;
    END LOOP;
END $$;

-- 3. Verificar resultado
SELECT 
    u.email,
    m.first_name,
    m.last_name,
    m.membership_status,
    array_agg(mr.role) as roles
FROM auth.users u
JOIN members m ON u.email = m.email
LEFT JOIN member_roles mr ON m.id = mr.member_id
GROUP BY u.email, m.first_name, m.last_name, m.membership_status
ORDER BY u.created_at DESC;
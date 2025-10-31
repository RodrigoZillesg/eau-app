-- SCRIPT PARA VINCULAR MEMBROS COM USUÁRIOS JÁ CRIADOS
-- Este script conecta os registros em 'members' com os usuários em 'auth.users'

-- Primeiro, vamos ver quantos usuários foram criados mas não vinculados
SELECT
    'Usuários criados no auth.users:' as info,
    COUNT(*) as total
FROM auth.users
WHERE email IN (SELECT email FROM members WHERE email IS NOT NULL);

SELECT
    'Membros sem user_id:' as info,
    COUNT(*) as total
FROM members
WHERE user_id IS NULL AND email IS NOT NULL AND email != '';

-- Agora vamos vincular todos os membros com seus respectivos usuários
DO $$
DECLARE
    member_record RECORD;
    auth_user_id UUID;
    total_linked INTEGER := 0;
    total_processed INTEGER := 0;
BEGIN
    RAISE NOTICE '🔗 Iniciando vinculação de membros com usuários...';

    -- Loop através de todos os membros sem user_id
    FOR member_record IN
        SELECT id, email
        FROM members
        WHERE user_id IS NULL
        AND email IS NOT NULL
        AND email != ''
    LOOP
        BEGIN
            -- Buscar o user_id no auth.users baseado no email
            SELECT id INTO auth_user_id
            FROM auth.users
            WHERE email = member_record.email
            LIMIT 1;

            IF auth_user_id IS NOT NULL THEN
                -- Atualizar o member com o user_id encontrado
                UPDATE members
                SET user_id = auth_user_id,
                    updated_at = NOW()
                WHERE id = member_record.id;

                total_linked := total_linked + 1;
            END IF;

            total_processed := total_processed + 1;

            -- Log a cada 500 registros
            IF total_processed % 500 = 0 THEN
                RAISE NOTICE '✅ Processados % membros, vinculados %...', total_processed, total_linked;
            END IF;

        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '⚠️ Erro ao vincular membro %: %', member_record.email, SQLERRM;
        END;
    END LOOP;

    RAISE NOTICE '🎉 VINCULAÇÃO COMPLETA!';
    RAISE NOTICE '📊 Total processados: %', total_processed;
    RAISE NOTICE '🔗 Total vinculados: %', total_linked;
END $$;

-- Verificar o resultado final
SELECT
    'RESULTADO FINAL' as status,
    COUNT(*) as total_members,
    COUNT(user_id) as members_with_user_id,
    COUNT(*) - COUNT(user_id) as members_without_user_id,
    ROUND((COUNT(user_id)::numeric / COUNT(*)::numeric * 100), 2) || '%' as percentage_with_auth
FROM members
WHERE email IS NOT NULL AND email != '';

-- Mostrar alguns exemplos de membros agora com credenciais
SELECT
    email,
    first_name || ' ' || last_name as full_name,
    CASE
        WHEN user_id IS NOT NULL THEN '✅ Vinculado - Login: ' || email || ' / Senha: EAU2025temp!'
        ELSE '❌ Não vinculado'
    END as status,
    user_id
FROM members
WHERE email IN (
    'sarah.johnson@sydneylanguage.edu.au',
    'test@testacademy.edu.au',
    'mauricio.segura@platty.tech',
    'evannozzi@apc.edu.au',
    'wilma.vanderstelt@holmesglen.edu.au'
)
ORDER BY user_id DESC NULLS LAST;

-- Contar quantos membros têm credenciais agora
SELECT
    'ESTATÍSTICAS FINAIS' as info,
    COUNT(DISTINCT m.id) as total_members,
    COUNT(DISTINCT m.user_id) as members_with_credentials,
    COUNT(DISTINCT au.id) as total_auth_users
FROM members m
LEFT JOIN auth.users au ON au.id = m.user_id
WHERE m.email IS NOT NULL AND m.email != '';
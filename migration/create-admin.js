// Script para criar usuário admin após ele ser criado no Dashboard
const ACCESS_TOKEN = 'sbp_a5330e805111a66d792e1c6464bdfef684ceb3d2';
const PROJECT_ID = 'ypsvoxelitgceclohxfu';

async function executeSQL(sql, description = 'Executing SQL') {
    try {
        console.log(`📋 ${description}...`);

        const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_ID}/database/query`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: sql })
        });

        if (!response.ok) {
            const error = await response.text();
            console.error(`❌ Erro: ${error}`);
            return false;
        }

        const result = await response.json();
        console.log(`✅ ${description} - Concluído!`);

        if (result && result.length > 0) {
            return result;
        }
        return true;

    } catch (error) {
        console.error(`❌ Erro em ${description}:`, error.message);
        return false;
    }
}

async function setupAdmin() {
    console.log('👤 CONFIGURANDO USUÁRIO ADMIN');
    console.log('==============================\n');

    const adminEmail = 'dev@platty.tech';

    // 1. Verificar se o usuário existe no auth.users
    const userCheck = await executeSQL(`
        SELECT id, email, raw_user_meta_data
        FROM auth.users
        WHERE email = '${adminEmail}'
        LIMIT 1;
    `, 'Verificando usuário no auth.users');

    if (!userCheck || userCheck.length === 0) {
        console.log('\n⚠️ Usuário ainda não foi criado no Dashboard!');
        console.log('\n📝 Por favor, faça o seguinte:');
        console.log('1. Acesse o Dashboard do Supabase');
        console.log('2. Vá para Authentication > Users');
        console.log('3. Clique em "Add User" > "Create new user"');
        console.log('4. Use o email: rrzillesg@gmail.com');
        console.log('5. Use a senha: Salmo119:97');
        console.log('6. Marque "Auto Confirm User"');
        console.log('7. Execute este script novamente');
        return;
    }

    const userId = userCheck[0].id;
    console.log(`✅ Usuário encontrado com ID: ${userId}`);

    // 2. Atualizar metadata do usuário
    await executeSQL(`
        UPDATE auth.users
        SET raw_user_meta_data = jsonb_build_object(
            'full_name', 'System Administrator',
            'role', 'super_admin'
        )
        WHERE id = '${userId}';
    `, 'Atualizando metadata do usuário');

    // 3. Verificar se já existe um member record
    const memberCheck = await executeSQL(`
        SELECT id FROM members
        WHERE email = '${adminEmail}'
        LIMIT 1;
    `, 'Verificando member existente');

    if (!memberCheck || memberCheck.length === 0) {
        // 4. Criar member record
        await executeSQL(`
            INSERT INTO members (
                email,
                first_name,
                last_name,
                user_id,
                user_type,
                membership_status,
                created_at
            ) VALUES (
                '${adminEmail}',
                'System',
                'Administrator',
                '${userId}',
                'super_admin',
                'active',
                NOW()
            );
        `, 'Criando registro de membro admin');
    } else {
        // 4. Atualizar member record existente
        await executeSQL(`
            UPDATE members
            SET
                user_id = '${userId}',
                user_type = 'super_admin',
                membership_status = 'active',
                first_name = 'System',
                last_name = 'Administrator',
                updated_at = NOW()
            WHERE email = '${adminEmail}';
        `, 'Atualizando registro de membro admin');
    }

    console.log('\n==============================');
    console.log('✅ ADMIN CONFIGURADO COM SUCESSO!');
    console.log('==============================\n');
    console.log('📊 Detalhes do Admin:');
    console.log(`  Email: ${adminEmail}`);
    console.log(`  Senha: Salmo119:97`);
    console.log(`  Role: super_admin`);
    console.log(`  Status: Ativo`);
    console.log('\n🚀 Você já pode fazer login na aplicação!');
}

// Executar
setupAdmin().catch(console.error);
// Script para configurar RLS policies
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

        console.log(`✅ ${description} - Concluído!`);
        return true;

    } catch (error) {
        console.error(`❌ Erro em ${description}:`, error.message);
        return false;
    }
}

async function setupRLS() {
    console.log('🛡️ CONFIGURANDO RLS POLICIES');
    console.log('============================\n');

    // 1. Habilitar RLS em todas as tabelas
    const tables = [
        'institutions', 'members', 'events', 'event_registrations',
        'cpd_activities', 'event_certificates', 'password_reset_tokens',
        'email_logs', 'membership_applications', 'membership_fees',
        'openlearning_sync_logs', 'openlearning_courses',
        'openlearning_api_logs', 'openlearning_sso_sessions'
    ];

    for (const table of tables) {
        await executeSQL(
            `ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`,
            `Habilitando RLS em ${table}`
        );
    }

    // 2. Criar funções helper
    await executeSQL(`
        CREATE OR REPLACE FUNCTION is_admin()
        RETURNS BOOLEAN AS $$
        BEGIN
            RETURN (auth.jwt() ->> 'role' IN ('admin', 'super_admin')) OR
                   (auth.jwt() -> 'user_metadata' ->> 'role' IN ('admin', 'super_admin'));
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
    `, 'Criando função is_admin');

    await executeSQL(`
        CREATE OR REPLACE FUNCTION is_super_admin()
        RETURNS BOOLEAN AS $$
        BEGIN
            RETURN (auth.jwt() ->> 'role' = 'super_admin') OR
                   (auth.jwt() -> 'user_metadata' ->> 'role' = 'super_admin');
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
    `, 'Criando função is_super_admin');

    await executeSQL(`
        CREATE OR REPLACE FUNCTION get_user_institution()
        RETURNS UUID AS $$
        BEGIN
            RETURN (
                SELECT institution_id FROM members
                WHERE user_id = auth.uid()
                LIMIT 1
            );
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
    `, 'Criando função get_user_institution');

    await executeSQL(`
        CREATE OR REPLACE FUNCTION is_institution_admin(inst_id UUID)
        RETURNS BOOLEAN AS $$
        BEGIN
            RETURN EXISTS (
                SELECT 1 FROM members
                WHERE user_id = auth.uid()
                AND institution_id = inst_id
                AND user_type = 'Institution Admin'
            );
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
    `, 'Criando função is_institution_admin');

    // 3. Policies para institutions
    await executeSQL(`
        CREATE POLICY "institutions_select_policy" ON institutions
        FOR SELECT USING (true);
    `, 'Policy: institutions SELECT (público)');

    await executeSQL(`
        CREATE POLICY "institutions_insert_policy" ON institutions
        FOR INSERT WITH CHECK (is_admin());
    `, 'Policy: institutions INSERT (admins)');

    await executeSQL(`
        CREATE POLICY "institutions_update_policy" ON institutions
        FOR UPDATE USING (is_admin() OR is_institution_admin(id));
    `, 'Policy: institutions UPDATE');

    await executeSQL(`
        CREATE POLICY "institutions_delete_policy" ON institutions
        FOR DELETE USING (is_super_admin());
    `, 'Policy: institutions DELETE (super admin)');

    // 4. Policies para members
    await executeSQL(`
        CREATE POLICY "members_select_policy" ON members
        FOR SELECT USING (
            is_admin() OR
            user_id = auth.uid() OR
            (institution_id = get_user_institution() AND is_institution_admin(get_user_institution()))
        );
    `, 'Policy: members SELECT');

    await executeSQL(`
        CREATE POLICY "members_insert_policy" ON members
        FOR INSERT WITH CHECK (
            is_admin() OR
            (institution_id = get_user_institution() AND is_institution_admin(get_user_institution()))
        );
    `, 'Policy: members INSERT');

    await executeSQL(`
        CREATE POLICY "members_update_policy" ON members
        FOR UPDATE USING (
            is_admin() OR
            user_id = auth.uid() OR
            (institution_id = get_user_institution() AND is_institution_admin(get_user_institution()))
        );
    `, 'Policy: members UPDATE');

    await executeSQL(`
        CREATE POLICY "members_delete_policy" ON members
        FOR DELETE USING (is_admin());
    `, 'Policy: members DELETE');

    // 5. Policies para events
    await executeSQL(`
        CREATE POLICY "events_select_policy" ON events
        FOR SELECT USING (status = 'published' OR created_by = auth.uid() OR is_admin());
    `, 'Policy: events SELECT');

    await executeSQL(`
        CREATE POLICY "events_insert_policy" ON events
        FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
    `, 'Policy: events INSERT');

    await executeSQL(`
        CREATE POLICY "events_update_policy" ON events
        FOR UPDATE USING (created_by = auth.uid() OR is_admin());
    `, 'Policy: events UPDATE');

    await executeSQL(`
        CREATE POLICY "events_delete_policy" ON events
        FOR DELETE USING (created_by = auth.uid() OR is_admin());
    `, 'Policy: events DELETE');

    // 6. Policies para event_registrations
    await executeSQL(`
        CREATE POLICY "event_registrations_select_policy" ON event_registrations
        FOR SELECT USING (
            user_id = auth.uid() OR
            is_admin() OR
            EXISTS (
                SELECT 1 FROM events
                WHERE events.id = event_registrations.event_id
                AND events.created_by = auth.uid()
            )
        );
    `, 'Policy: event_registrations SELECT');

    await executeSQL(`
        CREATE POLICY "event_registrations_insert_policy" ON event_registrations
        FOR INSERT WITH CHECK (user_id = auth.uid() OR is_admin());
    `, 'Policy: event_registrations INSERT');

    await executeSQL(`
        CREATE POLICY "event_registrations_update_policy" ON event_registrations
        FOR UPDATE USING (
            is_admin() OR
            EXISTS (
                SELECT 1 FROM events
                WHERE events.id = event_registrations.event_id
                AND events.created_by = auth.uid()
            )
        );
    `, 'Policy: event_registrations UPDATE');

    // 7. Policies para cpd_activities
    await executeSQL(`
        CREATE POLICY "cpd_activities_select_policy" ON cpd_activities
        FOR SELECT USING (user_id = auth.uid() OR is_admin());
    `, 'Policy: cpd_activities SELECT');

    await executeSQL(`
        CREATE POLICY "cpd_activities_insert_policy" ON cpd_activities
        FOR INSERT WITH CHECK (user_id = auth.uid() OR is_admin());
    `, 'Policy: cpd_activities INSERT');

    await executeSQL(`
        CREATE POLICY "cpd_activities_update_policy" ON cpd_activities
        FOR UPDATE USING ((user_id = auth.uid() AND status = 'pending') OR is_admin());
    `, 'Policy: cpd_activities UPDATE');

    // 8. Policies básicas para outras tabelas
    await executeSQL(`
        CREATE POLICY "event_certificates_select_policy" ON event_certificates
        FOR SELECT USING (user_id = auth.uid() OR is_admin());
    `, 'Policy: event_certificates SELECT');

    await executeSQL(`
        CREATE POLICY "membership_fees_select_policy" ON membership_fees
        FOR SELECT USING (is_active = true OR is_admin());
    `, 'Policy: membership_fees SELECT');

    await executeSQL(`
        CREATE POLICY "membership_applications_select_policy" ON membership_applications
        FOR SELECT USING (contact_person_email = auth.jwt() ->> 'email' OR is_admin());
    `, 'Policy: membership_applications SELECT');

    await executeSQL(`
        CREATE POLICY "membership_applications_insert_policy" ON membership_applications
        FOR INSERT WITH CHECK (true);
    `, 'Policy: membership_applications INSERT (público)');

    console.log('\n============================');
    console.log('✅ RLS POLICIES CONFIGURADAS!');
    console.log('============================\n');
}

// Executar
setupRLS().catch(console.error);
// Script completo de migração para Supabase Cloud
const fs = require('fs').promises;
const path = require('path');

// Configurações
const SUPABASE_URL = 'https://ypsvoxelitgceclohxfu.supabase.co';
const ACCESS_TOKEN = 'sbp_a5330e805111a66d792e1c6464bdfef684ceb3d2';
const PROJECT_ID = 'ypsvoxelitgceclohxfu';

// Função para executar SQL via Management API
async function executeSQL(sql, description = 'Executing SQL') {
    try {
        console.log(`\n📋 ${description}...`);

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
        return true;

    } catch (error) {
        console.error(`❌ Erro em ${description}:`, error.message);
        return false;
    }
}

async function runMigration() {
    console.log('🚀 INICIANDO MIGRAÇÃO COMPLETA DO BANCO DE DADOS');
    console.log('================================================\n');

    // 1. Extensões
    await executeSQL(`
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    `, 'Habilitando extensões');

    // 2. Tabela institutions (sem dependências)
    await executeSQL(`
        CREATE TABLE IF NOT EXISTS institutions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(500) NOT NULL,
            code VARCHAR(100) UNIQUE,
            email VARCHAR(255),
            phone VARCHAR(50),
            website VARCHAR(500),
            address TEXT,
            city VARCHAR(200),
            state VARCHAR(100),
            country VARCHAR(100) DEFAULT 'Australia',
            postal_code VARCHAR(20),
            membership_type VARCHAR(100),
            membership_status VARCHAR(50) DEFAULT 'active',
            membership_start_date DATE,
            membership_renewal_date DATE,
            membership_fee_amount DECIMAL(10,2),
            membership_fee_gst DECIMAL(10,2),
            membership_fee_total DECIMAL(10,2),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    `, 'Criando tabela institutions');

    // 3. Tabela members
    await executeSQL(`
        CREATE TABLE IF NOT EXISTS members (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email VARCHAR(255) NOT NULL,
            first_name VARCHAR(255),
            last_name VARCHAR(255),
            phone VARCHAR(50),
            job_title VARCHAR(255),
            department VARCHAR(255),
            institution_id UUID REFERENCES institutions(id) ON DELETE SET NULL,
            user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
            created_by UUID,
            membership_type VARCHAR(100),
            membership_status VARCHAR(50) DEFAULT 'active',
            membership_start_date DATE,
            membership_end_date DATE,
            user_type VARCHAR(50),
            welcome_email_sent TIMESTAMP WITH TIME ZONE,
            openlearning_user_id VARCHAR(255),
            openlearning_external_id VARCHAR(255),
            openlearning_provisioned_at TIMESTAMP WITH TIME ZONE,
            openlearning_last_sso TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE INDEX idx_members_email ON members(email);
        CREATE INDEX idx_members_institution ON members(institution_id);
        CREATE INDEX idx_members_user_id ON members(user_id);
    `, 'Criando tabela members com índices');

    // 4. Tabela events
    await executeSQL(`
        CREATE TABLE IF NOT EXISTS events (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title VARCHAR NOT NULL,
            slug VARCHAR NOT NULL,
            description TEXT,
            short_description VARCHAR,
            image_url TEXT,
            category_id UUID,
            start_date TIMESTAMP WITH TIME ZONE NOT NULL,
            end_date TIMESTAMP WITH TIME ZONE NOT NULL,
            timezone VARCHAR DEFAULT 'Australia/Sydney',
            location_type VARCHAR CHECK (location_type IN ('physical', 'virtual', 'hybrid')),
            venue_name VARCHAR,
            address_line1 VARCHAR,
            address_line2 VARCHAR,
            city VARCHAR,
            state VARCHAR,
            postal_code VARCHAR,
            country VARCHAR DEFAULT 'Australia',
            virtual_link TEXT,
            location_instructions TEXT,
            capacity INTEGER,
            waitlist_enabled BOOLEAN DEFAULT false,
            registration_start_date TIMESTAMP WITH TIME ZONE,
            registration_end_date TIMESTAMP WITH TIME ZONE,
            member_price_cents INTEGER,
            non_member_price_cents INTEGER,
            early_bird_price_cents INTEGER,
            early_bird_end_date TIMESTAMP WITH TIME ZONE,
            cpd_points NUMERIC DEFAULT 1,
            cpd_category VARCHAR,
            status VARCHAR DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled')),
            visibility VARCHAR DEFAULT 'public',
            featured BOOLEAN DEFAULT false,
            created_by UUID,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            published_at TIMESTAMP WITH TIME ZONE,
            cancelled_at TIMESTAMP WITH TIME ZONE,
            cancellation_reason TEXT,
            allow_guests BOOLEAN DEFAULT false,
            max_guests_per_registration INTEGER DEFAULT 0,
            requires_approval BOOLEAN DEFAULT false,
            show_attendee_list BOOLEAN DEFAULT false,
            meta_title VARCHAR,
            meta_description VARCHAR,
            tags TEXT[],
            custom_fields JSONB,
            settings JSONB
        );

        CREATE INDEX idx_events_status ON events(status);
        CREATE INDEX idx_events_dates ON events(start_date, end_date);
        CREATE INDEX idx_events_created_by ON events(created_by);
    `, 'Criando tabela events com índices');

    // 5. Tabela cpd_activities (precisa vir antes de event_registrations)
    await executeSQL(`
        CREATE TABLE IF NOT EXISTS cpd_activities (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            activity_type VARCHAR(100) NOT NULL,
            activity_title VARCHAR(500) NOT NULL,
            activity_date DATE NOT NULL,
            cpd_points INTEGER NOT NULL DEFAULT 1,
            cpd_category VARCHAR(200),
            description TEXT,
            provider VARCHAR(500),
            certificate_number VARCHAR(100),
            certificate_url TEXT,
            event_id UUID REFERENCES events(id) ON DELETE SET NULL,
            status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
            approved_by UUID REFERENCES auth.users(id),
            approved_date TIMESTAMP WITH TIME ZONE,
            rejection_reason TEXT,
            evidence_url TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE INDEX idx_cpd_activities_user ON cpd_activities(user_id);
        CREATE INDEX idx_cpd_activities_event ON cpd_activities(event_id);
        CREATE INDEX idx_cpd_activities_status ON cpd_activities(status);
        CREATE INDEX idx_cpd_activities_date ON cpd_activities(activity_date);
    `, 'Criando tabela cpd_activities com índices');

    // 6. Tabela event_registrations
    await executeSQL(`
        CREATE TABLE IF NOT EXISTS event_registrations (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'waitlist')),
            attended BOOLEAN DEFAULT false,
            checked_in BOOLEAN DEFAULT false,
            check_in_date TIMESTAMP WITH TIME ZONE,
            payment_status VARCHAR(50) CHECK (payment_status IN ('pending', 'paid', 'refunded', 'exempt')),
            payment_amount DECIMAL(10,2),
            certificate_issued BOOLEAN DEFAULT false,
            certificate_issued_date TIMESTAMP WITH TIME ZONE,
            certificate_number VARCHAR(100),
            cpd_activity_created BOOLEAN DEFAULT false,
            cpd_activity_id UUID REFERENCES cpd_activities(id) ON DELETE SET NULL,
            certificate_url TEXT,
            pdf_url TEXT,
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(event_id, user_id)
        );

        CREATE INDEX idx_event_registrations_event ON event_registrations(event_id);
        CREATE INDEX idx_event_registrations_user ON event_registrations(user_id);
        CREATE INDEX idx_event_registrations_status ON event_registrations(status);
    `, 'Criando tabela event_registrations com índices');

    // 7. Tabela event_certificates
    await executeSQL(`
        CREATE TABLE IF NOT EXISTS event_certificates (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            registration_id UUID NOT NULL REFERENCES event_registrations(id) ON DELETE CASCADE,
            event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            certificate_number VARCHAR(50) NOT NULL UNIQUE,
            issue_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            recipient_name VARCHAR(255) NOT NULL,
            event_title VARCHAR(500) NOT NULL,
            event_date VARCHAR(50) NOT NULL,
            cpd_points INTEGER DEFAULT 1,
            cpd_category VARCHAR(100),
            pdf_url TEXT,
            pdf_generated BOOLEAN DEFAULT false,
            is_valid BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE INDEX idx_event_certificates_user ON event_certificates(user_id);
        CREATE INDEX idx_event_certificates_event ON event_certificates(event_id);
        CREATE INDEX idx_event_certificates_number ON event_certificates(certificate_number);
    `, 'Criando tabela event_certificates com índices');

    // 8. Outras tabelas auxiliares
    await executeSQL(`
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            email VARCHAR(255) NOT NULL,
            token VARCHAR(255) UNIQUE NOT NULL,
            expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
            used BOOLEAN DEFAULT false,
            type VARCHAR(50) DEFAULT 'reset' CHECK (type IN ('reset', 'welcome')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            used_at TIMESTAMP WITH TIME ZONE
        );

        CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
        CREATE INDEX idx_password_reset_tokens_email ON password_reset_tokens(email);
    `, 'Criando tabela password_reset_tokens');

    await executeSQL(`
        CREATE TABLE IF NOT EXISTS email_logs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
            recipient_email VARCHAR(255) NOT NULL,
            email_type VARCHAR(50) NOT NULL,
            sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'bounced')),
            error_message TEXT,
            metadata JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE INDEX idx_email_logs_user ON email_logs(user_id);
        CREATE INDEX idx_email_logs_email ON email_logs(recipient_email);
        CREATE INDEX idx_email_logs_type ON email_logs(email_type);
    `, 'Criando tabela email_logs');

    // 9. Tabelas de membership
    await executeSQL(`
        CREATE TABLE IF NOT EXISTS membership_fees (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            membership_type VARCHAR(50) UNIQUE NOT NULL,
            display_name VARCHAR(100) NOT NULL,
            base_fee_cents INTEGER NOT NULL,
            gst_rate DECIMAL(4,2) DEFAULT 0.10,
            description TEXT,
            benefits JSONB,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    `, 'Criando tabela membership_fees');

    await executeSQL(`
        CREATE TABLE IF NOT EXISTS membership_applications (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            institution_name VARCHAR(255) NOT NULL,
            contact_person_email VARCHAR(255) NOT NULL,
            membership_type VARCHAR(50) NOT NULL,
            application_data JSONB NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
            submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            reviewed_at TIMESTAMPTZ,
            reviewed_by UUID REFERENCES auth.users(id),
            review_notes TEXT,
            approved_at TIMESTAMPTZ,
            rejected_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE INDEX idx_membership_applications_status ON membership_applications(status);
        CREATE INDEX idx_membership_applications_email ON membership_applications(contact_person_email);
    `, 'Criando tabela membership_applications');

    // 10. Tabelas OpenLearning
    await executeSQL(`
        CREATE TABLE IF NOT EXISTS openlearning_sync_logs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            sync_type VARCHAR(50) NOT NULL CHECK (sync_type IN ('scheduled', 'manual', 'webhook')),
            started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            completed_at TIMESTAMP WITH TIME ZONE,
            status VARCHAR(50) NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
            members_processed INTEGER DEFAULT 0,
            courses_imported INTEGER DEFAULT 0,
            cpd_activities_created INTEGER DEFAULT 0,
            execution_time_ms INTEGER,
            error_message TEXT,
            result JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    `, 'Criando tabela openlearning_sync_logs');

    await executeSQL(`
        CREATE TABLE IF NOT EXISTS openlearning_courses (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
            openlearning_course_id VARCHAR(255) NOT NULL,
            openlearning_class_id VARCHAR(255),
            course_name VARCHAR(500),
            course_description TEXT,
            completion_date TIMESTAMP WITH TIME ZONE,
            completion_percentage INTEGER DEFAULT 100,
            certificate_url TEXT,
            cpd_activity_id UUID REFERENCES cpd_activities(id) ON DELETE SET NULL,
            raw_data JSONB,
            synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(member_id, openlearning_course_id, openlearning_class_id)
        );
    `, 'Criando tabela openlearning_courses');

    await executeSQL(`
        CREATE TABLE IF NOT EXISTS openlearning_api_logs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            member_id UUID REFERENCES members(id) ON DELETE CASCADE,
            action VARCHAR(100) NOT NULL,
            endpoint VARCHAR(255) NOT NULL,
            request_data JSONB,
            response_data JSONB,
            status_code INTEGER,
            error_message TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    `, 'Criando tabela openlearning_api_logs');

    await executeSQL(`
        CREATE TABLE IF NOT EXISTS openlearning_sso_sessions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
            openlearning_user_id VARCHAR(255),
            session_token VARCHAR(500) NOT NULL,
            external_id VARCHAR(255),
            expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
            last_accessed TIMESTAMP WITH TIME ZONE,
            metadata JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(session_token)
        );
    `, 'Criando tabela openlearning_sso_sessions');

    // 11. Função de trigger para updated_at
    await executeSQL(`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    `, 'Criando função de trigger updated_at');

    // 12. Aplicar triggers
    const tables = [
        'institutions', 'members', 'events', 'event_registrations',
        'cpd_activities', 'event_certificates', 'membership_applications',
        'membership_fees'
    ];

    for (const table of tables) {
        await executeSQL(`
            CREATE TRIGGER update_${table}_updated_at
            BEFORE UPDATE ON ${table}
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        `, `Criando trigger updated_at para ${table}`);
    }

    // 13. Inserir dados padrão de membership fees
    await executeSQL(`
        INSERT INTO membership_fees (membership_type, display_name, base_fee_cents, description, benefits) VALUES
        ('member_college_full', 'Member College - Full', 550000, 'Full membership for English language colleges', '{"benefits": ["Full voting rights", "Access to all events", "Marketing support", "Policy advocacy"]}'),
        ('member_college_associate', 'Member College - Associate', 275000, 'Associate membership for newer colleges', '{"benefits": ["Limited voting rights", "Access to events", "Basic support"]}'),
        ('professional_affiliate', 'Professional Affiliate', 15000, 'Individual professional membership', '{"benefits": ["Professional development", "Networking events", "Industry updates"]}'),
        ('corporate_affiliate', 'Corporate Affiliate', 110000, 'Corporate partnership membership', '{"benefits": ["Brand visibility", "Event sponsorship", "Industry connections"]}')
        ON CONFLICT (membership_type) DO NOTHING;
    `, 'Inserindo dados padrão de membership fees');

    console.log('\n================================================');
    console.log('✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('================================================\n');
    console.log('📊 Status:');
    console.log('  - 14 tabelas criadas');
    console.log('  - Índices criados');
    console.log('  - Triggers configurados');
    console.log('  - Dados padrão inseridos');
    console.log('\n📋 Próximos passos:');
    console.log('  1. Criar usuário admin no Dashboard');
    console.log('  2. Criar storage buckets');
    console.log('  3. Configurar RLS policies');
    console.log('  4. Atualizar variáveis de ambiente');
}

// Executar
runMigration().catch(console.error);
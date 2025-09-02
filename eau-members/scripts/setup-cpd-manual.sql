-- Execute este SQL no Supabase Studio (http://localhost:3000)
-- Copy/paste cada comando individualmente no SQL Editor

-- 1. Criar tabela de configurações globais
CREATE TABLE IF NOT EXISTS cpd_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    auto_approval_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- 2. Criar tabela de configurações por categoria
CREATE TABLE IF NOT EXISTS cpd_category_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id INTEGER NOT NULL UNIQUE,
    category_name TEXT NOT NULL,
    points_per_hour DECIMAL(5,2) NOT NULL DEFAULT 1.0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- 3. Inserir configuração global padrão
INSERT INTO cpd_settings (auto_approval_enabled) VALUES (false)
ON CONFLICT DO NOTHING;

-- 4. Inserir configurações padrão das categorias
INSERT INTO cpd_category_settings (category_id, category_name, points_per_hour) VALUES
    (25, 'Learning Circle Interactive Course', 1.0),
    (24, 'Mentor TESOL teacher', 1.0),
    (23, 'Attend industry webinar', 1.0),
    (15, 'Attend industry PD event', 1.0),
    (14, 'Attend English Australia PD event', 1.0),
    (17, 'Present at industry event (include preparation time)', 2.0),
    (21, 'Attend in-house PD or Training event', 1.0),
    (22, 'Present at in-house PD event (include preparation time)', 2.0),
    (9, 'Attend English Australia webinar', 1.0),
    (12, 'Watch recorded webinar', 1.0),
    (18, 'Peer-observe someone''s lesson', 1.0),
    (19, 'Be observed teaching (including feedback)', 1.0),
    (20, 'Complete professional course', 1.0),
    (10, 'Attend Industry Training', 1.0),
    (13, 'Read journal article', 0.5),
    (11, 'Read professional article', 0.5)
ON CONFLICT (category_id) DO NOTHING;

-- 5. Criar índices
CREATE INDEX IF NOT EXISTS idx_cpd_category_settings_category_id ON cpd_category_settings(category_id);
CREATE INDEX IF NOT EXISTS idx_cpd_category_settings_is_active ON cpd_category_settings(is_active);

-- 6. Habilitar RLS
ALTER TABLE cpd_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cpd_category_settings ENABLE ROW LEVEL SECURITY;

-- 7. Criar políticas RLS para admins
CREATE POLICY "Only admins can access cpd_settings" ON cpd_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role_name IN ('Admin', 'AdminSuper')
        )
    );

CREATE POLICY "Only admins can access cpd_category_settings" ON cpd_category_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role_name IN ('Admin', 'AdminSuper')
        )
    );
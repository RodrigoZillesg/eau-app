-- PASSO 2: Configurar RLS simplificado (EXECUTE DEPOIS do Passo 1)
-- Execute este segundo no Supabase Studio

-- Habilitar RLS nas tabelas
ALTER TABLE cpd_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cpd_category_settings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS simplificadas (permitem acesso a usuários autenticados)
-- Você pode refinar isso depois quando tiver a tabela user_roles

-- Política temporária: permitir acesso a usuários autenticados
CREATE POLICY "Authenticated users can access cpd_settings" ON cpd_settings
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can access cpd_category_settings" ON cpd_category_settings
    FOR ALL USING (auth.uid() IS NOT NULL);
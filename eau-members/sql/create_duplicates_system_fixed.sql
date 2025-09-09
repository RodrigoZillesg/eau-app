-- =====================================================
-- SISTEMA DE GESTÃO DE DUPLICATAS DE MEMBROS
-- Versão Corrigida - Sem dependência de user_roles
-- =====================================================

-- 1. Criar tabela de duplicatas de membros
CREATE TABLE IF NOT EXISTS member_duplicates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member1_id UUID REFERENCES members(id) ON DELETE CASCADE,
    member2_id UUID REFERENCES members(id) ON DELETE CASCADE,
    
    -- Pontuação de similaridade
    similarity_score INTEGER NOT NULL,
    match_details JSONB, -- Detalhes do que combinou
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'merged', 'not_duplicate', 'skipped')),
    
    -- Informações de revisão
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_notes TEXT,
    
    -- Configuração do merge (se foi mesclado)
    merge_config JSONB,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Garantir que não temos pares duplicados
    CONSTRAINT unique_member_pair UNIQUE (member1_id, member2_id),
    CONSTRAINT different_members CHECK (member1_id != member2_id)
);

-- 2. Criar tabela de histórico de merges
CREATE TABLE IF NOT EXISTS member_merge_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Membros envolvidos
    kept_member_id UUID REFERENCES members(id) ON DELETE SET NULL,
    deleted_member_id UUID,
    deleted_member_data JSONB, -- Dados completos do membro deletado
    
    -- Detalhes do merge
    merge_data JSONB,
    relationships_transferred JSONB,
    
    -- Quem executou o merge
    performed_by UUID REFERENCES auth.users(id),
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Capacidade de desfazer
    can_undo BOOLEAN DEFAULT true,
    undo_deadline TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
    undone BOOLEAN DEFAULT false,
    undone_by UUID REFERENCES auth.users(id),
    undone_at TIMESTAMP WITH TIME ZONE
);

-- 3. Criar tabela de sessões de importação
CREATE TABLE IF NOT EXISTS member_import_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Detalhes da importação
    filename TEXT NOT NULL,
    file_size INTEGER,
    total_rows INTEGER,
    
    -- Status
    status VARCHAR(20) DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed', 'cancelled')),
    
    -- Estatísticas
    members_imported INTEGER DEFAULT 0,
    members_updated INTEGER DEFAULT 0,
    members_skipped INTEGER DEFAULT 0,
    duplicates_found INTEGER DEFAULT 0,
    errors JSONB,
    
    -- Configuração
    import_config JSONB,
    
    -- Quem iniciou
    imported_by UUID REFERENCES auth.users(id),
    imported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    processing_notes TEXT
);

-- 4. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_member_duplicates_status ON member_duplicates(status);
CREATE INDEX IF NOT EXISTS idx_member_duplicates_score ON member_duplicates(similarity_score DESC);
CREATE INDEX IF NOT EXISTS idx_member_duplicates_member1 ON member_duplicates(member1_id);
CREATE INDEX IF NOT EXISTS idx_member_duplicates_member2 ON member_duplicates(member2_id);
CREATE INDEX IF NOT EXISTS idx_merge_history_kept_member ON member_merge_history(kept_member_id);
CREATE INDEX IF NOT EXISTS idx_merge_history_performed_at ON member_merge_history(performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_import_sessions_status ON member_import_sessions(status);
CREATE INDEX IF NOT EXISTS idx_import_sessions_imported_at ON member_import_sessions(imported_at DESC);

-- 5. Criar função para atualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Criar trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_member_duplicates_updated_at ON member_duplicates;
CREATE TRIGGER update_member_duplicates_updated_at 
    BEFORE UPDATE ON member_duplicates 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 7. IMPORTANTE: Criar a VIEW para duplicatas pendentes
CREATE OR REPLACE VIEW pending_duplicates_view AS
SELECT 
    md.*,
    m1.first_name AS member1_first_name,
    m1.last_name AS member1_last_name,
    m1.email AS member1_email,
    m1.company_name AS member1_company,
    m2.first_name AS member2_first_name,
    m2.last_name AS member2_last_name,
    m2.email AS member2_email,
    m2.company_name AS member2_company
FROM member_duplicates md
JOIN members m1 ON m1.id = md.member1_id
JOIN members m2 ON m2.id = md.member2_id
WHERE md.status = 'pending'
ORDER BY md.similarity_score DESC;

-- 8. Habilitar RLS (Row Level Security) - Versão Simplificada
ALTER TABLE member_duplicates ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_merge_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_import_sessions ENABLE ROW LEVEL SECURITY;

-- 9. Políticas RLS simplificadas (permite acesso a usuários autenticados)
-- Temporariamente permite acesso total para usuários autenticados
-- Você pode ajustar isso depois conforme sua estrutura de roles

DROP POLICY IF EXISTS allow_all_member_duplicates ON member_duplicates;
CREATE POLICY allow_all_member_duplicates ON member_duplicates
    FOR ALL
    USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS allow_all_merge_history ON member_merge_history;
CREATE POLICY allow_all_merge_history ON member_merge_history
    FOR ALL
    USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS allow_all_import_sessions ON member_import_sessions;
CREATE POLICY allow_all_import_sessions ON member_import_sessions
    FOR ALL
    USING (auth.uid() IS NOT NULL);

-- 10. Verificar se tudo foi criado corretamente
SELECT 'Tabelas criadas:' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('member_duplicates', 'member_merge_history', 'member_import_sessions');

SELECT 'View criada:' as info;
SELECT viewname 
FROM pg_views 
WHERE schemaname = 'public' 
AND viewname = 'pending_duplicates_view';

SELECT 'Sistema de duplicatas configurado com sucesso!' as message;
-- ========================================
-- SCRIPT FINAL CORRIGIDO PARA INTEGRAÇÃO OPENLEARNING
-- Execute este script no Supabase Studio SQL Editor
-- ========================================

-- 1. ADICIONAR COLUNAS NA TABELA MEMBERS (se ainda não existirem)
-- ========================================
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS openlearning_user_id VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS openlearning_external_id VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS openlearning_last_synced TIMESTAMP,
ADD COLUMN IF NOT EXISTS openlearning_provisioned_at TIMESTAMP;

-- Note: openlearning_sync_enabled já existe, não precisa adicionar

-- Criar índices para as novas colunas
CREATE INDEX IF NOT EXISTS idx_members_openlearning_user_id ON members(openlearning_user_id);
CREATE INDEX IF NOT EXISTS idx_members_openlearning_external_id ON members(openlearning_external_id);


-- 2. TABELA PARA ARMAZENAR CURSOS DO OPENLEARNING
-- ========================================
DROP TABLE IF EXISTS openlearning_courses CASCADE;
CREATE TABLE openlearning_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  openlearning_course_id VARCHAR(255) NOT NULL,
  openlearning_class_id VARCHAR(255),
  course_name TEXT NOT NULL,
  course_description TEXT,
  completion_date TIMESTAMP NOT NULL,
  completion_percentage DECIMAL(5,2),
  certificate_url TEXT,
  cpd_activity_id UUID REFERENCES cpd_activities(id) ON DELETE SET NULL,
  raw_data JSONB,
  synced_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(member_id, openlearning_course_id, openlearning_class_id)
);

-- Índices para openlearning_courses
CREATE INDEX idx_openlearning_courses_member_id ON openlearning_courses(member_id);
CREATE INDEX idx_openlearning_courses_cpd_activity_id ON openlearning_courses(cpd_activity_id);
CREATE INDEX idx_openlearning_courses_completion_date ON openlearning_courses(completion_date);


-- 3. TABELA PARA SESSÕES SSO
-- ========================================
DROP TABLE IF EXISTS openlearning_sso_sessions CASCADE;
CREATE TABLE openlearning_sso_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  launch_url TEXT,
  class_id VARCHAR(255),
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para SSO sessions
CREATE INDEX idx_openlearning_sso_sessions_member_id ON openlearning_sso_sessions(member_id);
CREATE INDEX idx_openlearning_sso_sessions_token ON openlearning_sso_sessions(session_token);
CREATE INDEX idx_openlearning_sso_sessions_expires_at ON openlearning_sso_sessions(expires_at);


-- 4. TABELA PARA LOGS DE API
-- ========================================
DROP TABLE IF EXISTS openlearning_api_logs CASCADE;
CREATE TABLE openlearning_api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  endpoint TEXT,
  request_data JSONB,
  response_data JSONB,
  status_code INTEGER,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para API logs
CREATE INDEX idx_openlearning_api_logs_member_id ON openlearning_api_logs(member_id);
CREATE INDEX idx_openlearning_api_logs_action ON openlearning_api_logs(action);
CREATE INDEX idx_openlearning_api_logs_created_at ON openlearning_api_logs(created_at);


-- 5. FUNÇÃO PARA ATUALIZAR TIMESTAMP
-- ========================================
CREATE OR REPLACE FUNCTION update_openlearning_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para openlearning_courses
DROP TRIGGER IF EXISTS openlearning_courses_updated_at ON openlearning_courses;
CREATE TRIGGER openlearning_courses_updated_at
  BEFORE UPDATE ON openlearning_courses
  FOR EACH ROW
  EXECUTE FUNCTION update_openlearning_updated_at();


-- 6. PERMISSÕES (RLS - Row Level Security)
-- ========================================

-- Habilitar RLS nas tabelas
ALTER TABLE openlearning_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE openlearning_sso_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE openlearning_api_logs ENABLE ROW LEVEL SECURITY;

-- ========================================
-- POLÍTICAS PARA openlearning_courses
-- ========================================

-- Membros podem ver seus próprios cursos
DROP POLICY IF EXISTS "Members can view their own OpenLearning courses" ON openlearning_courses;
CREATE POLICY "Members can view their own OpenLearning courses" 
ON openlearning_courses
FOR SELECT 
USING (member_id = auth.uid()::uuid);

-- Admins podem ver todos os cursos (baseado na coluna role em member_roles)
DROP POLICY IF EXISTS "Admins can view all OpenLearning courses" ON openlearning_courses;
CREATE POLICY "Admins can view all OpenLearning courses" 
ON openlearning_courses
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM member_roles mr
    WHERE mr.member_id = auth.uid()::uuid 
    AND mr.role IN ('super_admin', 'admin', 'institution_admin')
  )
);

-- Service role pode fazer tudo
DROP POLICY IF EXISTS "Service role full access courses" ON openlearning_courses;
CREATE POLICY "Service role full access courses" 
ON openlearning_courses
FOR ALL 
USING (auth.role() = 'service_role');

-- ========================================
-- POLÍTICAS PARA openlearning_sso_sessions
-- ========================================

-- Membros podem ver suas próprias sessões
DROP POLICY IF EXISTS "Members can view their own SSO sessions" ON openlearning_sso_sessions;
CREATE POLICY "Members can view their own SSO sessions" 
ON openlearning_sso_sessions
FOR SELECT 
USING (member_id = auth.uid()::uuid);

-- Membros podem criar suas próprias sessões
DROP POLICY IF EXISTS "Members can create their own SSO sessions" ON openlearning_sso_sessions;
CREATE POLICY "Members can create their own SSO sessions" 
ON openlearning_sso_sessions
FOR INSERT 
WITH CHECK (member_id = auth.uid()::uuid);

-- Service role pode fazer tudo
DROP POLICY IF EXISTS "Service role full access sso" ON openlearning_sso_sessions;
CREATE POLICY "Service role full access sso" 
ON openlearning_sso_sessions
FOR ALL 
USING (auth.role() = 'service_role');

-- ========================================
-- POLÍTICAS PARA openlearning_api_logs
-- ========================================

-- Apenas admins podem ver logs
DROP POLICY IF EXISTS "Admins can view all API logs" ON openlearning_api_logs;
CREATE POLICY "Admins can view all API logs" 
ON openlearning_api_logs
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM member_roles mr
    WHERE mr.member_id = auth.uid()::uuid 
    AND mr.role IN ('super_admin', 'admin', 'institution_admin')
  )
);

-- Service role pode fazer tudo
DROP POLICY IF EXISTS "Service role full access logs" ON openlearning_api_logs;
CREATE POLICY "Service role full access logs" 
ON openlearning_api_logs
FOR ALL 
USING (auth.role() = 'service_role');


-- 7. GRANTS DE PERMISSÃO
-- ========================================
GRANT ALL ON openlearning_courses TO authenticated;
GRANT ALL ON openlearning_sso_sessions TO authenticated;
GRANT ALL ON openlearning_api_logs TO authenticated;
GRANT ALL ON openlearning_courses TO service_role;
GRANT ALL ON openlearning_sso_sessions TO service_role;
GRANT ALL ON openlearning_api_logs TO service_role;


-- ========================================
-- VERIFICAÇÃO DAS TABELAS CRIADAS
-- ========================================

-- 1. Verificar colunas adicionadas na tabela members
DO $$
BEGIN
  RAISE NOTICE '=== Colunas OpenLearning na tabela members ===';
END $$;

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'members' 
AND column_name LIKE 'openlearning%'
ORDER BY column_name;

-- 2. Verificar tabelas criadas
DO $$
BEGIN
  RAISE NOTICE '=== Tabelas OpenLearning criadas ===';
END $$;

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'openlearning%'
ORDER BY table_name;

-- 3. Verificar políticas RLS
DO $$
BEGIN
  RAISE NOTICE '=== Políticas RLS criadas ===';
END $$;

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename LIKE 'openlearning%'
ORDER BY tablename, policyname;

-- 4. Contar registros (deve ser 0 para tabelas novas)
DO $$
BEGIN
  RAISE NOTICE '=== Contagem de registros ===';
END $$;

SELECT 
  'openlearning_courses' as table_name, 
  COUNT(*) as record_count 
FROM openlearning_courses
UNION ALL
SELECT 
  'openlearning_sso_sessions', 
  COUNT(*) 
FROM openlearning_sso_sessions
UNION ALL
SELECT 
  'openlearning_api_logs', 
  COUNT(*) 
FROM openlearning_api_logs
ORDER BY table_name;

-- ========================================
-- MENSAGEM FINAL
-- ========================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Script executado com sucesso!';
  RAISE NOTICE '✅ Integração OpenLearning está pronta para uso.';
  RAISE NOTICE '';
END $$;

-- ========================================
-- FIM DO SCRIPT
-- ========================================
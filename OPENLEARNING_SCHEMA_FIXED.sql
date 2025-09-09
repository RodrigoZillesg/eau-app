-- ========================================
-- SCRIPT CORRIGIDO PARA INTEGRAÇÃO OPENLEARNING
-- Execute este script no Supabase Studio SQL Editor
-- ========================================

-- 1. ADICIONAR COLUNAS NA TABELA MEMBERS
-- ========================================
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS openlearning_user_id VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS openlearning_external_id VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS openlearning_sync_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS openlearning_last_synced TIMESTAMP,
ADD COLUMN IF NOT EXISTS openlearning_provisioned_at TIMESTAMP;

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

-- Políticas para openlearning_courses
-- Membros podem ver seus próprios cursos
CREATE POLICY "Members can view their own OpenLearning courses" 
ON openlearning_courses
FOR SELECT 
USING (member_id = auth.uid()::uuid);

-- Admins podem ver todos os cursos (baseado em member_roles)
CREATE POLICY "Admins can view all OpenLearning courses" 
ON openlearning_courses
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM member_roles mr
    WHERE mr.member_id = auth.uid()::uuid 
    AND mr.role_name IN ('super_admin', 'admin', 'institution_admin')
  )
);

-- Service role pode fazer tudo
CREATE POLICY "Service role full access courses" 
ON openlearning_courses
FOR ALL 
USING (auth.role() = 'service_role');

-- Políticas para openlearning_sso_sessions
-- Membros podem ver suas próprias sessões
CREATE POLICY "Members can view their own SSO sessions" 
ON openlearning_sso_sessions
FOR SELECT 
USING (member_id = auth.uid()::uuid);

-- Membros podem criar suas próprias sessões
CREATE POLICY "Members can create their own SSO sessions" 
ON openlearning_sso_sessions
FOR INSERT 
WITH CHECK (member_id = auth.uid()::uuid);

-- Service role pode fazer tudo
CREATE POLICY "Service role full access sso" 
ON openlearning_sso_sessions
FOR ALL 
USING (auth.role() = 'service_role');

-- Políticas para openlearning_api_logs
-- Apenas admins podem ver logs
CREATE POLICY "Admins can view all API logs" 
ON openlearning_api_logs
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM member_roles mr
    WHERE mr.member_id = auth.uid()::uuid 
    AND mr.role_name IN ('super_admin', 'admin', 'institution_admin')
  )
);

-- Service role pode fazer tudo
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
-- Verificar colunas na tabela members
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'members' 
AND column_name LIKE 'openlearning%'
ORDER BY column_name;

-- Verificar se as tabelas foram criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'openlearning%'
ORDER BY table_name;

-- Contar registros em cada tabela (deve retornar 0 para tabelas novas)
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
-- FIM DO SCRIPT
-- ========================================
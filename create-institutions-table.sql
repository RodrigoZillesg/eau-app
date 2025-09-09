-- ========================================
-- SCRIPT PARA CRIAR TABELA DE INSTITUIÇÕES/COMPANIES
-- Execute este script no Supabase Studio SQL Editor
-- ========================================

-- 1. CRIAR TABELA INSTITUTIONS
-- ========================================
CREATE TABLE IF NOT EXISTS institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Informações básicas
  name VARCHAR(255) NOT NULL,
  parent_company VARCHAR(255),
  abn VARCHAR(20),
  company_email VARCHAR(255),
  company_type VARCHAR(100),
  cricos_code VARCHAR(50),
  
  -- Endereço
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  address_line3 VARCHAR(255),
  suburb VARCHAR(100),
  postcode VARCHAR(20),
  state VARCHAR(50),
  country VARCHAR(100),
  
  -- Contato
  phone VARCHAR(50),
  website VARCHAR(255),
  
  -- Informações adicionais
  primary_contact_id UUID REFERENCES members(id) ON DELETE SET NULL,
  courses_offered TEXT,
  logo_url TEXT,
  member_since DATE,
  cancellation_details TEXT,
  
  -- Status
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  
  -- Índices úteis
  UNIQUE(abn),
  UNIQUE(company_email)
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_institutions_name ON institutions(name);
CREATE INDEX IF NOT EXISTS idx_institutions_status ON institutions(status);
CREATE INDEX IF NOT EXISTS idx_institutions_state ON institutions(state);
CREATE INDEX IF NOT EXISTS idx_institutions_created_at ON institutions(created_at);

-- 2. CRIAR TABELA DE RELACIONAMENTO MEMBER-INSTITUTION
-- ========================================
CREATE TABLE IF NOT EXISTS member_institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  role VARCHAR(100) DEFAULT 'member',
  position VARCHAR(255),
  department VARCHAR(255),
  start_date DATE,
  end_date DATE,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Garantir que cada membro tem apenas uma instituição primária
  UNIQUE(member_id, institution_id)
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_member_institutions_member_id ON member_institutions(member_id);
CREATE INDEX IF NOT EXISTS idx_member_institutions_institution_id ON member_institutions(institution_id);
CREATE INDEX IF NOT EXISTS idx_member_institutions_is_primary ON member_institutions(is_primary);

-- 3. CRIAR TABELA DE MEMBERSHIPS (ASSINATURAS)
-- ========================================
CREATE TABLE IF NOT EXISTS memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- ID externo (para importação)
  external_id VARCHAR(100) UNIQUE,
  
  -- Relacionamentos
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  primary_contact_id UUID REFERENCES members(id) ON DELETE SET NULL,
  
  -- Datas
  start_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  last_renewed_date DATE,
  previous_expiry_date DATE,
  
  -- Status
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired', 'pending', 'cancelled')),
  pending_status VARCHAR(50),
  
  -- Detalhes da assinatura
  category VARCHAR(100),
  type VARCHAR(100),
  pricing_option VARCHAR(100),
  pricing_option_cost DECIMAL(10, 2),
  target_type VARCHAR(100),
  total_members INTEGER DEFAULT 0,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_memberships_institution_id ON memberships(institution_id);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON memberships(status);
CREATE INDEX IF NOT EXISTS idx_memberships_expiry_date ON memberships(expiry_date);
CREATE INDEX IF NOT EXISTS idx_memberships_external_id ON memberships(external_id);

-- 4. ADICIONAR COLUNA institution_id NA TABELA MEMBERS (se não existir)
-- ========================================
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES institutions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_members_institution_id ON members(institution_id);

-- 5. CRIAR VIEWS ÚTEIS
-- ========================================

-- View para ver instituições com contagem de membros
CREATE OR REPLACE VIEW institutions_with_stats AS
SELECT 
  i.*,
  COUNT(DISTINCT mi.member_id) as member_count,
  COUNT(DISTINCT m.id) as active_memberships,
  pc.first_name || ' ' || pc.last_name as primary_contact_name,
  pc.email as primary_contact_email
FROM institutions i
LEFT JOIN member_institutions mi ON i.id = mi.institution_id
LEFT JOIN memberships m ON i.id = m.institution_id AND m.status = 'active'
LEFT JOIN members pc ON i.primary_contact_id = pc.id
GROUP BY i.id, pc.first_name, pc.last_name, pc.email;

-- View para ver memberships com detalhes
CREATE OR REPLACE VIEW memberships_detailed AS
SELECT 
  m.*,
  i.name as institution_name,
  i.company_email as institution_email,
  pc.first_name || ' ' || pc.last_name as primary_contact_name,
  pc.email as primary_contact_email
FROM memberships m
LEFT JOIN institutions i ON m.institution_id = i.id
LEFT JOIN members pc ON m.primary_contact_id = pc.id;

-- 6. HABILITAR RLS (Row Level Security)
-- ========================================
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

-- Políticas para super_admin e admin (podem ver e editar tudo)
CREATE POLICY "Admins can manage institutions" ON institutions
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM members WHERE role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage member_institutions" ON member_institutions
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM members WHERE role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage memberships" ON memberships
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM members WHERE role IN ('admin', 'super_admin')
    )
  );

-- Políticas para membros (podem ver sua própria instituição)
CREATE POLICY "Members can view their institution" ON institutions
  FOR SELECT USING (
    id IN (
      SELECT institution_id FROM members WHERE id = auth.uid()
      UNION
      SELECT institution_id FROM member_institutions WHERE member_id = auth.uid()
    )
  );

CREATE POLICY "Members can view their member_institutions" ON member_institutions
  FOR SELECT USING (member_id = auth.uid());

-- 7. CRIAR TRIGGERS PARA ATUALIZAR updated_at
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_institutions_updated_at
  BEFORE UPDATE ON institutions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_member_institutions_updated_at
  BEFORE UPDATE ON member_institutions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_memberships_updated_at
  BEFORE UPDATE ON memberships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 8. INSERIR DADOS DE EXEMPLO (OPCIONAL)
-- ========================================
-- Descomente as linhas abaixo se quiser inserir dados de exemplo

/*
INSERT INTO institutions (name, company_email, company_type, state, country, status) VALUES
  ('English Australia University', 'contact@eau.edu.au', 'University', 'NSW', 'Australia', 'active'),
  ('Sydney Language School', 'info@sls.edu.au', 'Language School', 'NSW', 'Australia', 'active'),
  ('Melbourne Institute', 'admin@mi.edu.au', 'Institute', 'VIC', 'Australia', 'active');
*/

-- ========================================
-- FIM DO SCRIPT
-- ========================================
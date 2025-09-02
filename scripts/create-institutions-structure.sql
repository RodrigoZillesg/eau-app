-- =====================================================
-- SCRIPT DE CRIAÇÃO DA ESTRUTURA INSTITUCIONAL
-- English Australia Membership System
-- =====================================================

-- 1. Criar tabela de instituições
CREATE TABLE IF NOT EXISTS institutions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  trading_name VARCHAR(255),
  abn VARCHAR(20),
  cricos_code VARCHAR(50),
  membership_type VARCHAR(50) NOT NULL CHECK (membership_type IN ('full_provider', 'associate', 'corporate', 'professional')),
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'expired', 'cancelled')),
  payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('paid', 'pending', 'overdue', 'grace_period')),
  
  -- Informações de contato
  primary_contact_name VARCHAR(255),
  primary_contact_email VARCHAR(255),
  primary_contact_phone VARCHAR(50),
  billing_email VARCHAR(255),
  
  -- Endereço
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(50),
  postal_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'Australia',
  
  -- Informações financeiras
  annual_fee DECIMAL(10,2),
  payment_due_date DATE,
  last_payment_date DATE,
  
  -- Sites adicionais (para Full Providers)
  additional_sites INTEGER DEFAULT 0,
  student_weeks INTEGER DEFAULT 0,
  
  -- Datas importantes
  application_date DATE,
  approval_date DATE,
  membership_start_date DATE,
  membership_end_date DATE,
  
  -- Metadados
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- 2. Criar índices para performance
CREATE INDEX idx_institutions_status ON institutions(status);
CREATE INDEX idx_institutions_membership_type ON institutions(membership_type);
CREATE INDEX idx_institutions_payment_status ON institutions(payment_status);

-- 3. Adicionar campo institution_id na tabela members
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES institutions(id),
ADD COLUMN IF NOT EXISTS user_type VARCHAR(50) DEFAULT 'staff' 
  CHECK (user_type IN ('super_admin', 'institution_admin', 'staff', 'teacher', 'limited'));

-- Criar índice para institution_id
CREATE INDEX IF NOT EXISTS idx_members_institution ON members(institution_id);

-- 4. Criar tabela de pagamentos institucionais
CREATE TABLE IF NOT EXISTS institution_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  
  -- Informações do pagamento
  invoice_number VARCHAR(50) UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  gst_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  
  -- Período de cobertura
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Status e datas
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'partial', 'cancelled', 'refunded')),
  payment_date DATE,
  payment_method VARCHAR(50),
  transaction_reference VARCHAR(255),
  
  -- Detalhamento (para Full Providers)
  base_fee DECIMAL(10,2),
  site_fees DECIMAL(10,2),
  student_week_fees DECIMAL(10,2),
  
  -- Metadados
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Criar índices
CREATE INDEX idx_payments_institution ON institution_payments(institution_id);
CREATE INDEX idx_payments_status ON institution_payments(status);
CREATE INDEX idx_payments_date ON institution_payments(payment_date);

-- 5. Criar tabela de convites para staff
CREATE TABLE IF NOT EXISTS staff_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  
  -- Informações do convite
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  user_type VARCHAR(50) DEFAULT 'staff',
  
  -- Status e validade
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  token VARCHAR(255) UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Criar índices
CREATE INDEX idx_invitations_institution ON staff_invitations(institution_id);
CREATE INDEX idx_invitations_email ON staff_invitations(email);
CREATE INDEX idx_invitations_token ON staff_invitations(token);

-- 6. Criar view para facilitar consultas
CREATE OR REPLACE VIEW institution_summary AS
SELECT 
  i.*,
  COUNT(DISTINCT m.id) as total_members,
  COUNT(DISTINCT CASE WHEN m.membership_status = 'active' THEN m.id END) as active_members,
  COUNT(DISTINCT si.id) as pending_invitations
FROM institutions i
LEFT JOIN members m ON m.institution_id = i.id
LEFT JOIN staff_invitations si ON si.institution_id = i.id AND si.status = 'pending'
GROUP BY i.id;

-- 7. Adicionar RLS (Row Level Security)
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE institution_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_invitations ENABLE ROW LEVEL SECURITY;

-- Políticas para institutions
CREATE POLICY "Super admins can do everything with institutions" ON institutions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.id = auth.uid()::text
      AND members.user_type = 'super_admin'
    )
  );

CREATE POLICY "Institution admins can view their own institution" ON institutions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.id = auth.uid()::text
      AND members.institution_id = institutions.id
      AND members.user_type = 'institution_admin'
    )
  );

CREATE POLICY "Staff can view their own institution basic info" ON institutions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.id = auth.uid()::text
      AND members.institution_id = institutions.id
    )
  );

-- Políticas para institution_payments
CREATE POLICY "Super admins can manage all payments" ON institution_payments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.id = auth.uid()::text
      AND members.user_type = 'super_admin'
    )
  );

CREATE POLICY "Institution admins can view their payments" ON institution_payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM members m
      JOIN institutions i ON i.id = institution_payments.institution_id
      WHERE m.id = auth.uid()::text
      AND m.institution_id = i.id
      AND m.user_type = 'institution_admin'
    )
  );

-- Políticas para staff_invitations
CREATE POLICY "Institution admins can manage their invitations" ON staff_invitations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.id = auth.uid()::text
      AND members.institution_id = staff_invitations.institution_id
      AND members.user_type IN ('super_admin', 'institution_admin')
    )
  );

-- 8. Inserir algumas instituições de exemplo
INSERT INTO institutions (
  name, trading_name, membership_type, status, payment_status,
  primary_contact_name, primary_contact_email, 
  city, state, annual_fee
) VALUES
  ('Sydney English College', 'SEC', 'full_provider', 'active', 'paid',
   'John Smith', 'admin@sec.edu.au', 'Sydney', 'NSW', 12000.00),
  
  ('Melbourne Language Institute', 'MLI', 'full_provider', 'active', 'paid',
   'Sarah Johnson', 'contact@mli.edu.au', 'Melbourne', 'VIC', 15000.00),
  
  ('Brisbane Academy', 'BA', 'associate', 'active', 'paid',
   'Michael Brown', 'info@ba.edu.au', 'Brisbane', 'QLD', 2500.00),
  
  ('EduTech Solutions', 'EduTech', 'corporate', 'active', 'paid',
   'Lisa White', 'sales@edutech.com.au', 'Sydney', 'NSW', 2500.00)
ON CONFLICT DO NOTHING;

-- 9. Atualizar membros existentes para vincular a instituições
-- (Associar membros existentes à primeira instituição como exemplo)
UPDATE members 
SET institution_id = (SELECT id FROM institutions LIMIT 1)
WHERE institution_id IS NULL;

-- 10. Função para convidar staff
CREATE OR REPLACE FUNCTION invite_staff_member(
  p_institution_id UUID,
  p_email VARCHAR,
  p_first_name VARCHAR,
  p_last_name VARCHAR,
  p_user_type VARCHAR,
  p_invited_by UUID
) RETURNS UUID AS $$
DECLARE
  v_invitation_id UUID;
  v_token VARCHAR;
BEGIN
  -- Gerar token único
  v_token := encode(gen_random_bytes(32), 'hex');
  
  -- Criar convite
  INSERT INTO staff_invitations (
    institution_id, email, first_name, last_name,
    user_type, token, expires_at, created_by
  ) VALUES (
    p_institution_id, p_email, p_first_name, p_last_name,
    p_user_type, v_token, NOW() + INTERVAL '7 days', p_invited_by
  ) RETURNING id INTO v_invitation_id;
  
  -- Aqui seria enviado o email com o link de convite
  -- Link format: https://domain.com/accept-invite?token=v_token
  
  RETURN v_invitation_id;
END;
$$ LANGUAGE plpgsql;

-- 11. Função para aceitar convite
CREATE OR REPLACE FUNCTION accept_staff_invitation(
  p_token VARCHAR,
  p_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_invitation RECORD;
BEGIN
  -- Buscar convite válido
  SELECT * INTO v_invitation
  FROM staff_invitations
  WHERE token = p_token
    AND status = 'pending'
    AND expires_at > NOW();
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Atualizar status do convite
  UPDATE staff_invitations
  SET status = 'accepted',
      accepted_at = NOW()
  WHERE id = v_invitation.id;
  
  -- Vincular usuário à instituição
  UPDATE members
  SET institution_id = v_invitation.institution_id,
      user_type = v_invitation.user_type
  WHERE id = p_user_id::text;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 12. Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_institutions_updated_at BEFORE UPDATE ON institutions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_institution_payments_updated_at BEFORE UPDATE ON institution_payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 13. Comentários nas tabelas
COMMENT ON TABLE institutions IS 'Instituições membros do English Australia';
COMMENT ON TABLE institution_payments IS 'Histórico de pagamentos das instituições';
COMMENT ON TABLE staff_invitations IS 'Convites enviados para staff das instituições';

COMMENT ON COLUMN members.institution_id IS 'Instituição à qual o membro está vinculado';
COMMENT ON COLUMN members.user_type IS 'Tipo de usuário: super_admin, institution_admin, staff, teacher, limited';

-- =====================================================
-- FIM DO SCRIPT
-- Execute este script no Supabase SQL Editor
-- =====================================================
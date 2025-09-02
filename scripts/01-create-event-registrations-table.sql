-- ================================================
-- CRIAR TABELA EVENT_REGISTRATIONS - EXECUTE PRIMEIRO!
-- ================================================

-- 1. Deletar tabela se existir (para garantir estrutura correta)
DROP TABLE IF EXISTS public.event_registrations CASCADE;

-- 2. Criar tabela com estrutura completa
CREATE TABLE public.event_registrations (
  -- IDs principais
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Status e tipo
  status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'cancelled', 'attended', 'no_show')),
  registration_type TEXT DEFAULT 'participant',
  
  -- Informações de pagamento (preparado para SecurePay)
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'waived')),
  payment_amount INTEGER DEFAULT 0, -- Em centavos
  payment_date TIMESTAMP WITH TIME ZONE,
  payment_method TEXT, -- 'card', 'bank_transfer', 'free'
  
  -- SecurePay fields
  securepay_transaction_id TEXT,
  securepay_payment_reference TEXT,
  securepay_receipt_number TEXT,
  securepay_card_type TEXT,
  securepay_card_last4 TEXT,
  invoice_number TEXT,
  
  -- Informações de convidado
  is_guest BOOLEAN DEFAULT false,
  guest_of UUID REFERENCES auth.users(id),
  guest_name TEXT,
  guest_email TEXT,
  
  -- Controle de presença
  attended BOOLEAN DEFAULT false,
  attendance_date TIMESTAMP WITH TIME ZONE,
  checked_in BOOLEAN DEFAULT false,
  check_in_date TIMESTAMP WITH TIME ZONE,
  check_in_method TEXT, -- 'manual', 'qr_code', 'auto'
  
  -- Certificado
  certificate_issued BOOLEAN DEFAULT false,
  certificate_issued_date TIMESTAMP WITH TIME ZONE,
  certificate_number TEXT,
  certificate_url TEXT,
  
  -- CPD
  cpd_activity_created BOOLEAN DEFAULT false,
  cpd_activity_id UUID,
  
  -- Lembretes
  reminder_email_sent BOOLEAN DEFAULT false,
  reminder_email_date TIMESTAMP WITH TIME ZONE,
  
  -- Informações adicionais
  dietary_requirements TEXT,
  accessibility_requirements TEXT,
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Constraints
  UNIQUE(event_id, user_id)
);

-- 3. Criar índices para performance
CREATE INDEX idx_event_registrations_event_id ON public.event_registrations(event_id);
CREATE INDEX idx_event_registrations_user_id ON public.event_registrations(user_id);
CREATE INDEX idx_event_registrations_status ON public.event_registrations(status);
CREATE INDEX idx_event_registrations_payment_status ON public.event_registrations(payment_status);
CREATE INDEX idx_event_registrations_checked_in ON public.event_registrations(checked_in);
CREATE INDEX idx_event_registrations_securepay_transaction ON public.event_registrations(securepay_transaction_id);

-- 4. Habilitar RLS
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- 5. Criar políticas de segurança
CREATE POLICY "Users can view own registrations" 
  ON public.event_registrations
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can register for events" 
  ON public.event_registrations
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own registrations" 
  ON public.event_registrations
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can cancel own registrations" 
  ON public.event_registrations
  FOR DELETE 
  USING (auth.uid() = user_id);

-- 6. Conceder permissões
GRANT ALL ON public.event_registrations TO authenticated;
GRANT ALL ON public.event_registrations TO service_role;

-- 7. Função para atualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Criar trigger para updated_at
DROP TRIGGER IF EXISTS update_event_registrations_updated_at ON public.event_registrations;
CREATE TRIGGER update_event_registrations_updated_at 
  BEFORE UPDATE ON public.event_registrations 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 9. IMPORTANTE: Recarregar cache do Supabase
NOTIFY pgrst, 'reload schema';

-- 10. Verificar se tabela foi criada corretamente
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'event_registrations'
ORDER BY ordinal_position;

-- Mensagem de sucesso
DO $$ 
BEGIN
  RAISE NOTICE '✅ Tabela event_registrations criada com sucesso!';
  RAISE NOTICE '💳 Campos para SecurePay incluídos';
  RAISE NOTICE '🔄 Cache do Supabase recarregado';
END $$;
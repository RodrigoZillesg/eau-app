-- ================================================
-- SCRIPT SEGURO PARA SISTEMA DE INSCRIÇÃO EM EVENTOS
-- Execute este script no Supabase SQL Editor
-- Versão que verifica se objetos já existem
-- ================================================

-- 1. CRIAR TABELA DE INSCRIÇÕES (SE NÃO EXISTIR)
-- ================================================
CREATE TABLE IF NOT EXISTS public.event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Campos básicos
  status TEXT DEFAULT 'registered',
  registration_type TEXT DEFAULT 'participant',
  
  -- Informações de pagamento
  payment_status TEXT DEFAULT 'pending',
  payment_amount INTEGER DEFAULT 0,
  payment_date TIMESTAMP WITH TIME ZONE,
  payment_method TEXT,
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
  check_in_method TEXT,
  
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
  
  -- Garantir inscrição única por evento
  UNIQUE(event_id, user_id)
);

-- Adicionar colunas que podem estar faltando
ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS checked_in BOOLEAN DEFAULT false;
ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS check_in_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS check_in_method TEXT;
ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS certificate_issued BOOLEAN DEFAULT false;
ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS certificate_issued_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS certificate_number TEXT;
ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS certificate_url TEXT;
ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS cpd_activity_created BOOLEAN DEFAULT false;
ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS cpd_activity_id UUID;
ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS dietary_requirements TEXT;
ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS accessibility_requirements TEXT;
ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. CRIAR ÍNDICES
-- ================================================
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON public.event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user_id ON public.event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_status ON public.event_registrations(status);
CREATE INDEX IF NOT EXISTS idx_event_registrations_checked_in ON public.event_registrations(checked_in);

-- 3. HABILITAR RLS (ROW LEVEL SECURITY)
-- ================================================
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- 4. CRIAR POLÍTICAS DE SEGURANÇA (com DROP IF EXISTS)
-- ================================================
DROP POLICY IF EXISTS "Users can view own registrations" ON public.event_registrations;
CREATE POLICY "Users can view own registrations" ON public.event_registrations
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can register for events" ON public.event_registrations;
CREATE POLICY "Users can register for events" ON public.event_registrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own registrations" ON public.event_registrations;
CREATE POLICY "Users can update own registrations" ON public.event_registrations
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own registrations" ON public.event_registrations;
CREATE POLICY "Users can delete own registrations" ON public.event_registrations
  FOR DELETE USING (auth.uid() = user_id);

-- 5. TABELA DE CERTIFICADOS (OPCIONAL - para futuro)
-- ================================================
CREATE TABLE IF NOT EXISTS public.event_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID REFERENCES public.event_registrations(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  certificate_number TEXT UNIQUE NOT NULL,
  issue_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  recipient_name TEXT NOT NULL,
  event_title TEXT NOT NULL,
  event_date TEXT NOT NULL,
  
  cpd_points INTEGER DEFAULT 0,
  cpd_category TEXT,
  
  pdf_url TEXT,
  pdf_generated BOOLEAN DEFAULT false,
  pdf_generation_date TIMESTAMP WITH TIME ZONE,
  
  verification_code TEXT,
  is_valid BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para certificados
CREATE INDEX IF NOT EXISTS idx_certificates_registration ON public.event_certificates(registration_id);
CREATE INDEX IF NOT EXISTS idx_certificates_user ON public.event_certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_number ON public.event_certificates(certificate_number);

-- RLS para certificados
ALTER TABLE public.event_certificates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own certificates" ON public.event_certificates;
CREATE POLICY "Users can view own certificates" ON public.event_certificates
  FOR SELECT USING (auth.uid() = user_id);

-- 6. TABELA DE LOG DE PRESENÇA (OPCIONAL - para futuro)
-- ================================================
CREATE TABLE IF NOT EXISTS public.event_attendance_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID REFERENCES public.event_registrations(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  access_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  access_type TEXT CHECK (access_type IN ('check_in', 'page_view', 'video_start', 'video_complete', 'download')),
  
  ip_address TEXT,
  user_agent TEXT,
  session_duration INTEGER,
  video_progress INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para log
CREATE INDEX IF NOT EXISTS idx_attendance_log_registration ON public.event_attendance_log(registration_id);
CREATE INDEX IF NOT EXISTS idx_attendance_log_event ON public.event_attendance_log(event_id);
CREATE INDEX IF NOT EXISTS idx_attendance_log_user ON public.event_attendance_log(user_id);

-- RLS para log
ALTER TABLE public.event_attendance_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own attendance" ON public.event_attendance_log;
CREATE POLICY "Users can view own attendance" ON public.event_attendance_log
  FOR SELECT USING (auth.uid() = user_id);

-- 7. TABELA DE LEMBRETES (OPCIONAL - para futuro)
-- ================================================
CREATE TABLE IF NOT EXISTS public.event_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  registration_id UUID REFERENCES public.event_registrations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  reminder_type TEXT,
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_date TIMESTAMP WITH TIME ZONE,
  is_sent BOOLEAN DEFAULT false,
  
  email_to TEXT,
  email_subject TEXT,
  email_body TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para lembretes
CREATE INDEX IF NOT EXISTS idx_reminders_event ON public.event_reminders(event_id);
CREATE INDEX IF NOT EXISTS idx_reminders_registration ON public.event_reminders(registration_id);
CREATE INDEX IF NOT EXISTS idx_reminders_scheduled ON public.event_reminders(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_reminders_sent ON public.event_reminders(is_sent);

-- RLS para lembretes
ALTER TABLE public.event_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own reminders" ON public.event_reminders;
CREATE POLICY "Users can view own reminders" ON public.event_reminders
  FOR SELECT USING (auth.uid() = user_id);

-- 8. CONCEDER PERMISSÕES
-- ================================================
GRANT ALL ON public.event_registrations TO authenticated;
GRANT ALL ON public.event_certificates TO authenticated;
GRANT ALL ON public.event_attendance_log TO authenticated;
GRANT ALL ON public.event_reminders TO authenticated;

-- 9. FUNÇÃO PARA ATUALIZAR TIMESTAMP DE ATUALIZAÇÃO
-- ================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 10. CRIAR TRIGGERS APENAS SE NÃO EXISTIREM
-- ================================================
DO $$ 
BEGIN
  -- Trigger para event_registrations
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_event_registrations_updated_at'
  ) THEN
    CREATE TRIGGER update_event_registrations_updated_at 
      BEFORE UPDATE ON public.event_registrations 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- Trigger para event_certificates
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_event_certificates_updated_at'
  ) THEN
    CREATE TRIGGER update_event_certificates_updated_at 
      BEFORE UPDATE ON public.event_certificates 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- 11. VERIFICAR ESTRUTURA CRIADA
-- ================================================
-- Mostra as tabelas criadas e suas colunas
SELECT 
  table_name,
  COUNT(*) as total_columns
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('event_registrations', 'event_certificates', 'event_attendance_log', 'event_reminders')
GROUP BY table_name
ORDER BY table_name;

-- Mostra mensagem de sucesso
DO $$ 
BEGIN
  RAISE NOTICE '✅ Setup concluído com sucesso!';
  RAISE NOTICE '📋 Tabelas criadas/atualizadas: event_registrations, event_certificates, event_attendance_log, event_reminders';
  RAISE NOTICE '🔒 Políticas RLS configuradas';
  RAISE NOTICE '⚡ Índices e triggers criados';
END $$;
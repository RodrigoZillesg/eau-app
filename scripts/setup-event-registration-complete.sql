-- ================================================
-- SCRIPT COMPLETO PARA SISTEMA DE INSCRIÇÃO EM EVENTOS
-- Execute este script no Supabase SQL Editor
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

-- 2. CRIAR ÍNDICES
-- ================================================
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON public.event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user_id ON public.event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_status ON public.event_registrations(status);
CREATE INDEX IF NOT EXISTS idx_event_registrations_checked_in ON public.event_registrations(checked_in);

-- 3. HABILITAR RLS (ROW LEVEL SECURITY)
-- ================================================
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- 4. CRIAR POLÍTICAS DE SEGURANÇA
-- ================================================

-- Usuários podem ver suas próprias inscrições
CREATE POLICY "Users can view own registrations" ON public.event_registrations
  FOR SELECT USING (auth.uid() = user_id);

-- Usuários podem se inscrever em eventos
CREATE POLICY "Users can register for events" ON public.event_registrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar suas próprias inscrições
CREATE POLICY "Users can update own registrations" ON public.event_registrations
  FOR UPDATE USING (auth.uid() = user_id);

-- Usuários podem cancelar suas próprias inscrições
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

-- Criar triggers para atualizar updated_at
CREATE TRIGGER update_event_registrations_updated_at 
  BEFORE UPDATE ON public.event_registrations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_certificates_updated_at 
  BEFORE UPDATE ON public.event_certificates 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. VERIFICAR ESTRUTURA CRIADA
-- ================================================
-- Após executar, você pode verificar as tabelas criadas com:
SELECT table_name, column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('event_registrations', 'event_certificates', 'event_attendance_log', 'event_reminders')
ORDER BY table_name, ordinal_position;
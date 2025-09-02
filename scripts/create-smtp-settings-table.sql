-- ================================================
-- CRIAR TABELA DE CONFIGURAÇÕES SMTP
-- ================================================

CREATE TABLE IF NOT EXISTS public.smtp_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- SMTP Server Settings
  smtp_host TEXT NOT NULL,
  smtp_port INTEGER NOT NULL DEFAULT 587,
  smtp_secure BOOLEAN DEFAULT true, -- true = TLS, false = plain
  smtp_auth_type TEXT DEFAULT 'LOGIN', -- LOGIN, PLAIN, OAUTH2
  
  -- Authentication
  smtp_username TEXT NOT NULL,
  smtp_password TEXT, -- Encrypted in production
  
  -- Email Settings
  from_email TEXT NOT NULL,
  from_name TEXT NOT NULL DEFAULT 'English Australia',
  reply_to_email TEXT,
  reply_to_name TEXT,
  
  -- Additional Settings
  enabled BOOLEAN DEFAULT false,
  test_mode BOOLEAN DEFAULT false,
  test_email TEXT, -- Email to receive all emails in test mode
  
  -- Email Limits
  daily_limit INTEGER DEFAULT 1000,
  hourly_limit INTEGER DEFAULT 100,
  emails_sent_today INTEGER DEFAULT 0,
  emails_sent_this_hour INTEGER DEFAULT 0,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  last_reset_hour INTEGER DEFAULT EXTRACT(HOUR FROM NOW()),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  -- Only one active configuration
  CONSTRAINT only_one_active CHECK (
    (SELECT COUNT(*) FROM public.smtp_settings WHERE enabled = true) <= 1
  )
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_smtp_settings_enabled ON public.smtp_settings(enabled);

-- Enable RLS
ALTER TABLE public.smtp_settings ENABLE ROW LEVEL SECURITY;

-- Only super admins can manage SMTP settings
CREATE POLICY "Only super admins can manage SMTP settings" ON public.smtp_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.role_permissions rp
      JOIN public.user_roles ur ON rp.role_id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND rp.permission_id IN (
        SELECT id FROM public.permissions WHERE name = 'MANAGE_SYSTEM_SETTINGS'
      )
    )
  );

-- Grant permissions
GRANT ALL ON public.smtp_settings TO authenticated;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_smtp_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
DROP TRIGGER IF EXISTS update_smtp_settings_updated_at ON public.smtp_settings;
CREATE TRIGGER update_smtp_settings_updated_at
  BEFORE UPDATE ON public.smtp_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_smtp_settings_updated_at();
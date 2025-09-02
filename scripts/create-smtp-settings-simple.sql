-- ================================================
-- CRIAR TABELA DE CONFIGURAÇÕES SMTP (VERSÃO SIMPLIFICADA)
-- Sem dependências de tabelas de roles/permissões
-- ================================================

-- Drop table if exists to start fresh
DROP TABLE IF EXISTS public.email_queue CASCADE;
DROP TABLE IF EXISTS public.email_templates CASCADE;
DROP TABLE IF EXISTS public.smtp_settings CASCADE;

CREATE TABLE public.smtp_settings (
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
  updated_by UUID REFERENCES auth.users(id)
);

-- Create index
CREATE INDEX idx_smtp_settings_enabled ON public.smtp_settings(enabled);

-- Enable RLS
ALTER TABLE public.smtp_settings ENABLE ROW LEVEL SECURITY;

-- Simple policy - authenticated users can view, but we'll control edit in the app
CREATE POLICY "Authenticated users can view SMTP settings" ON public.smtp_settings
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Service role can manage SMTP settings" ON public.smtp_settings
  FOR ALL
  USING (auth.role() = 'service_role');

-- Grant permissions
GRANT SELECT ON public.smtp_settings TO authenticated;
GRANT ALL ON public.smtp_settings TO service_role;

-- Function to ensure only one active SMTP configuration
CREATE OR REPLACE FUNCTION ensure_single_active_smtp()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting this record to enabled
  IF NEW.enabled = true THEN
    -- Disable all other records
    UPDATE public.smtp_settings 
    SET enabled = false 
    WHERE id != NEW.id AND enabled = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to ensure only one active configuration
CREATE TRIGGER ensure_single_active_smtp_trigger
  BEFORE INSERT OR UPDATE ON public.smtp_settings
  FOR EACH ROW
  WHEN (NEW.enabled = true)
  EXECUTE FUNCTION ensure_single_active_smtp();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_smtp_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  IF auth.uid() IS NOT NULL THEN
    NEW.updated_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_smtp_settings_updated_at
  BEFORE UPDATE ON public.smtp_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_smtp_settings_updated_at();

-- ================================================
-- CRIAR TABELA DE TEMPLATES DE EMAIL
-- ================================================

CREATE TABLE public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Template Info
  name TEXT UNIQUE NOT NULL, -- Unique identifier like 'event-registration'
  display_name TEXT NOT NULL, -- Human readable name
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('event', 'cpd', 'member', 'system', 'custom')),
  
  -- Email Content
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT, -- Plain text version
  
  -- Variables
  variables JSONB DEFAULT '[]', -- Array of variable names like ["user_name", "event_title"]
  sample_data JSONB DEFAULT '{}', -- Sample data for preview
  
  -- Settings
  enabled BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false, -- System templates cannot be deleted
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create indexes
CREATE INDEX idx_email_templates_name ON public.email_templates(name);
CREATE INDEX idx_email_templates_category ON public.email_templates(category);
CREATE INDEX idx_email_templates_enabled ON public.email_templates(enabled);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Policies for email templates
CREATE POLICY "Anyone can view enabled templates" ON public.email_templates
  FOR SELECT
  USING (enabled = true);

CREATE POLICY "Service role can manage templates" ON public.email_templates
  FOR ALL
  USING (auth.role() = 'service_role');

-- Grant permissions
GRANT SELECT ON public.email_templates TO authenticated;
GRANT ALL ON public.email_templates TO service_role;

-- ================================================
-- CRIAR TABELA DE FILA DE EMAILS
-- ================================================

CREATE TABLE public.email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Recipient
  to_email TEXT NOT NULL,
  to_name TEXT,
  cc_email TEXT,
  bcc_email TEXT,
  
  -- Email Content
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  
  -- Template Info
  template_id UUID REFERENCES public.email_templates(id),
  template_variables JSONB,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed', 'cancelled')),
  priority INTEGER DEFAULT 5, -- 1 (highest) to 10 (lowest)
  
  -- Scheduling
  scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Attempts
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  
  -- Results
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  smtp_response TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create indexes for email queue
CREATE INDEX idx_email_queue_status ON public.email_queue(status);
CREATE INDEX idx_email_queue_scheduled ON public.email_queue(scheduled_for);
CREATE INDEX idx_email_queue_priority ON public.email_queue(priority);

-- Enable RLS
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

-- Service role can manage email queue
CREATE POLICY "Service role can manage email queue" ON public.email_queue
  FOR ALL
  USING (auth.role() = 'service_role');

-- Grant permissions
GRANT ALL ON public.email_queue TO service_role;

-- ================================================
-- INSERT DEFAULT EMAIL TEMPLATES
-- ================================================

INSERT INTO public.email_templates (name, display_name, description, category, subject, body_html, body_text, variables, is_system)
VALUES 
-- Event Registration Confirmation
('event-registration', 'Event Registration Confirmation', 'Sent when a member registers for an event', 'event',
'Registration Confirmed: {{event_title}}',
'<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #2c3e50;">Registration Confirmed!</h2>
    <p>Dear {{user_name}},</p>
    <p>Your registration for <strong>{{event_title}}</strong> has been confirmed.</p>
    
    <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h3 style="color: #2c3e50; margin-top: 0;">Event Details:</h3>
      <ul style="list-style: none; padding: 0;">
        <li><strong>Date:</strong> {{event_date}}</li>
        <li><strong>Time:</strong> {{event_time}}</li>
        <li><strong>Location:</strong> {{event_location}}</li>
        <li><strong>Registration ID:</strong> {{registration_id}}</li>
      </ul>
    </div>
    
    <p>We look forward to seeing you at the event!</p>
    
    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
    <p style="font-size: 12px; color: #666;">
      English Australia<br>
      This is an automated message. Please do not reply to this email.
    </p>
  </div>
</body>
</html>',
'Registration Confirmed!

Dear {{user_name}},

Your registration for {{event_title}} has been confirmed.

Event Details:
- Date: {{event_date}}
- Time: {{event_time}}
- Location: {{event_location}}
- Registration ID: {{registration_id}}

We look forward to seeing you at the event!

English Australia',
'["user_name", "event_title", "event_date", "event_time", "event_location", "registration_id"]'::jsonb,
true),

-- Event Reminder
('event-reminder', 'Event Reminder', 'Reminder sent before an event', 'event',
'Reminder: {{event_title}} - {{reminder_time}}',
'<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #2c3e50;">Event Reminder</h2>
    <p>Dear {{user_name}},</p>
    <p>This is a reminder that you are registered for:</p>
    
    <div style="background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
      <h3 style="color: #856404; margin-top: 0;">{{event_title}}</h3>
      <p style="margin: 5px 0;"><strong>When:</strong> {{event_date}} at {{event_time}}</p>
      <p style="margin: 5px 0;"><strong>Where:</strong> {{event_location}}</p>
    </div>
    
    <p>See you there!</p>
    
    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
    <p style="font-size: 12px; color: #666;">
      English Australia<br>
      This is an automated reminder.
    </p>
  </div>
</body>
</html>',
'Event Reminder

Dear {{user_name}},

This is a reminder that you are registered for:

{{event_title}}
When: {{event_date}} at {{event_time}}
Where: {{event_location}}

See you there!

English Australia',
'["user_name", "event_title", "event_date", "event_time", "event_location", "reminder_time"]'::jsonb,
true),

-- CPD Activity Approved
('cpd-approved', 'CPD Activity Approved', 'Sent when a CPD activity is approved', 'cpd',
'CPD Activity Approved: {{activity_title}}',
'<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #28a745;">CPD Activity Approved</h2>
    <p>Dear {{user_name}},</p>
    <p>Great news! Your CPD activity has been approved.</p>
    
    <div style="background: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h3 style="color: #155724; margin-top: 0;">Activity Details:</h3>
      <ul style="list-style: none; padding: 0;">
        <li><strong>Title:</strong> {{activity_title}}</li>
        <li><strong>Category:</strong> {{cpd_category}}</li>
        <li><strong>Points Awarded:</strong> {{cpd_points}}</li>
        <li><strong>Date Approved:</strong> {{approval_date}}</li>
      </ul>
    </div>
    
    <p>You can view your updated CPD record in your member portal.</p>
    
    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
    <p style="font-size: 12px; color: #666;">
      English Australia<br>
      CPD Team
    </p>
  </div>
</body>
</html>',
'CPD Activity Approved

Dear {{user_name}},

Great news! Your CPD activity has been approved.

Activity Details:
- Title: {{activity_title}}
- Category: {{cpd_category}}
- Points Awarded: {{cpd_points}}
- Date Approved: {{approval_date}}

You can view your updated CPD record in your member portal.

English Australia
CPD Team',
'["user_name", "activity_title", "cpd_category", "cpd_points", "approval_date"]'::jsonb,
true),

-- Event Certificate Available
('event-certificate', 'Event Certificate Available', 'Sent when event certificate is ready', 'event',
'Your Certificate is Ready - {{event_title}}',
'<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #28a745;">Certificate Available</h2>
    <p>Dear {{user_name}},</p>
    <p>Thank you for attending <strong>{{event_title}}</strong>.</p>
    
    <div style="background: #d1ecf1; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="margin: 0;">Your certificate of attendance is now available.</p>
      <p style="margin: 10px 0 0 0;">Certificate Number: <strong>{{certificate_number}}</strong></p>
    </div>
    
    <p>You can download your certificate from your member portal under "My Registrations".</p>
    
    <p>If you have any questions, please don''t hesitate to contact us.</p>
    
    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
    <p style="font-size: 12px; color: #666;">
      English Australia<br>
      Professional Development Team
    </p>
  </div>
</body>
</html>',
'Certificate Available

Dear {{user_name}},

Thank you for attending {{event_title}}.

Your certificate of attendance is now available.
Certificate Number: {{certificate_number}}

You can download your certificate from your member portal under "My Registrations".

If you have any questions, please don''t hesitate to contact us.

English Australia
Professional Development Team',
'["user_name", "event_title", "certificate_number"]'::jsonb,
true),

-- Welcome Email
('welcome', 'Welcome to English Australia', 'Sent when a new member joins', 'member',
'Welcome to English Australia!',
'<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #2c3e50;">Welcome to English Australia!</h2>
    <p>Dear {{user_name}},</p>
    <p>We''re delighted to welcome you to the English Australia community.</p>
    
    <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h3 style="color: #2c3e50; margin-top: 0;">Your Account Details:</h3>
      <ul style="list-style: none; padding: 0;">
        <li><strong>Email:</strong> {{user_email}}</li>
        <li><strong>Member Type:</strong> {{member_type}}</li>
        <li><strong>Member Since:</strong> {{join_date}}</li>
      </ul>
    </div>
    
    <h3 style="color: #2c3e50;">What''s Next?</h3>
    <ul>
      <li>Complete your profile</li>
      <li>Browse upcoming events</li>
      <li>Start tracking your CPD activities</li>
      <li>Connect with other members</li>
    </ul>
    
    <p>If you have any questions, our team is here to help!</p>
    
    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
    <p style="font-size: 12px; color: #666;">
      English Australia<br>
      Member Services Team
    </p>
  </div>
</body>
</html>',
'Welcome to English Australia!

Dear {{user_name}},

We''re delighted to welcome you to the English Australia community.

Your Account Details:
- Email: {{user_email}}
- Member Type: {{member_type}}
- Member Since: {{join_date}}

What''s Next?
- Complete your profile
- Browse upcoming events
- Start tracking your CPD activities
- Connect with other members

If you have any questions, our team is here to help!

English Australia
Member Services Team',
'["user_name", "user_email", "member_type", "join_date"]'::jsonb,
true)
ON CONFLICT (name) DO UPDATE SET
  body_html = EXCLUDED.body_html,
  body_text = EXCLUDED.body_text,
  updated_at = now();

-- ================================================
-- CREATE EDGE FUNCTION FOR EMAIL SENDING (Optional)
-- This is a template for a Supabase Edge Function
-- ================================================

COMMENT ON TABLE public.email_queue IS 
'Email queue for processing. 
To process emails, create a Supabase Edge Function or cron job that:
1. Fetches pending emails from this table
2. Sends them via SMTP using settings from smtp_settings table
3. Updates status to sent or failed
4. Increments attempt counter on failure';

-- ================================================
-- VERIFY INSTALLATION
-- ================================================

DO $$ 
DECLARE
  smtp_count INTEGER;
  template_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO smtp_count FROM public.smtp_settings;
  SELECT COUNT(*) INTO template_count FROM public.email_templates;
  
  RAISE NOTICE '✅ SMTP settings table created successfully';
  RAISE NOTICE '✅ Email templates table created with % default templates', template_count;
  RAISE NOTICE '✅ Email queue table created successfully';
  RAISE NOTICE '';
  RAISE NOTICE '📧 Next steps:';
  RAISE NOTICE '1. Add SMTP configuration via admin panel or SQL:';
  RAISE NOTICE '   INSERT INTO smtp_settings (smtp_host, smtp_port, smtp_username, smtp_password, from_email, from_name, enabled)';
  RAISE NOTICE '   VALUES (''smtp.gmail.com'', 587, ''your-email@gmail.com'', ''your-app-password'', ''noreply@englishaustralia.com.au'', ''English Australia'', true);';
  RAISE NOTICE '';
  RAISE NOTICE '2. Test with: SELECT * FROM email_templates;';
  RAISE NOTICE '3. Create Edge Function or cron job to process email_queue';
END $$;
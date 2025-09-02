-- Event Registrations table
CREATE TABLE IF NOT EXISTS public.event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Registration details
  registration_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'confirmed', 'attended', 'cancelled', 'no_show')),
  registration_type TEXT DEFAULT 'participant' CHECK (registration_type IN ('participant', 'speaker', 'organizer', 'volunteer')),
  
  -- Payment info
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'waived')),
  payment_amount INTEGER DEFAULT 0, -- in cents
  payment_date TIMESTAMP WITH TIME ZONE,
  payment_method TEXT,
  invoice_number TEXT,
  
  -- Guest info (if applicable)
  is_guest BOOLEAN DEFAULT false,
  guest_of UUID REFERENCES auth.users(id),
  guest_name TEXT,
  guest_email TEXT,
  
  -- Check-in info
  checked_in BOOLEAN DEFAULT false,
  check_in_date TIMESTAMP WITH TIME ZONE,
  check_in_method TEXT, -- 'manual', 'qr_code', 'auto'
  
  -- Certificate info
  certificate_issued BOOLEAN DEFAULT false,
  certificate_issued_date TIMESTAMP WITH TIME ZONE,
  certificate_number TEXT UNIQUE,
  certificate_url TEXT,
  
  -- CPD Activity tracking
  cpd_activity_created BOOLEAN DEFAULT false,
  cpd_activity_id UUID REFERENCES public.cpd_activities(id),
  
  -- Reminder settings
  reminder_email_sent BOOLEAN DEFAULT false,
  reminder_email_date TIMESTAMP WITH TIME ZONE,
  
  -- Additional info
  dietary_requirements TEXT,
  accessibility_requirements TEXT,
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Ensure unique registration per event per user
  UNIQUE(event_id, user_id)
);

-- Event Certificates table
CREATE TABLE IF NOT EXISTS public.event_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES public.event_registrations(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Certificate details
  certificate_number TEXT UNIQUE NOT NULL,
  issue_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Certificate content
  recipient_name TEXT NOT NULL,
  event_title TEXT NOT NULL,
  event_date TEXT NOT NULL,
  cpd_points DECIMAL(4,2),
  cpd_category TEXT,
  
  -- File info
  pdf_url TEXT,
  pdf_generated BOOLEAN DEFAULT false,
  pdf_generation_date TIMESTAMP WITH TIME ZONE,
  
  -- Verification
  verification_code TEXT UNIQUE,
  is_valid BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Event Attendance Log (for tracking actual participation)
CREATE TABLE IF NOT EXISTS public.event_attendance_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES public.event_registrations(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Access tracking
  access_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  access_type TEXT CHECK (access_type IN ('check_in', 'page_view', 'video_start', 'video_complete', 'download')),
  
  -- Session info
  ip_address INET,
  user_agent TEXT,
  session_duration INTEGER, -- in seconds
  
  -- For virtual events
  video_progress INTEGER, -- percentage watched
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Event Reminders Queue
CREATE TABLE IF NOT EXISTS public.event_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  registration_id UUID NOT NULL REFERENCES public.event_registrations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Reminder details
  reminder_type TEXT CHECK (reminder_type IN ('1_week', '1_day', '1_hour', 'custom')),
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Status
  sent BOOLEAN DEFAULT false,
  sent_date TIMESTAMP WITH TIME ZONE,
  
  -- Email details
  email_to TEXT NOT NULL,
  email_subject TEXT,
  email_body TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_event_registrations_event_id ON public.event_registrations(event_id);
CREATE INDEX idx_event_registrations_user_id ON public.event_registrations(user_id);
CREATE INDEX idx_event_registrations_status ON public.event_registrations(status);
CREATE INDEX idx_event_registrations_check_in ON public.event_registrations(checked_in);
CREATE INDEX idx_event_certificates_registration_id ON public.event_certificates(registration_id);
CREATE INDEX idx_event_certificates_user_id ON public.event_certificates(user_id);
CREATE INDEX idx_event_certificates_number ON public.event_certificates(certificate_number);
CREATE INDEX idx_event_attendance_event_id ON public.event_attendance_log(event_id);
CREATE INDEX idx_event_attendance_user_id ON public.event_attendance_log(user_id);
CREATE INDEX idx_event_reminders_scheduled ON public.event_reminders(scheduled_date, sent);

-- RLS Policies for event_registrations
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own registrations" ON public.event_registrations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can register for events" ON public.event_registrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own registrations" ON public.event_registrations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all registrations" ON public.event_registrations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- RLS Policies for event_certificates
ALTER TABLE public.event_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own certificates" ON public.event_certificates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Public can verify certificates" ON public.event_certificates
  FOR SELECT USING (verification_code IS NOT NULL);

-- RLS Policies for event_attendance_log
ALTER TABLE public.event_attendance_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own attendance" ON public.event_attendance_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can log attendance" ON public.event_attendance_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to generate certificate number
CREATE OR REPLACE FUNCTION generate_certificate_number()
RETURNS TEXT AS $$
DECLARE
  cert_number TEXT;
BEGIN
  -- Format: EAU-YYYY-NNNNNN (e.g., EAU-2024-000001)
  cert_number := 'EAU-' || EXTRACT(YEAR FROM now())::TEXT || '-' || 
                 LPAD(COALESCE((
                   SELECT COUNT(*) + 1 
                   FROM public.event_certificates 
                   WHERE EXTRACT(YEAR FROM issue_date) = EXTRACT(YEAR FROM now())
                 ), 1)::TEXT, 6, '0');
  RETURN cert_number;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-create CPD activity when user attends event
CREATE OR REPLACE FUNCTION create_cpd_activity_on_attendance()
RETURNS TRIGGER AS $$
DECLARE
  v_event RECORD;
  v_cpd_activity_id UUID;
BEGIN
  -- Only process when check-in happens or status changes to 'attended'
  IF NEW.checked_in = true AND OLD.checked_in = false THEN
    -- Get event details
    SELECT * INTO v_event FROM public.events WHERE id = NEW.event_id;
    
    -- Create CPD activity if event has CPD points
    IF v_event.cpd_points > 0 THEN
      INSERT INTO public.cpd_activities (
        user_id,
        activity_type,
        title,
        description,
        provider,
        start_date,
        end_date,
        cpd_hours,
        cpd_points,
        category,
        status,
        reflection,
        event_id
      ) VALUES (
        NEW.user_id,
        'event',
        v_event.title,
        v_event.description,
        'English Australia',
        v_event.start_date,
        v_event.end_date,
        EXTRACT(EPOCH FROM (v_event.end_date - v_event.start_date)) / 3600,
        v_event.cpd_points,
        v_event.cpd_category,
        'completed',
        'Attended event: ' || v_event.title,
        NEW.event_id
      ) RETURNING id INTO v_cpd_activity_id;
      
      -- Update registration with CPD activity ID
      NEW.cpd_activity_created := true;
      NEW.cpd_activity_id := v_cpd_activity_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto CPD activity creation
CREATE TRIGGER create_cpd_on_event_attendance
  BEFORE UPDATE ON public.event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION create_cpd_activity_on_attendance();

-- Grant permissions
GRANT ALL ON public.event_registrations TO authenticated;
GRANT ALL ON public.event_certificates TO authenticated;
GRANT ALL ON public.event_attendance_log TO authenticated;
GRANT ALL ON public.event_reminders TO authenticated;
GRANT SELECT ON public.event_certificates TO anon; -- For certificate verification
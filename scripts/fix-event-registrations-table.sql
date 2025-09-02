-- Add missing columns to event_registrations table if they don't exist

-- Check and add checked_in column
ALTER TABLE public.event_registrations 
ADD COLUMN IF NOT EXISTS checked_in BOOLEAN DEFAULT false;

-- Check and add check_in_date column
ALTER TABLE public.event_registrations 
ADD COLUMN IF NOT EXISTS check_in_date TIMESTAMP WITH TIME ZONE;

-- Check and add check_in_method column
ALTER TABLE public.event_registrations 
ADD COLUMN IF NOT EXISTS check_in_method TEXT;

-- Check and add certificate_issued column
ALTER TABLE public.event_registrations 
ADD COLUMN IF NOT EXISTS certificate_issued BOOLEAN DEFAULT false;

-- Check and add certificate_issued_date column
ALTER TABLE public.event_registrations 
ADD COLUMN IF NOT EXISTS certificate_issued_date TIMESTAMP WITH TIME ZONE;

-- Check and add certificate_number column
ALTER TABLE public.event_registrations 
ADD COLUMN IF NOT EXISTS certificate_number TEXT;

-- Check and add certificate_url column
ALTER TABLE public.event_registrations 
ADD COLUMN IF NOT EXISTS certificate_url TEXT;

-- Check and add cpd_activity_created column
ALTER TABLE public.event_registrations 
ADD COLUMN IF NOT EXISTS cpd_activity_created BOOLEAN DEFAULT false;

-- Check and add cpd_activity_id column
ALTER TABLE public.event_registrations 
ADD COLUMN IF NOT EXISTS cpd_activity_id UUID REFERENCES public.cpd_activities(id);

-- Check and add reminder_email_sent column
ALTER TABLE public.event_registrations 
ADD COLUMN IF NOT EXISTS reminder_email_sent BOOLEAN DEFAULT false;

-- Check and add reminder_email_date column
ALTER TABLE public.event_registrations 
ADD COLUMN IF NOT EXISTS reminder_email_date TIMESTAMP WITH TIME ZONE;

-- Check and add dietary_requirements column
ALTER TABLE public.event_registrations 
ADD COLUMN IF NOT EXISTS dietary_requirements TEXT;

-- Check and add accessibility_requirements column
ALTER TABLE public.event_registrations 
ADD COLUMN IF NOT EXISTS accessibility_requirements TEXT;

-- Check and add notes column
ALTER TABLE public.event_registrations 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add any missing indexes
CREATE INDEX IF NOT EXISTS idx_event_registrations_checked_in 
ON public.event_registrations(checked_in);

-- Verify the structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'event_registrations'
ORDER BY ordinal_position;
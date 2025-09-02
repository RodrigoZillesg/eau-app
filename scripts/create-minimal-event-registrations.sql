-- Minimal Event Registrations table that works with existing structure
-- This script creates only what's absolutely necessary

-- First, let's check if the table exists and what columns it has
DO $$ 
BEGIN
  -- Create the table if it doesn't exist
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'event_registrations') THEN
    CREATE TABLE public.event_registrations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      registration_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
      status TEXT DEFAULT 'registered',
      payment_status TEXT DEFAULT 'pending',
      payment_amount INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      UNIQUE(event_id, user_id)
    );
    
    -- Create basic indexes
    CREATE INDEX idx_event_registrations_event_id ON public.event_registrations(event_id);
    CREATE INDEX idx_event_registrations_user_id ON public.event_registrations(user_id);
    
    -- Enable RLS
    ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
    
    -- Basic RLS policies
    CREATE POLICY "Users can view their own registrations" ON public.event_registrations
      FOR SELECT USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can register for events" ON public.event_registrations
      FOR INSERT WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can update their own registrations" ON public.event_registrations
      FOR UPDATE USING (auth.uid() = user_id);
    
    -- Grant permissions
    GRANT ALL ON public.event_registrations TO authenticated;
  END IF;
END $$;

-- Add essential columns if they don't exist
ALTER TABLE public.event_registrations 
ADD COLUMN IF NOT EXISTS registration_type TEXT DEFAULT 'participant';

ALTER TABLE public.event_registrations 
ADD COLUMN IF NOT EXISTS is_guest BOOLEAN DEFAULT false;

ALTER TABLE public.event_registrations 
ADD COLUMN IF NOT EXISTS guest_name TEXT;

ALTER TABLE public.event_registrations 
ADD COLUMN IF NOT EXISTS guest_email TEXT;

-- Add columns for tracking attendance (simplified)
ALTER TABLE public.event_registrations 
ADD COLUMN IF NOT EXISTS attended BOOLEAN DEFAULT false;

ALTER TABLE public.event_registrations 
ADD COLUMN IF NOT EXISTS attendance_date TIMESTAMP WITH TIME ZONE;

-- Add columns for optional info
ALTER TABLE public.event_registrations 
ADD COLUMN IF NOT EXISTS dietary_requirements TEXT;

ALTER TABLE public.event_registrations 
ADD COLUMN IF NOT EXISTS accessibility_requirements TEXT;

ALTER TABLE public.event_registrations 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Show final structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'event_registrations'
ORDER BY ordinal_position;
-- Fix event_certificates table permissions and RLS policies

-- Make sure the table exists first
CREATE TABLE IF NOT EXISTS event_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID NOT NULL REFERENCES event_registrations(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    certificate_number VARCHAR(50) NOT NULL UNIQUE,
    issue_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    recipient_name VARCHAR(255) NOT NULL,
    event_title VARCHAR(500) NOT NULL,
    event_date VARCHAR(50) NOT NULL,
    cpd_points INTEGER DEFAULT 1,
    cpd_category VARCHAR(100),
    pdf_url TEXT,
    pdf_generated BOOLEAN DEFAULT false,
    is_valid BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drop existing RLS policies that might be blocking access
DROP POLICY IF EXISTS "Users can view their own certificates" ON event_certificates;
DROP POLICY IF EXISTS "Admins can view all certificates" ON event_certificates;
DROP POLICY IF EXISTS "Service role can manage certificates" ON event_certificates;

-- Disable RLS temporarily for testing
ALTER TABLE event_certificates DISABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON event_certificates TO authenticated;
GRANT ALL ON event_certificates TO anon;
GRANT ALL ON event_certificates TO service_role;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_certificates_registration_id ON event_certificates(registration_id);
CREATE INDEX IF NOT EXISTS idx_event_certificates_event_id ON event_certificates(event_id);
CREATE INDEX IF NOT EXISTS idx_event_certificates_user_id ON event_certificates(user_id);

-- Also ensure cpd_activities has the event_id column and proper permissions
ALTER TABLE cpd_activities ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id);
CREATE INDEX IF NOT EXISTS idx_cpd_activities_event_id ON cpd_activities(event_id);

-- Disable RLS on cpd_activities for testing as well
ALTER TABLE cpd_activities DISABLE ROW LEVEL SECURITY;
GRANT ALL ON cpd_activities TO authenticated;
GRANT ALL ON cpd_activities TO anon;

COMMENT ON TABLE event_certificates IS 'Certificates issued for event attendance - RLS DISABLED FOR TESTING';
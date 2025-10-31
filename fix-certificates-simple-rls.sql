-- SIMPLEST FIX: Temporarily disable RLS on event_certificates
-- This will allow all authenticated users to access the table
-- Run this if you're still getting 406 errors

-- Option 1: Disable RLS completely (temporary for testing)
ALTER TABLE event_certificates DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON event_certificates TO authenticated;
GRANT ALL ON event_certificates TO anon;
GRANT ALL ON event_certificates TO service_role;

-- Test insert
-- This should work after disabling RLS
/*
INSERT INTO event_certificates (
    registration_id,
    event_id, 
    user_id,
    certificate_number,
    recipient_name,
    event_title,
    event_date
) VALUES (
    (SELECT id FROM event_registrations LIMIT 1),
    (SELECT id FROM events LIMIT 1),
    (SELECT id FROM auth.users LIMIT 1),
    'TEST-' || extract(epoch from now())::text,
    'Test User',
    'Test Event',
    '2025-01-10'
);
*/

-- Option 2: If you want to keep RLS enabled but make it fully permissive
-- Uncomment the lines below:
/*
ALTER TABLE event_certificates ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own certificates" ON event_certificates;
DROP POLICY IF EXISTS "Admins can view all certificates" ON event_certificates;
DROP POLICY IF EXISTS "Service role can manage certificates" ON event_certificates;
DROP POLICY IF EXISTS "Admins and staff can view all certificates" ON event_certificates;
DROP POLICY IF EXISTS "Authenticated users can create certificates" ON event_certificates;
DROP POLICY IF EXISTS "Admins and staff can update certificates" ON event_certificates;
DROP POLICY IF EXISTS "Super admins can delete certificates" ON event_certificates;
DROP POLICY IF EXISTS "Service role full access" ON event_certificates;
DROP POLICY IF EXISTS "Authenticated users full access" ON event_certificates;

-- Create a single fully permissive policy
CREATE POLICY "Allow all for authenticated" ON event_certificates
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Also create one for anon role (in case frontend uses anon key)
CREATE POLICY "Allow all for anon" ON event_certificates
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);
*/
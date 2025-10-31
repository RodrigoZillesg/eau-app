-- Fix RLS policies for event_certificates table to resolve 406 error
-- Run this SQL in Supabase Studio SQL Editor

-- First, drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view their own certificates" ON event_certificates;
DROP POLICY IF EXISTS "Admins can view all certificates" ON event_certificates;
DROP POLICY IF EXISTS "Service role can manage certificates" ON event_certificates;

-- Create comprehensive RLS policies

-- 1. SELECT policies - Users can view their own certificates
CREATE POLICY "Users can view their own certificates" ON event_certificates
    FOR SELECT 
    USING (auth.uid() = user_id);

-- 2. SELECT policy - Admins and staff can view all certificates
CREATE POLICY "Admins and staff can view all certificates" ON event_certificates
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND (
                user_metadata->>'role' IN ('Admin', 'AdminSuper', 'Staff') 
                OR 
                user_metadata->>'is_admin' = 'true'
            )
        )
    );

-- 3. INSERT policy - Allow authenticated users to create certificates (backend will validate)
CREATE POLICY "Authenticated users can create certificates" ON event_certificates
    FOR INSERT 
    WITH CHECK (
        -- Check if the user is creating a certificate for themselves OR is an admin
        auth.uid() = user_id 
        OR 
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND (
                user_metadata->>'role' IN ('Admin', 'AdminSuper', 'Staff') 
                OR 
                user_metadata->>'is_admin' = 'true'
            )
        )
    );

-- 4. UPDATE policy - Admins and staff can update certificates
CREATE POLICY "Admins and staff can update certificates" ON event_certificates
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND (
                user_metadata->>'role' IN ('Admin', 'AdminSuper', 'Staff') 
                OR 
                user_metadata->>'is_admin' = 'true'
            )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND (
                user_metadata->>'role' IN ('Admin', 'AdminSuper', 'Staff') 
                OR 
                user_metadata->>'is_admin' = 'true'
            )
        )
    );

-- 5. DELETE policy - Only super admins can delete certificates
CREATE POLICY "Super admins can delete certificates" ON event_certificates
    FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND user_metadata->>'role' = 'AdminSuper'
        )
    );

-- 6. Service role bypass - Allow service role full access (for backend operations)
CREATE POLICY "Service role full access" ON event_certificates
    FOR ALL 
    USING (auth.jwt()->>'role' = 'service_role')
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Grant proper permissions to roles
GRANT ALL ON event_certificates TO service_role;
GRANT SELECT, INSERT ON event_certificates TO authenticated;
GRANT ALL ON event_certificates TO postgres;

-- Also ensure sequence permissions if needed
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Verify the policies are created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'event_certificates'
ORDER BY policyname;

-- Test insert capability for authenticated users
-- This should work after applying the policies above
/*
-- Test query (do not run, just for reference):
INSERT INTO event_certificates (
    registration_id,
    event_id,
    user_id,
    certificate_number,
    recipient_name,
    event_title,
    event_date,
    cpd_points,
    cpd_category
) VALUES (
    'test-registration-id',
    'test-event-id',
    auth.uid(),
    'CERT-TEST-001',
    'Test User',
    'Test Event',
    '2025-01-10',
    1,
    'Professional Development'
);
*/
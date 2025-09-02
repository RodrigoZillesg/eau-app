-- =====================================================
-- Fix Row Level Security for Events Tables
-- This script updates the RLS policies to allow
-- authenticated users to create and manage events
-- =====================================================

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Events are manageable by admins" ON events;
DROP POLICY IF EXISTS "Published events are viewable by everyone" ON events;

-- =====================================================
-- Events Policies (Updated)
-- =====================================================

-- Policy for viewing events
CREATE POLICY "Published events are viewable by everyone" ON events
    FOR SELECT USING (
        status = 'published' 
        AND (
            visibility = 'public' 
            OR (visibility = 'members' AND auth.uid() IS NOT NULL)
            OR (visibility = 'private' AND created_by = auth.uid())
        )
        -- Admins can see all events
        OR created_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM members m
            WHERE m.user_id = auth.uid()
            AND m.email = 'rrzillesg@gmail.com' -- Admin check
        )
    );

-- Policy for creating events (any authenticated user can create)
CREATE POLICY "Authenticated users can create events" ON events
    FOR INSERT 
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND auth.uid() = created_by
    );

-- Policy for updating events (only creator or admin)
CREATE POLICY "Users can update their own events" ON events
    FOR UPDATE 
    USING (
        auth.uid() IS NOT NULL 
        AND (
            created_by = auth.uid()
            OR EXISTS (
                SELECT 1 FROM members m
                WHERE m.user_id = auth.uid()
                AND m.email = 'rrzillesg@gmail.com' -- Admin check
            )
        )
    )
    WITH CHECK (
        auth.uid() IS NOT NULL 
        AND (
            created_by = auth.uid()
            OR EXISTS (
                SELECT 1 FROM members m
                WHERE m.user_id = auth.uid()
                AND m.email = 'rrzillesg@gmail.com' -- Admin check
            )
        )
    );

-- Policy for deleting events (only creator or admin)
CREATE POLICY "Users can delete their own events" ON events
    FOR DELETE 
    USING (
        auth.uid() IS NOT NULL 
        AND (
            created_by = auth.uid()
            OR EXISTS (
                SELECT 1 FROM members m
                WHERE m.user_id = auth.uid()
                AND m.email = 'rrzillesg@gmail.com' -- Admin check
            )
        )
    );

-- =====================================================
-- Fix for Event Registrations
-- =====================================================

DROP POLICY IF EXISTS "Users can create their own registrations" ON event_registrations;

-- Allow authenticated users to register for events
CREATE POLICY "Users can create their own registrations" ON event_registrations
    FOR INSERT 
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND (
            user_id = auth.uid() 
            OR member_id IN (SELECT id FROM members WHERE user_id = auth.uid())
            OR user_id IS NULL -- Allow registration without user_id for guest registrations
        )
    );

-- =====================================================
-- Temporary Admin Access (for development)
-- This gives full access to specific admin users
-- =====================================================

-- Grant full access to admin email
CREATE POLICY "Admin full access to events" ON events
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.email = 'rrzillesg@gmail.com'
        )
    );

-- =====================================================
-- Additional fixes for related tables
-- =====================================================

-- Ensure event_categories is readable by all
DROP POLICY IF EXISTS "Event categories are viewable by everyone" ON event_categories;
CREATE POLICY "Event categories are viewable by everyone" ON event_categories
    FOR SELECT 
    USING (true); -- All categories are public

-- Ensure authenticated users can read their own CPD activities
DROP POLICY IF EXISTS "Users can view their own CPD activities" ON cpd_event_activities;
CREATE POLICY "Users can view their own CPD activities" ON cpd_event_activities
    FOR SELECT 
    USING (
        member_id IN (SELECT id FROM members WHERE user_id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.email = 'rrzillesg@gmail.com'
        )
    );

-- =====================================================
-- Verify the changes
-- =====================================================

-- Check if policies are correctly applied
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
WHERE tablename IN ('events', 'event_registrations', 'event_categories', 'cpd_event_activities')
ORDER BY tablename, policyname;
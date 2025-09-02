-- =====================================================
-- Fix Row Level Security for Events Tables V2
-- This version fixes the permission issues with auth.users
-- =====================================================

-- First, drop all existing policies on events table
DROP POLICY IF EXISTS "Events are manageable by admins" ON events;
DROP POLICY IF EXISTS "Published events are viewable by everyone" ON events;
DROP POLICY IF EXISTS "Authenticated users can create events" ON events;
DROP POLICY IF EXISTS "Users can update their own events" ON events;
DROP POLICY IF EXISTS "Users can delete their own events" ON events;
DROP POLICY IF EXISTS "Admin full access to events" ON events;

-- =====================================================
-- Simplified Events Policies
-- =====================================================

-- 1. Anyone can view published events
CREATE POLICY "Anyone can view published events" ON events
    FOR SELECT
    USING (
        status = 'published' 
        OR created_by = auth.uid()  -- Creators can see their own events
    );

-- 2. Authenticated users can create events
CREATE POLICY "Authenticated users can create events" ON events
    FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL
    );

-- 3. Users can update their own events
CREATE POLICY "Users can update their own events" ON events
    FOR UPDATE
    USING (
        auth.uid() = created_by
    )
    WITH CHECK (
        auth.uid() = created_by
    );

-- 4. Users can delete their own events
CREATE POLICY "Users can delete their own events" ON events
    FOR DELETE
    USING (
        auth.uid() = created_by
    );

-- =====================================================
-- Fix Event Categories Policy
-- =====================================================

DROP POLICY IF EXISTS "Event categories are viewable by everyone" ON event_categories;
DROP POLICY IF EXISTS "Event categories are manageable by admins" ON event_categories;

-- Everyone can see categories
CREATE POLICY "Public can view event categories" ON event_categories
    FOR SELECT
    USING (true);

-- Only admins can manage categories (simplified check)
CREATE POLICY "Admins can manage categories" ON event_categories
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT user_id FROM members 
            WHERE email = 'rrzillesg@gmail.com'
        )
    );

-- =====================================================
-- Fix Event Registrations Policies
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own registrations" ON event_registrations;
DROP POLICY IF EXISTS "Users can create their own registrations" ON event_registrations;
DROP POLICY IF EXISTS "Admins can manage all registrations" ON event_registrations;

-- Users can view their own registrations
CREATE POLICY "Users view own registrations" ON event_registrations
    FOR SELECT
    USING (
        auth.uid() = user_id
        OR auth.uid() IN (
            SELECT created_by FROM events WHERE id = event_registrations.event_id
        )
    );

-- Users can create registrations
CREATE POLICY "Users create registrations" ON event_registrations
    FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL
    );

-- Users can update their own registrations
CREATE POLICY "Users update own registrations" ON event_registrations
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- Fix Email Templates Policies
-- =====================================================

DROP POLICY IF EXISTS "Event emails are manageable by admins only" ON event_emails;

-- Event creators can manage email templates for their events
CREATE POLICY "Event creators manage emails" ON event_emails
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT created_by FROM events WHERE id = event_emails.event_id
        )
    );

-- =====================================================
-- Fix CPD Activities Policies
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own CPD activities" ON cpd_event_activities;
DROP POLICY IF EXISTS "Admins can manage all CPD activities" ON cpd_event_activities;

-- Simplified CPD policy
CREATE POLICY "Users manage own CPD activities" ON cpd_event_activities
    FOR ALL
    USING (
        member_id IN (
            SELECT id FROM members WHERE user_id = auth.uid()
        )
    );

-- =====================================================
-- Test the permissions
-- =====================================================

-- This should return true if you're authenticated
SELECT 
    CASE 
        WHEN auth.uid() IS NOT NULL 
        THEN 'Authenticated - Can create events' 
        ELSE 'Not authenticated' 
    END as status;

-- List all active policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd
FROM pg_policies 
WHERE tablename IN ('events', 'event_registrations', 'event_categories', 'event_emails', 'cpd_event_activities')
ORDER BY tablename, policyname;
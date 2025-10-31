-- ========================================
-- EAU SYSTEM - RLS POLICIES
-- Version: 2.0 - Clean Migration
-- Date: 24/01/2025
-- ========================================

-- Enable RLS on all tables
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cpd_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE openlearning_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE openlearning_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE openlearning_api_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE openlearning_sso_sessions ENABLE ROW LEVEL SECURITY;

-- ========================================
-- HELPER FUNCTIONS
-- ========================================

-- Function to check if user is admin or super_admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (auth.jwt() ->> 'role' IN ('admin', 'super_admin')) OR
           (auth.jwt() -> 'user_metadata' ->> 'role' IN ('admin', 'super_admin'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is super_admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (auth.jwt() ->> 'role' = 'super_admin') OR
           (auth.jwt() -> 'user_metadata' ->> 'role' = 'super_admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is institution admin
CREATE OR REPLACE FUNCTION is_institution_admin(inst_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM members
        WHERE user_id = auth.uid()
        AND institution_id = inst_id
        AND user_type = 'Institution Admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's institution
CREATE OR REPLACE FUNCTION get_user_institution()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT institution_id FROM members
        WHERE user_id = auth.uid()
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- INSTITUTIONS POLICIES
-- ========================================

-- View policy: Everyone can view institutions
CREATE POLICY "institutions_select_policy" ON institutions
    FOR SELECT USING (true);

-- Insert policy: Only admins can create institutions
CREATE POLICY "institutions_insert_policy" ON institutions
    FOR INSERT WITH CHECK (is_admin());

-- Update policy: Admins or institution admins can update
CREATE POLICY "institutions_update_policy" ON institutions
    FOR UPDATE USING (
        is_admin() OR
        is_institution_admin(id)
    );

-- Delete policy: Only super admins can delete
CREATE POLICY "institutions_delete_policy" ON institutions
    FOR DELETE USING (is_super_admin());

-- ========================================
-- MEMBERS POLICIES
-- ========================================

-- View policy: Users can see members based on role
CREATE POLICY "members_select_policy" ON members
    FOR SELECT USING (
        is_admin() OR -- Admins see all
        user_id = auth.uid() OR -- Users see themselves
        (institution_id = get_user_institution() AND is_institution_admin(get_user_institution())) -- Institution admins see their institution
    );

-- Insert policy: Admins and institution admins can create
CREATE POLICY "members_insert_policy" ON members
    FOR INSERT WITH CHECK (
        is_admin() OR
        (institution_id = get_user_institution() AND is_institution_admin(get_user_institution()))
    );

-- Update policy: Users can update themselves, admins can update all
CREATE POLICY "members_update_policy" ON members
    FOR UPDATE USING (
        is_admin() OR
        user_id = auth.uid() OR
        (institution_id = get_user_institution() AND is_institution_admin(get_user_institution()))
    );

-- Delete policy: Only admins can delete
CREATE POLICY "members_delete_policy" ON members
    FOR DELETE USING (is_admin());

-- ========================================
-- EVENTS POLICIES
-- ========================================

-- View policy: Published events are public, drafts need auth
CREATE POLICY "events_select_policy" ON events
    FOR SELECT USING (
        status = 'published' OR
        created_by = auth.uid() OR
        is_admin()
    );

-- Insert policy: Authenticated users can create events
CREATE POLICY "events_insert_policy" ON events
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL
    );

-- Update policy: Creators and admins can update
CREATE POLICY "events_update_policy" ON events
    FOR UPDATE USING (
        created_by = auth.uid() OR
        is_admin()
    );

-- Delete policy: Creators and admins can delete
CREATE POLICY "events_delete_policy" ON events
    FOR DELETE USING (
        created_by = auth.uid() OR
        is_admin()
    );

-- ========================================
-- EVENT_REGISTRATIONS POLICIES
-- ========================================

-- View policy: Users see their own, admins see all
CREATE POLICY "event_registrations_select_policy" ON event_registrations
    FOR SELECT USING (
        user_id = auth.uid() OR
        is_admin() OR
        EXISTS (
            SELECT 1 FROM events
            WHERE events.id = event_registrations.event_id
            AND events.created_by = auth.uid()
        )
    );

-- Insert policy: Users can register themselves
CREATE POLICY "event_registrations_insert_policy" ON event_registrations
    FOR INSERT WITH CHECK (
        user_id = auth.uid() OR
        is_admin()
    );

-- Update policy: Admins and event creators can update
CREATE POLICY "event_registrations_update_policy" ON event_registrations
    FOR UPDATE USING (
        is_admin() OR
        EXISTS (
            SELECT 1 FROM events
            WHERE events.id = event_registrations.event_id
            AND events.created_by = auth.uid()
        )
    );

-- Delete policy: Users can cancel their own, admins can delete any
CREATE POLICY "event_registrations_delete_policy" ON event_registrations
    FOR DELETE USING (
        user_id = auth.uid() OR
        is_admin()
    );

-- ========================================
-- CPD_ACTIVITIES POLICIES
-- ========================================

-- View policy: Users see their own, admins see all
CREATE POLICY "cpd_activities_select_policy" ON cpd_activities
    FOR SELECT USING (
        user_id = auth.uid() OR
        is_admin()
    );

-- Insert policy: Users can create their own
CREATE POLICY "cpd_activities_insert_policy" ON cpd_activities
    FOR INSERT WITH CHECK (
        user_id = auth.uid() OR
        is_admin()
    );

-- Update policy: Users can update their own pending, admins can update all
CREATE POLICY "cpd_activities_update_policy" ON cpd_activities
    FOR UPDATE USING (
        (user_id = auth.uid() AND status = 'pending') OR
        is_admin()
    );

-- Delete policy: Users can delete their own pending, admins can delete any
CREATE POLICY "cpd_activities_delete_policy" ON cpd_activities
    FOR DELETE USING (
        (user_id = auth.uid() AND status = 'pending') OR
        is_admin()
    );

-- ========================================
-- EVENT_CERTIFICATES POLICIES
-- ========================================

-- View policy: Users see their own, admins see all
CREATE POLICY "event_certificates_select_policy" ON event_certificates
    FOR SELECT USING (
        user_id = auth.uid() OR
        is_admin()
    );

-- Insert policy: Only system/admins can create certificates
CREATE POLICY "event_certificates_insert_policy" ON event_certificates
    FOR INSERT WITH CHECK (is_admin());

-- Update policy: Only admins can update
CREATE POLICY "event_certificates_update_policy" ON event_certificates
    FOR UPDATE USING (is_admin());

-- Delete policy: Only super admins can delete
CREATE POLICY "event_certificates_delete_policy" ON event_certificates
    FOR DELETE USING (is_super_admin());

-- ========================================
-- PASSWORD_RESET_TOKENS POLICIES
-- ========================================

-- View policy: Users can only see their own tokens
CREATE POLICY "password_reset_tokens_select_policy" ON password_reset_tokens
    FOR SELECT USING (
        user_id = auth.uid() OR
        is_admin()
    );

-- Insert policy: Anyone can create (for reset requests)
CREATE POLICY "password_reset_tokens_insert_policy" ON password_reset_tokens
    FOR INSERT WITH CHECK (true);

-- Update policy: Only the token owner can update
CREATE POLICY "password_reset_tokens_update_policy" ON password_reset_tokens
    FOR UPDATE USING (
        user_id = auth.uid() OR
        is_admin()
    );

-- Delete policy: Admins only
CREATE POLICY "password_reset_tokens_delete_policy" ON password_reset_tokens
    FOR DELETE USING (is_admin());

-- ========================================
-- EMAIL_LOGS POLICIES
-- ========================================

-- View policy: Users see their own, admins see all
CREATE POLICY "email_logs_select_policy" ON email_logs
    FOR SELECT USING (
        user_id = auth.uid() OR
        is_admin()
    );

-- Insert policy: System only (service role)
CREATE POLICY "email_logs_insert_policy" ON email_logs
    FOR INSERT WITH CHECK (is_admin());

-- No update policy - logs should be immutable
-- No delete policy - logs should be immutable

-- ========================================
-- MEMBERSHIP_APPLICATIONS POLICIES
-- ========================================

-- View policy: Public can view their own, admins see all
CREATE POLICY "membership_applications_select_policy" ON membership_applications
    FOR SELECT USING (
        contact_person_email = auth.jwt() ->> 'email' OR
        is_admin()
    );

-- Insert policy: Anyone can apply (public)
CREATE POLICY "membership_applications_insert_policy" ON membership_applications
    FOR INSERT WITH CHECK (true);

-- Update policy: Only admins can update
CREATE POLICY "membership_applications_update_policy" ON membership_applications
    FOR UPDATE USING (is_admin());

-- Delete policy: Only super admins can delete
CREATE POLICY "membership_applications_delete_policy" ON membership_applications
    FOR DELETE USING (is_super_admin());

-- ========================================
-- MEMBERSHIP_FEES POLICIES
-- ========================================

-- View policy: Public can view active fees
CREATE POLICY "membership_fees_select_policy" ON membership_fees
    FOR SELECT USING (is_active = true OR is_admin());

-- Insert policy: Only admins
CREATE POLICY "membership_fees_insert_policy" ON membership_fees
    FOR INSERT WITH CHECK (is_admin());

-- Update policy: Only admins
CREATE POLICY "membership_fees_update_policy" ON membership_fees
    FOR UPDATE USING (is_admin());

-- Delete policy: Only super admins
CREATE POLICY "membership_fees_delete_policy" ON membership_fees
    FOR DELETE USING (is_super_admin());

-- ========================================
-- OPENLEARNING TABLES POLICIES
-- ========================================

-- OpenLearning Sync Logs - Admin only
CREATE POLICY "openlearning_sync_logs_select_policy" ON openlearning_sync_logs
    FOR SELECT USING (is_admin());

CREATE POLICY "openlearning_sync_logs_insert_policy" ON openlearning_sync_logs
    FOR INSERT WITH CHECK (is_admin());

-- OpenLearning Courses - Users see their own
CREATE POLICY "openlearning_courses_select_policy" ON openlearning_courses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM members
            WHERE members.id = openlearning_courses.member_id
            AND members.user_id = auth.uid()
        ) OR is_admin()
    );

CREATE POLICY "openlearning_courses_insert_policy" ON openlearning_courses
    FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "openlearning_courses_update_policy" ON openlearning_courses
    FOR UPDATE USING (is_admin());

-- OpenLearning API Logs - Users see their own
CREATE POLICY "openlearning_api_logs_select_policy" ON openlearning_api_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM members
            WHERE members.id = openlearning_api_logs.member_id
            AND members.user_id = auth.uid()
        ) OR is_admin()
    );

CREATE POLICY "openlearning_api_logs_insert_policy" ON openlearning_api_logs
    FOR INSERT WITH CHECK (is_admin());

-- OpenLearning SSO Sessions - Users see their own
CREATE POLICY "openlearning_sso_sessions_select_policy" ON openlearning_sso_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM members
            WHERE members.id = openlearning_sso_sessions.member_id
            AND members.user_id = auth.uid()
        ) OR is_admin()
    );

CREATE POLICY "openlearning_sso_sessions_insert_policy" ON openlearning_sso_sessions
    FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "openlearning_sso_sessions_update_policy" ON openlearning_sso_sessions
    FOR UPDATE USING (is_admin());

-- ========================================
-- SUCCESS MESSAGE
-- ========================================
DO $$
BEGIN
    RAISE NOTICE 'RLS policies created successfully!';
    RAISE NOTICE 'Helper functions created: 4';
    RAISE NOTICE 'Policies created: 50+';
    RAISE NOTICE 'All tables have RLS enabled';
END $$;
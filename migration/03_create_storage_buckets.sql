-- ========================================
-- EAU SYSTEM - STORAGE BUCKETS
-- Version: 2.0 - Clean Migration
-- Date: 24/01/2025
-- ========================================

-- Note: Storage buckets need to be created via Supabase Dashboard
-- This SQL provides the policies for the buckets

-- Expected buckets to be created in Dashboard:
-- 1. certificates (public)
-- 2. avatars (public)
-- 3. documents (private)
-- 4. event-images (public)

-- ========================================
-- CERTIFICATES BUCKET POLICIES
-- ========================================

-- Allow authenticated users to view certificates
INSERT INTO storage.policies (bucket_id, name, definition, mode)
VALUES (
    'certificates',
    'Allow authenticated users to view certificates',
    '{"Select": {"auth.uid()": "IS NOT", "value": null}}',
    'read'
) ON CONFLICT DO NOTHING;

-- Allow admins to upload certificates
INSERT INTO storage.policies (bucket_id, name, definition, mode)
VALUES (
    'certificates',
    'Allow admins to upload certificates',
    '{"Insert": {"auth.role()": "IN", "value": ["admin", "super_admin", "service_role"]}}',
    'write'
) ON CONFLICT DO NOTHING;

-- ========================================
-- AVATARS BUCKET POLICIES
-- ========================================

-- Allow public to view avatars
INSERT INTO storage.policies (bucket_id, name, definition, mode)
VALUES (
    'avatars',
    'Allow public to view avatars',
    '{"Select": {}}',
    'read'
) ON CONFLICT DO NOTHING;

-- Allow users to upload their own avatar
INSERT INTO storage.policies (bucket_id, name, definition, mode)
VALUES (
    'avatars',
    'Allow users to upload their own avatar',
    '{"Insert": {"auth.uid()": "IS NOT", "value": null}}',
    'write'
) ON CONFLICT DO NOTHING;

-- Allow users to update their own avatar
INSERT INTO storage.policies (bucket_id, name, definition, mode)
VALUES (
    'avatars',
    'Allow users to update their own avatar',
    '{"Update": {"auth.uid()": "IS NOT", "value": null}}',
    'write'
) ON CONFLICT DO NOTHING;

-- ========================================
-- DOCUMENTS BUCKET POLICIES
-- ========================================

-- Allow users to view their own documents
INSERT INTO storage.policies (bucket_id, name, definition, mode)
VALUES (
    'documents',
    'Allow users to view their own documents',
    '{"Select": {"auth.uid()": "IS NOT", "value": null}}',
    'read'
) ON CONFLICT DO NOTHING;

-- Allow users to upload documents
INSERT INTO storage.policies (bucket_id, name, definition, mode)
VALUES (
    'documents',
    'Allow users to upload documents',
    '{"Insert": {"auth.uid()": "IS NOT", "value": null}}',
    'write'
) ON CONFLICT DO NOTHING;

-- ========================================
-- EVENT-IMAGES BUCKET POLICIES
-- ========================================

-- Allow public to view event images
INSERT INTO storage.policies (bucket_id, name, definition, mode)
VALUES (
    'event-images',
    'Allow public to view event images',
    '{"Select": {}}',
    'read'
) ON CONFLICT DO NOTHING;

-- Allow authenticated users to upload event images
INSERT INTO storage.policies (bucket_id, name, definition, mode)
VALUES (
    'event-images',
    'Allow authenticated users to upload event images',
    '{"Insert": {"auth.uid()": "IS NOT", "value": null}}',
    'write'
) ON CONFLICT DO NOTHING;

-- ========================================
-- MANUAL STEPS REQUIRED
-- ========================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=====================================';
    RAISE NOTICE 'MANUAL STEPS REQUIRED IN DASHBOARD:';
    RAISE NOTICE '=====================================';
    RAISE NOTICE '';
    RAISE NOTICE '1. Go to Storage in Supabase Dashboard';
    RAISE NOTICE '2. Create the following buckets:';
    RAISE NOTICE '   - certificates (public)';
    RAISE NOTICE '   - avatars (public)';
    RAISE NOTICE '   - documents (private)';
    RAISE NOTICE '   - event-images (public)';
    RAISE NOTICE '';
    RAISE NOTICE 'The policies have been prepared but need';
    RAISE NOTICE 'the buckets to exist first.';
    RAISE NOTICE '=====================================';
END $$;
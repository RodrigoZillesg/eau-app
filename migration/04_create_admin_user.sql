-- ========================================
-- EAU SYSTEM - CREATE INITIAL ADMIN USER
-- Version: 2.0 - Clean Migration
-- Date: 24/01/2025
-- ========================================

-- This script creates the initial admin user
-- You'll need to run this AFTER enabling authentication in Supabase Dashboard

-- Note: Replace the email and password with your desired admin credentials

DO $$
DECLARE
    admin_user_id UUID;
    admin_email VARCHAR := 'rrzillesg@gmail.com';
    admin_name VARCHAR := 'System Administrator';
BEGIN
    -- Check if user already exists
    SELECT id INTO admin_user_id
    FROM auth.users
    WHERE email = admin_email
    LIMIT 1;

    IF admin_user_id IS NULL THEN
        RAISE NOTICE 'Creating admin user...';

        -- Note: User creation must be done via Supabase Auth API or Dashboard
        -- This is just to set up the member record after user is created

        RAISE NOTICE '';
        RAISE NOTICE '=====================================';
        RAISE NOTICE 'MANUAL STEP REQUIRED:';
        RAISE NOTICE '=====================================';
        RAISE NOTICE '';
        RAISE NOTICE 'Please create the admin user in Supabase Dashboard:';
        RAISE NOTICE '1. Go to Authentication > Users';
        RAISE NOTICE '2. Click "Add User"';
        RAISE NOTICE '3. Email: %', admin_email;
        RAISE NOTICE '4. Password: Salmo119:97 (or your preferred password)';
        RAISE NOTICE '5. Auto Confirm User: YES';
        RAISE NOTICE '';
        RAISE NOTICE 'After creating the user, run script 05_setup_admin_member.sql';
        RAISE NOTICE '=====================================';
    ELSE
        RAISE NOTICE 'Admin user already exists with ID: %', admin_user_id;
    END IF;
END $$;
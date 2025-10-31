-- ========================================
-- EAU SYSTEM - SETUP ADMIN MEMBER RECORD
-- Version: 2.0 - Clean Migration
-- Date: 24/01/2025
-- ========================================

-- Run this AFTER creating the admin user in Supabase Dashboard

DO $$
DECLARE
    admin_user_id UUID;
    admin_email VARCHAR := 'rrzillesg@gmail.com';
    admin_member_id UUID;
BEGIN
    -- Get the admin user ID
    SELECT id INTO admin_user_id
    FROM auth.users
    WHERE email = admin_email
    LIMIT 1;

    IF admin_user_id IS NULL THEN
        RAISE EXCEPTION 'Admin user not found. Please create the user first in Supabase Dashboard.';
    END IF;

    -- Update user metadata to include role
    UPDATE auth.users
    SET raw_user_meta_data = jsonb_build_object(
        'full_name', 'System Administrator',
        'role', 'super_admin'
    )
    WHERE id = admin_user_id;

    -- Check if member record exists
    SELECT id INTO admin_member_id
    FROM members
    WHERE email = admin_email
    LIMIT 1;

    IF admin_member_id IS NULL THEN
        -- Create member record
        INSERT INTO members (
            email,
            first_name,
            last_name,
            user_id,
            user_type,
            membership_status,
            created_at
        ) VALUES (
            admin_email,
            'System',
            'Administrator',
            admin_user_id,
            'super_admin',
            'active',
            NOW()
        ) RETURNING id INTO admin_member_id;

        RAISE NOTICE 'Admin member record created with ID: %', admin_member_id;
    ELSE
        -- Update existing member record
        UPDATE members
        SET
            user_id = admin_user_id,
            user_type = 'super_admin',
            membership_status = 'active',
            updated_at = NOW()
        WHERE id = admin_member_id;

        RAISE NOTICE 'Admin member record updated with ID: %', admin_member_id;
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE '=====================================';
    RAISE NOTICE 'ADMIN SETUP COMPLETE!';
    RAISE NOTICE '=====================================';
    RAISE NOTICE 'Email: %', admin_email;
    RAISE NOTICE 'User ID: %', admin_user_id;
    RAISE NOTICE 'Member ID: %', admin_member_id;
    RAISE NOTICE 'Role: super_admin';
    RAISE NOTICE '=====================================';

END $$;
-- Check if users were imported successfully
-- Run this query in Supabase SQL Editor to verify the import

-- Count total members
SELECT COUNT(*) as total_members FROM members;

-- Show the first 10 imported members with legacy_user_id
SELECT 
    id,
    legacy_user_id,
    first_name,
    last_name,
    email,
    cpd_activities_count,
    cpd_points_total,
    cpd_goal_achieved,
    cpd_goal_target,
    created_at
FROM members
WHERE legacy_user_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- Check for specific users from the CSV
SELECT 
    legacy_user_id,
    email,
    first_name || ' ' || last_name as full_name,
    cpd_points_total
FROM members
WHERE email IN (
    'liz.dutoit@ivt.com.au',
    'arose@advsol.com',
    'brettblacker@englishaustralia.com.au',
    'sophieokeefe@englishaustralia.com.au'
);
-- Script to add default roles to imported members
-- First, check if member_roles table exists, if not create it
CREATE TABLE IF NOT EXISTS public.member_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    UNIQUE(member_id, role)
);

-- Remove the old check constraint if it exists
ALTER TABLE member_roles DROP CONSTRAINT IF EXISTS member_roles_role_check;

-- Add all members who don't have any role yet as 'member'
INSERT INTO member_roles (member_id, role)
SELECT m.id, 'member'
FROM members m
WHERE NOT EXISTS (
    SELECT 1 FROM member_roles mr 
    WHERE mr.member_id = m.id
)
AND m.id IS NOT NULL;

-- Count how many roles were added
SELECT 
    COUNT(*) as total_members,
    (SELECT COUNT(*) FROM member_roles) as total_roles_assigned,
    (SELECT COUNT(DISTINCT member_id) FROM member_roles) as members_with_roles
FROM members;

-- Verify some members have roles now
SELECT 
    m.email,
    m.first_name,
    m.last_name,
    mr.role
FROM members m
LEFT JOIN member_roles mr ON mr.member_id = m.id
LIMIT 10;
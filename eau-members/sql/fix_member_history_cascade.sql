-- Fix member_history foreign key to cascade on delete
-- This allows the history to be deleted when a member is deleted

-- First, drop the existing constraint
ALTER TABLE member_history 
DROP CONSTRAINT IF EXISTS member_history_member_id_fkey;

-- Add it back with CASCADE DELETE
ALTER TABLE member_history
ADD CONSTRAINT member_history_member_id_fkey
FOREIGN KEY (member_id) 
REFERENCES members(id) 
ON DELETE CASCADE;

-- Also do the same for member_roles
ALTER TABLE member_roles
DROP CONSTRAINT IF EXISTS member_roles_member_id_fkey;

ALTER TABLE member_roles
ADD CONSTRAINT member_roles_member_id_fkey
FOREIGN KEY (member_id)
REFERENCES members(id)
ON DELETE CASCADE;

-- Verify the constraints
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname IN ('member_history_member_id_fkey', 'member_roles_member_id_fkey');
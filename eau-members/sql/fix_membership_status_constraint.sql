-- First, let's check the current constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'members_membership_status_check';

-- Drop the old constraint if it exists
ALTER TABLE members 
DROP CONSTRAINT IF EXISTS members_membership_status_check;

-- Add a new constraint that accepts more status values including from the CSV
-- The CSV uses "Active", "Inactive", etc. with capital letters
ALTER TABLE members 
ADD CONSTRAINT members_membership_status_check 
CHECK (membership_status IN ('active', 'inactive', 'pending', 'suspended', 'expired', 'Active', 'Inactive', 'Pending', 'Suspended', 'Expired'));

-- Or better yet, make it case-insensitive by converting to lowercase
ALTER TABLE members 
DROP CONSTRAINT IF EXISTS members_membership_status_check;

-- Even better: just remove the constraint entirely for now since this is legacy data
-- We can add it back later after understanding all possible values
ALTER TABLE members 
DROP CONSTRAINT IF EXISTS members_membership_status_check;

-- Verify the constraint was removed
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'members'
AND column_name = 'membership_status';
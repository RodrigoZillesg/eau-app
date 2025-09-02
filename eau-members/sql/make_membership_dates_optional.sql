-- Make membership date fields optional since some records have invalid dates
ALTER TABLE memberships 
ALTER COLUMN start_date DROP NOT NULL;

ALTER TABLE memberships 
ALTER COLUMN expiry_date DROP NOT NULL;

-- Verify changes
SELECT column_name, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'memberships' 
AND column_name IN ('start_date', 'expiry_date');
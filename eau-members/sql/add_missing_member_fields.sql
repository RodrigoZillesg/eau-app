-- Add missing fields to members table
-- These fields are referenced in the import but were not added in the initial setup

-- Add postcode field
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS postcode VARCHAR(20);

-- Add state field  
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS state VARCHAR(50);

-- Add country field
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'Australia';

-- Verify the columns were added
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'members'
AND column_name IN ('postcode', 'state', 'country')
ORDER BY column_name;
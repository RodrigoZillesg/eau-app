-- Add fields needed for user import from legacy system
-- These fields will store legacy system data and CPD tracking information

-- Add legacy user ID field
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS legacy_user_id INTEGER UNIQUE;

-- Add user_id field to link with auth.users
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add CPD tracking fields
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS cpd_activities_count INTEGER DEFAULT 0;

ALTER TABLE members 
ADD COLUMN IF NOT EXISTS cpd_points_total DECIMAL(10,2) DEFAULT 0.00;

ALTER TABLE members 
ADD COLUMN IF NOT EXISTS cpd_goal_target DECIMAL(10,2) DEFAULT 0.00;

ALTER TABLE members 
ADD COLUMN IF NOT EXISTS cpd_goal_achieved DECIMAL(10,2) DEFAULT 0.00;

-- Add institution field (organization)
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS institution VARCHAR(255);

-- Add display name field (for "First Last" format)
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS display_name VARCHAR(255);

-- Add avatar URL field (if not exists)
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_members_legacy_user_id ON members(legacy_user_id);
CREATE INDEX IF NOT EXISTS idx_members_user_id ON members(user_id);
CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);

-- Add comment to explain the fields
COMMENT ON COLUMN members.legacy_user_id IS 'User ID from the old system for reference';
COMMENT ON COLUMN members.cpd_activities_count IS 'Number of CPD activities completed';
COMMENT ON COLUMN members.cpd_points_total IS 'Total CPD points accumulated';
COMMENT ON COLUMN members.cpd_goal_target IS 'Target CPD points for the period';
COMMENT ON COLUMN members.cpd_goal_achieved IS 'CPD points achieved towards goal';
COMMENT ON COLUMN members.institution IS 'Institution or organization the member belongs to';
COMMENT ON COLUMN members.display_name IS 'Full name as displayed in the system';

-- Update existing members to set display_name
UPDATE members 
SET display_name = CONCAT(first_name, ' ', last_name)
WHERE display_name IS NULL;
-- Add interest_group field to members table
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS interest_group VARCHAR(50);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_members_interest_group ON members(interest_group);

-- Update existing members with default groups based on membership_type
UPDATE members 
SET interest_group = CASE 
  WHEN membership_type = 'corporate' THEN 'Corporate Affiliate'
  WHEN membership_type = 'premium' THEN 'Full Provider'
  WHEN membership_type = 'student' THEN 'Professional Affiliate'
  WHEN membership_type = 'standard' THEN 'Associate Provider'
  ELSE NULL
END
WHERE interest_group IS NULL;

-- Create a table for interest groups configuration
CREATE TABLE IF NOT EXISTS interest_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default interest groups
INSERT INTO interest_groups (name, description) VALUES
  ('Full Provider', 'Colleges registered on CRICOS as an ELICOS provider for 12+ months'),
  ('Associate Provider', 'Newly established colleges (registered <12 months)'),
  ('Corporate Affiliate', 'Organizations providing products/services to international education sector'),
  ('Professional Affiliate', 'Non-ELICOS colleges involved in English language tuition')
ON CONFLICT (name) DO NOTHING;

-- Add RLS policies
ALTER TABLE interest_groups ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read interest groups
CREATE POLICY "interest_groups_read" ON interest_groups
  FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can modify interest groups
CREATE POLICY "interest_groups_admin" ON interest_groups
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'super_admin')
    )
  );
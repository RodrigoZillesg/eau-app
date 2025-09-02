-- ============================================
-- SETUP FOR CPD ACTIVITIES IMPORT
-- Execute this script in Supabase SQL Editor
-- ============================================

-- Step 1: Create CPD activities table (if not exists)
CREATE TABLE IF NOT EXISTS cpd_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Activity details
    category_id INTEGER NOT NULL,
    category_name TEXT NOT NULL,
    activity_title TEXT NOT NULL,
    description TEXT,
    provider TEXT,
    date_completed DATE NOT NULL,
    
    -- Time and points
    hours DECIMAL(5,2) NOT NULL DEFAULT 0,
    minutes INTEGER DEFAULT 0,
    points DECIMAL(5,2) NOT NULL DEFAULT 0,
    
    -- Evidence
    evidence_url TEXT,
    evidence_filename TEXT,
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cpd_activities_member_id ON cpd_activities(member_id);
CREATE INDEX IF NOT EXISTS idx_cpd_activities_user_id ON cpd_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_cpd_activities_status ON cpd_activities(status);
CREATE INDEX IF NOT EXISTS idx_cpd_activities_date_completed ON cpd_activities(date_completed);
CREATE INDEX IF NOT EXISTS idx_cpd_activities_created_at ON cpd_activities(created_at);
CREATE INDEX IF NOT EXISTS idx_cpd_activities_category_id ON cpd_activities(category_id);
CREATE INDEX IF NOT EXISTS idx_cpd_activities_email_lookup ON cpd_activities(user_id, member_id);

-- Step 3: Enable RLS
ALTER TABLE cpd_activities ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view own cpd activities" ON cpd_activities;
DROP POLICY IF EXISTS "Users can create own cpd activities" ON cpd_activities;
DROP POLICY IF EXISTS "Users can update own pending cpd activities" ON cpd_activities;
DROP POLICY IF EXISTS "Admins can view all cpd activities" ON cpd_activities;
DROP POLICY IF EXISTS "Admins can update all cpd activities" ON cpd_activities;
DROP POLICY IF EXISTS "Admins can insert cpd activities" ON cpd_activities;
DROP POLICY IF EXISTS "Admins can delete cpd activities" ON cpd_activities;

-- Step 5: Create RLS policies
-- Users can view their own activities
CREATE POLICY "Users can view own cpd activities" ON cpd_activities
    FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own activities
CREATE POLICY "Users can create own cpd activities" ON cpd_activities
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending activities
CREATE POLICY "Users can update own pending cpd activities" ON cpd_activities
    FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

-- Admins can do everything
CREATE POLICY "Admins can view all cpd activities" ON cpd_activities
    FOR SELECT USING (
        auth.jwt()->>'email' = 'rrzillesg@gmail.com'
    );

CREATE POLICY "Admins can insert cpd activities" ON cpd_activities
    FOR INSERT WITH CHECK (
        auth.jwt()->>'email' = 'rrzillesg@gmail.com'
    );

CREATE POLICY "Admins can update all cpd activities" ON cpd_activities
    FOR UPDATE USING (
        auth.jwt()->>'email' = 'rrzillesg@gmail.com'
    );

CREATE POLICY "Admins can delete cpd activities" ON cpd_activities
    FOR DELETE USING (
        auth.jwt()->>'email' = 'rrzillesg@gmail.com'
    );

-- Step 6: Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_cpd_activities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create trigger for updated_at
DROP TRIGGER IF EXISTS update_cpd_activities_updated_at ON cpd_activities;
CREATE TRIGGER update_cpd_activities_updated_at
    BEFORE UPDATE ON cpd_activities
    FOR EACH ROW
    EXECUTE FUNCTION update_cpd_activities_updated_at();

-- Step 8: Add legacy activity ID field for import reference (optional)
ALTER TABLE cpd_activities 
ADD COLUMN IF NOT EXISTS legacy_activity_id INTEGER;

CREATE INDEX IF NOT EXISTS idx_cpd_activities_legacy_id ON cpd_activities(legacy_activity_id);

-- Step 9: Verify the table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'cpd_activities'
ORDER BY ordinal_position;

-- Step 10: Check if table exists and has the right structure
SELECT 
    'cpd_activities table created successfully!' as status,
    COUNT(*) as existing_records
FROM cpd_activities;

-- If you see the table structure and status message, the setup is complete!
-- You can now import CPD activities using the Import Activities page.
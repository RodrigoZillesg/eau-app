-- Create CPD activities table
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

-- Create indexes
CREATE INDEX idx_cpd_activities_member_id ON cpd_activities(member_id);
CREATE INDEX idx_cpd_activities_user_id ON cpd_activities(user_id);
CREATE INDEX idx_cpd_activities_status ON cpd_activities(status);
CREATE INDEX idx_cpd_activities_date_completed ON cpd_activities(date_completed);
CREATE INDEX idx_cpd_activities_created_at ON cpd_activities(created_at);

-- Create RLS policies
ALTER TABLE cpd_activities ENABLE ROW LEVEL SECURITY;

-- Users can view their own activities
CREATE POLICY "Users can view own cpd activities" ON cpd_activities
    FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own activities
CREATE POLICY "Users can create own cpd activities" ON cpd_activities
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending activities
CREATE POLICY "Users can update own pending cpd activities" ON cpd_activities
    FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

-- Admins can view all activities
CREATE POLICY "Admins can view all cpd activities" ON cpd_activities
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM members 
            WHERE email = auth.jwt()->>'email' 
            AND email = 'rrzillesg@gmail.com'
        )
    );

-- Admins can update all activities
CREATE POLICY "Admins can update all cpd activities" ON cpd_activities
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM members 
            WHERE email = auth.jwt()->>'email' 
            AND email = 'rrzillesg@gmail.com'
        )
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_cpd_activities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_cpd_activities_updated_at
    BEFORE UPDATE ON cpd_activities
    FOR EACH ROW
    EXECUTE FUNCTION update_cpd_activities_updated_at();
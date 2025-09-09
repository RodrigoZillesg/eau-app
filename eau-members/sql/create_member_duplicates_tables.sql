-- =====================================================
-- MEMBER DUPLICATES MANAGEMENT SYSTEM
-- =====================================================
-- This script creates the necessary tables for managing
-- member duplicates detection and merge operations
-- =====================================================

-- Table for tracking potential duplicate members
CREATE TABLE IF NOT EXISTS member_duplicates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member1_id UUID REFERENCES members(id) ON DELETE CASCADE,
    member2_id UUID REFERENCES members(id) ON DELETE CASCADE,
    
    -- Similarity scoring
    similarity_score INTEGER NOT NULL,
    match_details JSONB, -- Detailed breakdown of what matched
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'merged', 'not_duplicate', 'skipped')),
    
    -- Review information
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_notes TEXT,
    
    -- Merge configuration (if merged)
    merge_config JSONB, -- Which fields to keep from which member
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure we don't have duplicate pairs
    CONSTRAINT unique_member_pair UNIQUE (member1_id, member2_id),
    CONSTRAINT different_members CHECK (member1_id != member2_id)
);

-- Table for storing merge history
CREATE TABLE IF NOT EXISTS member_merge_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Members involved
    kept_member_id UUID REFERENCES members(id) ON DELETE SET NULL,
    deleted_member_id UUID, -- No FK as member will be deleted
    deleted_member_data JSONB, -- Store full data of deleted member
    
    -- Merge details
    merge_data JSONB, -- What data was merged and how
    relationships_transferred JSONB, -- CPD activities, events, etc.
    
    -- Who performed the merge
    performed_by UUID REFERENCES auth.users(id),
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Undo capability
    can_undo BOOLEAN DEFAULT true,
    undo_deadline TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
    undone BOOLEAN DEFAULT false,
    undone_by UUID REFERENCES auth.users(id),
    undone_at TIMESTAMP WITH TIME ZONE
);

-- Table for CSV import sessions
CREATE TABLE IF NOT EXISTS member_import_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Import details
    filename TEXT NOT NULL,
    file_size INTEGER,
    total_rows INTEGER,
    
    -- Processing status
    status VARCHAR(20) DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed', 'cancelled')),
    
    -- Statistics
    members_imported INTEGER DEFAULT 0,
    members_updated INTEGER DEFAULT 0,
    members_skipped INTEGER DEFAULT 0,
    duplicates_found INTEGER DEFAULT 0,
    errors JSONB,
    
    -- Import configuration
    import_config JSONB, -- Column mappings, rules, etc.
    
    -- Who initiated
    imported_by UUID REFERENCES auth.users(id),
    imported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Processing details
    processing_notes TEXT
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_member_duplicates_status ON member_duplicates(status);
CREATE INDEX IF NOT EXISTS idx_member_duplicates_score ON member_duplicates(similarity_score DESC);
CREATE INDEX IF NOT EXISTS idx_member_duplicates_member1 ON member_duplicates(member1_id);
CREATE INDEX IF NOT EXISTS idx_member_duplicates_member2 ON member_duplicates(member2_id);
CREATE INDEX IF NOT EXISTS idx_merge_history_kept_member ON member_merge_history(kept_member_id);
CREATE INDEX IF NOT EXISTS idx_merge_history_performed_at ON member_merge_history(performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_import_sessions_status ON member_import_sessions(status);
CREATE INDEX IF NOT EXISTS idx_import_sessions_imported_at ON member_import_sessions(imported_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for member_duplicates
CREATE TRIGGER update_member_duplicates_updated_at 
    BEFORE UPDATE ON member_duplicates 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE member_duplicates ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_merge_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_import_sessions ENABLE ROW LEVEL SECURITY;

-- Only admins can manage duplicates
CREATE POLICY admin_all_member_duplicates ON member_duplicates
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('admin', 'admin_super')
        )
    );

CREATE POLICY admin_all_merge_history ON member_merge_history
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('admin', 'admin_super')
        )
    );

CREATE POLICY admin_all_import_sessions ON member_import_sessions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('admin', 'admin_super')
        )
    );

-- View for pending duplicates with member details
CREATE OR REPLACE VIEW pending_duplicates_view AS
SELECT 
    md.*,
    m1.first_name AS member1_first_name,
    m1.last_name AS member1_last_name,
    m1.email AS member1_email,
    m1.company_name AS member1_company,
    m2.first_name AS member2_first_name,
    m2.last_name AS member2_last_name,
    m2.email AS member2_email,
    m2.company_name AS member2_company
FROM member_duplicates md
JOIN members m1 ON m1.id = md.member1_id
JOIN members m2 ON m2.id = md.member2_id
WHERE md.status = 'pending'
ORDER BY md.similarity_score DESC;
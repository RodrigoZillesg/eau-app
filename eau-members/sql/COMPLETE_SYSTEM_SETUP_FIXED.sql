-- ============================================
-- COMPLETE SYSTEM SETUP FOR EAU MEMBERSHIP - FIXED VERSION
-- Execute this entire script in Supabase SQL Editor
-- ============================================

-- Step 1: Create Companies table (Organizations/Institutions)
CREATE TABLE IF NOT EXISTS companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    legacy_company_id INTEGER UNIQUE,
    
    -- Basic Information
    company_name VARCHAR(255) NOT NULL,
    parent_company VARCHAR(255),
    abn VARCHAR(50), -- Australian Business Number
    company_email VARCHAR(255),
    company_type VARCHAR(100), -- ELICOS College, etc
    cricos_code VARCHAR(50), -- Provider code for international education
    
    -- Address
    address_line_1 VARCHAR(255),
    address_line_2 VARCHAR(255),
    address_line_3 VARCHAR(255),
    suburb VARCHAR(100),
    postcode VARCHAR(20),
    state VARCHAR(50),
    country VARCHAR(100) DEFAULT 'Australia',
    phone VARCHAR(50),
    
    -- Additional Info
    website VARCHAR(255),
    logo_url TEXT,
    courses_offered TEXT, -- Comma separated list
    member_since DATE,
    membership_cancellation_details TEXT,
    
    -- Primary Contact (will reference members table)
    primary_contact_id UUID,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Step 2: Create Memberships table (The actual membership/subscription)
CREATE TABLE IF NOT EXISTS memberships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    legacy_membership_id INTEGER UNIQUE,
    
    -- Membership Details
    start_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    last_renewed_date TIMESTAMP,
    previous_expiry_date DATE,
    
    -- Status
    status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Pending', 'Expired', 'Cancelled')),
    pending_status VARCHAR(100),
    
    -- Type and Category
    category VARCHAR(100), -- Organisation, Individual
    membership_type VARCHAR(100), -- Member College - Full, Member College - Associate, etc
    pricing_option VARCHAR(100),
    pricing_option_cost DECIMAL(10,2) DEFAULT 0,
    target_type VARCHAR(50), -- Individual/Organisation
    
    -- Members Count (for organizational memberships)
    total_members INTEGER DEFAULT 1,
    
    -- Link to Company (for organizational memberships)
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Primary Contact (for organizational memberships)
    primary_contact_user_id INTEGER,
    primary_contact_member_id UUID,
    
    -- Order/Payment Information - Signup
    signup_order_id VARCHAR(100),
    signup_order_total DECIMAL(10,2),
    signup_order_status VARCHAR(50),
    signup_payment_method VARCHAR(100),
    signup_payment_received_date TIMESTAMP,
    
    -- Order/Payment Information - Last Renewal
    renewal_order_id VARCHAR(100),
    renewal_order_total DECIMAL(10,2),
    renewal_order_status VARCHAR(50),
    renewal_payment_method VARCHAR(100),
    renewal_payment_received_date TIMESTAMP,
    
    -- Approval Information
    approved_date TIMESTAMP,
    approver_first_name VARCHAR(100),
    approver_last_name VARCHAR(100),
    approver_email VARCHAR(255),
    
    -- Modification Tracking
    last_modified_date TIMESTAMP,
    last_modifier_user_id INTEGER,
    last_modifier_first_name VARCHAR(100),
    last_modifier_last_name VARCHAR(100),
    last_modifier_email VARCHAR(255),
    
    -- Creation Tracking
    created_date TIMESTAMP DEFAULT NOW(),
    creator_first_name VARCHAR(100),
    creator_last_name VARCHAR(100),
    creator_email VARCHAR(255),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Update Members table with new fields
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS membership_id UUID REFERENCES memberships(id) ON DELETE SET NULL;

ALTER TABLE members 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE SET NULL;

ALTER TABLE members 
ADD COLUMN IF NOT EXISTS title VARCHAR(20); -- Mr, Mrs, Ms, Dr, etc

ALTER TABLE members 
ADD COLUMN IF NOT EXISTS position VARCHAR(255); -- Job title/position

ALTER TABLE members 
ADD COLUMN IF NOT EXISTS street_address VARCHAR(255);

ALTER TABLE members 
ADD COLUMN IF NOT EXISTS street_address_line_2 VARCHAR(255);

ALTER TABLE members 
ADD COLUMN IF NOT EXISTS suburb VARCHAR(100);

ALTER TABLE members 
ADD COLUMN IF NOT EXISTS mobile VARCHAR(50);

ALTER TABLE members 
ADD COLUMN IF NOT EXISTS bio TEXT;

ALTER TABLE members 
ADD COLUMN IF NOT EXISTS board_member_role VARCHAR(255);

ALTER TABLE members 
ADD COLUMN IF NOT EXISTS area_of_expertise TEXT;

ALTER TABLE members 
ADD COLUMN IF NOT EXISTS teacher_since DATE;

ALTER TABLE members 
ADD COLUMN IF NOT EXISTS courses_taught TEXT;

ALTER TABLE members 
ADD COLUMN IF NOT EXISTS interest_tags TEXT;

ALTER TABLE members 
ADD COLUMN IF NOT EXISTS subscriptions TEXT;

ALTER TABLE members 
ADD COLUMN IF NOT EXISTS email_subscriptions TEXT;

ALTER TABLE members 
ADD COLUMN IF NOT EXISTS unsubscribe_notes TEXT;

ALTER TABLE members 
ADD COLUMN IF NOT EXISTS username VARCHAR(255) UNIQUE;

ALTER TABLE members 
ADD COLUMN IF NOT EXISTS groups TEXT; -- Comma separated groups

ALTER TABLE members 
ADD COLUMN IF NOT EXISTS is_test_member BOOLEAN DEFAULT FALSE;

ALTER TABLE members 
ADD COLUMN IF NOT EXISTS is_editable_address BOOLEAN DEFAULT TRUE;

ALTER TABLE members 
ADD COLUMN IF NOT EXISTS member_created_date TIMESTAMP;

ALTER TABLE members 
ADD COLUMN IF NOT EXISTS member_last_edited TIMESTAMP;

-- Add company name denormalized for convenience
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS company_name VARCHAR(255);

ALTER TABLE members 
ADD COLUMN IF NOT EXISTS company_name_actual VARCHAR(255);

-- Step 4: Add foreign key for primary contact after members table is updated
ALTER TABLE companies 
ADD CONSTRAINT fk_primary_contact 
FOREIGN KEY (primary_contact_id) 
REFERENCES members(id) 
ON DELETE SET NULL;

-- Step 5: Add foreign key for membership primary contact
ALTER TABLE memberships 
ADD CONSTRAINT fk_primary_contact_member 
FOREIGN KEY (primary_contact_member_id) 
REFERENCES members(id) 
ON DELETE SET NULL;

-- Step 6: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_companies_legacy_id ON companies(legacy_company_id);
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(company_name);
CREATE INDEX IF NOT EXISTS idx_companies_abn ON companies(abn);
CREATE INDEX IF NOT EXISTS idx_companies_cricos ON companies(cricos_code);

CREATE INDEX IF NOT EXISTS idx_memberships_legacy_id ON memberships(legacy_membership_id);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON memberships(status);
CREATE INDEX IF NOT EXISTS idx_memberships_expiry ON memberships(expiry_date);
CREATE INDEX IF NOT EXISTS idx_memberships_company ON memberships(company_id);

CREATE INDEX IF NOT EXISTS idx_members_membership ON members(membership_id);
CREATE INDEX IF NOT EXISTS idx_members_company ON members(company_id);
CREATE INDEX IF NOT EXISTS idx_members_username ON members(username);

-- Step 7: Create a view for easy querying of complete member information
CREATE OR REPLACE VIEW member_full_info AS
SELECT 
    m.*,
    c.company_name as company_full_name,
    c.abn as company_abn,
    c.cricos_code as company_cricos,
    c.website as company_website,
    ms.status as membership_status_current,
    ms.expiry_date as membership_expiry,
    ms.category as membership_category,
    ms.membership_type as membership_type_full
FROM members m
LEFT JOIN companies c ON m.company_id = c.id
LEFT JOIN memberships ms ON m.membership_id = ms.id;

-- Step 8: Enable RLS for new tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

-- Step 9: Create RLS policies for companies (SIMPLIFIED - NO user_roles)
CREATE POLICY "Anyone can view companies" ON companies
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage companies" ON companies
    FOR ALL USING (
        auth.jwt()->>'email' = 'rrzillesg@gmail.com'
        OR auth.jwt()->>'email' LIKE '%@englishaustralia.com.au'
    );

-- Step 10: Create RLS policies for memberships (SIMPLIFIED - NO user_roles)
CREATE POLICY "Members can view their own membership" ON memberships
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM members 
            WHERE members.membership_id = memberships.id 
            AND members.user_id = auth.uid()
        )
        OR auth.jwt()->>'email' = 'rrzillesg@gmail.com'
    );

CREATE POLICY "Admins can manage memberships" ON memberships
    FOR ALL USING (
        auth.jwt()->>'email' = 'rrzillesg@gmail.com'
        OR auth.jwt()->>'email' LIKE '%@englishaustralia.com.au'
    );

-- Step 11: Create trigger functions for updated_at
CREATE OR REPLACE FUNCTION update_companies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_memberships_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 12: Create triggers
DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW
    EXECUTE FUNCTION update_companies_updated_at();

DROP TRIGGER IF EXISTS update_memberships_updated_at ON memberships;
CREATE TRIGGER update_memberships_updated_at
    BEFORE UPDATE ON memberships
    FOR EACH ROW
    EXECUTE FUNCTION update_memberships_updated_at();

-- Step 13: Add comments for documentation
COMMENT ON TABLE companies IS 'Organizations/Institutions that have memberships';
COMMENT ON TABLE memberships IS 'Membership subscriptions - can be individual or organizational';
COMMENT ON COLUMN memberships.target_type IS 'Individual or Organisation - determines if this is a personal or company membership';
COMMENT ON COLUMN members.membership_id IS 'Link to the membership this member belongs to';
COMMENT ON COLUMN members.company_id IS 'Link to the company this member works for';

-- Step 14: Verify the setup
SELECT 
    'Setup completed successfully!' as status,
    (SELECT COUNT(*) FROM companies) as companies_count,
    (SELECT COUNT(*) FROM memberships) as memberships_count,
    (SELECT COUNT(*) FROM members) as members_count;

-- You can now import the complete CSV data!
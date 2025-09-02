-- =====================================================
-- Event Management System - Database Schema
-- Version: 1.0.0
-- Date: January 2025
-- =====================================================

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS cpd_event_activities CASCADE;
DROP TABLE IF EXISTS event_emails CASCADE;
DROP TABLE IF EXISTS event_registrations CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS event_categories CASCADE;

-- =====================================================
-- Event Categories Table
-- =====================================================
CREATE TABLE event_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color for UI
    icon VARCHAR(50), -- Icon name for UI
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- Events Table
-- =====================================================
CREATE TABLE events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Basic Information
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL, -- URL-friendly version of title
    description TEXT,
    short_description VARCHAR(500), -- For card previews
    image_url TEXT, -- Cover image
    
    -- Category
    category_id UUID REFERENCES event_categories(id) ON DELETE SET NULL,
    
    -- Date and Time
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    timezone VARCHAR(50) DEFAULT 'Australia/Sydney',
    
    -- Location
    location_type VARCHAR(20) CHECK (location_type IN ('physical', 'virtual', 'hybrid')) DEFAULT 'physical',
    venue_name VARCHAR(255),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Australia',
    virtual_link TEXT, -- For online events
    location_instructions TEXT, -- Parking, access instructions, etc.
    
    -- Capacity and Registration
    capacity INTEGER DEFAULT 100,
    waitlist_enabled BOOLEAN DEFAULT true,
    registration_start_date TIMESTAMP WITH TIME ZONE,
    registration_end_date TIMESTAMP WITH TIME ZONE,
    
    -- Pricing (in cents to avoid decimal issues)
    member_price_cents INTEGER DEFAULT 0,
    non_member_price_cents INTEGER DEFAULT 0,
    early_bird_price_cents INTEGER,
    early_bird_end_date TIMESTAMP WITH TIME ZONE,
    
    -- CPD Integration
    cpd_points DECIMAL(4,2) DEFAULT 0,
    cpd_category VARCHAR(100),
    
    -- Status and Visibility
    status VARCHAR(20) CHECK (status IN ('draft', 'published', 'cancelled', 'completed')) DEFAULT 'draft',
    visibility VARCHAR(20) CHECK (visibility IN ('public', 'members', 'private')) DEFAULT 'public',
    featured BOOLEAN DEFAULT false,
    
    -- Meta Information
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    
    -- Additional Settings
    allow_guests BOOLEAN DEFAULT false,
    max_guests_per_registration INTEGER DEFAULT 0,
    requires_approval BOOLEAN DEFAULT false,
    show_attendee_list BOOLEAN DEFAULT false,
    
    -- SEO and Marketing
    meta_title VARCHAR(160),
    meta_description VARCHAR(320),
    tags TEXT[], -- Array of tags for categorization
    
    -- Custom Fields (JSON for flexibility)
    custom_fields JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}'
);

-- =====================================================
-- Event Registrations Table
-- =====================================================
CREATE TABLE event_registrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Relationships
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    member_id UUID REFERENCES members(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Registration Details
    registration_number VARCHAR(50) UNIQUE NOT NULL, -- e.g., EVT-2025-00001
    registration_type VARCHAR(20) CHECK (registration_type IN ('member', 'non_member', 'guest')) DEFAULT 'non_member',
    
    -- Personal Information (for non-members or guests)
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    organization VARCHAR(255),
    dietary_requirements TEXT,
    accessibility_requirements TEXT,
    
    -- Guest Information (if applicable)
    guest_count INTEGER DEFAULT 0,
    guest_names TEXT[], -- Array of guest names
    
    -- Status
    status VARCHAR(20) CHECK (status IN ('pending', 'confirmed', 'waitlisted', 'cancelled', 'refunded')) DEFAULT 'pending',
    
    -- Payment Information
    payment_status VARCHAR(20) CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'exempt')) DEFAULT 'pending',
    amount_paid_cents INTEGER DEFAULT 0,
    payment_method VARCHAR(50),
    payment_reference VARCHAR(255),
    paid_at TIMESTAMP WITH TIME ZONE,
    refunded_at TIMESTAMP WITH TIME ZONE,
    refund_amount_cents INTEGER DEFAULT 0,
    refund_reason TEXT,
    
    -- Attendance
    attended BOOLEAN DEFAULT false,
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_in_method VARCHAR(20) CHECK (check_in_method IN ('qr_code', 'manual', 'auto')),
    checked_in_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- QR Code
    qr_code_token VARCHAR(255) UNIQUE,
    qr_code_url TEXT,
    
    -- Approval (if event requires approval)
    approval_status VARCHAR(20) CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    approval_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    
    -- Additional Data
    notes TEXT,
    custom_responses JSONB DEFAULT '{}', -- For custom form fields
    source VARCHAR(50), -- How they registered (web, admin, import, etc.)
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100)
);

-- =====================================================
-- Event Emails Table
-- =====================================================
CREATE TABLE event_emails (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Relationships
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    
    -- Email Configuration
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'registration_confirmation',
        'payment_confirmation',
        'waitlist_notification',
        'reminder_1_week',
        'reminder_1_day',
        'reminder_1_hour',
        'cancellation_notice',
        'post_event_thank_you',
        'post_event_survey',
        'certificate_delivery',
        'custom'
    )),
    
    -- Content
    subject VARCHAR(255) NOT NULL,
    content TEXT NOT NULL, -- HTML content
    
    -- Scheduling
    is_active BOOLEAN DEFAULT true,
    send_trigger VARCHAR(50) CHECK (send_trigger IN (
        'immediate',
        'scheduled',
        'before_event',
        'after_event',
        'on_registration',
        'on_payment',
        'on_cancellation'
    )),
    send_offset_minutes INTEGER, -- Minutes before/after trigger
    scheduled_at TIMESTAMP WITH TIME ZONE,
    
    -- Tracking
    sent_count INTEGER DEFAULT 0,
    last_sent_at TIMESTAMP WITH TIME ZONE,
    
    -- Meta
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- CPD Event Activities Table
-- =====================================================
CREATE TABLE cpd_event_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Relationships
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    registration_id UUID REFERENCES event_registrations(id) ON DELETE SET NULL,
    
    -- CPD Details
    points_earned DECIMAL(4,2) NOT NULL,
    cpd_category VARCHAR(100),
    
    -- Certificate
    certificate_number VARCHAR(50) UNIQUE,
    certificate_url TEXT,
    certificate_generated_at TIMESTAMP WITH TIME ZONE,
    
    -- Status
    status VARCHAR(20) CHECK (status IN ('pending', 'approved', 'issued')) DEFAULT 'pending',
    
    -- Meta
    issued_at TIMESTAMP WITH TIME ZONE,
    issued_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure unique CPD entry per member per event
    UNIQUE(event_id, member_id)
);

-- =====================================================
-- Indexes for Performance
-- =====================================================

-- Events indexes
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_events_category ON events(category_id);
CREATE INDEX idx_events_slug ON events(slug);
CREATE INDEX idx_events_created_by ON events(created_by);
CREATE INDEX idx_events_visibility ON events(visibility);
CREATE INDEX idx_events_featured ON events(featured);

-- Event registrations indexes
CREATE INDEX idx_registrations_event ON event_registrations(event_id);
CREATE INDEX idx_registrations_member ON event_registrations(member_id);
CREATE INDEX idx_registrations_user ON event_registrations(user_id);
CREATE INDEX idx_registrations_status ON event_registrations(status);
CREATE INDEX idx_registrations_payment_status ON event_registrations(payment_status);
CREATE INDEX idx_registrations_qr_token ON event_registrations(qr_code_token);
CREATE INDEX idx_registrations_email ON event_registrations(email);

-- Event emails indexes
CREATE INDEX idx_emails_event ON event_emails(event_id);
CREATE INDEX idx_emails_type ON event_emails(type);
CREATE INDEX idx_emails_active ON event_emails(is_active);

-- CPD activities indexes
CREATE INDEX idx_cpd_event ON cpd_event_activities(event_id);
CREATE INDEX idx_cpd_member ON cpd_event_activities(member_id);
CREATE INDEX idx_cpd_registration ON cpd_event_activities(registration_id);
CREATE INDEX idx_cpd_status ON cpd_event_activities(status);

-- =====================================================
-- Functions and Triggers
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to tables
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_registrations_updated_at BEFORE UPDATE ON event_registrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_emails_updated_at BEFORE UPDATE ON event_emails
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_categories_updated_at BEFORE UPDATE ON event_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate registration number
CREATE OR REPLACE FUNCTION generate_registration_number()
RETURNS TRIGGER AS $$
DECLARE
    year_str TEXT;
    seq_num INTEGER;
    reg_number TEXT;
BEGIN
    -- Get current year
    year_str := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    
    -- Get next sequence number for this year
    SELECT COUNT(*) + 1 INTO seq_num
    FROM event_registrations
    WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE);
    
    -- Generate registration number (e.g., EVT-2025-00001)
    reg_number := 'EVT-' || year_str || '-' || LPAD(seq_num::TEXT, 5, '0');
    
    NEW.registration_number := reg_number;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply registration number trigger
CREATE TRIGGER generate_registration_number_trigger
    BEFORE INSERT ON event_registrations
    FOR EACH ROW
    WHEN (NEW.registration_number IS NULL)
    EXECUTE FUNCTION generate_registration_number();

-- Function to generate QR code token
CREATE OR REPLACE FUNCTION generate_qr_token()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.qr_code_token IS NULL THEN
        NEW.qr_code_token := encode(gen_random_bytes(32), 'hex');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply QR token trigger
CREATE TRIGGER generate_qr_token_trigger
    BEFORE INSERT ON event_registrations
    FOR EACH ROW
    EXECUTE FUNCTION generate_qr_token();

-- Function to generate event slug
CREATE OR REPLACE FUNCTION generate_event_slug()
RETURNS TRIGGER AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
BEGIN
    -- Generate base slug from title
    base_slug := LOWER(REGEXP_REPLACE(NEW.title, '[^a-zA-Z0-9]+', '-', 'g'));
    base_slug := TRIM(BOTH '-' FROM base_slug);
    
    -- Check if slug already exists
    final_slug := base_slug;
    WHILE EXISTS(SELECT 1 FROM events WHERE slug = final_slug AND id != NEW.id) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    
    NEW.slug := final_slug;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply slug generation trigger for INSERT
CREATE TRIGGER generate_event_slug_insert_trigger
    BEFORE INSERT ON events
    FOR EACH ROW
    WHEN (NEW.slug IS NULL)
    EXECUTE FUNCTION generate_event_slug();

-- Apply slug generation trigger for UPDATE
CREATE TRIGGER generate_event_slug_update_trigger
    BEFORE UPDATE OF title ON events
    FOR EACH ROW
    WHEN (OLD.title IS DISTINCT FROM NEW.title)
    EXECUTE FUNCTION generate_event_slug();

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE event_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE cpd_event_activities ENABLE ROW LEVEL SECURITY;

-- Event Categories Policies
CREATE POLICY "Event categories are viewable by everyone" ON event_categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Event categories are manageable by admins" ON event_categories
    FOR ALL USING (
        -- Simplified admin check - will need to be updated when roles table exists
        auth.uid() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM members m
            WHERE m.user_id = auth.uid()
            -- For now, we'll check if user exists in members table
            -- In the future, add: AND check for admin role
        )
    );

-- Events Policies
CREATE POLICY "Published events are viewable by everyone" ON events
    FOR SELECT USING (
        status = 'published' 
        AND (
            visibility = 'public' 
            OR (visibility = 'members' AND EXISTS (
                SELECT 1 FROM members WHERE user_id = auth.uid()
            ))
        )
    );

CREATE POLICY "Events are manageable by admins" ON events
    FOR ALL USING (
        -- Simplified admin check
        auth.uid() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM members m
            WHERE m.user_id = auth.uid()
        )
    );

-- Event Registrations Policies
CREATE POLICY "Users can view their own registrations" ON event_registrations
    FOR SELECT USING (
        user_id = auth.uid() 
        OR member_id IN (SELECT id FROM members WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can create their own registrations" ON event_registrations
    FOR INSERT WITH CHECK (
        user_id = auth.uid() 
        OR member_id IN (SELECT id FROM members WHERE user_id = auth.uid())
    );

CREATE POLICY "Admins can manage all registrations" ON event_registrations
    FOR ALL USING (
        -- Simplified admin check
        auth.uid() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM members m
            WHERE m.user_id = auth.uid()
        )
    );

-- Event Emails Policies (Admin only)
CREATE POLICY "Event emails are manageable by admins only" ON event_emails
    FOR ALL USING (
        -- Simplified admin check
        auth.uid() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM members m
            WHERE m.user_id = auth.uid()
        )
    );

-- CPD Activities Policies
CREATE POLICY "Users can view their own CPD activities" ON cpd_event_activities
    FOR SELECT USING (
        member_id IN (SELECT id FROM members WHERE user_id = auth.uid())
    );

CREATE POLICY "Admins can manage all CPD activities" ON cpd_event_activities
    FOR ALL USING (
        -- Simplified admin check
        auth.uid() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM members m
            WHERE m.user_id = auth.uid()
        )
    );

-- =====================================================
-- Seed Data
-- =====================================================

-- Insert default event categories
INSERT INTO event_categories (name, description, color, icon, sort_order) VALUES
    ('Conference', 'Large-scale professional conferences', '#8B5CF6', 'Users', 1),
    ('Workshop', 'Hands-on training sessions', '#10B981', 'Tool', 2),
    ('Webinar', 'Online educational presentations', '#3B82F6', 'Video', 3),
    ('Networking', 'Professional networking events', '#F59E0B', 'Network', 4),
    ('Training', 'Professional development training', '#EF4444', 'GraduationCap', 5),
    ('Social', 'Social and community events', '#EC4899', 'Heart', 6),
    ('Meeting', 'Business and member meetings', '#6B7280', 'Calendar', 7);

-- =====================================================
-- Views for Reporting
-- =====================================================

-- Event statistics view
CREATE OR REPLACE VIEW event_statistics AS
SELECT 
    e.id,
    e.title,
    e.start_date,
    e.capacity,
    COUNT(DISTINCT CASE WHEN er.status = 'confirmed' THEN er.id END) as confirmed_count,
    COUNT(DISTINCT CASE WHEN er.status = 'waitlisted' THEN er.id END) as waitlist_count,
    COUNT(DISTINCT CASE WHEN er.attended = true THEN er.id END) as attended_count,
    SUM(CASE WHEN er.payment_status = 'paid' THEN er.amount_paid_cents ELSE 0 END) as total_revenue_cents,
    ROUND(
        CASE 
            WHEN e.capacity > 0 
            THEN (COUNT(DISTINCT CASE WHEN er.status = 'confirmed' THEN er.id END)::DECIMAL / e.capacity) * 100
            ELSE 0 
        END, 2
    ) as occupancy_rate
FROM events e
LEFT JOIN event_registrations er ON e.id = er.event_id
GROUP BY e.id, e.title, e.start_date, e.capacity;

-- Member event history view
CREATE OR REPLACE VIEW member_event_history AS
SELECT 
    m.id as member_id,
    m.first_name,
    m.last_name,
    m.email,
    e.id as event_id,
    e.title as event_title,
    e.start_date,
    er.status as registration_status,
    er.payment_status,
    er.attended,
    cea.points_earned as cpd_points
FROM members m
LEFT JOIN event_registrations er ON m.id = er.member_id
LEFT JOIN events e ON er.event_id = e.id
LEFT JOIN cpd_event_activities cea ON cea.member_id = m.id AND cea.event_id = e.id
WHERE er.id IS NOT NULL
ORDER BY e.start_date DESC;

-- =====================================================
-- Grant Permissions
-- =====================================================

-- Grant usage on all tables to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant usage on views
GRANT SELECT ON event_statistics TO authenticated;
GRANT SELECT ON member_event_history TO authenticated;
-- Media Library Schema for EAU React Application
-- This schema creates tables for managing uploaded media files

-- Drop existing tables if they exist
DROP TABLE IF EXISTS media_usage CASCADE;
DROP TABLE IF EXISTS media_files CASCADE;
DROP TABLE IF EXISTS media_folders CASCADE;

-- Create media folders table for organizing media
CREATE TABLE media_folders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    parent_id UUID REFERENCES media_folders(id) ON DELETE CASCADE,
    path TEXT NOT NULL, -- Full path like /events/2024/
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(path)
);

-- Create media files table
CREATE TABLE media_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    folder_id UUID REFERENCES media_folders(id) ON DELETE SET NULL,
    
    -- File information
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL, -- image/jpeg, image/png, etc
    file_size INTEGER NOT NULL, -- in bytes
    mime_type VARCHAR(100),
    
    -- URLs
    url TEXT NOT NULL, -- Full URL to access the file
    thumbnail_url TEXT, -- Thumbnail version
    medium_url TEXT, -- Medium size version
    large_url TEXT, -- Large size version
    
    -- Image metadata
    width INTEGER,
    height INTEGER,
    alt_text TEXT,
    title VARCHAR(255),
    description TEXT,
    
    -- Categorization
    category VARCHAR(50) DEFAULT 'general', -- events, members, cpd, etc
    tags TEXT[], -- Array of tags
    
    -- Status
    status VARCHAR(20) DEFAULT 'active', -- active, archived, deleted
    is_public BOOLEAN DEFAULT false,
    
    -- Metadata
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create media usage tracking table
CREATE TABLE media_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    media_file_id UUID NOT NULL REFERENCES media_files(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL, -- 'event', 'member', 'cpd_activity', etc
    entity_id UUID NOT NULL,
    field_name VARCHAR(50), -- 'image_url', 'banner_url', etc
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(media_file_id, entity_type, entity_id, field_name)
);

-- Create indexes
CREATE INDEX idx_media_files_folder ON media_files(folder_id);
CREATE INDEX idx_media_files_category ON media_files(category);
CREATE INDEX idx_media_files_status ON media_files(status);
CREATE INDEX idx_media_files_uploaded_by ON media_files(uploaded_by);
CREATE INDEX idx_media_files_created_at ON media_files(created_at DESC);
CREATE INDEX idx_media_files_tags ON media_files USING GIN(tags);

-- Create text search indexes
CREATE INDEX idx_media_files_title ON media_files(title);
CREATE INDEX idx_media_files_description ON media_files(description);
CREATE INDEX idx_media_files_alt_text ON media_files(alt_text);

CREATE INDEX idx_media_usage_entity ON media_usage(entity_type, entity_id);
CREATE INDEX idx_media_usage_media_file ON media_usage(media_file_id);

CREATE INDEX idx_media_folders_parent ON media_folders(parent_id);
CREATE INDEX idx_media_folders_path ON media_folders(path);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers
CREATE TRIGGER update_media_files_updated_at BEFORE UPDATE ON media_files
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_media_folders_updated_at BEFORE UPDATE ON media_folders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_usage ENABLE ROW LEVEL SECURITY;

-- Media Files Policies
-- Public files can be viewed by anyone
CREATE POLICY "Public media files are viewable by everyone" ON media_files
    FOR SELECT
    USING (is_public = true OR auth.uid() IS NOT NULL);

-- Authenticated users can upload
CREATE POLICY "Authenticated users can upload media" ON media_files
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own uploads or admins can update any
CREATE POLICY "Users can update their own media" ON media_files
    FOR UPDATE
    USING (uploaded_by = auth.uid() OR auth.uid() IS NOT NULL);

-- Only admins can delete (simplified for now)
CREATE POLICY "Authenticated users can delete media" ON media_files
    FOR DELETE
    USING (auth.uid() IS NOT NULL);

-- Media Folders Policies
CREATE POLICY "Folders are viewable by authenticated users" ON media_folders
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage folders" ON media_folders
    FOR ALL
    USING (auth.uid() IS NOT NULL);

-- Media Usage Policies
CREATE POLICY "Usage tracking viewable by authenticated users" ON media_usage
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can track usage" ON media_usage
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update usage tracking" ON media_usage
    FOR UPDATE
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete usage tracking" ON media_usage
    FOR DELETE
    USING (auth.uid() IS NOT NULL);

-- Insert default folders
INSERT INTO media_folders (name, path) VALUES 
    ('Events', '/events/'),
    ('Members', '/members/'),
    ('CPD', '/cpd/'),
    ('General', '/general/'),
    ('Banners', '/banners/'),
    ('Icons', '/icons/')
ON CONFLICT (path) DO NOTHING;

-- Function to search media files
CREATE OR REPLACE FUNCTION search_media_files(search_query TEXT)
RETURNS TABLE (
    id UUID,
    filename VARCHAR,
    title VARCHAR,
    description TEXT,
    url TEXT,
    thumbnail_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.filename,
        m.title,
        m.description,
        m.url,
        m.thumbnail_url
    FROM media_files m
    WHERE 
        m.status = 'active' AND (
            m.title ILIKE '%' || search_query || '%' OR
            m.description ILIKE '%' || search_query || '%' OR
            m.alt_text ILIKE '%' || search_query || '%' OR
            m.filename ILIKE '%' || search_query || '%' OR
            array_to_string(m.tags, ' ') ILIKE '%' || search_query || '%'
        )
    ORDER BY m.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get media usage statistics
CREATE OR REPLACE FUNCTION get_media_statistics()
RETURNS TABLE (
    total_files BIGINT,
    total_size BIGINT,
    total_folders BIGINT,
    files_by_category JSON,
    recent_uploads JSON
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM media_files WHERE status = 'active')::BIGINT,
        (SELECT COALESCE(SUM(file_size), 0) FROM media_files WHERE status = 'active')::BIGINT,
        (SELECT COUNT(*) FROM media_folders)::BIGINT,
        (SELECT json_object_agg(category, count) 
         FROM (SELECT category, COUNT(*) as count 
               FROM media_files 
               WHERE status = 'active' 
               GROUP BY category) t),
        (SELECT json_agg(row_to_json(t)) 
         FROM (SELECT id, filename, url, thumbnail_url, created_at 
               FROM media_files 
               WHERE status = 'active' 
               ORDER BY created_at DESC 
               LIMIT 10) t);
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT ALL ON media_files TO authenticated;
GRANT ALL ON media_folders TO authenticated;
GRANT ALL ON media_usage TO authenticated;
GRANT EXECUTE ON FUNCTION search_media_files(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_media_statistics() TO authenticated;
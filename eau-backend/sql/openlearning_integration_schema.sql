-- OpenLearning Integration Schema
-- This script creates the necessary database structure for OpenLearning integration

-- Add OpenLearning fields to members table
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS openlearning_user_id VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS openlearning_external_id VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS openlearning_sync_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS openlearning_last_synced TIMESTAMP,
ADD COLUMN IF NOT EXISTS openlearning_provisioned_at TIMESTAMP;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_members_openlearning_user_id ON members(openlearning_user_id);
CREATE INDEX IF NOT EXISTS idx_members_openlearning_external_id ON members(openlearning_external_id);

-- Table to store OpenLearning course completions
CREATE TABLE IF NOT EXISTS openlearning_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  openlearning_course_id VARCHAR(255) NOT NULL,
  openlearning_class_id VARCHAR(255),
  course_name TEXT NOT NULL,
  course_description TEXT,
  completion_date TIMESTAMP NOT NULL,
  completion_percentage DECIMAL(5,2),
  certificate_url TEXT,
  cpd_activity_id UUID REFERENCES cpd_activities(id) ON DELETE SET NULL,
  raw_data JSONB,
  synced_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(member_id, openlearning_course_id, openlearning_class_id)
);

-- Create indexes for openlearning_courses
CREATE INDEX IF NOT EXISTS idx_openlearning_courses_member_id ON openlearning_courses(member_id);
CREATE INDEX IF NOT EXISTS idx_openlearning_courses_cpd_activity_id ON openlearning_courses(cpd_activity_id);
CREATE INDEX IF NOT EXISTS idx_openlearning_courses_completion_date ON openlearning_courses(completion_date);

-- Table to track SSO sessions
CREATE TABLE IF NOT EXISTS openlearning_sso_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  launch_url TEXT,
  class_id VARCHAR(255),
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for SSO sessions
CREATE INDEX IF NOT EXISTS idx_openlearning_sso_sessions_member_id ON openlearning_sso_sessions(member_id);
CREATE INDEX IF NOT EXISTS idx_openlearning_sso_sessions_token ON openlearning_sso_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_openlearning_sso_sessions_expires_at ON openlearning_sso_sessions(expires_at);

-- Table to log OpenLearning API interactions
CREATE TABLE IF NOT EXISTS openlearning_api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  endpoint TEXT,
  request_data JSONB,
  response_data JSONB,
  status_code INTEGER,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for API logs
CREATE INDEX IF NOT EXISTS idx_openlearning_api_logs_member_id ON openlearning_api_logs(member_id);
CREATE INDEX IF NOT EXISTS idx_openlearning_api_logs_action ON openlearning_api_logs(action);
CREATE INDEX IF NOT EXISTS idx_openlearning_api_logs_created_at ON openlearning_api_logs(created_at);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_openlearning_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for openlearning_courses
DROP TRIGGER IF EXISTS openlearning_courses_updated_at ON openlearning_courses;
CREATE TRIGGER openlearning_courses_updated_at
  BEFORE UPDATE ON openlearning_courses
  FOR EACH ROW
  EXECUTE FUNCTION update_openlearning_updated_at();

-- Grant permissions (adjust role names as needed)
GRANT ALL ON openlearning_courses TO authenticated;
GRANT ALL ON openlearning_sso_sessions TO authenticated;
GRANT ALL ON openlearning_api_logs TO authenticated;

-- Add RLS policies
ALTER TABLE openlearning_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE openlearning_sso_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE openlearning_api_logs ENABLE ROW LEVEL SECURITY;

-- Policies for openlearning_courses
CREATE POLICY "Members can view their own OpenLearning courses" ON openlearning_courses
  FOR SELECT USING (auth.uid() = member_id);

CREATE POLICY "Admins can view all OpenLearning courses" ON openlearning_courses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.id = auth.uid() 
      AND m.role IN ('super_admin', 'admin')
    )
  );

-- Policies for openlearning_sso_sessions
CREATE POLICY "Members can view their own SSO sessions" ON openlearning_sso_sessions
  FOR SELECT USING (auth.uid() = member_id);

CREATE POLICY "Members can create their own SSO sessions" ON openlearning_sso_sessions
  FOR INSERT WITH CHECK (auth.uid() = member_id);

-- Policies for openlearning_api_logs
CREATE POLICY "Admins can view all API logs" ON openlearning_api_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.id = auth.uid() 
      AND m.role IN ('super_admin', 'admin')
    )
  );
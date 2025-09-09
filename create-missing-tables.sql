-- Add missing columns to members table
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS openlearning_user_id VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS openlearning_external_id VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS openlearning_sync_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS openlearning_last_synced TIMESTAMP,
ADD COLUMN IF NOT EXISTS openlearning_provisioned_at TIMESTAMP;

-- Create SSO sessions table
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

-- Create API logs table
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
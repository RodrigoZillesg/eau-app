-- Fix RLS policies for event_reminders table
-- This will allow users to create reminders when registering for events

-- Remove existing policies
DROP POLICY IF EXISTS "Users can insert reminders" ON event_reminders;
DROP POLICY IF EXISTS "Users can view reminders" ON event_reminders;
DROP POLICY IF EXISTS "Users can update reminders" ON event_reminders;
DROP POLICY IF EXISTS "Authenticated can insert reminders" ON event_reminders;
DROP POLICY IF EXISTS "Users can view own reminders" ON event_reminders;

-- Create new permissive policies
-- Allow authenticated users to insert reminders
CREATE POLICY "Allow authenticated to insert reminders" 
ON event_reminders FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Allow users to view their own reminders
CREATE POLICY "Allow users to view own reminders" 
ON event_reminders FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Allow service role to do everything (for worker)
CREATE POLICY "Allow service role full access" 
ON event_reminders FOR ALL 
TO service_role 
USING (true)
WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE event_reminders ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON event_reminders TO authenticated;
GRANT ALL ON event_reminders TO service_role;
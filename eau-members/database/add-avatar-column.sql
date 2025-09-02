-- Add avatar_url column to members table
-- Execute this script in your Supabase SQL editor

-- Add the avatar_url column to the members table
ALTER TABLE public.members 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add comment to document the column
COMMENT ON COLUMN public.members.avatar_url IS 'URL to the member''s profile picture stored in Supabase Storage';

-- Create the profiles storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'profiles', 
    'profiles', 
    true, 
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the profiles bucket
-- Allow authenticated users to upload their own avatars
CREATE POLICY "Authenticated users can upload avatars" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'profiles' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = 'avatars'
);

-- Allow public read access to all profile images
CREATE POLICY "Public read access to profile images" ON storage.objects
FOR SELECT USING (bucket_id = 'profiles');

-- Allow users to update their own avatars
CREATE POLICY "Users can update their own avatars" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'profiles' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = 'avatars'
);

-- Allow users to delete their own avatars
CREATE POLICY "Users can delete their own avatars" ON storage.objects
FOR DELETE USING (
    bucket_id = 'profiles' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = 'avatars'
);
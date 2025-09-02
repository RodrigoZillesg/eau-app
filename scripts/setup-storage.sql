-- Create media bucket for storing images and files
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the media bucket
-- Allow anyone to view files (public bucket)
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'media');

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'media' 
    AND auth.role() = 'authenticated'
  );

-- Allow users to update their own uploads
CREATE POLICY "Users can update own uploads" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'media' 
    AND auth.uid() = owner
  );

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete own uploads" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'media' 
    AND auth.uid() = owner
  );

-- Create media_files table for tracking uploaded files
CREATE TABLE IF NOT EXISTS public.media_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  original_filename TEXT,
  file_type TEXT,
  file_size BIGINT,
  mime_type TEXT,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  medium_url TEXT,
  large_url TEXT,
  width INTEGER,
  height INTEGER,
  alt_text TEXT,
  title TEXT,
  description TEXT,
  category TEXT DEFAULT 'general',
  tags TEXT[],
  folder_id UUID,
  status TEXT DEFAULT 'active',
  is_public BOOLEAN DEFAULT false,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_media_files_category ON public.media_files(category);
CREATE INDEX IF NOT EXISTS idx_media_files_status ON public.media_files(status);
CREATE INDEX IF NOT EXISTS idx_media_files_uploaded_by ON public.media_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_media_files_created_at ON public.media_files(created_at DESC);

-- Set up RLS for media_files table
ALTER TABLE public.media_files ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view active public media files
CREATE POLICY "View public media files" ON public.media_files
  FOR SELECT USING (status = 'active' AND is_public = true);

-- Allow authenticated users to view all their media files
CREATE POLICY "Users can view own media files" ON public.media_files
  FOR SELECT USING (auth.uid() = uploaded_by);

-- Allow authenticated users to insert media files
CREATE POLICY "Authenticated users can insert media files" ON public.media_files
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow users to update their own media files
CREATE POLICY "Users can update own media files" ON public.media_files
  FOR UPDATE USING (auth.uid() = uploaded_by);

-- Allow users to delete their own media files
CREATE POLICY "Users can delete own media files" ON public.media_files
  FOR DELETE USING (auth.uid() = uploaded_by);

-- Grant necessary permissions
GRANT ALL ON public.media_files TO authenticated;
GRANT SELECT ON public.media_files TO anon;
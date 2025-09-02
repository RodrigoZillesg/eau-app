# Supabase Storage Setup

## Quick Fix for "Bucket not found" Error

The application uses Supabase Storage for image uploads. If you're seeing a "Bucket not found" error, follow these steps:

## Option 1: Using Supabase Dashboard (Easiest)

1. **Open Supabase Dashboard**
   - Go to http://localhost:3000 (Supabase Studio)
   - Login with:
     - Username: `rrzillesg`
     - Password: `pkWwMiebGUCQXXrVFvCWp`

2. **Create Storage Bucket**
   - Navigate to "Storage" in the left sidebar
   - Click "New bucket"
   - Create a bucket with:
     - Name: `media`
     - Public: ✅ (check this box)
   - Click "Create bucket"

3. **That's it!** The application will now be able to upload images.

## Option 2: Using SQL (More Complete)

1. **Run the setup script**
   - Go to Supabase SQL Editor
   - Copy and run the contents of `scripts/setup-storage.sql`
   - This will:
     - Create the media bucket
     - Set up proper permissions
     - Create a media_files table for metadata
     - Configure Row Level Security

## Option 3: Automatic Creation

The application will try to create the bucket automatically when you first upload an image. However, this requires proper permissions.

## Testing the Upload

1. Go to Events > Admin Events
2. Create or edit an event
3. Click "Select Image"
4. Try uploading an image or selecting from the gallery

## Troubleshooting

### Still getting "Bucket not found"?
- Make sure Supabase is running: `docker-compose up -d`
- Check if the bucket exists in Storage section
- Try refreshing the page after creating the bucket

### Can't create bucket?
- You might not have admin permissions
- Use the SQL script method instead
- Check Supabase logs for detailed errors

### Images upload but don't save metadata?
- The media_files table might not exist
- Run the full `setup-storage.sql` script

## Default Images

Even without storage configured, the application provides 12 stock images for events that can be used via URL.

## Storage Structure

```
media/
├── events/          # Event images
├── profiles/        # User profile pictures
├── documents/       # Uploaded documents
└── editor-images/   # Images from rich text editor
```

## Security Notes

- The bucket is public for reading (anyone can view images)
- Only authenticated users can upload
- Users can only modify their own uploads
- All uploads are validated for type and size (max 10MB)
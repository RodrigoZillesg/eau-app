import { supabase } from './client'

export class StorageService {
  static async initializeBuckets() {
    try {
      // Check if 'profiles' bucket exists
      const { data: buckets, error: listError } = await supabase.storage.listBuckets()
      
      if (listError) {
        console.warn('Error listing buckets:', listError)
        // Try to create bucket anyway in case it's a permissions issue
      }

      const profilesBucketExists = buckets?.some(bucket => bucket.name === 'profiles')
      
      if (!profilesBucketExists) {
        // Create profiles bucket
        const { data, error: createError } = await supabase.storage.createBucket('profiles', {
          public: true, // Allow public access to profile images
          fileSizeLimit: 5242880, // 5MB limit
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        })
        
        if (createError) {
          // Bucket might already exist, which is fine
          if (createError.message?.includes('already exists')) {
            console.log('✅ Profiles bucket already exists')
          } else {
            console.warn('Error creating profiles bucket:', createError)
          }
        } else {
          console.log('✅ Profiles bucket created successfully', data)
        }
      } else {
        console.log('✅ Profiles bucket already exists')
      }
    } catch (error) {
      console.warn('Error initializing storage buckets:', error)
    }
  }

  static async uploadAvatar(userId: string, file: File): Promise<string> {
    // Get file extension from the file name or type
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const fileName = `avatar-${userId}-${Date.now()}.${fileExt}`
    const filePath = `avatars/${fileName}`

    console.log('Uploading file:', {
      name: file.name,
      type: file.type,
      size: file.size,
      path: filePath
    })

    // Upload file with its actual content type
    const { data, error: uploadError } = await supabase.storage
      .from('profiles')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      })

    if (uploadError) {
      console.error('Upload error details:', uploadError)
      throw uploadError
    }

    console.log('Upload successful:', data)

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('profiles')
      .getPublicUrl(filePath)

    return publicUrl
  }

  static async deleteAvatar(avatarUrl: string): Promise<void> {
    try {
      // Extract file path from URL
      const url = new URL(avatarUrl)
      const pathMatch = url.pathname.match(/\/profiles\/(.+)$/)
      
      if (pathMatch && pathMatch[1]) {
        const filePath = pathMatch[1]
        
        const { error } = await supabase.storage
          .from('profiles')
          .remove([filePath])

        if (error) {
          console.warn('Error deleting avatar file:', error)
        }
      }
    } catch (error) {
      console.warn('Error parsing avatar URL for deletion:', error)
    }
  }
}
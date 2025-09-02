import { supabase } from '../lib/supabase/client'

export async function setupStorage() {
  try {
    console.log('Setting up storage bucket...')
    
    // List existing buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('Error listing buckets:', listError)
      return false
    }
    
    const mediaExists = buckets?.some(b => b.name === 'media')
    
    if (!mediaExists) {
      // Create media bucket
      const { data, error } = await supabase.storage.createBucket('media', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        fileSizeLimit: 5242880 // 5MB
      })
      
      if (error) {
        console.error('Error creating bucket:', error)
        return false
      }
      
      console.log('Storage bucket created successfully')
      return true
    } else {
      console.log('Storage bucket already exists')
      return true
    }
  } catch (error) {
    console.error('Setup error:', error)
    return false
  }
}
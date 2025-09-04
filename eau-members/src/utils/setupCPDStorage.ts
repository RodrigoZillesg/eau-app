import { supabase } from '../lib/supabase/client'

export async function setupCPDStorage() {
  try {
    console.log('Checking CPD storage configuration...')
    
    // List all buckets to see what's available
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('Error listing buckets:', listError)
      return false
    }
    
    console.log('Available storage buckets:', buckets)
    
    // Check if 'cpd-evidence' bucket exists
    const cpdBucketExists = buckets?.some(bucket => bucket.name === 'cpd-evidence')
    
    if (!cpdBucketExists) {
      console.log('Creating cpd-evidence bucket...')
      
      // Create the cpd-evidence bucket
      const { data: newBucket, error: createError } = await supabase.storage.createBucket('cpd-evidence', {
        public: true, // Make it public so files can be accessed via URL
        fileSizeLimit: 10485760, // 10MB limit
        allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      })
      
      if (createError) {
        console.error('Error creating cpd-evidence bucket:', createError)
        
        // If error is because bucket exists, that's ok
        if (createError.message?.includes('already exists')) {
          console.log('Bucket already exists, continuing...')
          return true
        }
        return false
      }
      
      console.log('CPD evidence bucket created successfully:', newBucket)
    } else {
      console.log('cpd-evidence bucket already exists')
    }
    
    // Also check if 'profiles' bucket exists (for backwards compatibility)
    const profilesBucketExists = buckets?.some(bucket => bucket.name === 'profiles')
    
    if (!profilesBucketExists) {
      console.log('Note: profiles bucket does not exist, but we will use cpd-evidence bucket instead')
    }
    
    return true
  } catch (error) {
    console.error('Error setting up CPD storage:', error)
    return false
  }
}

// Function to test upload
export async function testCPDUpload() {
  try {
    // Create a test file
    const testContent = 'Test CPD Evidence Upload'
    const testBlob = new Blob([testContent], { type: 'text/plain' })
    const testFile = new File([testBlob], 'test-cpd.txt', { type: 'text/plain' })
    
    const testPath = `test/test-${Date.now()}.txt`
    
    console.log('Testing upload to cpd-evidence bucket...')
    
    // Try uploading to cpd-evidence bucket
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('cpd-evidence')
      .upload(testPath, testFile)
    
    if (uploadError) {
      console.error('Test upload failed:', uploadError)
      return false
    }
    
    console.log('Test upload successful:', uploadData)
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('cpd-evidence')
      .getPublicUrl(testPath)
    
    console.log('Public URL:', publicUrl)
    
    // Clean up test file
    const { error: deleteError } = await supabase.storage
      .from('cpd-evidence')
      .remove([testPath])
    
    if (deleteError) {
      console.error('Error deleting test file:', deleteError)
    } else {
      console.log('Test file cleaned up')
    }
    
    return true
  } catch (error) {
    console.error('Error in test upload:', error)
    return false
  }
}
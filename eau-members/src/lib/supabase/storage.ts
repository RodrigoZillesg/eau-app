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
    console.log('Uploading file to backend:', {
      name: file.name,
      type: file.type,
      size: file.size,
      userId
    })

    // Get authentication token
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) {
      throw new Error('No authentication token found')
    }

    // Create FormData
    const formData = new FormData()
    formData.append('avatar', file)

    // Backend API URL
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'
    const uploadUrl = `${backendUrl}/api/v1/storage/upload-avatar`

    console.log('Uploading to:', uploadUrl)

    // Upload to backend
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      },
      body: formData
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Upload failed' }))
      console.error('Upload error:', errorData)
      throw new Error(errorData.error || 'Upload failed')
    }

    const result = await response.json()
    console.log('Upload successful:', result)

    return result.publicUrl
  }

  static async deleteAvatar(avatarUrl: string): Promise<void> {
    try {
      // Extract filename from URL (e.g., http://localhost:3001/uploads/avatars/avatar-123-456.jpg)
      const url = new URL(avatarUrl)
      const pathMatch = url.pathname.match(/\/uploads\/avatars\/(.+)$/)

      if (!pathMatch || !pathMatch[1]) {
        console.warn('Could not extract filename from avatar URL:', avatarUrl)
        return
      }

      const fileName = pathMatch[1]

      // Get authentication token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('No authentication token found')
      }

      // Backend API URL
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'
      const deleteUrl = `${backendUrl}/api/v1/storage/delete-avatar`

      // Delete from backend
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fileName })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Delete failed' }))
        console.warn('Error deleting avatar file:', errorData)
      } else {
        console.log('Avatar deleted successfully')
      }
    } catch (error) {
      console.warn('Error deleting avatar:', error)
    }
  }

  static async uploadEventImage(file: File): Promise<string> {
    console.log('Uploading event image to backend:', {
      name: file.name,
      type: file.type,
      size: file.size
    })

    // Get authentication token
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) {
      throw new Error('No authentication token found')
    }

    // Create FormData
    const formData = new FormData()
    formData.append('eventImage', file)

    // Backend API URL
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'
    const uploadUrl = `${backendUrl}/api/v1/storage/upload-event-image`

    console.log('Uploading to:', uploadUrl)

    // Upload to backend
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      },
      body: formData
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Upload failed' }))
      console.error('Upload error:', errorData)
      throw new Error(errorData.error || 'Upload failed')
    }

    const result = await response.json()
    console.log('Upload successful:', result)

    return result.publicUrl
  }

  static async uploadPaymentReceipt(registrationId: string, file: File): Promise<string> {
    console.log('Uploading payment receipt to backend:', {
      name: file.name,
      type: file.type,
      size: file.size,
      registrationId
    })

    // Get authentication token
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) {
      throw new Error('No authentication token found')
    }

    // Create FormData
    const formData = new FormData()
    formData.append('receipt', file)
    formData.append('registrationId', registrationId)

    // Backend API URL
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'
    const uploadUrl = `${backendUrl}/api/v1/storage/upload-payment-receipt`

    console.log('Uploading to:', uploadUrl)

    // Upload to backend
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      },
      body: formData
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Upload failed' }))
      console.error('Upload error:', errorData)
      throw new Error(errorData.error || 'Upload failed')
    }

    const result = await response.json()
    console.log('Upload successful:', result)

    return result.publicUrl
  }
}
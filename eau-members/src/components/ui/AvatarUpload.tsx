import React, { useState, useRef, useCallback } from 'react'
import { Camera, Upload } from 'lucide-react'
import { supabase } from '../../lib/supabase/client'
import { StorageService } from '../../lib/supabase/storage'
import { useAuthStore } from '../../stores/authStore'
import { showNotification } from '../../lib/notifications'

interface AvatarUploadProps {
  currentAvatar?: string | null
  onAvatarChange: (avatarUrl: string | null) => void
  size?: 'sm' | 'md' | 'lg'
}


export function AvatarUpload({ currentAvatar, onAvatarChange, size = 'lg' }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuthStore()

  // Size configurations
  const sizeConfig = {
    sm: { wrapper: 'w-16 h-16', text: 'text-xs' },
    md: { wrapper: 'w-24 h-24', text: 'text-sm' },
    lg: { wrapper: 'w-32 h-32', text: 'text-base' }
  }

  const config = sizeConfig[size]

  // File validation
  const validateFile = (file: File): string | null => {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return 'Only JPEG, PNG, and WebP images are allowed'
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return 'Image must be smaller than 5MB'
    }

    return null
  }

  const onSelectFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      
      // Validate file
      const error = validateFile(file)
      if (error) {
        showNotification('error', error)
        return
      }

      // Directly upload without crop for now
      await handleDirectUpload(file)
    }
  }, [])

  const handleDirectUpload = async (file: File) => {
    if (!user) return

    try {
      setUploading(true)

      // Upload using storage service
      const publicUrl = await StorageService.uploadAvatar(user.id, file)

      // Update user profile with new avatar URL
      if (user.email) {
        const { error: updateError } = await supabase
          .from('members')
          .update({ avatar_url: publicUrl })
          .eq('email', user.email)

        if (updateError) {
          // If member doesn't exist, create one
          if (updateError.code === 'PGRST116') {
            await supabase
              .from('members')
              .insert({
                email: user.email,
                avatar_url: publicUrl,
                created_by: user.id,
                membership_status: 'active',
                membership_type: 'standard'
              })
          } else {
            throw updateError
          }
        }
      }

      onAvatarChange(publicUrl)
      showNotification('success', 'Profile photo updated successfully!')

    } catch (error) {
      console.error('Error uploading avatar:', error)
      showNotification('error', 'Failed to upload profile photo')
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveAvatar = async () => {
    if (!user?.email) return

    try {
      setUploading(true)

      // Update user profile to remove avatar
      const { error } = await supabase
        .from('members')
        .update({ avatar_url: null })
        .eq('email', user.email)

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      onAvatarChange(null)
      showNotification('success', 'Profile photo removed')

    } catch (error) {
      console.error('Error removing avatar:', error)
      showNotification('error', 'Failed to remove profile photo')
    } finally {
      setUploading(false)
    }
  }


  return (
    <div className="flex flex-col items-center space-y-3">
      {/* Avatar Display */}
      <div className={`relative ${config.wrapper} rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg group cursor-pointer`}>
        {currentAvatar ? (
          <img
            src={currentAvatar}
            alt="Profile"
            className="w-full h-full object-cover"
            onClick={() => fileInputRef.current?.click()}
          />
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 text-white"
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera className="w-10 h-10" />
          </div>
        )}
        
        {/* Overlay with camera icon on hover */}
        <div 
          className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <Camera className="w-8 h-8 text-white" />
        </div>
        
        {/* Upload badge */}
        {!uploading && (
          <div 
            className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 shadow-lg cursor-pointer hover:bg-blue-700 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-4 h-4" />
          </div>
        )}
        
        {/* Loading indicator */}
        {uploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}
      </div>

      {/* Remove button - only show if there's an avatar */}
      {currentAvatar && !uploading && (
        <button
          type="button"
          onClick={handleRemoveAvatar}
          className="text-xs text-gray-500 hover:text-red-600 transition-colors"
        >
          Remove photo
        </button>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onSelectFile}
        className="hidden"
      />

    </div>
  )
}
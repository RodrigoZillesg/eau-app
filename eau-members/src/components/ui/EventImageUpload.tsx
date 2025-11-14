import React, { useState, useRef, useEffect } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { StorageService } from '../../lib/supabase/storage'
import { showNotification } from '../../lib/notifications'

interface EventImageUploadProps {
  currentImage?: string | null
  onImageChange: (imageUrl: string | null) => void
}

export function EventImageUpload({ currentImage, onImageChange }: EventImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Update preview when currentImage prop changes
  useEffect(() => {
    setPreviewUrl(currentImage || null)
  }, [currentImage])

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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]

      // Validate file
      const error = validateFile(file)
      if (error) {
        showNotification('error', error)
        return
      }

      // Show preview immediately
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)

      // Upload file
      await handleUpload(file)
    }
  }

  const handleUpload = async (file: File) => {
    try {
      setUploading(true)

      // Upload using storage service
      const publicUrl = await StorageService.uploadEventImage(file)

      onImageChange(publicUrl)
      showNotification('success', 'Event image uploaded successfully!')

    } catch (error) {
      console.error('Error uploading event image:', error)
      showNotification('error', 'Failed to upload event image')
      // Revert preview on error
      setPreviewUrl(currentImage || null)
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    setPreviewUrl(null)
    onImageChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-3">
      {/* Image Preview */}
      {previewUrl ? (
        <div className="relative w-full h-64 rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200">
          <img
            src={previewUrl}
            alt="Event preview"
            className="w-full h-full object-cover"
          />

          {/* Remove button */}
          {!uploading && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg"
              title="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Loading overlay */}
          {uploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
          )}
        </div>
      ) : (
        /* Upload area */
        <div
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-64 rounded-lg border-2 border-dashed border-gray-300 hover:border-primary-500 bg-gray-50 hover:bg-gray-100 transition-all cursor-pointer flex flex-col items-center justify-center gap-3"
        >
          {uploading ? (
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          ) : (
            <>
              <ImageIcon className="w-12 h-12 text-gray-400" />
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700">
                  Click to upload event image
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG, WebP up to 5MB
                </p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors">
                <Upload className="w-4 h-4" />
                <span className="text-sm">Choose File</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />
    </div>
  )
}

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import Cropper from 'react-easy-crop'
import { Upload, X, Check, RotateCw, ZoomIn, ZoomOut } from 'lucide-react'
import { Button } from '../ui/Button'
import { showNotification } from '../../lib/notifications'

interface ImageUploadWithCropProps {
  onImageCropped: (croppedImage: Blob, originalFile: File) => void
  onClose: () => void
  aspectRatio?: number
  maxSizeMB?: number
}

interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

export function ImageUploadWithCrop({ 
  onImageCropped, 
  onClose, 
  aspectRatio = 16/9,
  maxSizeMB = 5 
}: ImageUploadWithCropProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [originalFile, setOriginalFile] = useState<File | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    
    if (!file) return
    
    // Check file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      showNotification('error', `File size must be less than ${maxSizeMB}MB`)
      return
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      showNotification('error', 'Please upload an image file')
      return
    }
    
    setOriginalFile(file)
    
    const reader = new FileReader()
    reader.onload = () => {
      setImageSrc(reader.result as string)
    }
    reader.readAsDataURL(file)
  }, [maxSizeMB])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: 1,
    multiple: false
  })

  const onCropComplete = useCallback((croppedArea: CropArea, croppedAreaPixels: CropArea) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image()
      image.addEventListener('load', () => resolve(image))
      image.addEventListener('error', error => reject(error))
      image.src = url
    })

  const getCroppedImg = async (): Promise<Blob | null> => {
    if (!imageSrc || !croppedAreaPixels) return null
    
    try {
      const image = await createImage(imageSrc)
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) return null
      
      // Set canvas size to match the cropped area
      canvas.width = croppedAreaPixels.width
      canvas.height = croppedAreaPixels.height
      
      // Draw the cropped image
      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      )
      
      // Convert canvas to blob
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob)
        }, 'image/jpeg', 0.95)
      })
    } catch (e) {
      console.error('Error creating cropped image:', e)
      return null
    }
  }

  const handleSave = async () => {
    if (!originalFile) return
    
    setIsProcessing(true)
    
    try {
      const croppedBlob = await getCroppedImg()
      
      if (croppedBlob) {
        onImageCropped(croppedBlob, originalFile)
      } else {
        showNotification('error', 'Failed to process image')
      }
    } catch (error) {
      console.error('Error processing image:', error)
      showNotification('error', 'Failed to process image')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360)
  }

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.1, 3))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.1, 1))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Upload and Crop Image</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {!imageSrc ? (
            // Upload Area
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                {isDragActive ? 'Drop the image here' : 'Drag & drop an image here'}
              </p>
              <p className="text-sm text-gray-500 mb-4">or click to select from your computer</p>
              <p className="text-xs text-gray-400">
                Supported formats: JPG, PNG, GIF, WebP (max {maxSizeMB}MB)
              </p>
            </div>
          ) : (
            // Crop Area
            <div className="space-y-4">
              <div className="relative h-[400px] bg-gray-100 rounded-lg overflow-hidden">
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={aspectRatio}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleZoomOut}
                    className="p-2 rounded hover:bg-gray-100"
                    title="Zoom Out"
                  >
                    <ZoomOut className="h-5 w-5" />
                  </button>
                  <input
                    type="range"
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.1}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-32"
                  />
                  <button
                    onClick={handleZoomIn}
                    className="p-2 rounded hover:bg-gray-100"
                    title="Zoom In"
                  >
                    <ZoomIn className="h-5 w-5" />
                  </button>
                </div>

                <div className="h-6 w-px bg-gray-300" />

                <button
                  onClick={handleRotate}
                  className="p-2 rounded hover:bg-gray-100"
                  title="Rotate 90°"
                >
                  <RotateCw className="h-5 w-5" />
                </button>
              </div>

              {/* Aspect Ratio Info */}
              <div className="text-center text-sm text-gray-500">
                Aspect Ratio: {aspectRatio === 16/9 ? '16:9' : aspectRatio === 1 ? '1:1' : `${aspectRatio}:1`}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {imageSrc && (
          <div className="flex justify-between items-center p-4 border-t bg-gray-50">
            <Button
              variant="outline"
              onClick={() => {
                setImageSrc(null)
                setOriginalFile(null)
                setCrop({ x: 0, y: 0 })
                setZoom(1)
                setRotation(0)
              }}
            >
              Choose Different Image
            </Button>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>Processing...</>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Save Cropped Image
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
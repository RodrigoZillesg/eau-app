import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Upload, Calendar, Clock, FileText } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Label } from '../../../components/ui/Label'
import cpd, { type CPDFormData, type CPDCategorySettings } from '../cpdService'

const { CPDService, CPD_CATEGORIES } = cpd
import { useAuthStore } from '../../../stores/authStore'

const cpdSchema = z.object({
  category_id: z.number().min(1, 'Please select a category'),
  activity_title: z.string().min(1, 'Activity title is required'),
  description: z.string().optional(),
  provider: z.string().optional(),
  date_completed: z.string().min(1, 'Date is required'),
  hours: z.number().min(0).max(99),
  minutes: z.number().min(0).max(59),
})

interface AddCPDActivityModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AddCPDActivityModal({ isOpen, onClose, onSuccess }: AddCPDActivityModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null)
  const [categorySettings, setCategorySettings] = useState<CPDCategorySettings[]>([])
  const { user } = useAuthStore()
  
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors }
  } = useForm<CPDFormData>({
    resolver: zodResolver(cpdSchema),
    defaultValues: {
      hours: 0,
      minutes: 0,
      date_completed: new Date().toISOString().split('T')[0]
    }
  })

  const selectedCategoryId = watch('category_id')
  const hours = watch('hours') || 0
  const minutes = watch('minutes') || 0

  useEffect(() => {
    if (isOpen) {
      loadCategorySettings()
    }
  }, [isOpen])

  const loadCategorySettings = async () => {
    try {
      const settings = await CPDService.getCategorySettings()
      setCategorySettings(settings)
    } catch (error) {
      console.error('Error loading category settings:', error)
      setCategorySettings([])
    }
  }
  
  // Calculate points based on selected category (using database settings first, fallback to hardcoded)
  const calculatePoints = () => {
    const categoryConfig = categorySettings.find(c => c.category_id === Number(selectedCategoryId))
    const fallbackCategory = CPD_CATEGORIES.find(c => c.id === Number(selectedCategoryId))
    
    const pointsPerHour = categoryConfig?.points_per_hour || fallbackCategory?.points_per_hour || 1
    const totalHours = hours + (minutes / 60)
    return (totalHours * pointsPerHour).toFixed(2)
  }

  const onSubmit = async (data: CPDFormData) => {
    if (!user) return
    
    try {
      setIsSubmitting(true)
      
      const formDataWithEvidence = {
        ...data,
        evidence: evidenceFile || undefined
      }
      
      await CPDService.createActivity(formDataWithEvidence, user.id, user.email || '')
      
      reset()
      setEvidenceFile(null)
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error submitting CPD activity:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      // Limit file size to 10MB
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB')
        return
      }
      setEvidenceFile(file)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Add New CPD Activity</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Category */}
          <div>
            <Label htmlFor="category_id">Category *</Label>
            <select
              id="category_id"
              {...register('category_id', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select a Category --</option>
              {CPD_CATEGORIES.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.category_id && (
              <p className="text-red-500 text-sm mt-1">{errors.category_id.message}</p>
            )}
          </div>

          {/* Activity Title */}
          <div>
            <Label htmlFor="activity_title">Activity Title *</Label>
            <Input
              id="activity_title"
              {...register('activity_title')}
              placeholder="e.g., Annual TESOL Conference"
            />
            {errors.activity_title && (
              <p className="text-red-500 text-sm mt-1">{errors.activity_title.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              {...register('description')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Brief description of the activity..."
            />
          </div>

          {/* Provider */}
          <div>
            <Label htmlFor="provider">Provider/Organizer</Label>
            <Input
              id="provider"
              {...register('provider')}
              placeholder="e.g., English Australia"
            />
          </div>

          {/* Date */}
          <div>
            <Label htmlFor="date_completed">
              <Calendar className="w-4 h-4 inline mr-1" />
              Date Completed *
            </Label>
            <Input
              id="date_completed"
              type="date"
              {...register('date_completed')}
              max={new Date().toISOString().split('T')[0]}
            />
            {errors.date_completed && (
              <p className="text-red-500 text-sm mt-1">{errors.date_completed.message}</p>
            )}
          </div>

          {/* Duration */}
          <div>
            <Label>
              <Clock className="w-4 h-4 inline mr-1" />
              Duration *
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    {...register('hours', { valueAsNumber: true })}
                    min="0"
                    max="99"
                    className="w-20"
                  />
                  <span className="text-sm text-gray-600">hours</span>
                </div>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    {...register('minutes', { valueAsNumber: true })}
                    min="0"
                    max="59"
                    className="w-20"
                  />
                  <span className="text-sm text-gray-600">minutes</span>
                </div>
              </div>
            </div>
          </div>

          {/* Points Preview */}
          {selectedCategoryId && (hours > 0 || minutes > 0) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900">Estimated Points:</span>
                <span className="text-2xl font-bold text-blue-600">{calculatePoints()}</span>
              </div>
            </div>
          )}

          {/* Evidence Upload */}
          <div>
            <Label htmlFor="evidence">
              <FileText className="w-4 h-4 inline mr-1" />
              Evidence (Optional)
            </Label>
            <div className="mt-1">
              <label className="flex items-center justify-center w-full px-4 py-2 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:border-blue-400 transition-colors">
                <Upload className="w-5 h-5 mr-2 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {evidenceFile ? evidenceFile.name : 'Click to upload certificate or evidence'}
                </span>
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  className="hidden"
                />
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Accepted formats: PDF, JPG, PNG, DOC, DOCX (Max 10MB)
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Adding...' : 'Add Activity'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
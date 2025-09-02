import { useState, useEffect } from 'react'
import { Save, Settings, Award, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import cpd, { type CPDSettings, type CPDCategorySettings } from '../cpdService'
import { useAuthStore } from '../../../stores/authStore'

const { CPDService } = cpd

export function CPDSettingsPage() {
  const [settings, setSettings] = useState<CPDSettings | null>(null)
  const [categorySettings, setCategorySettings] = useState<CPDCategorySettings[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingCategories, setEditingCategories] = useState<{ [key: number]: number }>({})
  const { user } = useAuthStore()

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const [globalSettings, categories] = await Promise.all([
        CPDService.getCPDSettings(),
        CPDService.getCategorySettings()
      ])
      setSettings(globalSettings)
      setCategorySettings(categories)
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAutoApprovalToggle = async () => {
    if (!settings || !user) return

    try {
      setSaving(true)
      const updated = await CPDService.updateCPDSettings(
        { auto_approval_enabled: !settings.auto_approval_enabled }
      )
      setSettings(updated)
    } catch (error) {
      console.error('Error updating auto approval:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleCategoryPointsChange = (categoryId: number, points: number) => {
    setEditingCategories(prev => ({
      ...prev,
      [categoryId]: points
    }))
  }

  const saveCategoryPoints = async (categoryId: number) => {
    if (!user) return

    const newPoints = editingCategories[categoryId]
    if (newPoints === undefined || newPoints < 0) return

    try {
      setSaving(true)
      await CPDService.updateCategorySettings(
        categoryId,
        { points_per_hour: newPoints }
      )

      // Update local state
      setCategorySettings(prev => 
        prev.map(cat => 
          cat.category_id === categoryId 
            ? { ...cat, points_per_hour: newPoints }
            : cat
        )
      )

      // Remove from editing state
      setEditingCategories(prev => {
        const newState = { ...prev }
        delete newState[categoryId]
        return newState
      })
    } catch (error) {
      console.error('Error saving category points:', error)
    } finally {
      setSaving(false)
    }
  }

  const cancelCategoryEdit = (categoryId: number) => {
    setEditingCategories(prev => {
      const newState = { ...prev }
      delete newState[categoryId]
      return newState
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <Settings className="h-8 w-8 text-blue-600" />
          CPD System Configuration
        </h1>
        <p className="text-gray-600">
          Configure CPD activity settings, points per hour by category, and approval workflow.
        </p>
      </div>

      <div className="space-y-6">
        
        {/* Global Settings */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <AlertCircle className="h-6 w-6 text-orange-600" />
            <h2 className="text-xl font-semibold text-gray-900">Global Settings</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Automatic Approval</h3>
                <p className="text-sm text-gray-600 mt-1">
                  When enabled, all CPD activities submitted by members will be automatically approved without requiring admin review.
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`text-sm font-medium ${
                  settings?.auto_approval_enabled ? 'text-green-600' : 'text-red-600'
                }`}>
                  {settings?.auto_approval_enabled ? 'Enabled' : 'Disabled'}
                </span>
                <Button
                  onClick={handleAutoApprovalToggle}
                  disabled={saving}
                  className={`${
                    settings?.auto_approval_enabled 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-green-600 hover:bg-green-700'
                  } text-white`}
                >
                  {settings?.auto_approval_enabled ? (
                    <>
                      <XCircle className="h-4 w-4 mr-2" />
                      Disable
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Enable
                    </>
                  )}
                </Button>
              </div>
            </div>

            {settings?.auto_approval_enabled && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-green-800">Auto-Approval Active</h4>
                    <p className="text-sm text-green-700 mt-1">
                      All new CPD submissions will be automatically approved and members will receive points immediately.
                      You can still access the Review page to see all activities, but no manual approval is required.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Category Points Configuration */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Award className="h-6 w-6 text-yellow-600" />
            <h2 className="text-xl font-semibold text-gray-900">Points per Hour by Category</h2>
          </div>

          <div className="space-y-3">
            {categorySettings.map((category) => (
              <div key={category.category_id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {category.category_name}
                  </h3>
                  <p className="text-xs text-gray-500">Category ID: {category.category_id}</p>
                </div>

                <div className="flex items-center space-x-3">
                  {editingCategories[category.category_id] !== undefined ? (
                    // Editing mode
                    <>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          value={editingCategories[category.category_id]}
                          onChange={(e) => handleCategoryPointsChange(category.category_id, parseFloat(e.target.value) || 0)}
                          className="w-20 text-center"
                        />
                        <span className="text-sm text-gray-600">pts/hr</span>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => saveCategoryPoints(category.category_id)}
                          disabled={saving}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Save className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => cancelCategoryEdit(category.category_id)}
                          disabled={saving}
                        >
                          Cancel
                        </Button>
                      </div>
                    </>
                  ) : (
                    // Display mode
                    <>
                      <div className="text-center">
                        <span className="text-lg font-bold text-blue-600">
                          {category.points_per_hour}
                        </span>
                        <br />
                        <span className="text-xs text-gray-500">points/hour</span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingCategories(prev => ({
                          ...prev,
                          [category.category_id]: category.points_per_hour
                        }))}
                        className="text-blue-600 border-blue-600 hover:bg-blue-50"
                      >
                        Edit
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-800">Points Calculation</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Points are calculated automatically when members submit activities. 
                  The formula is: <strong>(Hours + Minutes/60) × Points per Hour</strong>.
                  Changes to points per hour only apply to new submissions.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Current Status Summary */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Configuration Summary</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                {settings?.auto_approval_enabled ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <span className="font-medium">Auto-Approval</span>
              </div>
              <p className="text-sm text-gray-600">
                {settings?.auto_approval_enabled 
                  ? 'Activities are automatically approved'
                  : 'Activities require manual review'
                }
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Award className="h-5 w-5 text-yellow-600" />
                <span className="font-medium">Categories</span>
              </div>
              <p className="text-sm text-gray-600">
                {categorySettings.length} active categories configured
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Settings className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Points Range</span>
              </div>
              <p className="text-sm text-gray-600">
                {Math.min(...categorySettings.map(c => c.points_per_hour))} - {Math.max(...categorySettings.map(c => c.points_per_hour))} pts/hour
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
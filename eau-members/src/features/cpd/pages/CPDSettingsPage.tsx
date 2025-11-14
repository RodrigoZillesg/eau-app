import { useState, useEffect } from 'react'
import { Settings, Award, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import cpd, { type CPDSettings } from '../cpdService'
import { useAuthStore } from '../../../stores/authStore'

const { CPDService } = cpd

export function CPDSettingsPage() {
  const [settings, setSettings] = useState<CPDSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { user } = useAuthStore()

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const globalSettings = await CPDService.getCPDSettings()
      setSettings(globalSettings)
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        {/* CPD Categories Management - Redirect Card */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Award className="h-6 w-6 text-yellow-600" />
            <h2 className="text-xl font-semibold text-gray-900">CPD Categories Management</h2>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 mb-3">
              <strong>Note:</strong> CPD category configuration and points per hour settings are now managed in a dedicated page.
            </p>
            <Button
              onClick={() => window.location.href = '/admin/cpd-categories'}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Settings className="h-4 w-4 mr-2" />
              Manage CPD Categories
            </Button>
          </div>
        </Card>

        {/* Current Status Summary */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Configuration</h2>

          <div className="bg-gray-50 p-4 rounded-lg max-w-md">
            <div className="flex items-center space-x-2 mb-2">
              {settings?.auto_approval_enabled ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span className="font-medium">Auto-Approval Status</span>
            </div>
            <p className="text-sm text-gray-600">
              {settings?.auto_approval_enabled
                ? 'Activities are automatically approved'
                : 'Activities require manual review'
              }
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
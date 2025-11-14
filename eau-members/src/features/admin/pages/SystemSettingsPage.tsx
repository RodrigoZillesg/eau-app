import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Switch } from '../../../components/ui/Switch'
import { supabase } from '../../../lib/supabase/client'
import { showNotification } from '../../../utils/notifications'
import { Save, Settings, Calendar, Users, BookOpen } from 'lucide-react'

interface SystemSettings {
  id?: string
  institutions_can_create_events: boolean
  created_at?: string
  updated_at?: string
}

export const SystemSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings>({
    institutions_can_create_events: false
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)

      // Get event_management settings from system_settings table (JSONB format)
      const { data: settingsRow, error } = await supabase
        .from('system_settings')
        .select('id, setting_value, created_at, updated_at')
        .eq('setting_key', 'event_management')
        .single()

      if (settingsRow && settingsRow.setting_value) {
        // Extract settings from JSONB
        const value = settingsRow.setting_value as any
        setSettings({
          id: settingsRow.id,
          institutions_can_create_events: value.institutions_can_create_events ?? false,
          created_at: settingsRow.created_at,
          updated_at: settingsRow.updated_at
        })
      } else if (error?.code === 'PGRST116') {
        // No settings found, will use defaults
        console.log('No system settings found, using defaults')
      } else if (error) {
        console.error('Error loading system settings:', error)
        showNotification('error', 'Error loading settings')
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      showNotification('error', 'Error loading settings')
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    try {
      setSaving(true)

      // Update event_management settings (JSONB format)
      const { data: result, error } = await supabase
        .from('system_settings')
        .update({
          setting_value: {
            institutions_can_create_events: settings.institutions_can_create_events
          },
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', 'event_management')
        .select('id, setting_value, created_at, updated_at')
        .single()

      if (error) throw error

      if (result && result.setting_value) {
        const value = result.setting_value as any
        setSettings({
          id: result.id,
          institutions_can_create_events: value.institutions_can_create_events ?? false,
          created_at: result.created_at,
          updated_at: result.updated_at
        })
      }

      showNotification('success', 'Settings saved successfully')
    } catch (error) {
      console.error('Error saving settings:', error)
      showNotification('error', 'Error saving settings')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = (field: keyof SystemSettings) => {
    setSettings(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Settings className="h-8 w-8" />
          System Settings
        </h1>
        <p className="mt-2 text-gray-600">
          Configure global system settings and permissions
        </p>
      </div>

      <div className="space-y-6">
        {/* Events Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Event Management
            </CardTitle>
            <CardDescription>
              Control event creation permissions for institutions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <label htmlFor="events-toggle" className="text-sm font-medium text-gray-900">
                    Allow Institutions to Create Events
                  </label>
                  <p className="text-sm text-gray-500 mt-1">
                    When enabled, Institution Admins can create and manage events for their institution.
                    When disabled, only Super Admins can create events.
                  </p>
                </div>
                <Switch
                  id="events-toggle"
                  checked={settings.institutions_can_create_events}
                  onCheckedChange={() => handleToggle('institutions_can_create_events')}
                  className="ml-4"
                />
              </div>

              {settings.institutions_can_create_events && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Institution Admins will be able to:
                  </p>
                  <ul className="list-disc list-inside text-sm text-blue-700 mt-2 ml-2">
                    <li>Create new events for their institution</li>
                    <li>Edit and manage their own events</li>
                    <li>View registrations for their events</li>
                    <li>Cannot delete or modify events from other institutions</li>
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* CPD Settings moved to dedicated CPD Settings page */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              CPD Management
            </CardTitle>
            <CardDescription>
              CPD settings have been moved to a dedicated configuration page
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 mb-3">
                <strong>Note:</strong> CPD approval settings and points configuration are now managed separately.
              </p>
              <Button
                onClick={() => window.location.href = '/admin/cpd/settings'}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Settings className="h-4 w-4 mr-2" />
                Go to CPD Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Permission Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Current Permission Summary
            </CardTitle>
            <CardDescription>
              Overview of current system permissions by role
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-900">Feature</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-900">SuperAdmin<br/><span className="text-xs text-gray-600">(Developer)</span></th>
                      <th className="px-4 py-3 text-center font-medium text-gray-900">Admin<br/><span className="text-xs text-gray-600">(System Owner)</span></th>
                      <th className="px-4 py-3 text-center font-medium text-gray-900">InstitutionAdmin<br/><span className="text-xs text-gray-600">(Institution)</span></th>
                      <th className="px-4 py-3 text-center font-medium text-gray-900">Members<br/><span className="text-xs text-gray-600">(Regular)</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-3 text-gray-900">Create Events</td>
                      <td className="px-4 py-3 text-center">✅</td>
                      <td className="px-4 py-3 text-center">✅</td>
                      <td className="px-4 py-3 text-center">
                        {settings.institutions_can_create_events ? '✅' : '❌'}
                      </td>
                      <td className="px-4 py-3 text-center">❌</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-gray-900">Review CPD Activities</td>
                      <td className="px-4 py-3 text-center">✅</td>
                      <td className="px-4 py-3 text-center">✅</td>
                      <td className="px-4 py-3 text-center">✅</td>
                      <td className="px-4 py-3 text-center">❌</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-gray-900">Manage All Members</td>
                      <td className="px-4 py-3 text-center">✅</td>
                      <td className="px-4 py-3 text-center">✅</td>
                      <td className="px-4 py-3 text-center">❌</td>
                      <td className="px-4 py-3 text-center">❌</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-gray-900">View Institution Members</td>
                      <td className="px-4 py-3 text-center">✅</td>
                      <td className="px-4 py-3 text-center">✅</td>
                      <td className="px-4 py-3 text-center">✅</td>
                      <td className="px-4 py-3 text-center">❌</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-gray-900">OpenLearning Integration</td>
                      <td className="px-4 py-3 text-center">✅</td>
                      <td className="px-4 py-3 text-center">✅</td>
                      <td className="px-4 py-3 text-center">❌</td>
                      <td className="px-4 py-3 text-center">❌</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-gray-900">Certificates & CPD</td>
                      <td className="px-4 py-3 text-center">✅</td>
                      <td className="px-4 py-3 text-center">✅</td>
                      <td className="px-4 py-3 text-center">❌</td>
                      <td className="px-4 py-3 text-center">❌</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-gray-900">Email Management</td>
                      <td className="px-4 py-3 text-center">✅</td>
                      <td className="px-4 py-3 text-center">✅</td>
                      <td className="px-4 py-3 text-center">❌</td>
                      <td className="px-4 py-3 text-center">❌</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-gray-900">Import System (Technical)</td>
                      <td className="px-4 py-3 text-center">✅</td>
                      <td className="px-4 py-3 text-center">❌</td>
                      <td className="px-4 py-3 text-center">❌</td>
                      <td className="px-4 py-3 text-center">❌</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-gray-900">Bulk Operations</td>
                      <td className="px-4 py-3 text-center">✅</td>
                      <td className="px-4 py-3 text-center">❌</td>
                      <td className="px-4 py-3 text-center">❌</td>
                      <td className="px-4 py-3 text-center">❌</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-gray-900">System Settings</td>
                      <td className="px-4 py-3 text-center">✅</td>
                      <td className="px-4 py-3 text-center">❌</td>
                      <td className="px-4 py-3 text-center">❌</td>
                      <td className="px-4 py-3 text-center">❌</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={saveSettings}
            disabled={saving}
            className="min-w-[150px]"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
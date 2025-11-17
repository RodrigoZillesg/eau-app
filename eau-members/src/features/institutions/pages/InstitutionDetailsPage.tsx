import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Mail, Phone, Globe, MapPin, Save, ArrowLeft, Calendar, DollarSign } from 'lucide-react'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { useAuthStore } from '../../../stores/authStore'
import { showNotification } from '../../../lib/notifications'
import { supabase } from '../../../lib/supabase/client'

const API_BASE_URL = 'http://localhost:3001/api/v1'

interface Institution {
  id: string
  name: string
  code: string | null
  email: string | null
  phone: string | null
  website: string | null
  address: string | null
  city: string | null
  state: string | null
  country: string | null
  postal_code: string | null
  membership_type: string | null
  membership_status: string
  membership_start_date: string | null
  membership_renewal_date: string | null
  membership_fee_amount: number | null
  membership_fee_gst: number | null
  membership_fee_total: number | null
  created_at: string
  updated_at: string
}

export function InstitutionDetailsPage() {
  const [institution, setInstitution] = useState<Institution | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState<Partial<Institution>>({})
  const { memberData } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (!memberData?.institution_id) {
      showNotification({
        title: 'Error',
        message: 'No institution associated with your account',
        type: 'error'
      })
      navigate('/dashboard')
      return
    }

    loadInstitution()
  }, [memberData])

  const loadInstitution = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const response = await fetch(`${API_BASE_URL}/institutions/${memberData?.institution_id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (data?.success) {
        setInstitution(data.data)
        setFormData(data.data)
      } else {
        throw new Error(data?.error || 'Failed to load institution')
      }
    } catch (error: any) {
      console.error('Error loading institution:', error)
      showNotification({
        title: 'Error',
        message: 'Failed to load institution details',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      // Only send fields that Institution Admin can update
      const allowedFields = {
        email: formData.email,
        phone: formData.phone,
        website: formData.website,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        postal_code: formData.postal_code
      }

      const response = await fetch(`${API_BASE_URL}/institutions/${memberData?.institution_id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(allowedFields)
      })

      const data = await response.json()

      if (data?.success) {
        setInstitution(data.data)
        setFormData(data.data)
        setEditMode(false)
        showNotification({
          title: 'Success',
          message: 'Institution details updated successfully',
          type: 'success'
        })
      } else {
        throw new Error(data?.error || 'Failed to update institution')
      }
    } catch (error: any) {
      console.error('Error updating institution:', error)
      showNotification({
        title: 'Error',
        message: 'Failed to update institution details',
        type: 'error'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData(institution || {})
    setEditMode(false)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-AU', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return 'N/A'
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status as keyof typeof colors] || colors.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
          <div className="space-y-4">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!institution) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="p-12 text-center">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Institution Found</h3>
          <p className="text-gray-500 mb-6">
            No institution is associated with your account.
          </p>
          <Button onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Institution Details</h1>
            <p className="text-gray-600 mt-1">View and manage your institution information</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {editMode ? (
            <>
              <Button variant="outline" onClick={handleCancel} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          ) : (
            <Button onClick={() => setEditMode(true)}>
              Edit Details
            </Button>
          )}
        </div>
      </div>

      {/* Institution Name & Status */}
      <Card className="p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{institution.name}</h2>
              {institution.code && (
                <p className="text-sm text-gray-600 mt-1">Code: {institution.code}</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600 mb-2">Membership Status</p>
            {getStatusBadge(institution.membership_status)}
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Contact Information */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-gray-600" />
            Contact Information
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              {editMode ? (
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="institution@example.com"
                />
              ) : (
                <div className="flex items-center gap-2 text-gray-900">
                  <Mail className="w-4 h-4 text-gray-400" />
                  {institution.email || 'Not set'}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              {editMode ? (
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="+61 2 1234 5678"
                />
              ) : (
                <div className="flex items-center gap-2 text-gray-900">
                  <Phone className="w-4 h-4 text-gray-400" />
                  {institution.phone || 'Not set'}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website
              </label>
              {editMode ? (
                <input
                  type="url"
                  value={formData.website || ''}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://www.example.com"
                />
              ) : (
                <div className="flex items-center gap-2 text-gray-900">
                  <Globe className="w-4 h-4 text-gray-400" />
                  {institution.website ? (
                    <a href={institution.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {institution.website}
                    </a>
                  ) : (
                    'Not set'
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Address */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-gray-600" />
            Address
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Street Address
              </label>
              {editMode ? (
                <textarea
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={2}
                  placeholder="123 Main Street"
                />
              ) : (
                <p className="text-gray-900">{institution.address || 'Not set'}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                {editMode ? (
                  <input
                    type="text"
                    value={formData.city || ''}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Sydney"
                  />
                ) : (
                  <p className="text-gray-900">{institution.city || 'Not set'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                {editMode ? (
                  <input
                    type="text"
                    value={formData.state || ''}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="NSW"
                  />
                ) : (
                  <p className="text-gray-900">{institution.state || 'Not set'}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Postal Code
                </label>
                {editMode ? (
                  <input
                    type="text"
                    value={formData.postal_code || ''}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="2000"
                  />
                ) : (
                  <p className="text-gray-900">{institution.postal_code || 'Not set'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <p className="text-gray-900">{institution.country || 'Australia'}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Membership Information */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-600" />
            Membership Information
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Membership Type
              </label>
              <p className="text-gray-900">{institution.membership_type || 'Not set'}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <p className="text-gray-900">{formatDate(institution.membership_start_date)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Renewal Date
                </label>
                <p className="text-gray-900">{formatDate(institution.membership_renewal_date)}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <div className="mt-1">
                {getStatusBadge(institution.membership_status)}
              </div>
            </div>
          </div>
        </Card>

        {/* Fee Information */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-gray-600" />
            Fee Information
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Base Amount
                </label>
                <p className="text-gray-900 font-semibold">{formatCurrency(institution.membership_fee_amount)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GST
                </label>
                <p className="text-gray-900 font-semibold">{formatCurrency(institution.membership_fee_gst)}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Amount (incl. GST)
              </label>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(institution.membership_fee_total)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* System Information */}
      <Card className="p-6 mt-6">
        <h3 className="text-lg font-semibold mb-4">System Information</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Created:</span>
            <span className="ml-2 text-gray-900">{formatDate(institution.created_at)}</span>
          </div>
          <div>
            <span className="text-gray-600">Last Updated:</span>
            <span className="ml-2 text-gray-900">{formatDate(institution.updated_at)}</span>
          </div>
        </div>
      </Card>
    </div>
  )
}

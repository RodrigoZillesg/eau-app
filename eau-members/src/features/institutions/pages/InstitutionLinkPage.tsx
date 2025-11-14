import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Check, Clock, X, AlertCircle, Link as LinkIcon, Unlink } from 'lucide-react'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { SearchableSelect } from '../../../components/ui/SearchableSelect'
import { useAuthStore } from '../../../stores/authStore'
import { showNotification } from '../../../lib/notifications'
import { supabase } from '../../../lib/supabase/client'

const API_BASE_URL = 'http://localhost:3001/api/v1'

interface Institution {
  id: string
  name: string
  email: string
}

interface LinkStatus {
  currentInstitution: {
    id: string
    name: string
    linkedAt: string
  } | null
  pendingRequest: {
    id: string
    institutionName: string
    requestedAt: string
  } | null
  history: Array<{
    id: string
    institution: { name: string }
    status: 'pending' | 'approved' | 'rejected'
    requested_at: string
    reviewed_at: string | null
    review_notes: string | null
    reviewer: { first_name: string; last_name: string } | null
  }>
}

export function InstitutionLinkPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [selectedInstitutionId, setSelectedInstitutionId] = useState('')
  const [linkStatus, setLinkStatus] = useState<LinkStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const { user } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    loadData()
  }, [user, navigate])

  const loadData = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      // Load institutions list (with forLinking flag to get all active institutions)
      const institutionsResponse = await fetch(`${API_BASE_URL}/institutions?forLinking=true`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      const institutionsData = await institutionsResponse.json()
      if (institutionsData?.success) {
        setInstitutions(institutionsData.data?.institutions || [])
      }

      // Load user's link status
      const statusResponse = await fetch(`${API_BASE_URL}/institution-links/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      const statusData = await statusResponse.json()
      if (statusData?.success) {
        setLinkStatus(statusData.data)
      }
    } catch (error) {
      console.error('Error loading data:', error)
      showNotification({
        title: 'Error',
        message: 'Failed to load institution data',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRequestLink = async () => {
    if (!selectedInstitutionId) {
      showNotification({
        title: 'Validation Error',
        message: 'Please select an institution',
        type: 'warning'
      })
      return
    }

    try {
      setSubmitting(true)
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const response = await fetch(`${API_BASE_URL}/institution-links/request`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          institution_id: selectedInstitutionId
        })
      })

      const data = await response.json()

      if (data?.success) {
        showNotification({
          title: 'Success',
          message: data.message || 'Link request submitted successfully',
          type: 'success'
        })
        setSelectedInstitutionId('')
        loadData() // Reload data
      } else {
        showNotification({
          title: 'Error',
          message: data?.error || 'Failed to submit link request',
          type: 'error'
        })
      }
    } catch (error: any) {
      showNotification({
        title: 'Error',
        message: 'Failed to submit link request',
        type: 'error'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleUnlink = async () => {
    if (!window.confirm('Are you sure you want to unlink from your current institution?')) {
      return
    }

    try {
      setSubmitting(true)
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const response = await fetch(`${API_BASE_URL}/institution-links/unlink`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (data?.success) {
        showNotification({
          title: 'Success',
          message: 'Successfully unlinked from institution',
          type: 'success'
        })
        loadData() // Reload data
      } else {
        showNotification({
          title: 'Error',
          message: data?.error || 'Failed to unlink',
          type: 'error'
        })
      }
    } catch (error: any) {
      showNotification({
        title: 'Error',
        message: 'Failed to unlink',
        type: 'error'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <Check className="w-5 h-5 text-green-500" />
      case 'rejected':
        return <X className="w-5 h-5 text-red-500" />
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Building2 className="w-8 h-8 text-blue-600" />
        <h1 className="text-3xl font-bold">Institution Linking</h1>
      </div>

      <div className="space-y-6">
        {/* Current Status */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Current Status</h2>

          {linkStatus?.currentInstitution ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-green-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-green-900">Linked to Institution</h3>
                    <p className="text-green-700 mt-1">{linkStatus.currentInstitution.name}</p>
                    <p className="text-sm text-green-600 mt-1">
                      Linked on {new Date(linkStatus.currentInstitution.linkedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUnlink}
                  disabled={submitting}
                  className="text-red-600 hover:bg-red-50"
                >
                  <Unlink className="w-4 h-4 mr-2" />
                  Unlink
                </Button>
              </div>
            </div>
          ) : linkStatus?.pendingRequest ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Clock className="w-6 h-6 text-yellow-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-yellow-900">Pending Request</h3>
                  <p className="text-yellow-700 mt-1">
                    You have a pending link request to <strong>{linkStatus.pendingRequest.institutionName}</strong>
                  </p>
                  <p className="text-sm text-yellow-600 mt-1">
                    Requested on {new Date(linkStatus.pendingRequest.requestedAt).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-yellow-600 mt-2">
                    Please wait for the institution administrator to review your request.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-gray-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Not Linked</h3>
                  <p className="text-gray-600 mt-1">
                    You are not currently linked to any institution. Link to an institution to access exclusive resources and events.
                  </p>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Request New Link */}
        {!linkStatus?.pendingRequest && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <LinkIcon className="w-5 h-5" />
              {linkStatus?.currentInstitution ? 'Request Institution Transfer' : 'Request Institution Link'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Institution
                </label>
                <SearchableSelect
                  options={institutions.map((inst) => ({
                    value: inst.id,
                    label: inst.name
                  }))}
                  value={selectedInstitutionId}
                  onChange={setSelectedInstitutionId}
                  placeholder="-- Select an institution --"
                  emptyMessage="No institutions found"
                />
              </div>

              <Button
                onClick={handleRequestLink}
                disabled={!selectedInstitutionId || submitting}
                className="w-full"
              >
                {submitting ? 'Submitting...' : 'Submit Link Request'}
              </Button>

              <p className="text-sm text-gray-500 mt-2">
                <strong>Note:</strong> Your request will be sent to the institution's administrator for approval.
                You will receive an email notification once your request has been reviewed.
              </p>
            </div>
          </Card>
        )}

        {/* Request History */}
        {linkStatus?.history && linkStatus.history.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Request History</h2>

            <div className="space-y-4">
              {linkStatus.history.map((request) => (
                <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getStatusIcon(request.status)}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{request.institution.name}</h3>
                          {getStatusBadge(request.status)}
                        </div>
                        <p className="text-sm text-gray-600">
                          Requested: {new Date(request.requested_at).toLocaleDateString()}
                        </p>
                        {request.reviewed_at && (
                          <p className="text-sm text-gray-600">
                            Reviewed: {new Date(request.reviewed_at).toLocaleDateString()}
                            {request.reviewer && ` by ${request.reviewer.first_name} ${request.reviewer.last_name}`}
                          </p>
                        )}
                        {request.review_notes && (
                          <div className="mt-2 p-3 bg-gray-50 rounded-md">
                            <p className="text-sm font-medium text-gray-700">Admin Notes:</p>
                            <p className="text-sm text-gray-600 mt-1">{request.review_notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

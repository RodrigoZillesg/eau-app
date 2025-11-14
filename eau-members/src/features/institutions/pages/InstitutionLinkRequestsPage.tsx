import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Check, X, Clock, Mail, User, Calendar } from 'lucide-react'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { useAuthStore } from '../../../stores/authStore'
import { usePermissions } from '../../../hooks/usePermissions'
import { showNotification } from '../../../lib/notifications'
import { supabase } from '../../../lib/supabase/client'

const API_BASE_URL = 'http://localhost:3001/api/v1'

interface LinkRequest {
  id: string
  member_id: string
  institution_id: string
  status: 'pending' | 'approved' | 'rejected'
  requested_at: string
  reviewed_at: string | null
  review_notes: string | null
  member: {
    id: string
    first_name: string
    last_name: string
    email: string
    phone: string | null
    user_type: string
    membership_type: string | null
    created_at: string
  }
  reviewer?: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
}

export function InstitutionLinkRequestsPage() {
  const [requests, setRequests] = useState<LinkRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<LinkRequest[]>([])
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending')
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [reviewNotes, setReviewNotes] = useState<{ [key: string]: string }>({})
  const [showNotesFor, setShowNotesFor] = useState<{ [key: string]: boolean }>({})
  const { user } = useAuthStore()
  const { isAdmin } = usePermissions()
  const navigate = useNavigate()

  // Check admin status ONCE outside useEffect to prevent loop
  const userIsAdmin = isAdmin()

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    // Check if user is admin using permissions system
    if (!userIsAdmin) {
      navigate('/dashboard')
      showNotification({
        title: 'Access Denied',
        message: 'You do not have permission to access this page',
        type: 'error'
      })
      return
    }

    loadRequests()
  }, [user, navigate, activeTab, userIsAdmin])

  const loadRequests = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const endpoint = activeTab === 'pending'
        ? '/institution-links/pending'
        : '/institution-links/all'

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (data?.success) {
        const requests = data.data || []
        setRequests(requests)
        setFilteredRequests(requests)
      }
    } catch (error: any) {
      console.error('Error loading requests:', error)
      showNotification({
        title: 'Error',
        message: 'Failed to load link requests',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (requestId: string) => {
    if (!window.confirm('Are you sure you want to approve this link request?')) {
      return
    }

    try {
      console.log('🔵 Starting approval for request:', requestId)
      setProcessingId(requestId)
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      console.log('🔵 Token obtained:', token ? 'YES' : 'NO')

      const url = `${API_BASE_URL}/institution-links/${requestId}/approve`
      console.log('🔵 Sending POST to:', url)

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notes: reviewNotes[requestId] || undefined
        })
      })

      console.log('🔵 Response status:', response.status)
      const data = await response.json()
      console.log('🔵 Response data:', data)

      if (data?.success) {
        showNotification({
          title: 'Success',
          message: 'Link request approved successfully',
          type: 'success'
        })
        loadRequests() // Reload list
        setReviewNotes({ ...reviewNotes, [requestId]: '' })
        setShowNotesFor({ ...showNotesFor, [requestId]: false })
      } else {
        showNotification({
          title: 'Error',
          message: data?.error || 'Failed to approve request',
          type: 'error'
        })
      }
    } catch (error: any) {
      console.error('❌ Approval error:', error)
      showNotification({
        title: 'Error',
        message: 'Failed to approve request',
        type: 'error'
      })
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (requestId: string) => {
    const notes = reviewNotes[requestId]?.trim()

    if (!notes) {
      showNotification({
        title: 'Validation Error',
        message: 'Please provide a reason for rejection',
        type: 'warning'
      })
      setShowNotesFor({ ...showNotesFor, [requestId]: true })
      return
    }

    if (!window.confirm('Are you sure you want to reject this link request?')) {
      return
    }

    try {
      setProcessingId(requestId)
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const response = await fetch(`${API_BASE_URL}/institution-links/${requestId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notes
        })
      })

      const data = await response.json()

      if (data?.success) {
        showNotification({
          title: 'Success',
          message: 'Link request rejected',
          type: 'success'
        })
        loadRequests() // Reload list
        setReviewNotes({ ...reviewNotes, [requestId]: '' })
        setShowNotesFor({ ...showNotesFor, [requestId]: false })
      } else {
        showNotification({
          title: 'Error',
          message: data?.error || 'Failed to reject request',
          type: 'error'
        })
      }
    } catch (error: any) {
      showNotification({
        title: 'Error',
        message: 'Failed to reject request',
        type: 'error'
      })
    } finally {
      setProcessingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    }

    const icons = {
      pending: <Clock className="w-3 h-3" />,
      approved: <Check className="w-3 h-3" />,
      rejected: <X className="w-3 h-3" />
    }

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors]}`}>
        {icons[status as keyof typeof icons]}
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
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Building2 className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Institution Link Requests</h1>
        </div>
        <Button variant="outline" onClick={loadRequests}>
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('pending')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'pending'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Pending Requests
            {requests.filter(r => r.status === 'pending').length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                {requests.filter(r => r.status === 'pending').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'all'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            All Requests
          </button>
        </nav>
      </div>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <Card className="p-12 text-center">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Requests Found</h3>
          <p className="text-gray-500">
            {activeTab === 'pending'
              ? 'There are no pending link requests at this time.'
              : 'No link requests have been submitted yet.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <Card key={request.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-semibold">
                      {request.member.first_name} {request.member.last_name}
                    </h3>
                    {getStatusBadge(request.status)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span>{request.member.email}</span>
                    </div>
                    {request.member.phone && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <User className="w-4 h-4" />
                        <span>{request.member.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>Requested: {new Date(request.requested_at).toLocaleDateString()}</span>
                    </div>
                    {request.member.membership_type && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <User className="w-4 h-4" />
                        <span>Type: {request.member.membership_type}</span>
                      </div>
                    )}
                  </div>

                  {/* Review History */}
                  {request.status !== 'pending' && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        {request.status === 'approved' ? 'Approved' : 'Rejected'}
                        {request.reviewed_at && ` on ${new Date(request.reviewed_at).toLocaleDateString()}`}
                        {request.reviewer && ` by ${request.reviewer.first_name} ${request.reviewer.last_name}`}
                      </p>
                      {request.review_notes && (
                        <p className="text-sm text-gray-600 mt-2">
                          <strong>Notes:</strong> {request.review_notes}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons - Only for Pending */}
              {request.status === 'pending' && (
                <div className="space-y-3 mt-4 pt-4 border-t border-gray-200">
                  {/* Show/Hide Notes Toggle */}
                  <button
                    onClick={() => setShowNotesFor({ ...showNotesFor, [request.id]: !showNotesFor[request.id] })}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    {showNotesFor[request.id] ? 'Hide notes' : 'Add notes (optional for approval, required for rejection)'}
                  </button>

                  {/* Notes Textarea */}
                  {showNotesFor[request.id] && (
                    <textarea
                      value={reviewNotes[request.id] || ''}
                      onChange={(e) => setReviewNotes({ ...reviewNotes, [request.id]: e.target.value })}
                      placeholder="Add notes for this request..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      rows={3}
                    />
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleApprove(request.id)}
                      disabled={processingId === request.id}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      {processingId === request.id ? 'Processing...' : 'Approve'}
                    </Button>
                    <Button
                      onClick={() => handleReject(request.id)}
                      disabled={processingId === request.id}
                      variant="outline"
                      className="border-red-600 text-red-600 hover:bg-red-50"
                    >
                      <X className="w-4 h-4 mr-2" />
                      {processingId === request.id ? 'Processing...' : 'Reject'}
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

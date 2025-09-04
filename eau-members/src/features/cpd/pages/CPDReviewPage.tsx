import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Clock, FileText, User, Calendar, Award } from 'lucide-react'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Label } from '../../../components/ui/Label'
import cpd, { type CPDActivity } from '../cpdService'
import { useAuthStore } from '../../../stores/authStore'
import { format } from 'date-fns'

const { CPDService } = cpd

interface CPDActivityWithMember extends CPDActivity {
  members?: {
    first_name: string
    last_name: string
    email: string
  }
}

export function CPDReviewPage() {
  const [activities, setActivities] = useState<CPDActivityWithMember[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedActivity, setSelectedActivity] = useState<CPDActivityWithMember | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)
  const { user } = useAuthStore()

  useEffect(() => {
    loadPendingActivities()
  }, [])

  const loadPendingActivities = async () => {
    try {
      setLoading(true)
      const data = await CPDService.getAllPendingActivities()
      setActivities(data)
    } catch (error) {
      console.error('Error loading pending activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (activityId: string) => {
    if (!user) return
    
    try {
      await CPDService.approveActivity(activityId, user.id)
      await loadPendingActivities()
    } catch (error) {
      console.error('Error approving activity:', error)
    }
  }

  const handleReject = async () => {
    if (!user || !selectedActivity) return

    try {
      await CPDService.rejectActivity(selectedActivity.id, user.id, rejectReason)
      await loadPendingActivities()
      setShowRejectModal(false)
      setSelectedActivity(null)
      setRejectReason('')
    } catch (error) {
      console.error('Error rejecting activity:', error)
    }
  }

  const openRejectModal = (activity: CPDActivityWithMember) => {
    setSelectedActivity(activity)
    setShowRejectModal(true)
  }

  const closeRejectModal = () => {
    setShowRejectModal(false)
    setSelectedActivity(null)
    setRejectReason('')
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Review CPD Submissions
        </h1>
        <p className="text-gray-600">
          Review and approve or reject pending CPD activity submissions from members.
        </p>
      </div>

      {activities.length === 0 ? (
        <Card className="p-8 text-center">
          <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No pending submissions
          </h3>
          <p className="text-gray-600">
            All CPD submissions have been reviewed. Check back later for new submissions.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {activities.map((activity) => (
            <Card key={activity.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-blue-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {activity.members?.first_name} {activity.members?.last_name}
                    </h3>
                    <p className="text-sm text-gray-600">{activity.members?.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <span className="text-sm text-orange-600 font-medium">Pending Review</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Activity Title</Label>
                  <p className="text-sm text-gray-900 font-semibold">{activity.activity_title}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">Category</Label>
                  <p className="text-sm text-gray-900">{activity.category_name}</p>
                </div>

                <div className="flex items-center space-x-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Duration</Label>
                    <p className="text-sm text-gray-900">
                      {activity.hours}h {activity.minutes}m
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Points</Label>
                    <div className="flex items-center space-x-1">
                      <Award className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-semibold text-gray-900">
                        {activity.points}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">Date Completed</Label>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-900">
                      {format(new Date(activity.date_completed), 'MMM dd, yyyy')}
                    </span>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">Provider</Label>
                  <p className="text-sm text-gray-900">{activity.provider || 'N/A'}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">Submitted</Label>
                  <p className="text-sm text-gray-900">
                    {format(new Date(activity.created_at), 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>

              {activity.description && (
                <div className="mb-4">
                  <Label className="text-sm font-medium text-gray-700">Description</Label>
                  <p className="text-sm text-gray-900 mt-1">{activity.description}</p>
                </div>
              )}

              {activity.evidence_url && (
                <div className="mb-6">
                  <Label className="text-sm font-medium text-gray-700">Evidence</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <a 
                      href={activity.evidence_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm underline"
                    >
                      {activity.evidence_filename || 'View Evidence'}
                    </a>
                  </div>
                </div>
              )}

              <div className="flex space-x-3 pt-4 border-t border-gray-200">
                <Button
                  onClick={() => handleApprove(activity.id)}
                  className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Approve</span>
                </Button>

                <Button
                  onClick={() => openRejectModal(activity)}
                  variant="outline"
                  className="flex items-center space-x-2 text-red-600 border-red-600 hover:bg-red-50"
                >
                  <XCircle className="h-4 w-4" />
                  <span>Reject</span>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Reject CPD Submission
            </h3>
            
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for rejecting this submission. This will be visible to the member.
            </p>

            <div className="mb-6">
              <Label htmlFor="rejectReason" className="text-sm font-medium text-gray-700">
                Rejection Reason
              </Label>
              <textarea
                id="rejectReason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                rows={4}
                placeholder="Explain why this submission is being rejected..."
                required
              />
            </div>

            <div className="flex space-x-3 justify-end">
              <Button
                onClick={closeRejectModal}
                variant="outline"
                className="text-gray-600"
              >
                Cancel
              </Button>
              <Button
                onClick={handleReject}
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={!rejectReason.trim()}
              >
                Reject Submission
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
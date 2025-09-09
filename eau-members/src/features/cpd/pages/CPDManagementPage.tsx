import { useState, useEffect } from 'react'
import { Search, Filter, Edit, Trash2, Eye, CheckCircle, XCircle, Clock, Download, FileText, X } from 'lucide-react'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Label } from '../../../components/ui/Label'
import cpd, { type CPDActivity } from '../cpdService'
import { useAuthStore } from '../../../stores/authStore'
import { format } from 'date-fns'
import { showNotification } from '../../../lib/notifications'
import Swal from 'sweetalert2'

const { CPDService } = cpd

interface CPDActivityWithMember extends CPDActivity {
  members?: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
}

export function CPDManagementPage() {
  const [activities, setActivities] = useState<CPDActivityWithMember[]>([])
  const [filteredActivities, setFilteredActivities] = useState<CPDActivityWithMember[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedActivity, setSelectedActivity] = useState<CPDActivityWithMember | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState<Partial<CPDActivity>>({})
  const [showEvidenceModal, setShowEvidenceModal] = useState(false)
  const [selectedEvidence, setSelectedEvidence] = useState<{url: string | null, filename: string | null} | null>(null)
  const { user, getEffectiveRoles } = useAuthStore()

  useEffect(() => {
    loadAllActivities()
  }, [])

  useEffect(() => {
    filterActivities()
  }, [activities, searchTerm, statusFilter])

  const loadAllActivities = async () => {
    try {
      setLoading(true)
      const data = await CPDService.getAllActivities()
      setActivities(data as CPDActivityWithMember[])
    } catch (error) {
      console.error('Error loading activities:', error)
      showNotification('error', 'Failed to load CPD activities')
    } finally {
      setLoading(false)
    }
  }

  const filterActivities = () => {
    let filtered = [...activities]

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(a => a.status === statusFilter)
    }

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(a => 
        a.activity_title.toLowerCase().includes(search) ||
        a.members?.first_name?.toLowerCase().includes(search) ||
        a.members?.last_name?.toLowerCase().includes(search) ||
        a.members?.email?.toLowerCase().includes(search)
      )
    }

    setFilteredActivities(filtered)
  }

  const handleEdit = (activity: CPDActivityWithMember) => {
    setSelectedActivity(activity)
    setEditForm({
      activity_title: activity.activity_title,
      hours: activity.hours,
      minutes: activity.minutes,
      points: activity.points,
      status: activity.status
    })
    setShowEditModal(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedActivity) return

    try {
      await CPDService.updateActivity(selectedActivity.id, editForm)
      showNotification('success', 'CPD activity updated successfully')
      setShowEditModal(false)
      await loadAllActivities()
    } catch (error) {
      console.error('Error updating activity:', error)
      showNotification('error', 'Failed to update activity')
    }
  }

  const handleDelete = async (activity: CPDActivityWithMember) => {
    const result = await Swal.fire({
      title: 'Delete CPD Activity?',
      html: `
        <p>Are you sure you want to delete this activity?</p>
        <p class="mt-2"><strong>${activity.activity_title}</strong></p>
        <p class="text-sm text-gray-600">Member: ${activity.members?.first_name} ${activity.members?.last_name}</p>
        <p class="text-sm text-gray-600">Points: ${activity.points}</p>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel'
    })

    if (result.isConfirmed) {
      try {
        await CPDService.deleteActivity(activity.id)
        showNotification('success', 'CPD activity deleted successfully')
        await loadAllActivities()
      } catch (error) {
        console.error('Error deleting activity:', error)
        showNotification('error', 'Failed to delete activity')
      }
    }
  }

  const handleApprove = async (activityId: string) => {
    if (!user) return
    
    try {
      await CPDService.approveActivity(activityId, user.id)
      showNotification('success', 'CPD activity approved')
      await loadAllActivities()
    } catch (error) {
      console.error('Error approving activity:', error)
      showNotification('error', 'Failed to approve activity')
    }
  }

  const handleReject = async (activity: CPDActivityWithMember) => {
    const { value: reason } = await Swal.fire({
      title: 'Reject CPD Activity',
      input: 'textarea',
      inputLabel: 'Rejection reason',
      inputPlaceholder: 'Enter the reason for rejection...',
      inputAttributes: {
        'aria-label': 'Rejection reason'
      },
      showCancelButton: true,
      confirmButtonText: 'Reject',
      confirmButtonColor: '#dc2626',
      cancelButtonText: 'Cancel'
    })

    if (reason && user) {
      try {
        await CPDService.rejectActivity(activity.id, user.id, reason)
        showNotification('success', 'CPD activity rejected')
        await loadAllActivities()
      } catch (error) {
        console.error('Error rejecting activity:', error)
        showNotification('error', 'Failed to reject activity')
      }
    }
  }

  const handleViewEvidence = (activity: CPDActivityWithMember) => {
    if (activity.evidence_url || activity.evidence_filename) {
      setSelectedEvidence({
        url: activity.evidence_url,
        filename: activity.evidence_filename
      })
      setShowEvidenceModal(true)
    } else {
      showNotification('info', 'No evidence uploaded for this activity')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3" /> Approved
        </span>
      case 'rejected':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3 h-3" /> Rejected
        </span>
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="w-3 h-3" /> Pending
        </span>
    }
  }

  const exportToCSV = () => {
    const csvContent = [
      ['Member Name', 'Email', 'Activity', 'Date', 'Hours', 'Points', 'Status', 'Category'],
      ...filteredActivities.map(a => [
        `${a.members?.first_name || ''} ${a.members?.last_name || ''}`,
        a.members?.email || '',
        a.activity_title,
        format(new Date(a.date_completed), 'yyyy-MM-dd'),
        `${a.hours}h ${a.minutes}m`,
        a.points.toString(),
        a.status,
        a.category_name || ''
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `cpd-activities-${format(new Date(), 'yyyy-MM-dd')}.csv`
    link.click()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CPD Management</h1>
          <p className="text-gray-600 mt-1">Manage all CPD activities across the platform</p>
        </div>
        <Button onClick={exportToCSV} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-600">Total Activities</div>
          <div className="text-2xl font-bold">{activities.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Pending</div>
          <div className="text-2xl font-bold text-yellow-600">
            {activities.filter(a => a.status === 'pending').length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Approved</div>
          <div className="text-2xl font-bold text-green-600">
            {activities.filter(a => a.status === 'approved').length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Total Points</div>
          <div className="text-2xl font-bold text-blue-600">
            {activities.reduce((sum, a) => sum + (a.points || 0), 0)}
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by title, member name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Activities Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Activity
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Points
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredActivities.map((activity) => (
                <tr key={activity.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      {activity.members ? (
                        <>
                          <div className="text-sm font-medium text-gray-900">
                            {activity.members.first_name} {activity.members.last_name}
                          </div>
                          <div className="text-xs text-gray-500">{activity.members.email}</div>
                        </>
                      ) : (
                        <div className="text-sm text-gray-400 italic">
                          Member data not available
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{activity.activity_title}</div>
                      <div className="text-xs text-gray-500">{activity.category_name}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {format(new Date(activity.date_completed), 'dd/MM/yyyy')}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {activity.hours}h {activity.minutes}m
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-semibold text-blue-600">{activity.points}</span>
                  </td>
                  <td className="px-4 py-3">
                    {getStatusBadge(activity.status)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {/* View Evidence Button */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleViewEvidence(activity)}
                        className={activity.evidence_url ? "text-blue-600 hover:text-blue-700" : "text-gray-400"}
                        title={activity.evidence_url ? "View evidence" : "No evidence uploaded"}
                      >
                        <FileText className="w-4 h-4" />
                      </Button>
                      
                      {activity.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleApprove(activity.id)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleReject(activity)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(activity)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(activity)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredActivities.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No CPD activities found</p>
            </div>
          )}
        </div>
      </Card>

      {/* Edit Modal */}
      {showEditModal && selectedActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Edit CPD Activity</h3>
              
              <div className="space-y-4">
                <div>
                  <Label>Activity Title</Label>
                  <Input
                    value={editForm.activity_title || ''}
                    onChange={(e) => setEditForm({...editForm, activity_title: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Hours</Label>
                    <Input
                      type="number"
                      value={editForm.hours || 0}
                      onChange={(e) => setEditForm({...editForm, hours: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <Label>Minutes</Label>
                    <Input
                      type="number"
                      value={editForm.minutes || 0}
                      onChange={(e) => setEditForm({...editForm, minutes: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>

                <div>
                  <Label>Points</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={editForm.points || 0}
                    onChange={(e) => setEditForm({...editForm, points: parseFloat(e.target.value) || 0})}
                  />
                </div>

                <div>
                  <Label>Status</Label>
                  <select
                    value={editForm.status || 'pending'}
                    onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => setShowEditModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit}>
                  Save Changes
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Evidence Modal */}
      {showEvidenceModal && selectedEvidence && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Evidence Document</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowEvidenceModal(false)
                    setSelectedEvidence(null)
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="border rounded-lg p-4 bg-gray-50">
                {selectedEvidence.filename && (
                  <p className="text-sm text-gray-600 mb-4">
                    File: <span className="font-medium">{selectedEvidence.filename}</span>
                  </p>
                )}
                
                {selectedEvidence.url ? (
                  <div className="space-y-4">
                    {/* Check if it's a base64 image or PDF */}
                    {selectedEvidence.url.startsWith('data:image') ? (
                      <img
                        src={selectedEvidence.url}
                        alt="Evidence"
                        className="max-w-full h-auto rounded-lg"
                      />
                    ) : selectedEvidence.url.startsWith('data:application/pdf') ? (
                      <iframe
                        src={selectedEvidence.url}
                        className="w-full h-[600px] rounded-lg"
                        title="Evidence PDF"
                      />
                    ) : selectedEvidence.url.startsWith('http') ? (
                      <div>
                        <a
                          href={selectedEvidence.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          Open evidence in new tab
                        </a>
                        <iframe
                          src={selectedEvidence.url}
                          className="w-full h-[600px] rounded-lg mt-4"
                          title="Evidence Document"
                        />
                      </div>
                    ) : (
                      <div className="text-gray-600">
                        <p>Evidence format not supported for preview.</p>
                        {selectedEvidence.url.substring(0, 100)}...
                      </div>
                    )}
                    
                    {/* Download button for base64 data */}
                    {selectedEvidence.url.startsWith('data:') && (
                      <div className="mt-4">
                        <Button
                          onClick={() => {
                            const link = document.createElement('a')
                            link.href = selectedEvidence.url!
                            link.download = selectedEvidence.filename || 'evidence'
                            link.click()
                          }}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download Evidence
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500">No evidence file available</p>
                )}
              </div>

              <div className="flex justify-end mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEvidenceModal(false)
                    setSelectedEvidence(null)
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
      </div>
    </div>
  )
}
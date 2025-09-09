import { useState, useEffect } from 'react'
import { Plus, Calendar, Clock, Award, FileText, Search, Eye, Download } from 'lucide-react'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { AddCPDActivityModal } from '../components/AddCPDActivityModal'
import cpd, { type CPDActivity } from '../cpdService'

const { CPDService } = cpd
import { useAuthStore } from '../../../stores/authStore'
import { format } from 'date-fns'

export function CPDPage() {
  const [activities, setActivities] = useState<CPDActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'approved' | 'rejected'>('all')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [totalPoints, setTotalPoints] = useState(0)
  const [yearlyPoints, setYearlyPoints] = useState(0)
  const { user, getEffectiveUserId } = useAuthStore()
  const effectiveUserId = getEffectiveUserId()
  const yearlyGoal = 20 // Meta anual de 20 pontos

  useEffect(() => {
    if (effectiveUserId) {
      loadActivities()
      loadPoints()
    }
  }, [effectiveUserId, selectedYear])

  const loadActivities = async () => {
    if (!effectiveUserId) return
    
    try {
      setLoading(true)
      const data = await CPDService.getUserActivities(effectiveUserId)
      setActivities(data)
    } catch (error) {
      console.error('Error loading activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadPoints = async () => {
    if (!effectiveUserId) return
    
    try {
      const [total, yearly] = await Promise.all([
        CPDService.getTotalPoints(effectiveUserId),
        CPDService.getYearlyPoints(effectiveUserId, selectedYear)
      ])
      setTotalPoints(total)
      setYearlyPoints(yearly)
    } catch (error) {
      console.error('Error loading points:', error)
    }
  }

  const handleModalSuccess = () => {
    loadActivities()
    loadPoints()
  }

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.activity_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          activity.category_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          activity.provider?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterStatus === 'all' || activity.status === filterStatus
    
    const activityYear = new Date(activity.date_completed).getFullYear()
    const matchesYear = activityYear === selectedYear
    
    return matchesSearch && matchesFilter && matchesYear
  })

  const progressPercentage = Math.min((yearlyPoints / yearlyGoal) * 100, 100)
  const availableYears = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - i
  )

  const getStatusBadge = (status: string) => {
    const styles = {
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    }
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My CPD Activities</h1>
        <p className="text-gray-600">Track and manage your Continuing Professional Development</p>
      </div>

      {/* Annual Progress Bar */}
      <Card className="p-6 mb-8 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-gray-800">
              {selectedYear} Annual Progress
            </h3>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>{yearlyPoints.toFixed(1)} points earned</span>
            <span>Goal: {yearlyGoal} points</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
              style={{ width: `${progressPercentage}%` }}
            >
              {progressPercentage > 15 && (
                <span className="text-xs text-white font-semibold">
                  {progressPercentage.toFixed(0)}%
                </span>
              )}
            </div>
          </div>
          {yearlyPoints >= yearlyGoal && (
            <div className="mt-3 text-center">
              <span className="text-green-600 font-semibold flex items-center justify-center">
                <Award className="w-5 h-5 mr-2" />
                Congratulations! You've reached your annual CPD goal!
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Points</p>
              <p className="text-2xl font-bold text-blue-600">{totalPoints.toFixed(1)}</p>
            </div>
            <Award className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{selectedYear} Points</p>
              <p className="text-2xl font-bold text-green-600">{yearlyPoints.toFixed(1)}</p>
            </div>
            <Calendar className="w-8 h-8 text-green-500" />
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Activities</p>
              <p className="text-2xl font-bold text-purple-600">{activities.length}</p>
            </div>
            <FileText className="w-8 h-8 text-purple-500" />
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Goal Progress</p>
              <p className="text-2xl font-bold text-indigo-600">
                {progressPercentage.toFixed(0)}%
              </p>
            </div>
            <Award className="w-8 h-8 text-indigo-500" />
          </div>
        </Card>
      </div>

      {/* Actions and Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Button onClick={() => setIsModalOpen(true)} className="md:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Add New Activity
        </Button>
        
        <div className="flex-1 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Activities List */}
      <Card>
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading activities...</p>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || filterStatus !== 'all' ? 'No activities found' : 'No CPD activities yet'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Start tracking your professional development by adding your first activity'}
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Activity
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Activity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Points
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Evidence
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredActivities.map((activity) => (
                  <tr key={activity.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(activity.date_completed), 'dd MMM yyyy')}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {activity.activity_title}
                        </div>
                        {activity.provider && (
                          <div className="text-sm text-gray-500">{activity.provider}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {activity.category_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {activity.hours}h {activity.minutes}m
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-blue-600">
                        {activity.points.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(activity.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {activity.evidence_url ? (
                        <div className="flex items-center gap-2">
                          {/* View button */}
                          <button
                            onClick={() => {
                              if (activity.evidence_url.startsWith('data:')) {
                                // For base64 data, open in new tab
                                const newTab = window.open()
                                if (newTab) {
                                  // Check if it's an image or PDF
                                  if (activity.evidence_url.includes('image/') || 
                                      activity.evidence_url.includes('application/pdf')) {
                                    newTab.document.write(`
                                      <html>
                                        <head>
                                          <title>${activity.evidence_filename || 'Certificate'}</title>
                                          <style>
                                            body { 
                                              margin: 0; 
                                              display: flex; 
                                              justify-content: center; 
                                              align-items: center; 
                                              min-height: 100vh; 
                                              background: #f3f4f6; 
                                            }
                                            img { max-width: 90%; max-height: 90vh; }
                                            embed { width: 100vw; height: 100vh; }
                                          </style>
                                        </head>
                                        <body>
                                          ${activity.evidence_url.includes('application/pdf') 
                                            ? `<embed src="${activity.evidence_url}" type="application/pdf" />` 
                                            : `<img src="${activity.evidence_url}" alt="${activity.evidence_filename || 'Certificate'}" />`
                                          }
                                        </body>
                                      </html>
                                    `)
                                    newTab.document.close()
                                  } else {
                                    // For other file types, just open the data URL
                                    newTab.location.href = activity.evidence_url
                                  }
                                }
                              } else {
                                // For regular URLs, open in new tab
                                window.open(activity.evidence_url, '_blank')
                              }
                            }}
                            className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            title="View certificate"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                          
                          {/* Download button (only for base64 data) */}
                          {activity.evidence_url.startsWith('data:') && (
                            <a
                              href={activity.evidence_url}
                              download={activity.evidence_filename || 'certificate'}
                              className="text-green-600 hover:text-green-800 flex items-center gap-1"
                              title="Download certificate"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add Activity Modal */}
      <AddCPDActivityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
      />
    </div>
  )
}
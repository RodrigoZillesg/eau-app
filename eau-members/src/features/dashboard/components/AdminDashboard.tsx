import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { useAuthStore } from '../../../stores/authStore'
import { PermissionGuard } from '../../../components/shared/PermissionGuard'
import cpd, { type CPDActivity } from '../../cpd/cpdService'
import { MembersService } from '../../../lib/supabase/members'
import { EventService } from '../../../services/eventService'
import { OpenLearningAccessButton } from '../../../components/openlearning/OpenLearningAccessButton'
import { OpenLearningStatus } from '../../../components/OpenLearningStatus'
import { getUserInstitution } from '../../../services/institutionService'
import { supabase } from '../../../lib/supabase/client'
import { EventRegistrationService } from '../../../services/eventRegistrationService'
import { OpenLearningCourseCatalog } from '../../../components/OpenLearningCourseCatalog'
import { SystemStatusCard } from '../../../components/ui/SystemStatusCard'

const { CPDService } = cpd

interface CPDSettings {
  id: string
  auto_approval_enabled: boolean
  created_at: string
  updated_at: string
}

export const AdminDashboard: React.FC = () => {
  const { user, roles, getEffectiveRoles } = useAuthStore()
  const navigate = useNavigate()
  const [cpdStats, setCpdStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 })
  const [pendingActivities, setPendingActivities] = useState<CPDActivity[]>([])
  const [memberStats, setMemberStats] = useState({ total: 0, active: 0, newThisMonth: 0, inactive: 0 })
  const [eventStats, setEventStats] = useState({ active: 0, upcoming: 0, past: 0 })
  const [cpdSettings, setCpdSettings] = useState<CPDSettings | null>(null)
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0)
  const [pointsStats, setPointsStats] = useState({ totalPoints: 0, monthlyPoints: 0 })
  const [loading, setLoading] = useState(true)
  const [userInstitution, setUserInstitution] = useState<{ institutionId: string | null; institutionName: string }>({
    institutionId: null,
    institutionName: 'All Institutions'
  })
  const [userName, setUserName] = useState<string>('')

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // Get user's name from members table
      if (user?.id) {
        const { data: memberData } = await supabase
          .from('members')
          .select('first_name, last_name')
          .eq('user_id', user.id)
          .single()

        if (memberData) {
          setUserName(`${memberData.first_name} ${memberData.last_name}`)
        }
      }

      // Get user's institution context
      const institution = await getUserInstitution()
      setUserInstitution(institution)

      // For Institution Admin, get members of their institution first
      let institutionMemberIds: string[] = []
      if (!roles.includes('AdminSuper') && institution.institutionId) {
        const institutionMembers = await MembersService.searchMembers({
          institutionId: institution.institutionId
        } as any)
        institutionMemberIds = institutionMembers.map(m => m.id)
      }

      const [stats, pending, members, events, settings, points, pendingPayments] = await Promise.all([
        // For Institution Admin, filter CPD stats by their members
        roles.includes('AdminSuper')
          ? CPDService.getAllActivitiesStats()
          : CPDService.getAllActivitiesStats(institutionMemberIds),
        // Filter pending activities similarly
        roles.includes('AdminSuper')
          ? CPDService.getAllPendingActivities()
          : CPDService.getAllPendingActivities(institutionMemberIds),
        // Pass institution context for member stats
        MembersService.getMemberStats(institution.institutionId),
        // For events, we'll filter after fetching
        EventService.getEvents(),
        CPDService.getCPDSettings(),
        // Filter points by institution members
        roles.includes('AdminSuper')
          ? CPDService.getPointsStats()
          : CPDService.getPointsStats(institutionMemberIds),
        // Get pending payments count
        EventRegistrationService.getPendingPayments().catch(() => [])
      ])

      setCpdStats(stats)
      setPendingActivities(pending)
      setMemberStats(members)
      setCpdSettings(settings)
      setPointsStats(points)
      setPendingPaymentsCount(pendingPayments.length)

      // Filter events for Institution Admin
      let filteredEvents = events
      if (!roles.includes('AdminSuper') && institution.institutionId) {
        // For Institution Admin, show only events created by their institution
        // or events where their members are registered
        filteredEvents = events.filter(e =>
          e.institution_id === institution.institutionId ||
          (e.registrations && e.registrations.some((r: any) =>
            institutionMemberIds.includes(r.member_id)
          ))
        )
      }

      // Calculate event statistics
      const now = new Date()
      const activeEvents = filteredEvents.filter(e => e.status === 'published')
      const upcomingEvents = activeEvents.filter(e => new Date(e.start_date) > now)
      const pastEvents = activeEvents.filter(e => new Date(e.end_date) < now)

      setEventStats({
        active: activeEvents.length,
        upcoming: upcomingEvents.length,
        past: pastEvents.length
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
              <p className="text-gray-600">
                Welcome, {userName || user?.email} | Roles: {roles.join(', ')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Institution Context Indicator */}
      {!roles.includes('AdminSuper') && userInstitution.institutionId && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Institution View:</strong> Showing data for {userInstitution.institutionName} only
            </p>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          {/* Total Members */}
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate('/admin/members')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Members</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {loading ? '...' : memberStats.total}
                  </p>
                </div>
                <div className="text-3xl">👥</div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Active: {loading ? '...' : memberStats.active}
              </p>
            </CardContent>
          </Card>

          {/* Total CPD Activities */}
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate('/cpd/management')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">CPD Activities</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {loading ? '...' : cpdStats.total}
                  </p>
                </div>
                <div className="text-3xl">📚</div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Pending approval: {loading ? '...' : cpdStats.pending}
              </p>
            </CardContent>
          </Card>

          {/* Active Events */}
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate('/events')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Events</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {loading ? '...' : eventStats.active}
                  </p>
                </div>
                <div className="text-3xl">📅</div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Upcoming: {loading ? '...' : eventStats.upcoming}
              </p>
            </CardContent>
          </Card>

          {/* Total Points Awarded */}
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate('/cpd/management')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Points Awarded</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {loading ? '...' : pointsStats.totalPoints}
                  </p>
                </div>
                <div className="text-3xl">⭐</div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                This month: {loading ? '...' : pointsStats.monthlyPoints}
              </p>
            </CardContent>
          </Card>

          {/* Pending Payments */}
          <PermissionGuard permissions={['Admin', 'AdminSuper']}>
            <Card
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate('/admin/payments')}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Payments</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {loading ? '...' : pendingPaymentsCount}
                    </p>
                  </div>
                  <div className="text-3xl">💳</div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Click to manage payments
                </p>
              </CardContent>
            </Card>
          </PermissionGuard>
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* System Status - Super Admin Only */}
          <PermissionGuard roles={['AdminSuper']}>
            <SystemStatusCard />
          </PermissionGuard>

          {/* Admin Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                ⚡ Admin Actions
              </CardTitle>
              <CardDescription>
                Common administrative tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Review CPD: Show for SuperAdmin always, or for Admin only if auto-approval is disabled */}
                {(getEffectiveRoles().includes('AdminSuper') || (cpdSettings && !cpdSettings.auto_approval_enabled)) && (
                  <PermissionGuard permission="APPROVE_CPD">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => navigate('/cpd/review')}
                    >
                      ✅ Review CPD Submissions ({loading ? '...' : `${cpdStats.pending} pending`})
                    </Button>
                  </PermissionGuard>
                )}

                <PermissionGuard roles={['Admin', 'AdminSuper']}>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => navigate('/cpd/management')}
                  >
                    📚 Manage All CPD Activities
                  </Button>
                </PermissionGuard>

                <PermissionGuard roles={['AdminSuper']}>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => navigate('/cpd/settings')}
                  >
                    ⚙️ CPD Settings & Configuration
                  </Button>
                </PermissionGuard>
                
                <PermissionGuard permission="CREATE_EVENT">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => navigate('/events')}
                  >
                    📅 Create New Event
                  </Button>
                </PermissionGuard>

                <PermissionGuard roles={['Admin', 'AdminSuper']}>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => navigate('/admin/events')}
                  >
                    🎟️ Manage Events
                  </Button>
                </PermissionGuard>

                <PermissionGuard permission="MANAGE_USERS">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => navigate('/admin/members')}
                  >
                    👥 Manage Users
                  </Button>
                </PermissionGuard>
                
                <PermissionGuard permission="VIEW_USER_REPORTS">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => navigate('/admin')}
                  >
                    📊 Generate Reports
                  </Button>
                </PermissionGuard>
                
                <PermissionGuard permission="ASSIGN_ROLES">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => navigate('/admin/members')}
                  >
                    🔑 Assign User Roles
                  </Button>
                </PermissionGuard>
                
                {/* Technical Settings - SuperAdmin Only */}
                <PermissionGuard roles={['AdminSuper']}>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => navigate('/admin/smtp-settings')}
                  >
                    📧 SMTP Settings
                  </Button>
                </PermissionGuard>
                
                <PermissionGuard roles={['AdminSuper']}>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => navigate('/admin/email-templates')}
                  >
                    ✉️ Email Templates
                  </Button>
                </PermissionGuard>
                
                {/* Event Reminders - SuperAdmin Only */}
                <PermissionGuard roles={['AdminSuper']}>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => navigate('/admin/event-reminders')}
                  >
                    🔔 Event Reminders
                  </Button>
                </PermissionGuard>
                
                {/* Import System - SuperAdmin Only */}
                <PermissionGuard roles={['AdminSuper']}>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => navigate('/admin/import-system')}
                  >
                    📥 Import System (CSV)
                  </Button>
                </PermissionGuard>
                
                <PermissionGuard roles={['AdminSuper']}>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => navigate('/admin/duplicates')}
                  >
                    🔍 Review Member Duplicates
                  </Button>
                </PermissionGuard>

                <PermissionGuard roles={['AdminSuper']}>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                    onClick={() => navigate('/admin/bulk-management')}
                  >
                    🗑️ Bulk Member Management
                  </Button>
                </PermissionGuard>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🕒 Recent System Activity
              </CardTitle>
              <CardDescription>
                Latest platform activities and submissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📝</div>
                <p>No recent activity</p>
                <p className="text-sm">System activities will appear here</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Actions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              ⏳ Pending Actions ({loading ? '...' : pendingActivities.length})
            </CardTitle>
            <CardDescription>
              Items requiring your attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : pendingActivities.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-6xl mb-4">✅</div>
                <h3 className="text-lg font-medium mb-2">All caught up!</h3>
                <p className="text-sm">No pending actions require your attention.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingActivities.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-orange-100 rounded-full">
                        <span className="text-orange-600 font-medium text-sm">📚</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          CPD Submission: {activity.activity_title}
                        </h4>
                        <p className="text-xs text-gray-600">
                          From: {(activity as any).members?.first_name} {(activity as any).members?.last_name} • 
                          {activity.points} points • 
                          {new Date(activity.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => navigate('/cpd/review')}
                      className="text-xs"
                    >
                      Review
                    </Button>
                  </div>
                ))}
                {pendingActivities.length > 5 && (
                  <div className="text-center pt-4 border-t border-gray-200">
                    <Button
                      variant="outline"
                      onClick={() => navigate('/cpd/review')}
                      className="text-sm"
                    >
                      View All {pendingActivities.length} Pending Items
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* OpenLearning Course Catalog Section */}
        <div className="mt-8">
          <OpenLearningCourseCatalog />
        </div>
      </div>
    </div>
  )
}
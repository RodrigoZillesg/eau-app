import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { useAuthStore } from '../../../stores/authStore'
import { PermissionGuard } from '../../../components/shared/PermissionGuard'
import { supabase } from '../../../lib/supabase/client'
import { impersonationService } from '../../../services/impersonationService'

export const MemberDashboard: React.FC = () => {
  const { user, roles, getEffectiveRoles, getEffectiveUserId } = useAuthStore()
  const effectiveUserId = getEffectiveUserId()
  
  // Get display user and roles (considering impersonation)
  const isImpersonating = impersonationService.isImpersonating()
  const impersonationInfo = impersonationService.getDisplayInfo()
  
  const displayUser = isImpersonating 
    ? { 
        email: impersonationInfo.targetEmail,
        user_metadata: { full_name: null } // Impersonated user doesn't have full name metadata
      }
    : user
  const displayRoles = getEffectiveRoles()
  const navigate = useNavigate()
  
  // State for CPD statistics
  const [cpdStats, setCpdStats] = useState({
    totalPoints: 0,
    totalActivities: 0,
    thisYearPoints: 0,
    loading: true
  })
  
  // State for upcoming events
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([])
  const [eventsLoading, setEventsLoading] = useState(true)
  
  // State for recent activities
  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [activitiesLoading, setActivitiesLoading] = useState(true)
  
  // Fetch CPD statistics
  useEffect(() => {
    const fetchCPDStats = async () => {
      if (!effectiveUserId) return
      
      try {
        // Check if we're in impersonation mode
        const impersonationSession = localStorage.getItem('eau_impersonation_session')
        let query
        
        if (impersonationSession) {
          // In impersonation mode, effectiveUserId is actually the member.id
          const memberId = effectiveUserId
          console.log('Dashboard: Fetching CPD activities for impersonated member:', memberId)
          
          query = supabase
            .from('cpd_activities')
            .select('*')
            .eq('member_id', memberId)
            .eq('status', 'approved')
        } else {
          // Normal mode: first get member_id from user_id
          const { data: memberData, error: memberError } = await supabase
            .from('members')
            .select('id')
            .eq('user_id', effectiveUserId)
            .single()
          
          if (memberError || !memberData) {
            console.error('Error fetching member data:', memberError)
            setCpdStats(prev => ({ ...prev, loading: false }))
            setActivitiesLoading(false)
            return
          }
          
          query = supabase
            .from('cpd_activities')
            .select('*')
            .eq('member_id', memberData.id)
            .eq('status', 'approved')
        }
        
        // Get all CPD activities for the user
        const { data: activities, error } = await query
        
        if (error) throw error
        
        // Calculate statistics
        const currentYear = new Date().getFullYear()
        let totalPoints = 0
        let thisYearPoints = 0
        
        activities?.forEach((activity: any) => {
          const points = activity.points || 0
          totalPoints += points
          
          const activityYear = new Date(activity.date_completed).getFullYear()
          if (activityYear === currentYear) {
            thisYearPoints += points
          }
        })
        
        setCpdStats({
          totalPoints,
          totalActivities: activities?.length || 0,
          thisYearPoints,
          loading: false
        })
        
        // Set recent activities (last 5)
        const sortedActivities = activities?.sort((a: any, b: any) => 
          new Date(b.date_completed).getTime() - new Date(a.date_completed).getTime()
        ) || []
        setRecentActivities(sortedActivities.slice(0, 5))
        setActivitiesLoading(false)
      } catch (error) {
        console.error('Error fetching CPD stats:', error)
        setCpdStats(prev => ({ ...prev, loading: false }))
        setActivitiesLoading(false)
      }
    }
    
    fetchCPDStats()
  }, [effectiveUserId])
  
  // Fetch upcoming events
  useEffect(() => {
    const fetchUpcomingEvents = async () => {
      try {
        const today = new Date().toISOString()
        const { data: events, error } = await supabase
          .from('events')
          .select('*')
          .gte('start_date', today)
          .order('start_date', { ascending: true })
          .limit(3)
        
        if (error) throw error
        
        setUpcomingEvents(events || [])
      } catch (error) {
        console.error('Error fetching upcoming events:', error)
      } finally {
        setEventsLoading(false)
      }
    }
    
    fetchUpcomingEvents()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {displayUser?.user_metadata?.full_name || displayUser?.email}
              </h1>
              <p className="text-gray-600">
                Roles: {displayRoles.join(', ') || 'No roles assigned'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* CPD Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📚 CPD Summary
              </CardTitle>
              <CardDescription>
                Your Continuing Professional Development progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Points:</span>
                  <span className="text-2xl font-bold text-primary-600">
                    {cpdStats.loading ? '...' : cpdStats.totalPoints}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Activities:</span>
                  <span className="text-lg font-semibold">
                    {cpdStats.loading ? '...' : cpdStats.totalActivities}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">This Year:</span>
                  <span className="text-lg font-semibold">
                    {cpdStats.loading ? '...' : cpdStats.thisYearPoints}
                  </span>
                </div>
                <PermissionGuard permission="CREATE_CPD">
                  <Button 
                    className="w-full mt-4"
                    onClick={() => navigate('/cpd')}
                  >
                    Add New CPD Activity
                  </Button>
                </PermissionGuard>
              </div>
            </CardContent>
          </Card>

          {/* Events Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📅 Upcoming Events
              </CardTitle>
              <CardDescription>
                Professional development events and workshops
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {eventsLoading ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>Loading...</p>
                  </div>
                ) : upcomingEvents.length > 0 ? (
                  <div className="space-y-2">
                    {upcomingEvents.slice(0, 2).map((event: any) => (
                      <div key={event.id} className="border-l-4 border-primary-500 pl-3 py-1">
                        <p className="text-sm font-medium text-gray-900">{event.title}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(event.start_date).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No upcoming events</p>
                  </div>
                )}
                <PermissionGuard permission="REGISTER_EVENT">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate('/events')}
                  >
                    Browse Events
                  </Button>
                </PermissionGuard>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                ⚡ Quick Actions
              </CardTitle>
              <CardDescription>
                Common tasks and shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <PermissionGuard permission="CREATE_CPD">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => navigate('/cpd')}
                  >
                    📝 Log CPD Activity
                  </Button>
                </PermissionGuard>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/profile')}
                >
                  👤 My Profile
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/cpd')}
                >
                  📋 Export Certificate
                </Button>
                
                <PermissionGuard roles={['Admin', 'AdminSuper']}>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => navigate('/admin')}
                  >
                    ⚙️ Admin Panel
                  </Button>
                </PermissionGuard>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity Card */}
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🕒 Recent Activity
              </CardTitle>
              <CardDescription>
                Your latest CPD activities and events
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activitiesLoading ? (
                <div className="text-center py-12 text-gray-500">
                  <p>Loading activities...</p>
                </div>
              ) : recentActivities.length > 0 ? (
                <div className="space-y-4">
                  {recentActivities.map((activity: any) => (
                    <div key={activity.id} className="border-b pb-3 last:border-0">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{activity.activity_title}</h4>
                          <p className="text-sm text-gray-600">{activity.category_name}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(activity.date_completed).toLocaleDateString()} • {activity.points} points
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          activity.status === 'approved' ? 'bg-green-100 text-green-800' :
                          activity.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {activity.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  <PermissionGuard permission="CREATE_CPD">
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={() => navigate('/cpd')}
                    >
                      View All Activities
                    </Button>
                  </PermissionGuard>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-6xl mb-4">📝</div>
                  <h3 className="text-lg font-medium mb-2">No activities yet</h3>
                  <p className="text-sm mb-4">Start logging your professional development activities to see them here.</p>
                  <PermissionGuard permission="CREATE_CPD">
                    <Button onClick={() => navigate('/cpd')}>Add Your First Activity</Button>
                  </PermissionGuard>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
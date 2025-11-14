import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { supabase } from '../../../lib/supabase/client'

interface InstitutionCPDStats {
  totalMembers: number
  totalPoints: number
  totalActivities: number
  thisYearPoints: number
  averagePointsPerMember: number
  activeMembersThisYear: number
  loading: boolean
}

export const InstitutionCPDCard: React.FC = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState<InstitutionCPDStats>({
    totalMembers: 0,
    totalPoints: 0,
    totalActivities: 0,
    thisYearPoints: 0,
    averagePointsPerMember: 0,
    activeMembersThisYear: 0,
    loading: true
  })

  useEffect(() => {
    const fetchInstitutionCPDStats = async () => {
      try {
        // Get current user's member record to find institution_id
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: adminMember, error: adminError } = await supabase
          .from('members')
          .select('institution_id')
          .eq('user_id', user.id)
          .single()

        if (adminError || !adminMember?.institution_id) {
          console.error('Error fetching admin member data:', adminError)
          setStats(prev => ({ ...prev, loading: false }))
          return
        }

        const institutionId = adminMember.institution_id

        // Get all members from the same institution
        const { data: institutionMembers, error: membersError } = await supabase
          .from('members')
          .select('id, user_id, first_name, last_name')
          .eq('institution_id', institutionId)

        if (membersError) {
          console.error('Error fetching institution members:', membersError)
          setStats(prev => ({ ...prev, loading: false }))
          return
        }

        const totalMembers = institutionMembers?.length || 0
        const memberUserIds = institutionMembers?.map(m => m.user_id).filter(Boolean) || []

        if (memberUserIds.length === 0) {
          setStats({
            totalMembers,
            totalPoints: 0,
            totalActivities: 0,
            thisYearPoints: 0,
            averagePointsPerMember: 0,
            activeMembersThisYear: 0,
            loading: false
          })
          return
        }

        // Get all CPD activities for institution members
        const { data: activities, error: activitiesError } = await supabase
          .from('cpd_activities')
          .select('*')
          .in('user_id', memberUserIds)
          .eq('status', 'approved')

        if (activitiesError) {
          console.error('Error fetching CPD activities:', activitiesError)
          setStats(prev => ({ ...prev, loading: false }))
          return
        }

        // Calculate statistics
        const currentYear = new Date().getFullYear()
        let totalPoints = 0
        let thisYearPoints = 0
        const activeMembersSet = new Set<string>()

        activities?.forEach((activity: any) => {
          const points = activity.cpd_points || 0
          totalPoints += points

          const activityYear = new Date(activity.date_completed).getFullYear()
          if (activityYear === currentYear) {
            thisYearPoints += points
            activeMembersSet.add(activity.user_id)
          }
        })

        const averagePointsPerMember = totalMembers > 0
          ? Math.round(thisYearPoints / totalMembers)
          : 0

        setStats({
          totalMembers,
          totalPoints,
          totalActivities: activities?.length || 0,
          thisYearPoints,
          averagePointsPerMember,
          activeMembersThisYear: activeMembersSet.size,
          loading: false
        })
      } catch (error) {
        console.error('Error fetching institution CPD stats:', error)
        setStats(prev => ({ ...prev, loading: false }))
      }
    }

    fetchInstitutionCPDStats()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🏢 Institution CPD Overview
        </CardTitle>
        <CardDescription>
          CPD statistics for all members in your institution
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <span className="text-xs text-gray-600 block">Total Members</span>
              <span className="text-2xl font-bold text-blue-600">
                {stats.loading ? '...' : stats.totalMembers}
              </span>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <span className="text-xs text-gray-600 block">Active This Year</span>
              <span className="text-2xl font-bold text-green-600">
                {stats.loading ? '...' : stats.activeMembersThisYear}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 border-t">
            <span className="text-sm text-gray-600">Total Points (All Time):</span>
            <span className="text-xl font-bold text-primary-600">
              {stats.loading ? '...' : stats.totalPoints.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">This Year Points:</span>
            <span className="text-lg font-semibold">
              {stats.loading ? '...' : stats.thisYearPoints.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Average per Member:</span>
            <span className="text-lg font-semibold">
              {stats.loading ? '...' : stats.averagePointsPerMember}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total Activities:</span>
            <span className="text-lg font-semibold">
              {stats.loading ? '...' : stats.totalActivities}
            </span>
          </div>

          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => navigate('/admin/institution/cpd-report')}
          >
            View Detailed Report
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

import React, { useEffect, useState } from 'react'
import { ArrowUpDown, Download, Search, Users, Award, TrendingUp, Activity } from 'lucide-react'
import { supabase } from '../../../lib/supabase/client'
import { showNotification } from '../../../lib/notifications'
import { exportToCSV } from '../../../utils/csvExport'

interface MemberCPDData {
  memberId: string
  firstName: string
  lastName: string
  email: string
  totalPoints: number
  thisYearPoints: number
  totalActivities: number
  lastActivityDate: string | null
}

type SortField = 'name' | 'email' | 'totalPoints' | 'thisYearPoints' | 'totalActivities'
type SortDirection = 'asc' | 'desc'

export default function InstitutionCPDReportPage() {
  const [members, setMembers] = useState<MemberCPDData[]>([])
  const [filteredMembers, setFilteredMembers] = useState<MemberCPDData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [sortField, setSortField] = useState<SortField>('thisYearPoints')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  // Statistics
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembersThisYear: 0,
    totalPoints: 0,
    averagePoints: 0
  })

  useEffect(() => {
    fetchInstitutionCPDData()
  }, [])

  useEffect(() => {
    filterAndSortMembers()
  }, [members, searchTerm, activeFilter, sortField, sortDirection])

  const fetchInstitutionCPDData = async () => {
    try {
      setLoading(true)

      // Get current user's institution
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: adminMember, error: adminError } = await supabase
        .from('members')
        .select('institution_id')
        .eq('user_id', user.id)
        .single()

      if (adminError || !adminMember?.institution_id) {
        showNotification('error', 'Could not load institution data')
        setLoading(false)
        return
      }

      const institutionId = adminMember.institution_id

      // Get all members from institution
      const { data: institutionMembers, error: membersError } = await supabase
        .from('members')
        .select('id, user_id, first_name, last_name, email')
        .eq('institution_id', institutionId)

      if (membersError) {
        showNotification('error', 'Failed to load members')
        setLoading(false)
        return
      }

      // Get all CPD activities for these members
      const memberUserIds = institutionMembers?.map(m => m.user_id).filter(Boolean) || []

      let allActivities: any[] = []
      if (memberUserIds.length > 0) {
        const { data: activities } = await supabase
          .from('cpd_activities')
          .select('*')
          .in('user_id', memberUserIds)
          .eq('status', 'approved')

        allActivities = activities || []
      }

      // Calculate CPD data for each member
      const currentYear = new Date().getFullYear()
      const memberCPDData: MemberCPDData[] = institutionMembers?.map(member => {
        const memberActivities = allActivities.filter(a => a.user_id === member.user_id)

        let totalPoints = 0
        let thisYearPoints = 0
        let lastActivityDate: string | null = null

        memberActivities.forEach(activity => {
          const points = activity.cpd_points || 0
          totalPoints += points

          const activityYear = new Date(activity.date_completed).getFullYear()
          if (activityYear === currentYear) {
            thisYearPoints += points
          }

          if (!lastActivityDate || new Date(activity.date_completed) > new Date(lastActivityDate)) {
            lastActivityDate = activity.date_completed
          }
        })

        return {
          memberId: member.id,
          firstName: member.first_name || '',
          lastName: member.last_name || '',
          email: member.email || '',
          totalPoints,
          thisYearPoints,
          totalActivities: memberActivities.length,
          lastActivityDate
        }
      }) || []

      setMembers(memberCPDData)

      // Calculate statistics
      const activeMembersThisYear = memberCPDData.filter(m => m.thisYearPoints > 0).length
      const totalPoints = memberCPDData.reduce((sum, m) => sum + m.thisYearPoints, 0)
      const averagePoints = memberCPDData.length > 0
        ? Math.round(totalPoints / memberCPDData.length)
        : 0

      setStats({
        totalMembers: memberCPDData.length,
        activeMembersThisYear,
        totalPoints,
        averagePoints
      })

      setLoading(false)
    } catch (error: any) {
      console.error('Error fetching institution CPD data:', error)
      showNotification('error', 'Failed to load CPD report', error.message)
      setLoading(false)
    }
  }

  const filterAndSortMembers = () => {
    let filtered = [...members]

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(m =>
        m.firstName.toLowerCase().includes(term) ||
        m.lastName.toLowerCase().includes(term) ||
        m.email.toLowerCase().includes(term)
      )
    }

    // Apply active/inactive filter
    if (activeFilter === 'active') {
      filtered = filtered.filter(m => m.thisYearPoints > 0)
    } else if (activeFilter === 'inactive') {
      filtered = filtered.filter(m => m.thisYearPoints === 0)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortField) {
        case 'name':
          aValue = `${a.firstName} ${a.lastName}`.toLowerCase()
          bValue = `${b.firstName} ${b.lastName}`.toLowerCase()
          break
        case 'email':
          aValue = a.email.toLowerCase()
          bValue = b.email.toLowerCase()
          break
        case 'totalPoints':
          aValue = a.totalPoints
          bValue = b.totalPoints
          break
        case 'thisYearPoints':
          aValue = a.thisYearPoints
          bValue = b.thisYearPoints
          break
        case 'totalActivities':
          aValue = a.totalActivities
          bValue = b.totalActivities
          break
        default:
          aValue = 0
          bValue = 0
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    setFilteredMembers(filtered)
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const handleExportCSV = () => {
    const csvData = filteredMembers.map(m => ({
      'First Name': m.firstName,
      'Last Name': m.lastName,
      'Email': m.email,
      'Total Points (All Time)': m.totalPoints,
      'This Year Points': m.thisYearPoints,
      'Total Activities': m.totalActivities,
      'Last Activity': m.lastActivityDate ? new Date(m.lastActivityDate).toLocaleDateString() : 'Never'
    }))

    const filename = `institution-cpd-report-${new Date().toISOString().split('T')[0]}.csv`
    exportToCSV(csvData, filename)
    showNotification('success', 'Report exported successfully')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading CPD report...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Institution CPD Report
          </h1>
          <p className="text-gray-600">
            Detailed CPD statistics for all members in your institution
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Members</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalMembers}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active This Year</p>
                <p className="text-3xl font-bold text-green-600">{stats.activeMembersThisYear}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Points</p>
                <p className="text-3xl font-bold text-primary-600">{stats.totalPoints.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Points</p>
                <p className="text-3xl font-bold text-purple-600">{stats.averagePoints}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Activity Filter */}
            <div>
              <select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Members ({members.length})</option>
                <option value="active">Active This Year ({stats.activeMembersThisYear})</option>
                <option value="inactive">Inactive This Year ({stats.totalMembers - stats.activeMembersThisYear})</option>
              </select>
            </div>

            {/* Export Button */}
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Members Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    onClick={() => handleSort('name')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-2">
                      Name
                      <ArrowUpDown className="w-4 h-4" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('email')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-2">
                      Email
                      <ArrowUpDown className="w-4 h-4" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('thisYearPoints')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-2">
                      This Year
                      <ArrowUpDown className="w-4 h-4" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('totalPoints')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-2">
                      Total Points
                      <ArrowUpDown className="w-4 h-4" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('totalActivities')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-2">
                      Activities
                      <ArrowUpDown className="w-4 h-4" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Activity
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No members found matching your filters
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((member) => (
                    <tr key={member.memberId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {member.firstName} {member.lastName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {member.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          member.thisYearPoints > 0
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {member.thisYearPoints} pts
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {member.totalPoints} pts
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {member.totalActivities}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {member.lastActivityDate
                          ? new Date(member.lastActivityDate).toLocaleDateString()
                          : 'Never'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mt-4 text-sm text-gray-600 text-center">
          Showing {filteredMembers.length} of {members.length} members
        </div>
      </div>
    </div>
  )
}

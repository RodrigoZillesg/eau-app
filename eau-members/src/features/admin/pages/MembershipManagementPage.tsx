import React, { useState, useEffect } from 'react'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Label } from '../../../components/ui/Label'
import { supabase } from '../../../lib/supabase/client'
import { showNotification } from '../../../lib/notifications'
import { 
  Users, TrendingUp, UserCheck, UserX, 
  Calendar, Award, Building, GraduationCap,
  RefreshCw, Download
} from 'lucide-react'
import { exportMembersToCSV } from '../../../utils/csvExport'
import type { MembershipStatus, MembershipType, InterestGroup } from '../../../types/supabase'

interface MembershipStats {
  total: number
  byStatus: Record<MembershipStatus, number>
  byType: Record<MembershipType, number>
  byGroup: Record<string, number>
}

interface MembershipUpdate {
  memberId: string
  memberName: string
  currentType: MembershipType
  currentStatus: MembershipStatus
  currentGroup?: string
  newType?: MembershipType
  newStatus?: MembershipStatus
  newGroup?: InterestGroup
}

export function MembershipManagementPage() {
  const [stats, setStats] = useState<MembershipStats>({
    total: 0,
    byStatus: { active: 0, inactive: 0, suspended: 0, expired: 0 },
    byType: { standard: 0, premium: 0, student: 0, corporate: 0 },
    byGroup: {}
  })
  const [selectedMembers, setSelectedMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [bulkUpdate, setBulkUpdate] = useState({
    status: '',
    type: '',
    group: ''
  })

  useEffect(() => {
    loadMembershipStats()
    loadMembers()
  }, [])

  const loadMembershipStats = async () => {
    try {
      // Get total count
      const { count: total } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })

      // Get counts by status
      const statuses: MembershipStatus[] = ['active', 'inactive', 'suspended', 'expired']
      const statusCounts: Record<MembershipStatus, number> = { 
        active: 0, inactive: 0, suspended: 0, expired: 0 
      }
      
      for (const status of statuses) {
        const { count } = await supabase
          .from('members')
          .select('*', { count: 'exact', head: true })
          .eq('membership_status', status)
        statusCounts[status] = count || 0
      }

      // Get counts by type
      const types: MembershipType[] = ['standard', 'premium', 'student', 'corporate']
      const typeCounts: Record<MembershipType, number> = {
        standard: 0, premium: 0, student: 0, corporate: 0
      }
      
      for (const type of types) {
        const { count } = await supabase
          .from('members')
          .select('*', { count: 'exact', head: true })
          .eq('membership_type', type)
        typeCounts[type] = count || 0
      }

      // Get counts by interest group
      const { data: groups } = await supabase
        .from('members')
        .select('interest_group')
        .not('interest_group', 'is', null)

      const groupCounts: Record<string, number> = {}
      groups?.forEach(g => {
        const group = g.interest_group || 'Unknown'
        groupCounts[group] = (groupCounts[group] || 0) + 1
      })

      setStats({
        total: total || 0,
        byStatus: statusCounts,
        byType: typeCounts,
        byGroup: groupCounts
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const loadMembers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setSelectedMembers(data || [])
    } catch (error) {
      console.error('Error loading members:', error)
      showNotification('error', 'Failed to load members')
    } finally {
      setLoading(false)
    }
  }

  const handleBulkUpdate = async () => {
    if (selectedMembers.length === 0) {
      showNotification('warning', 'No members selected')
      return
    }

    try {
      const updates: any = {}
      if (bulkUpdate.status) updates.membership_status = bulkUpdate.status
      if (bulkUpdate.type) updates.membership_type = bulkUpdate.type
      if (bulkUpdate.group) updates.interest_group = bulkUpdate.group

      if (Object.keys(updates).length === 0) {
        showNotification('warning', 'No changes selected')
        return
      }

      for (const member of selectedMembers) {
        await supabase
          .from('members')
          .update(updates)
          .eq('id', member.id)
      }

      showNotification('success', `Updated ${selectedMembers.length} members`)
      loadMembers()
      loadMembershipStats()
      setBulkUpdate({ status: '', type: '', group: '' })
    } catch (error) {
      console.error('Error updating members:', error)
      showNotification('error', 'Failed to update members')
    }
  }

  const handleExportAll = async () => {
    try {
      const { data } = await supabase
        .from('members')
        .select('*')
      
      if (data && data.length > 0) {
        exportMembersToCSV(data, 'all-members-export.csv')
        showNotification('success', `Exported ${data.length} members`)
      }
    } catch (error) {
      console.error('Error exporting:', error)
      showNotification('error', 'Failed to export members')
    }
  }

  const getStatusColor = (status: MembershipStatus) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-red-100 text-red-800',
      expired: 'bg-yellow-100 text-yellow-800'
    }
    return colors[status]
  }

  const getTypeIcon = (type: MembershipType) => {
    switch (type) {
      case 'premium': return <Award className="w-4 h-4" />
      case 'corporate': return <Building className="w-4 h-4" />
      case 'student': return <GraduationCap className="w-4 h-4" />
      default: return <Users className="w-4 h-4" />
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Membership Management</h1>
        <p className="text-gray-600">
          Manage membership types, statuses, and interest groups
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Members</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Members</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.byStatus.active}
              </p>
            </div>
            <UserCheck className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Premium Members</p>
              <p className="text-2xl font-bold text-purple-600">
                {stats.byType.premium}
              </p>
            </div>
            <Award className="w-8 h-8 text-purple-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Interest Groups</p>
              <p className="text-2xl font-bold text-indigo-600">
                {Object.keys(stats.byGroup).length}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-indigo-500" />
          </div>
        </Card>
      </div>

      {/* Membership Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* By Status */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Membership Status Distribution</h3>
          <div className="space-y-3">
            {Object.entries(stats.byStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status as MembershipStatus)}`}>
                    {status}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{count}</span>
                  <span className="text-sm text-gray-500">
                    ({stats.total > 0 ? ((count / stats.total) * 100).toFixed(1) : 0}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* By Type */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Membership Type Distribution</h3>
          <div className="space-y-3">
            {Object.entries(stats.byType).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getTypeIcon(type as MembershipType)}
                  <span className="capitalize">{type}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{count}</span>
                  <span className="text-sm text-gray-500">
                    ({stats.total > 0 ? ((count / stats.total) * 100).toFixed(1) : 0}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Interest Groups */}
      <Card className="p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4">Interest Groups Distribution</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(stats.byGroup).map(([group, count]) => (
            <div key={group} className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900">{group}</h4>
              <p className="text-2xl font-bold text-blue-600 mt-1">{count}</p>
              <p className="text-sm text-gray-500">members</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Bulk Update Section */}
      <Card className="p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4">Bulk Membership Update</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <Label htmlFor="bulk-status">Update Status</Label>
            <select
              id="bulk-status"
              value={bulkUpdate.status}
              onChange={(e) => setBulkUpdate({ ...bulkUpdate, status: e.target.value })}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">No change</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          <div>
            <Label htmlFor="bulk-type">Update Type</Label>
            <select
              id="bulk-type"
              value={bulkUpdate.type}
              onChange={(e) => setBulkUpdate({ ...bulkUpdate, type: e.target.value })}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">No change</option>
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
              <option value="student">Student</option>
              <option value="corporate">Corporate</option>
            </select>
          </div>

          <div>
            <Label htmlFor="bulk-group">Update Interest Group</Label>
            <select
              id="bulk-group"
              value={bulkUpdate.group}
              onChange={(e) => setBulkUpdate({ ...bulkUpdate, group: e.target.value })}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">No change</option>
              <option value="Full Provider">Full Provider</option>
              <option value="Associate Provider">Associate Provider</option>
              <option value="Corporate Affiliate">Corporate Affiliate</option>
              <option value="Professional Affiliate">Professional Affiliate</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <Button 
              onClick={handleBulkUpdate}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Update Selected
            </Button>
            <Button 
              onClick={handleExportAll}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export All
            </Button>
          </div>
        </div>

        {/* Sample Members List */}
        <div className="mt-6">
          <h4 className="font-medium text-gray-700 mb-3">Recent Members (Select for bulk update)</h4>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    <input 
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedMembers(selectedMembers)
                        } else {
                          setSelectedMembers([])
                        }
                      }}
                    />
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Member
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Interest Group
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Member Since
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {selectedMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <input 
                        type="checkbox"
                        checked={true}
                        onChange={() => {}}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <div>
                        <div className="font-medium text-gray-900">
                          {member.first_name} {member.last_name}
                        </div>
                        <div className="text-sm text-gray-500">{member.email}</div>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(member.membership_status)}`}>
                        {member.membership_status}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1">
                        {getTypeIcon(member.membership_type)}
                        <span className="text-sm capitalize">{member.membership_type}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {member.interest_group || '-'}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-500">
                      {member.membership_start_date 
                        ? new Date(member.membership_start_date).toLocaleDateString()
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button 
            onClick={() => window.location.href = '/admin/members'}
            variant="outline"
          >
            View All Members
          </Button>
          <Button 
            onClick={() => window.location.href = '/admin/user-import'}
            variant="outline"
          >
            Import Members
          </Button>
          <Button 
            onClick={loadMembershipStats}
            variant="outline"
            className="flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Stats
          </Button>
        </div>
      </Card>
    </div>
  )
}
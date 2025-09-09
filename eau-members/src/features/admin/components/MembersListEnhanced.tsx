import React, { useState, useEffect } from 'react'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Card } from '../../../components/ui/Card'
import { Label } from '../../../components/ui/Label'
import { MembersService, type MemberWithRoles } from '../../../lib/supabase/members'
import { 
  Search, Plus, Download, Filter, X, Users, 
  ChevronLeft, ChevronRight, Edit, Eye, UserCheck
} from 'lucide-react'
import type { MembershipStatus, MembershipType, InterestGroup } from '../../../types/supabase'
import { exportMembersToCSV } from '../../../utils/csvExport'
import { showNotification } from '../../../lib/notifications'
import { impersonationService } from '../../../services/impersonationService'
import { useAuthStore } from '../../../stores/authStore'
import { useNavigate } from 'react-router-dom'

interface MembersListEnhancedProps {
  onMemberSelect?: (member: MemberWithRoles) => void
  onAddMember?: () => void
  onEditMember?: (member: MemberWithRoles) => void
}

interface FilterState {
  search: string
  status: MembershipStatus | ''
  type: MembershipType | ''
  interestGroup: InterestGroup | ''
  city: string
  state: string
  hasRoles: boolean
}

const INTEREST_GROUPS: InterestGroup[] = [
  'Full Provider',
  'Associate Provider', 
  'Corporate Affiliate',
  'Professional Affiliate'
]

export const MembersListEnhanced: React.FC<MembersListEnhancedProps> = ({
  onMemberSelect,
  onAddMember,
  onEditMember
}) => {
  const [members, setMembers] = useState<MemberWithRoles[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: '',
    type: '',
    interestGroup: '',
    city: '',
    state: '',
    hasRoles: false
  })
  
  // Navigation and auth
  const navigate = useNavigate()
  const { roles } = useAuthStore()
  const canImpersonate = roles.includes('AdminSuper')
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [pageSize] = useState(20)
  
  const loadMembers = async () => {
    try {
      setLoading(true)
      
      // Build filter object for API
      const apiFilters = {
        search: filters.search || undefined,
        status: filters.status || undefined,
        type: filters.type || undefined,
        page: currentPage,
        pageSize
      }
      
      const { data, count } = await MembersService.searchMembersPaginated(apiFilters)
      
      // Apply additional client-side filters
      let filteredData = data
      
      if (filters.interestGroup) {
        filteredData = filteredData.filter(m => m.interest_group === filters.interestGroup)
      }
      
      if (filters.city) {
        filteredData = filteredData.filter(m => 
          m.city?.toLowerCase().includes(filters.city.toLowerCase())
        )
      }
      
      if (filters.state) {
        filteredData = filteredData.filter(m => 
          m.state?.toLowerCase().includes(filters.state.toLowerCase())
        )
      }
      
      if (filters.hasRoles) {
        filteredData = filteredData.filter(m => m.member_roles && m.member_roles.length > 0)
      }
      
      setMembers(filteredData)
      setTotalCount(count)
    } catch (err) {
      console.error('Error loading members:', err)
      showNotification('error', 'Failed to load members')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMembers()
  }, [currentPage, filters])

  const handleExportCSV = async () => {
    try {
      // Load all members for export (without pagination)
      const { data } = await MembersService.searchMembersPaginated({
        search: filters.search || undefined,
        status: filters.status || undefined,
        type: filters.type || undefined,
        pageSize: 10000 // Get all records
      })
      
      if (data.length === 0) {
        showNotification('warning', 'No members to export')
        return
      }
      
      exportMembersToCSV(data)
      showNotification('success', `Exported ${data.length} members to CSV`)
    } catch (err) {
      console.error('Error exporting members:', err)
      showNotification('error', 'Failed to export members')
    }
  }

  const handleImpersonate = async (member: MemberWithRoles) => {
    if (!canImpersonate) {
      showNotification('error', 'Only SuperAdmin can impersonate users')
      return
    }

    const result = await impersonationService.startImpersonation(member.id)
    if (result.success) {
      showNotification('success', `Now viewing as ${member.first_name} ${member.last_name}`)
      navigate('/dashboard')
      window.location.reload() // Force reload to update all components
    } else {
      showNotification('error', result.error || 'Failed to start impersonation')
    }
  }

  const resetFilters = () => {
    setFilters({
      search: '',
      status: '',
      type: '',
      interestGroup: '',
      city: '',
      state: '',
      hasRoles: false
    })
    setCurrentPage(1)
  }

  const activeFiltersCount = Object.values(filters).filter(v => v && v !== '').length

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Members Management</h2>
          <p className="text-gray-600 mt-1">
            Manage member accounts, roles, and groups
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleExportCSV}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
          {onAddMember && (
            <Button onClick={onAddMember}>
              <Plus className="w-4 h-4 mr-2" />
              Add Member
            </Button>
          )}
        </div>
      </div>

      {/* Search and Filter Bar */}
      <Card className="p-4">
        <div className="flex gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={filters.search}
              onChange={(e) => {
                setFilters(prev => ({ ...prev, search: e.target.value }))
                setCurrentPage(1)
              }}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 ${activeFiltersCount > 0 ? 'border-blue-500' : ''}`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {activeFiltersCount > 0 && (
              <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">
                {activeFiltersCount}
              </span>
            )}
          </Button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="status-filter">Membership Status</Label>
              <select
                id="status-filter"
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  status: e.target.value as MembershipStatus | '' 
                }))}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            <div>
              <Label htmlFor="type-filter">Membership Type</Label>
              <select
                id="type-filter"
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  type: e.target.value as MembershipType | '' 
                }))}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="standard">Standard</option>
                <option value="premium">Premium</option>
                <option value="student">Student</option>
                <option value="corporate">Corporate</option>
              </select>
            </div>

            <div>
              <Label htmlFor="group-filter">Interest Group</Label>
              <select
                id="group-filter"
                value={filters.interestGroup}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  interestGroup: e.target.value as InterestGroup | '' 
                }))}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Groups</option>
                {INTEREST_GROUPS.map(group => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="city-filter">City</Label>
              <Input
                id="city-filter"
                type="text"
                placeholder="Filter by city..."
                value={filters.city}
                onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="state-filter">State</Label>
              <Input
                id="state-filter"
                type="text"
                placeholder="Filter by state..."
                value={filters.state}
                onChange={(e) => setFilters(prev => ({ ...prev, state: e.target.value }))}
              />
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.hasRoles}
                  onChange={(e) => setFilters(prev => ({ ...prev, hasRoles: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm">Has special roles</span>
              </label>
            </div>

            <div className="md:col-span-3 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="flex items-center gap-2"
              >
                <X className="w-3 h-3" />
                Clear Filters
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Members Table */}
      <Card>
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading members...</p>
          </div>
        ) : members.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No members found</h3>
            <p className="text-gray-600">
              {activeFiltersCount > 0 
                ? 'Try adjusting your filters'
                : 'Start by adding your first member'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Membership
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Interest Group
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Roles
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {members.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {member.first_name} {member.last_name}
                          </div>
                          {member.profession && (
                            <div className="text-sm text-gray-500">{member.profession}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="text-gray-900">{member.email}</div>
                          {member.phone && (
                            <div className="text-gray-500">{member.phone}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex text-xs font-medium px-2 py-1 rounded-full ${
                            member.membership_status === 'active' 
                              ? 'bg-green-100 text-green-800'
                              : member.membership_status === 'inactive'
                              ? 'bg-gray-100 text-gray-800'
                              : member.membership_status === 'suspended'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {member.membership_status}
                          </span>
                          <span className="text-xs text-gray-500 capitalize">
                            {member.membership_type}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">
                          {member.interest_group || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {[member.city, member.state].filter(Boolean).join(', ') || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {member.member_roles?.map((role) => (
                            <span
                              key={role.id}
                              className="px-2 py-1 text-xs font-medium rounded bg-purple-100 text-purple-800"
                            >
                              {role.role}
                            </span>
                          )) || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          {onMemberSelect && (
                            <button
                              onClick={() => onMemberSelect(member)}
                              className="text-gray-400 hover:text-gray-600"
                              title="View details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                          {onEditMember && (
                            <button
                              onClick={() => onEditMember(member)}
                              className="text-blue-400 hover:text-blue-600"
                              title="Edit member"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          {canImpersonate && (
                            <button
                              onClick={() => handleImpersonate(member)}
                              className="text-purple-400 hover:text-purple-600"
                              title="View as this user"
                            >
                              <UserCheck className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {((currentPage - 1) * pageSize) + 1} to{' '}
                  {Math.min(currentPage * pageSize, totalCount)} of {totalCount} members
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (currentPage <= 3) {
                        pageNum = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = currentPage - 2 + i
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? 'primary' : 'outline'}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  )
}
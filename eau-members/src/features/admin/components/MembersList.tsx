import React, { useState, useEffect, useRef } from 'react'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Card } from '../../../components/ui/Card'
import { MembersService, type MemberWithRoles } from '../../../lib/supabase/members'
import { Search, Plus, Mail, Phone, Edit, Trash2, UserPlus, ChevronLeft, ChevronRight, Trash, CheckSquare } from 'lucide-react'
import type { MembershipStatus, MembershipType } from '../../../types/supabase'
import { InviteUserModal } from './InviteUserModal'
import { notifications } from '../../../lib/notifications'

interface MembersListProps {
  onMemberSelect?: (member: MemberWithRoles) => void
  onAddMember?: () => void
  onEditMember?: (member: MemberWithRoles) => void
}

export const MembersList: React.FC<MembersListProps> = ({
  onMemberSelect,
  onAddMember,
  onEditMember
}) => {
  const [members, setMembers] = useState<MemberWithRoles[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('') // Separate state for input field
  const [statusFilter, setStatusFilter] = useState<MembershipStatus | ''>('')
  const [typeFilter, setTypeFilter] = useState<MembershipType | ''>('')
  const [error, setError] = useState<string | null>(null)
  const [inviteModal, setInviteModal] = useState<{ show: boolean; memberEmail: string }>({
    show: false,
    memberEmail: ''
  })
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [pageSize] = useState(20) // 20 items per page
  
  // Debounce timer ref
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null)
  
  // Selection state
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set())
  const [isSelectionMode, setIsSelectionMode] = useState(false)

  const loadMembers = async (page: number = 1) => {
    try {
      setLoading(true)
      const filters = {
        search: search || undefined,
        status: statusFilter || undefined,
        type: typeFilter || undefined,
        page,
        pageSize
      }
      const { data, count } = await MembersService.searchMembersPaginated(filters)
      setMembers(data)
      setTotalCount(count)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading members')
      console.error('Erro ao carregar membros:', err)
    } finally {
      setLoading(false)
    }
  }

  // Handle search input with debounce
  const handleSearchChange = (value: string) => {
    setSearchInput(value)
    
    // Clear existing timer
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current)
    }
    
    // Set new timer for 500ms delay
    searchTimerRef.current = setTimeout(() => {
      setSearch(value)
      setCurrentPage(1) // Reset to first page when search changes
    }, 500)
  }
  
  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current)
      }
    }
  }, [])
  
  useEffect(() => {
    setCurrentPage(1) // Reset to first page when filters change
    loadMembers(1)
  }, [search, statusFilter, typeFilter])
  
  useEffect(() => {
    loadMembers(currentPage)
    // Clear selection when changing pages
    setSelectedMembers(new Set())
  }, [currentPage])

  const handleDeleteMember = async (member: MemberWithRoles) => {
    const result = await notifications.confirmDelete(`${member.first_name} ${member.last_name}`)
    if (!result.isConfirmed) {
      return
    }

    try {
      await MembersService.deleteMember(member.id)
      await loadMembers(currentPage) // Reload current page
      notifications.toast.success('Member deleted successfully')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting member')
      notifications.toast.error('Failed to delete member')
    }
  }
  
  const handleDeleteSelected = async () => {
    if (selectedMembers.size === 0) return
    
    const result = await notifications.confirmDelete(
      `${selectedMembers.size} selected member${selectedMembers.size > 1 ? 's' : ''}`
    )
    if (!result.isConfirmed) return
    
    try {
      setLoading(true)
      
      // Use bulk delete for better performance
      const memberIds = Array.from(selectedMembers)
      const { success: successCount, failed: failCount } = await MembersService.deleteMultipleMembers(memberIds)
      
      // Clear selection
      setSelectedMembers(new Set())
      setIsSelectionMode(false)
      
      // Reload members
      await loadMembers(currentPage)
      
      // Show results
      if (successCount > 0) {
        notifications.toast.success(`Successfully deleted ${successCount} member${successCount > 1 ? 's' : ''}`)
      }
      if (failCount > 0) {
        notifications.toast.error(`Failed to delete ${failCount} member${failCount > 1 ? 's' : ''}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting members')
      notifications.toast.error('Failed to delete members')
    } finally {
      setLoading(false)
    }
  }
  
  const toggleMemberSelection = (memberId: string) => {
    const newSelection = new Set(selectedMembers)
    if (newSelection.has(memberId)) {
      newSelection.delete(memberId)
    } else {
      newSelection.add(memberId)
    }
    setSelectedMembers(newSelection)
  }
  
  const toggleSelectAll = () => {
    if (selectedMembers.size === members.length) {
      setSelectedMembers(new Set())
    } else {
      setSelectedMembers(new Set(members.map(m => m.id)))
    }
  }

  const handleInviteMember = (member: MemberWithRoles) => {
    setInviteModal({
      show: true,
      memberEmail: member.email
    })
  }

  const closeInviteModal = () => {
    setInviteModal({ show: false, memberEmail: '' })
  }

  const getStatusBadge = (status: MembershipStatus) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-red-100 text-red-800',
      expired: 'bg-yellow-100 text-yellow-800'
    }
    
    const labels = {
      active: 'Active',
      inactive: 'Inactive',
      suspended: 'Suspended',
      expired: 'Expired'
    }

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status]}`}>
        {labels[status]}
      </span>
    )
  }

  const getTypeBadge = (type: MembershipType) => {
    const labels = {
      standard: 'Standard',
      premium: 'Premium',
      student: 'Student',
      corporate: 'Corporate'
    }

    return (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
        {labels[type]}
      </span>
    )
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-32">
          <div className="text-gray-500">Loading members...</div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header e Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Members</h2>
        
        <div className="flex items-center gap-2">
          {isSelectionMode ? (
            <>
              <span className="text-sm text-gray-600">
                {selectedMembers.size} selected
              </span>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsSelectionMode(false)
                  setSelectedMembers(new Set())
                }}
                className="flex items-center gap-2"
              >
                Cancel
              </Button>
              <Button 
                variant="outline" 
                onClick={handleDeleteSelected}
                disabled={selectedMembers.size === 0}
                className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:border-red-300"
              >
                <Trash size={16} />
                Delete Selected
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="outline" 
                onClick={() => setIsSelectionMode(true)}
                className="flex items-center gap-2"
              >
                <CheckSquare size={16} />
                Select
              </Button>
              <Button onClick={onAddMember} className="flex items-center gap-2">
                <Plus size={16} />
                Add Member
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              placeholder="Search by name or email..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchInput !== search && (
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                Typing...
              </span>
            )}
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as MembershipStatus | '')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
            <option value="expired">Expired</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as MembershipType | '')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All types</option>
            <option value="standard">Standard</option>
            <option value="premium">Premium</option>
            <option value="student">Student</option>
            <option value="corporate">Corporate</option>
          </select>
        </div>
      </Card>

      {/* Lista de Membros */}
      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-red-800">{error}</p>
        </Card>
      )}

      <Card>
        {members.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No members found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {isSelectionMode && (
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedMembers.size === members.length && members.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Roles
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registration Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {members.map((member) => (
                  <tr
                    key={member.id}
                    className={`hover:bg-gray-50 ${!isSelectionMode ? 'cursor-pointer' : ''} ${selectedMembers.has(member.id) ? 'bg-blue-50' : ''}`}
                    onClick={() => !isSelectionMode && onMemberSelect?.(member)}
                  >
                    {isSelectionMode && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedMembers.has(member.id)}
                          onChange={(e) => {
                            e.stopPropagation()
                            toggleMemberSelection(member.id)
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {member.first_name} {member.last_name}
                        </div>
                        {member.profession && (
                          <div className="text-sm text-gray-500">{member.profession}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-900">
                          <Mail size={14} className="mr-2 text-gray-400" />
                          {member.email}
                        </div>
                        {member.phone && (
                          <div className="flex items-center text-sm text-gray-500">
                            <Phone size={14} className="mr-2 text-gray-400" />
                            {member.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(member.membership_status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getTypeBadge(member.membership_type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {member.member_roles.map((role) => (
                          <span
                            key={role.id}
                            className="px-2 py-1 text-xs font-medium rounded bg-purple-100 text-purple-800"
                          >
                            {role.role}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(member.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {!isSelectionMode && (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleInviteMember(member)
                            }}
                            className="text-blue-600 hover:text-blue-700 hover:border-blue-300"
                            title="Invite user to login"
                          >
                            <UserPlus size={14} />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              onEditMember?.(member)
                            }}
                          >
                            <Edit size={14} />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteMember(member)
                            }}
                            className="text-red-600 hover:text-red-700 hover:border-red-300"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
        {totalCount > pageSize && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} members
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={16} />
                  Previous
                </Button>
                
                {/* Page numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.ceil(totalCount / pageSize) }, (_, i) => i + 1)
                    .filter(page => {
                      // Show first page, last page, current page, and pages around current
                      const totalPages = Math.ceil(totalCount / pageSize)
                      return page === 1 || 
                             page === totalPages || 
                             Math.abs(page - currentPage) <= 2
                    })
                    .map((page, index, array) => (
                      <React.Fragment key={page}>
                        {index > 0 && array[index - 1] !== page - 1 && (
                          <span className="px-2 text-gray-500">...</span>
                        )}
                        <Button
                          variant={page === currentPage ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className={`min-w-[40px] ${page === currentPage ? 'font-semibold' : ''}`}
                        >
                          {page}
                        </Button>
                      </React.Fragment>
                    ))}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalCount / pageSize), prev + 1))}
                  disabled={currentPage === Math.ceil(totalCount / pageSize)}
                >
                  Next
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Modal de Convite */}
      {inviteModal.show && (
        <InviteUserModal
          memberEmail={inviteModal.memberEmail}
          onClose={closeInviteModal}
          onSuccess={() => {
            closeInviteModal()
            loadMembers(currentPage) // Recarregar página atual
          }}
        />
      )}
    </div>
  )
}
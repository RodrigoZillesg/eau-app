import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Trash2, AlertTriangle, Users, CheckSquare, Square, Search, Filter, RefreshCw } from 'lucide-react'
import { showNotification } from '../../../lib/notifications'
import { supabase } from '../../../lib/supabase'
import { useAuthStore } from '../../../stores/authStore'
import Swal from 'sweetalert2'

interface Member {
  id: string
  user_id: string
  first_name: string
  last_name: string
  email: string
  company_name: string
  membership_type: string
  membership_status: string
  created_at: string
}

export const BulkManagementPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [members, setMembers] = useState<Member[]>([])
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    expired: 0
  })

  useEffect(() => {
    loadMembers()
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const { count: total } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })

      const { count: active } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('membership_status', 'active')

      const { count: inactive } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('membership_status', 'inactive')

      const { count: expired } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('membership_status', 'expired')

      setStats({
        total: total || 0,
        active: active || 0,
        inactive: inactive || 0,
        expired: expired || 0
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const loadMembers = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('members')
        .select('*')
        .order('created_at', { ascending: false })

      if (filterStatus !== 'all') {
        query = query.eq('membership_status', filterStatus)
      }

      const { data, error } = await query

      if (error) throw error

      setMembers(data || [])
    } catch (error) {
      console.error('Error loading members:', error)
      showNotification('error', 'Failed to load members')
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
    if (selectedMembers.size === filteredMembers.length) {
      setSelectedMembers(new Set())
    } else {
      setSelectedMembers(new Set(filteredMembers.map(m => m.id)))
    }
  }

  const filteredMembers = members.filter(member => {
    const matchesSearch = 
      member.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  const handleDeleteSelected = async () => {
    if (selectedMembers.size === 0) {
      showNotification('warning', 'No members selected')
      return
    }

    const result = await Swal.fire({
      title: 'Delete Selected Members?',
      html: `
        <div class="text-left">
          <p class="mb-4">You are about to delete <strong>${selectedMembers.size}</strong> member(s).</p>
          <p class="mb-2"><strong>This will permanently delete:</strong></p>
          <ul class="list-disc list-inside text-sm">
            <li>Member profiles</li>
            <li>CPD activities and points</li>
            <li>Event registrations</li>
            <li>Payment records</li>
            <li>All related data</li>
          </ul>
          <p class="mt-4 text-red-600"><strong>This action cannot be undone!</strong></p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete them!',
      cancelButtonText: 'Cancel'
    })

    if (!result.isConfirmed) return

    // Second confirmation for safety
    const secondConfirm = await Swal.fire({
      title: 'Are you absolutely sure?',
      text: `Type "DELETE" to confirm deletion of ${selectedMembers.size} member(s)`,
      input: 'text',
      inputPlaceholder: 'Type DELETE to confirm',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      inputValidator: (value) => {
        if (value !== 'DELETE') {
          return 'You must type DELETE to confirm'
        }
      }
    })

    if (!secondConfirm.isConfirmed) return

    try {
      setDeleting(true)
      
      // Get current user's member ID to prevent self-deletion
      const { data: currentMember } = await supabase
        .from('members')
        .select('id')
        .eq('user_id', user?.id)
        .single()

      // Remove current user from selection if present
      const membersToDelete = Array.from(selectedMembers).filter(
        id => id !== currentMember?.id
      )

      if (membersToDelete.length === 0) {
        showNotification('warning', 'Cannot delete your own account')
        return
      }

      // Delete in batches to avoid timeout
      const batchSize = 10
      let deletedCount = 0

      for (let i = 0; i < membersToDelete.length; i += batchSize) {
        const batch = membersToDelete.slice(i, i + batchSize)
        
        // Delete members (cascade will handle related data)
        const { error } = await supabase
          .from('members')
          .delete()
          .in('id', batch)

        if (error) throw error
        
        deletedCount += batch.length
        
        // Update progress
        showNotification('info', `Deleted ${deletedCount} of ${membersToDelete.length} members...`)
      }

      showNotification('success', `Successfully deleted ${deletedCount} member(s)`)
      
      // Reload data
      await loadMembers()
      await loadStats()
      setSelectedMembers(new Set())
      
    } catch (error) {
      console.error('Error deleting members:', error)
      showNotification('error', 'Failed to delete members')
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteAll = async () => {
    const result = await Swal.fire({
      title: '⚠️ EXTREME CAUTION ⚠️',
      html: `
        <div class="text-left">
          <p class="mb-4 text-red-600 font-bold">This will delete ALL ${stats.total} members from the system!</p>
          <p class="mb-2"><strong>Everything will be permanently deleted:</strong></p>
          <ul class="list-disc list-inside text-sm">
            <li>All member profiles</li>
            <li>All CPD activities and points</li>
            <li>All event registrations</li>
            <li>All payment records</li>
            <li>All companies and memberships</li>
            <li>ALL related data</li>
          </ul>
          <p class="mt-4 text-red-600"><strong>⚠️ THIS CANNOT BE UNDONE! ⚠️</strong></p>
          <p class="mt-2 text-sm">Only your account will be preserved.</p>
        </div>
      `,
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'I understand, continue',
      cancelButtonText: 'Cancel'
    })

    if (!result.isConfirmed) return

    // Second confirmation
    const secondConfirm = await Swal.fire({
      title: 'Final Confirmation',
      text: `Type "DELETE ALL MEMBERS" to confirm complete database cleanup`,
      input: 'text',
      inputPlaceholder: 'Type DELETE ALL MEMBERS to confirm',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Delete Everything',
      cancelButtonText: 'Cancel',
      inputValidator: (value) => {
        if (value !== 'DELETE ALL MEMBERS') {
          return 'You must type DELETE ALL MEMBERS to confirm'
        }
      }
    })

    if (!secondConfirm.isConfirmed) return

    try {
      setDeleting(true)
      
      showNotification('info', 'Starting complete database cleanup...')
      
      // Get current user's member ID to preserve it
      const { data: currentMember } = await supabase
        .from('members')
        .select('id')
        .eq('user_id', user?.id)
        .single()

      if (!currentMember) {
        showNotification('error', 'Could not identify current user')
        return
      }

      // Delete all members except current user
      const { error: deleteError } = await supabase
        .from('members')
        .delete()
        .neq('id', currentMember.id)

      if (deleteError) throw deleteError

      // Clean up orphaned data (if any)
      // CPD activities without members
      await supabase
        .from('cpd_activities')
        .delete()
        .is('member_id', null)

      // Event registrations without users
      await supabase
        .from('event_registrations')
        .delete()
        .neq('user_id', user?.id)

      showNotification('success', 'Database cleaned successfully! Only your account remains.')
      
      // Reload data
      await loadMembers()
      await loadStats()
      setSelectedMembers(new Set())
      
    } catch (error) {
      console.error('Error cleaning database:', error)
      showNotification('error', 'Failed to clean database')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Bulk Member Management</h1>
        <p className="mt-2 text-gray-600">
          Manage and clean up member data in bulk (Super Admin only)
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Members</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          <div className="text-sm text-gray-600">Active</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-yellow-600">{stats.inactive}</div>
          <div className="text-sm text-gray-600">Inactive</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
          <div className="text-sm text-gray-600">Expired</div>
        </Card>
      </div>

      {/* Actions Bar */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="expired">Expired</option>
            </select>
            <Button
              variant="outline"
              onClick={loadMembers}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="destructive"
              onClick={handleDeleteSelected}
              disabled={selectedMembers.size === 0 || deleting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected ({selectedMembers.size})
            </Button>
            
            <Button
              variant="destructive"
              onClick={handleDeleteAll}
              disabled={deleting || stats.total === 0}
              className="bg-red-600 hover:bg-red-700"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Delete All Members
            </Button>
          </div>
        </div>
      </Card>

      {/* Members Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={toggleSelectAll}
                    className="flex items-center gap-2 hover:text-blue-600"
                  >
                    {selectedMembers.size === filteredMembers.length && filteredMembers.length > 0 ? 
                      <CheckSquare className="h-4 w-4" /> : 
                      <Square className="h-4 w-4" />
                    }
                    Select All
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    Loading members...
                  </td>
                </tr>
              ) : filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No members found
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleMemberSelection(member.id)}
                        className="hover:text-blue-600"
                      >
                        {selectedMembers.has(member.id) ? 
                          <CheckSquare className="h-4 w-4" /> : 
                          <Square className="h-4 w-4" />
                        }
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {member.first_name} {member.last_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {member.email}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {member.company_name || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100">
                        {member.membership_type || 'Basic'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        member.membership_status === 'active' ? 'bg-green-100 text-green-800' :
                        member.membership_status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {member.membership_status || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(member.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Warning */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-900">Important Notice</h4>
            <p className="text-sm text-yellow-800 mt-1">
              Bulk deletion is permanent and cannot be undone. All related data including CPD activities, 
              event registrations, and payment records will also be deleted. Your own account will never be deleted.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
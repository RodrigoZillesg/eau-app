import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Search, Filter, Edit, Trash2, Eye, CheckCircle, XCircle, Clock, Download, FileText, X, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Label } from '../../../components/ui/Label'
import cpd, { type CPDActivity } from '../cpdService'
import { useAuthStore } from '../../../stores/authStore'
import { format } from 'date-fns'
import { showNotification } from '../../../lib/notifications'
import Swal from 'sweetalert2'
import { BulkOperations, BulkCheckbox } from '../../../components/bulk/BulkOperations'
import { useBulkOperations } from '../../../hooks/useBulkOperations'
import { supabase } from '../../../lib/supabase/client'
import { getUserInstitution } from '../../../services/institutionService'

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
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchInput, setSearchInput] = useState('') // Local state for input field
  const [isSearching, setIsSearching] = useState(false) // Loading indicator for search
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedActivity, setSelectedActivity] = useState<CPDActivityWithMember | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState<Partial<CPDActivity>>({})
  const [showEvidenceModal, setShowEvidenceModal] = useState(false)
  const [selectedEvidence, setSelectedEvidence] = useState<{url: string | null, filename: string | null} | null>(null)
  const { user, getEffectiveRoles, roles } = useAuthStore()
  const isSuperAdmin = roles.includes('AdminSuper')
  const [userInstitution, setUserInstitution] = useState<{ institutionId: string | null, institutionName: string }>({
    institutionId: null,
    institutionName: 'All Institutions'
  })

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [pageSize] = useState(50)

  // Bulk operations for superAdmin
  const {
    selectedIds,
    setSelectedIds,
    toggleSelection,
    isSelected
  } = useBulkOperations({
    entity: 'cpd_activities',
    onSuccess: () => loadAllActivities()
  })

  // Custom bulk actions for CPD activities (superAdmin only)
  const bulkActions = isSuperAdmin ? [
    {
      id: 'export',
      label: 'Export Selected',
      icon: <Download className="w-4 h-4" />,
      action: async (ids: string[]) => {
        // Get selected activities and export
        const selectedActivities = activities.filter(a => ids.includes(a.id))
        exportSelectedToCSV(selectedActivities)
      },
      requireConfirmation: false
    },
    {
      id: 'approve-bulk',
      label: 'Approve All',
      icon: <CheckCircle className="w-4 h-4" />,
      action: async (ids: string[]) => {
        await handleBulkApprove(ids)
      },
      variant: 'success' as const,
      requireConfirmation: true,
      confirmMessage: 'This will approve all selected CPD activities.'
    },
    {
      id: 'delete',
      label: 'Delete All',
      icon: <Trash2 className="w-4 h-4" />,
      action: async (ids: string[]) => {
        await handleBulkDelete(ids)
      },
      variant: 'danger' as const,
      requireConfirmation: true,
      confirmMessage: 'This will permanently delete all selected CPD activities. This action cannot be undone. Are you sure?'
    }
  ] : []

  // Create debounced search using useRef for timer
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Handle search input change with manual debounce
  const handleSearchInput = useCallback((value: string) => {
    setSearchInput(value) // Update input immediately for UI responsiveness

    // Show searching indicator if value is different from current search term
    if (value !== searchTerm) {
      setIsSearching(true)
    }

    // Clear previous timer
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current)
    }

    // Set new timer for debounced search
    searchTimerRef.current = setTimeout(() => {
      setSearchTerm(value)
      setCurrentPage(1) // Reset to first page on search
      setIsSearching(false) // Stop search indicator
    }, 500) // 500ms delay
  }, [searchTerm])

  useEffect(() => {
    // Load user institution context first
    const loadUserInstitution = async () => {
      const institution = await getUserInstitution()
      setUserInstitution(institution)
    }
    loadUserInstitution()
  }, [])

  useEffect(() => {
    loadAllActivities()
  }, [currentPage, statusFilter, searchTerm, userInstitution])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current)
      }
    }
  }, [])

  const loadAllActivities = async () => {
    try {
      setLoading(true)

      // For Institution Admins, we need to filter by their institution's members
      let institutionMemberIds: string[] = []

      if (!isSuperAdmin && userInstitution.institutionId) {
        // Get all members from this institution
        const { data: institutionMembers, error } = await supabase
          .from('members')
          .select('id')
          .eq('institution_id', userInstitution.institutionId)

        if (error) {
          console.error('Error loading institution members:', error)
          showNotification('error', 'Failed to load institution members')
          return
        }

        institutionMemberIds = institutionMembers?.map(m => m.id) || []

        // If no members in institution, show empty results
        if (institutionMemberIds.length === 0) {
          setActivities([])
          setTotalCount(0)
          return
        }
      }

      const filters = {
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchTerm || undefined,
        page: currentPage,
        pageSize,
        // Pass member IDs for filtering if Institution Admin
        memberIds: institutionMemberIds.length > 0 ? institutionMemberIds : undefined
      }

      const { data, count } = await CPDService.getAllActivitiesPaginated(filters)
      setActivities(data as CPDActivityWithMember[])
      setTotalCount(count)
    } catch (error) {
      console.error('Error loading activities:', error)
      showNotification('error', 'Failed to load CPD activities')
    } finally {
      setLoading(false)
    }
  }

  // Status filter change is immediate (no debounce needed)

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value)
    setCurrentPage(1) // Reset to first page on filter
  }

  const handleEdit = (activity: CPDActivityWithMember) => {
    setSelectedActivity(activity)
    setEditForm({
      activity_title: activity.activity_title,
      cpd_points: activity.cpd_points,
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
        <p class="text-sm text-gray-600">Points: ${activity.cpd_points}</p>
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
    if (activity.evidence_url) {
      // Generate a meaningful filename from the activity title
      const filename = `${activity.activity_title.replace(/[^a-zA-Z0-9]/g, '_')}_evidence`

      setSelectedEvidence({
        url: activity.evidence_url,
        filename: filename
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
      ...activities.map(a => [
        `${a.members?.first_name || ''} ${a.members?.last_name || ''}`,
        a.members?.email || '',
        a.activity_title,
        format(new Date(a.activity_date), 'yyyy-MM-dd'),
        '', // Duration not available in current schema
        a.cpd_points.toString(),
        a.status,
        a.cpd_category || ''
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `cpd-activities-${format(new Date(), 'yyyy-MM-dd')}.csv`
    link.click()
  }

  const exportSelectedToCSV = (selectedActivities: CPDActivityWithMember[]) => {
    const csvContent = [
      ['Member Name', 'Email', 'Activity', 'Date', 'Hours', 'Points', 'Status', 'Category'],
      ...selectedActivities.map(a => [
        `${a.members?.first_name || ''} ${a.members?.last_name || ''}`,
        a.members?.email || '',
        a.activity_title,
        format(new Date(a.activity_date), 'yyyy-MM-dd'),
        '', // Duration not available in current schema
        a.cpd_points.toString(),
        a.status,
        a.cpd_category || ''
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `cpd-activities-selected-${format(new Date(), 'yyyy-MM-dd')}.csv`
    link.click()
    showNotification('success', `Exported ${selectedActivities.length} selected activities`)
  }

  const handleBulkApprove = async (ids: string[]) => {
    if (!user) return

    try {
      // Show loading notification
      const loadingNotification = Swal.fire({
        title: 'Processing...',
        html: `Approving ${ids.length} activities...<br><br>
                <div class="progress-bar" style="width: 100%; height: 20px; background: #e0e0e0; border-radius: 10px; overflow: hidden;">
                  <div class="progress-fill" style="width: 0%; height: 100%; background: #4CAF50; transition: width 0.3s;"></div>
                </div>
                <br><span class="progress-text">0 / ${ids.length}</span>`,
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading()
        }
      })

      // Process in batches to avoid overwhelming the server
      const batchSize = 10
      let processedCount = 0

      for (let i = 0; i < ids.length; i += batchSize) {
        const batch = ids.slice(i, i + batchSize)

        // Process batch in parallel
        await Promise.all(
          batch.map(async (id) => {
            // Direct update without triggering individual notifications
            const { error } = await supabase
              .from('cpd_activities')
              .update({
                status: 'approved',
                approved_by: user.id,
                approved_at: new Date().toISOString(),
                updated_by: user.id,
                updated_at: new Date().toISOString()
              })
              .eq('id', id)

            if (error) {
              console.error(`Error approving activity ${id}:`, error)
            }
          })
        )

        processedCount += batch.length

        // Update progress
        const progressPercent = Math.round((processedCount / ids.length) * 100)
        const progressBar = Swal.getHtmlContainer()?.querySelector('.progress-fill') as HTMLElement
        const progressText = Swal.getHtmlContainer()?.querySelector('.progress-text') as HTMLElement

        if (progressBar) progressBar.style.width = `${progressPercent}%`
        if (progressText) progressText.textContent = `${processedCount} / ${ids.length}`
      }

      // Close loading notification
      Swal.close()

      // Show success notification
      showNotification('success', `Successfully approved ${ids.length} CPD activities`)

      // Clear selection and reload
      setSelectedIds([])
      await loadAllActivities()
    } catch (error) {
      console.error('Error bulk approving activities:', error)
      Swal.close()
      showNotification('error', 'Failed to approve activities')
    }
  }

  const handleBulkDelete = async (ids: string[]) => {
    try {
      // Show loading notification
      const loadingNotification = Swal.fire({
        title: 'Processing...',
        html: `Deleting ${ids.length} activities...<br><br>
                <div class="progress-bar" style="width: 100%; height: 20px; background: #e0e0e0; border-radius: 10px; overflow: hidden;">
                  <div class="progress-fill" style="width: 0%; height: 100%; background: #dc2626; transition: width 0.3s;"></div>
                </div>
                <br><span class="progress-text">0 / ${ids.length}</span>`,
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading()
        }
      })

      // Process in batches to avoid overwhelming the server
      const batchSize = 50  // Larger batch for deletion
      let processedCount = 0

      for (let i = 0; i < ids.length; i += batchSize) {
        const batch = ids.slice(i, i + batchSize)

        // Delete batch all at once using IN operator
        const { error } = await supabase
          .from('cpd_activities')
          .delete()
          .in('id', batch)

        if (error) {
          console.error(`Error deleting batch:`, error)
          throw error
        }

        processedCount += batch.length

        // Update progress
        const progressPercent = Math.round((processedCount / ids.length) * 100)
        const progressBar = Swal.getHtmlContainer()?.querySelector('.progress-fill') as HTMLElement
        const progressText = Swal.getHtmlContainer()?.querySelector('.progress-text') as HTMLElement

        if (progressBar) progressBar.style.width = `${progressPercent}%`
        if (progressText) progressText.textContent = `${processedCount} / ${ids.length}`
      }

      // Close loading notification
      Swal.close()

      // Show success notification
      showNotification('success', `Successfully deleted ${ids.length} CPD activities`)

      // Clear selection and reload
      setSelectedIds([])
      await loadAllActivities()
    } catch (error) {
      console.error('Error bulk deleting activities:', error)
      Swal.close()
      showNotification('error', 'Failed to delete activities')
    }
  }

  const handleDeleteAll = async () => {
    // Double confirmation for delete all
    const firstConfirm = await Swal.fire({
      title: 'Delete ALL CPD Activities?',
      html: `
        <div class="text-left">
          <p class="text-red-600 font-bold mb-3">
            <strong>⚠️ EXTREME CAUTION ⚠️</strong>
          </p>
          <p class="mb-2">You are about to delete <strong>ALL ${totalCount} CPD activities</strong> in the system.</p>
          <p class="mb-3">This will:</p>
          <ul class="list-disc ml-5 mb-3">
            <li>Remove ALL CPD activities from ALL members</li>
            <li>Delete all evidence files</li>
            <li>Reset all CPD points to zero</li>
            <li>This action CANNOT be undone</li>
          </ul>
          <p class="text-red-600">Are you absolutely sure?</p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, I understand the risks',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    })

    if (!firstConfirm.isConfirmed) return

    // Second confirmation with typing
    const { value: confirmText } = await Swal.fire({
      title: 'Final Confirmation',
      html: `
        <p class="mb-3">This will delete <strong class="text-red-600">${totalCount} activities</strong> permanently.</p>
        <p class="mb-3">Type <strong>DELETE ALL</strong> to confirm:</p>
      `,
      input: 'text',
      inputPlaceholder: 'Type DELETE ALL',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Delete Everything',
      cancelButtonText: 'Cancel',
      inputValidator: (value) => {
        if (value !== 'DELETE ALL') {
          return 'You must type DELETE ALL exactly to confirm'
        }
      }
    })

    if (confirmText !== 'DELETE ALL') return

    try {
      // Show loading with progress
      Swal.fire({
        title: 'Deleting ALL Activities...',
        html: `
          <div class="mb-4">
            <p class="text-lg font-bold text-red-600">Deleting ${totalCount} activities...</p>
          </div>
          <div class="progress-bar" style="width: 100%; height: 20px; background: #e0e0e0; border-radius: 10px; overflow: hidden;">
            <div class="progress-fill" style="width: 0%; height: 100%; background: #dc2626; transition: width 0.3s;"></div>
          </div>
          <br><span class="progress-text">Starting deletion...</span>
        `,
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading()
        }
      })

      // Get ALL activity IDs (not just current page)
      let allActivityIds: string[] = []
      let currentOffset = 0
      const fetchBatchSize = 500 // Reduced from 1000 to 500 for reliability

      // First, collect all activity IDs
      while (currentOffset < totalCount) {
        try {
          const { data: activities, error: fetchError } = await supabase
            .from('cpd_activities')
            .select('id')
            .range(currentOffset, Math.min(currentOffset + fetchBatchSize - 1, totalCount - 1))

          if (fetchError) {
            console.error('Error fetching batch:', fetchError)
            throw fetchError
          }

          if (activities && activities.length > 0) {
            allActivityIds = [...allActivityIds, ...activities.map(a => a.id)]
            currentOffset += activities.length

            // Update progress for fetching IDs
            const fetchProgress = Math.round((currentOffset / totalCount) * 30) // First 30% for fetching
            const progressBar = Swal.getHtmlContainer()?.querySelector('.progress-fill') as HTMLElement
            const progressText = Swal.getHtmlContainer()?.querySelector('.progress-text') as HTMLElement
            if (progressBar) progressBar.style.width = `${fetchProgress}%`
            if (progressText) progressText.textContent = `Fetching activities: ${currentOffset} / ${totalCount}`
          } else {
            break
          }
        } catch (fetchErr) {
          console.error('Error in fetch loop:', fetchErr)
          throw fetchErr
        }
      }

      // Now delete in smaller, more reliable batches
      const deleteBatchSize = 100 // Reduced from 500 to 100 for better reliability
      let deletedCount = 0
      let failedBatches = 0

      for (let i = 0; i < allActivityIds.length; i += deleteBatchSize) {
        const batch = allActivityIds.slice(i, i + deleteBatchSize)

        try {
          // Try to delete the batch
          const { error } = await supabase
            .from('cpd_activities')
            .delete()
            .in('id', batch)

          if (error) {
            console.error(`Error deleting batch ${i}-${i + batch.length}:`, error)
            failedBatches++

            // Try to delete individually if batch fails
            for (const id of batch) {
              try {
                await supabase
                  .from('cpd_activities')
                  .delete()
                  .eq('id', id)
                deletedCount++
              } catch (individualError) {
                console.error(`Failed to delete individual activity ${id}:`, individualError)
              }
            }
          } else {
            deletedCount += batch.length
          }

          // Update progress for deletion (remaining 70%)
          const deleteProgress = 30 + Math.round((deletedCount / allActivityIds.length) * 70)
          const progressBar = Swal.getHtmlContainer()?.querySelector('.progress-fill') as HTMLElement
          const progressText = Swal.getHtmlContainer()?.querySelector('.progress-text') as HTMLElement
          if (progressBar) progressBar.style.width = `${deleteProgress}%`
          if (progressText) {
            if (failedBatches > 0) {
              progressText.textContent = `Deleted: ${deletedCount} / ${allActivityIds.length} (${failedBatches} batches retried)`
            } else {
              progressText.textContent = `Deleted: ${deletedCount} / ${allActivityIds.length}`
            }
          }

          // Add a small delay between batches to avoid overwhelming the server
          await new Promise(resolve => setTimeout(resolve, 100))
        } catch (batchError) {
          console.error(`Unexpected error in batch ${i}-${i + batch.length}:`, batchError)
          // Continue with next batch
        }
      }

      Swal.close()

      // Show result
      if (deletedCount === allActivityIds.length) {
        await Swal.fire({
          title: 'All Activities Deleted!',
          html: `<p class="text-lg">Successfully deleted <strong>${deletedCount}</strong> CPD activities.</p>`,
          icon: 'success',
          confirmButtonText: 'OK'
        })
      } else if (deletedCount > 0) {
        await Swal.fire({
          title: 'Partial Success',
          html: `
            <div class="text-left">
              <p class="mb-2">Deleted <strong>${deletedCount}</strong> out of <strong>${allActivityIds.length}</strong> activities.</p>
              <p class="text-sm text-gray-600">${allActivityIds.length - deletedCount} activities could not be deleted.</p>
              <p class="text-sm text-gray-600 mt-2">Try running the delete operation again for remaining activities.</p>
            </div>
          `,
          icon: 'warning',
          confirmButtonText: 'OK'
        })
      } else {
        await Swal.fire({
          title: 'Delete Failed',
          html: `<p>Failed to delete activities. Please check the console for errors and try again.</p>`,
          icon: 'error',
          confirmButtonText: 'OK'
        })
      }

      // Reload the page data
      await loadAllActivities()
    } catch (error) {
      console.error('Error deleting all activities:', error)
      Swal.close()
      showNotification('error', 'Failed to delete all activities')
    }
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
          {isSuperAdmin && (
            <p className="text-sm text-purple-600 mt-1">
              <strong>SuperAdmin:</strong> Bulk operations available
            </p>
          )}
          {!isSuperAdmin && userInstitution.institutionId && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Institution View:</strong> Showing CPD activities for {userInstitution.institutionName} members only
              </p>
            </div>
          )}
        </div>
        <div className="flex gap-3">
          {isSuperAdmin && totalCount > 0 && (
            <Button
              onClick={handleDeleteAll}
              variant="danger"
              className="bg-red-600 hover:bg-red-700 text-white border-red-600"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Delete ALL ({totalCount})
            </Button>
          )}
          <Button onClick={exportToCSV} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export All CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-600">
            {statusFilter === 'all' ? 'Total Activities' : `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Activities`}
          </div>
          <div className="text-2xl font-bold">{totalCount}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Current Page</div>
          <div className="text-2xl font-bold text-blue-600">
            {currentPage} of {Math.ceil(totalCount / pageSize)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Showing</div>
          <div className="text-2xl font-bold text-green-600">
            {activities.length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Page Size</div>
          <div className="text-2xl font-bold text-gray-600">
            {pageSize}
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
                  value={searchInput}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  className="pl-10 pr-10"
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                  </div>
                )}
                {!isSearching && searchInput && searchInput !== searchTerm && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                    Typing...
                  </div>
                )}
                {!isSearching && searchInput && searchInput === searchTerm && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput('')
                      setSearchTerm('')
                      setCurrentPage(1)
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <div className="w-48">
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilter(e.target.value)}
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
      </Card>

      {/* Bulk Operations Bar - Only for SuperAdmin */}
      {isSuperAdmin && activities.length > 0 && (
        <BulkOperations
          items={activities}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          actions={bulkActions}
          isLoading={loading}
        />
      )}

      {/* Activities Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {isSuperAdmin && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {/* Checkbox header - handled by BulkOperations */}
                  </th>
                )}
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
              {activities.map((activity) => (
                <tr key={activity.id} className="hover:bg-gray-50">
                  {isSuperAdmin && (
                    <td className="px-4 py-3">
                      <BulkCheckbox
                        checked={isSelected(activity.id)}
                        onChange={() => toggleSelection(activity.id)}
                      />
                    </td>
                  )}
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
                      <div className="text-xs text-gray-500">{activity.cpd_category}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {format(new Date(activity.activity_date), 'dd/MM/yyyy')}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-semibold text-blue-600">{activity.cpd_points}</span>
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

          {activities.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No CPD activities found</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalCount > pageSize && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <div className="flex items-center text-sm text-gray-700">
              <span>
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} results
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, Math.ceil(totalCount / pageSize)) }, (_, i) => {
                  const totalPages = Math.ceil(totalCount / pageSize)
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
                      variant={currentPage === pageNum ? "default" : "outline"}
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
                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalCount / pageSize), prev + 1))}
                disabled={currentPage === Math.ceil(totalCount / pageSize)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
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

                {/* Hours and minutes fields removed - not present in current schema */}

                <div>
                  <Label>Points</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={editForm.cpd_points || 0}
                    onChange={(e) => setEditForm({...editForm, cpd_points: parseFloat(e.target.value) || 0})}
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
                          className="text-blue-600 hover:text-blue-800 underline block mb-4"
                        >
                          🔗 Open evidence in new tab: {selectedEvidence.url}
                        </a>
                        <div className="text-sm text-gray-600">
                          External URL - Click the link above to view the evidence document.
                        </div>
                      </div>
                    ) : selectedEvidence.url.startsWith('/') ? (
                      <div className="text-orange-600 bg-orange-50 p-4 rounded-lg">
                        <p className="font-medium">⚠️ Relative URL Evidence</p>
                        <p className="text-sm mt-2">This appears to be a relative path from the old system:</p>
                        <code className="bg-orange-100 px-2 py-1 rounded text-sm block mt-2">
                          {selectedEvidence.url}
                        </code>
                        <p className="text-sm mt-2">
                          This may reference content from the previous English Australia website.
                        </p>
                      </div>
                    ) : (
                      <div className="text-amber-600 bg-amber-50 p-4 rounded-lg">
                        <p className="font-medium">📝 Text Evidence</p>
                        <p className="text-sm mt-2">This evidence is stored as text:</p>
                        <div className="bg-amber-100 p-3 rounded mt-2 font-mono text-sm">
                          {selectedEvidence.url}
                        </div>
                        <p className="text-sm mt-2 text-gray-600">
                          This may be a reference code, abbreviation, or note from the import process.
                        </p>
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
import React, { useState, useEffect } from 'react'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Label } from '../../../components/ui/Label'
import { StatsCardSkeleton, MembershipTableSkeleton, DistributionCardSkeleton } from '../../../components/ui/SkeletonLoader'
import { AdvancedFilters, type FilterConfig, type FilterValues } from '../../../components/filters/AdvancedFilters'
import { MembershipEditModal } from '../components/MembershipEditModal'
import { MembershipPaymentExportService } from '../../../services/membershipPaymentExportService'
import { supabase } from '../../../lib/supabase/client'
import { adminClient } from '../../../lib/supabase/adminClient'
import { showNotification } from '../../../lib/notifications'
import { getUserInstitution } from '../../../services/institutionService'
import { useAuthStore } from '../../../stores/authStore'
import {
  Building2, Users, Award, Calendar,
  RefreshCw, Download, Edit, Eye,
  CheckCircle, XCircle, Clock, AlertCircle, DollarSign, FileText
} from 'lucide-react'

interface InstitutionMembership {
  id: string
  name: string
  membership_type: string
  membership_status: string
  membership_start_date: string
  membership_renewal_date: string
  total_members: number
  primary_contact_email: string
  abn: string
  payment_status?: string
  membership_fee_total?: number
}

interface MembershipStats {
  totalInstitutions: number
  totalMembers: number
  byType: {
    fullProvider: number
    associateProvider: number
    corporateAffiliate: number
    professionalAffiliate: number
  }
  byStatus: {
    active: number
    inactive: number
    expired: number
    pending: number
  }
}

export function MembershipManagementPage() {
  const { roles } = useAuthStore()
  const [userInstitution, setUserInstitution] = useState<{ institutionId: string | null, institutionName: string }>({
    institutionId: null,
    institutionName: 'All Institutions'
  })
  const [stats, setStats] = useState<MembershipStats>({
    totalInstitutions: 0,
    totalMembers: 0,
    byType: {
      fullProvider: 0,
      associateProvider: 0,
      corporateAffiliate: 0,
      professionalAffiliate: 0
    },
    byStatus: {
      active: 0,
      inactive: 0,
      expired: 0,
      pending: 0
    }
  })
  const [institutions, setInstitutions] = useState<InstitutionMembership[]>([])
  const [filteredInstitutions, setFilteredInstitutions] = useState<InstitutionMembership[]>([])
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [selectedInstitution, setSelectedInstitution] = useState<InstitutionMembership | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [activeFilters, setActiveFilters] = useState<FilterValues>({})

  // Filter configuration
  const filterConfig: FilterConfig[] = [
    {
      id: 'membership_type',
      label: 'Membership Type',
      type: 'select',
      options: [
        { value: 'Full_Member', label: 'Full Member' },
        { value: 'Associate', label: 'Associate' },
        { value: 'Corporate', label: 'Corporate Affiliate' },
        { value: 'Professional', label: 'Professional Affiliate' }
      ]
    },
    {
      id: 'membership_status',
      label: 'Status',
      type: 'multiselect',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'expired', label: 'Expired' },
        { value: 'pending', label: 'Pending' }
      ]
    },
    {
      id: 'expiry_date',
      label: 'Renewal Date Range',
      type: 'dateRange'
    },
    {
      id: 'state',
      label: 'State',
      type: 'select',
      options: [
        { value: 'NSW', label: 'New South Wales' },
        { value: 'VIC', label: 'Victoria' },
        { value: 'QLD', label: 'Queensland' },
        { value: 'WA', label: 'Western Australia' },
        { value: 'SA', label: 'South Australia' },
        { value: 'TAS', label: 'Tasmania' },
        { value: 'ACT', label: 'Australian Capital Territory' },
        { value: 'NT', label: 'Northern Territory' }
      ]
    },
    {
      id: 'min_members',
      label: 'Min Members',
      type: 'number',
      min: 0
    },
    {
      id: 'max_members',
      label: 'Max Members',
      type: 'number',
      min: 0
    },
    {
      id: 'has_abn',
      label: 'Has ABN',
      type: 'boolean'
    }
  ]

  useEffect(() => {
    // Get user's institution context first
    const loadUserInstitution = async () => {
      const institution = await getUserInstitution()
      setUserInstitution(institution)

      // For Institution Admin, only show their institution
      if (!roles.includes('AdminSuper') && institution.institutionId) {
        // They can only see their own institution
        loadSingleInstitution(institution.institutionId)
      } else {
        // Super Admin sees all
        loadMembershipStats()
        loadInstitutions()
      }
    }

    loadUserInstitution()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [institutions, searchText, activeFilters])

  const loadMembershipStats = async () => {
    try {
      setStatsLoading(true)
      
      // Fazer queries em paralelo para melhor performance
      const [
        institutionsResponse,
        membersResponse
      ] = await Promise.all([
        supabase
          .from('institutions')
          .select('membership_type, membership_status')
          .order('name'),
        adminClient
          .from('members')
          .select('*', { count: 'exact', head: true })
      ])

      if (institutionsResponse.error) throw institutionsResponse.error
      if (membersResponse.error) throw membersResponse.error

      const institutions = institutionsResponse.data || []
      const totalMembers = membersResponse.count || 0

      // Processar dados localmente em vez de múltiplas queries
      const typeCounts = {
        fullProvider: 0,
        associateProvider: 0,
        corporateAffiliate: 0,
        professionalAffiliate: 0
      }

      const statusCounts = {
        active: 0,
        inactive: 0,
        expired: 0,
        pending: 0
      }

      institutions.forEach(inst => {
        // Count by type
        switch (inst.membership_type) {
          case 'Full Provider':
            typeCounts.fullProvider++
            break
          case 'Associate Provider':
            typeCounts.associateProvider++
            break
          case 'Corporate Affiliate':
            typeCounts.corporateAffiliate++
            break
          case 'Professional Affiliate':
            typeCounts.professionalAffiliate++
            break
        }

        // Count by status
        const status = inst.membership_status || 'active'
        if (status in statusCounts) {
          statusCounts[status as keyof typeof statusCounts]++
        }
      })

      setStats({
        totalInstitutions: institutions.length,
        totalMembers,
        byType: typeCounts,
        byStatus: statusCounts
      })
    } catch (error) {
      console.error('Error loading stats:', error)
      showNotification('error', 'Failed to load membership statistics')
    } finally {
      setStatsLoading(false)
    }
  }

  const loadSingleInstitution = async (institutionId: string) => {
    try {
      setLoading(true)
      setStatsLoading(true)

      // Load only the specific institution
      // Get institution data
      const { data: instData, error: instError } = await supabase
        .from('institutions')
        .select('*')
        .eq('id', institutionId)
        .single()

      if (instError) throw instError

      // Get member count using adminClient
      const { count: memberCount } = await adminClient
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('institution_id', institutionId)

      const data = {
        ...instData,
        member_count: memberCount || 0
      }

      if (error) throw error

      if (data) {
        const formattedData = [{
          id: data.id,
          name: data.name,
          membership_type: data.membership_type || 'Full Provider',
          membership_status: data.membership_status || 'active',
          membership_start_date: data.membership_start_date || data.created_at,
          membership_renewal_date: data.membership_renewal_date,
          total_members: data.member_count || 0,
          primary_contact_email: data.company_email,
          abn: data.abn,
          payment_status: data.payment_status || 'pending',
          membership_fee_total: data.membership_fee_total
        }]

        setInstitutions(formattedData)
        setFilteredInstitutions(formattedData)

        // Set stats for single institution
        setStats({
          totalInstitutions: 1,
          totalMembers: formattedData[0].total_members,
          byType: {
            fullProvider: data.membership_type === 'Full Provider' ? 1 : 0,
            associateProvider: data.membership_type === 'Associate Provider' ? 1 : 0,
            corporateAffiliate: data.membership_type === 'Corporate Affiliate' ? 1 : 0,
            professionalAffiliate: data.membership_type === 'Professional Affiliate' ? 1 : 0
          },
          byStatus: {
            active: data.membership_status === 'active' ? 1 : 0,
            inactive: data.membership_status === 'inactive' ? 1 : 0,
            expired: data.membership_status === 'expired' ? 1 : 0,
            pending: data.membership_status === 'pending' ? 1 : 0
          }
        })
      }
    } catch (error) {
      console.error('Error loading institution:', error)
      showNotification('error', 'Failed to load institution data')
    } finally {
      setLoading(false)
      setStatsLoading(false)
    }
  }

  const loadInstitutions = async () => {
    try {
      setLoading(true)
      // Get institutions
      const { data: institutions, error } = await supabase
        .from('institutions')
        .select('*')
        .order('name')

      if (error) throw error

      // Get member counts using adminClient
      const { data: members } = await adminClient
        .from('members')
        .select('institution_id')

      // Count members per institution
      const memberCounts = members?.reduce((acc, member) => {
        if (member.institution_id) {
          acc[member.institution_id] = (acc[member.institution_id] || 0) + 1
        }
        return acc
      }, {} as Record<string, number>) || {}

      // Add counts to institutions
      const data = institutions?.map(inst => ({
        ...inst,
        member_count: memberCounts[inst.id] || 0
      })) || []

      const formattedData = (data || []).map(inst => ({
        id: inst.id,
        name: inst.name,
        membership_type: inst.membership_type || 'Full Provider',
        membership_status: inst.membership_status || 'active',
        membership_start_date: inst.membership_start_date || inst.created_at,
        membership_renewal_date: inst.membership_renewal_date,
        total_members: inst.member_count || 0,
        primary_contact_email: inst.company_email,
        abn: inst.abn,
        payment_status: inst.payment_status || 'pending',
        membership_fee_total: inst.membership_fee_total
      }))

      setInstitutions(formattedData)
      setFilteredInstitutions(formattedData)
    } catch (error) {
      console.error('Error loading institutions:', error)
      showNotification('error', 'Failed to load institutions')
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...institutions]

    // Apply search text
    if (searchText) {
      const search = searchText.toLowerCase()
      filtered = filtered.filter(inst =>
        inst.name.toLowerCase().includes(search) ||
        inst.primary_contact_email?.toLowerCase().includes(search) ||
        inst.abn?.toLowerCase().includes(search)
      )
    }

    // Apply membership type filter
    if (activeFilters.membership_type) {
      filtered = filtered.filter(inst => inst.membership_type === activeFilters.membership_type)
    }

    // Apply status filter (multiselect)
    if (activeFilters.membership_status && activeFilters.membership_status.length > 0) {
      filtered = filtered.filter(inst =>
        activeFilters.membership_status.includes(inst.membership_status)
      )
    }

    // Apply renewal date range filter
    if (activeFilters.expiry_date) {
      const { from, to } = activeFilters.expiry_date
      if (from) {
        filtered = filtered.filter(inst =>
          inst.membership_renewal_date && inst.membership_renewal_date >= from
        )
      }
      if (to) {
        filtered = filtered.filter(inst =>
          inst.membership_renewal_date && inst.membership_renewal_date <= to
        )
      }
    }

    // Apply member count filters
    if (activeFilters.min_members) {
      filtered = filtered.filter(inst => inst.total_members >= activeFilters.min_members)
    }
    if (activeFilters.max_members) {
      filtered = filtered.filter(inst => inst.total_members <= activeFilters.max_members)
    }

    // Apply ABN filter
    if (activeFilters.has_abn !== undefined && activeFilters.has_abn !== null) {
      filtered = filtered.filter(inst =>
        activeFilters.has_abn ? !!inst.abn : !inst.abn
      )
    }

    setFilteredInstitutions(filtered)
  }

  const handleFilterChange = (filters: FilterValues) => {
    setActiveFilters(filters)
  }

  const handleSearch = (text: string) => {
    setSearchText(text)
  }

  const handleExportFiltered = async () => {
    try {
      const csvContent = [
        ['Institution Name', 'Type', 'Status', 'Start Date', 'Renewal Date', 'Members', 'Contact Email', 'ABN'].join(','),
        ...filteredInstitutions.map(inst => [
          inst.name,
          inst.membership_type,
          inst.membership_status,
          inst.membership_start_date,
          inst.membership_renewal_date || '',
          inst.total_members,
          inst.primary_contact_email || '',
          inst.abn || ''
        ].join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `memberships-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      showNotification('success', `Exported ${filteredInstitutions.length} memberships`)
    } catch (error) {
      console.error('Error exporting:', error)
      showNotification('error', 'Failed to export memberships')
    }
  }

  const handleSave = () => {
    // Reload data after save
    if (!roles.includes('AdminSuper') && userInstitution.institutionId) {
      loadSingleInstitution(userInstitution.institutionId)
    } else {
      loadInstitutions()
      loadMembershipStats()
    }
    setShowEditModal(false)
    setSelectedInstitution(null)
  }

  const handleExportMemberships = async () => {
    try {
      const { data } = await supabase
        .from('institutions')
        .select('*')
        .order('name')
      
      if (data && data.length > 0) {
        // Convert to CSV
        const headers = ['Name', 'Type', 'Status', 'ABN', 'Email', 'Start Date', 'Renewal Date']
        const rows = data.map(inst => [
          inst.name,
          inst.membership_type || 'Full Provider',
          inst.membership_status || 'active',
          inst.abn,
          inst.company_email,
          inst.membership_start_date || inst.created_at,
          inst.membership_renewal_date || ''
        ])
        
        const csv = [
          headers.join(','),
          ...rows.map(row => row.map(cell => `"${cell || ''}"`).join(','))
        ].join('\n')
        
        // Download
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `memberships-export-${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        
        showNotification('success', `Exported ${data.length} memberships`)
      }
    } catch (error) {
      console.error('Error exporting:', error)
      showNotification('error', 'Failed to export memberships')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'expired': return 'bg-red-100 text-red-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800'
      case 'partially_paid': return 'bg-yellow-100 text-yellow-800'
      case 'pending': return 'bg-gray-100 text-gray-800'
      case 'exempt': return 'bg-blue-100 text-blue-800'
      case 'failed': return 'bg-red-100 text-red-800'
      case 'refunded': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'inactive': return <XCircle className="w-4 h-4 text-gray-600" />
      case 'expired': return <AlertCircle className="w-4 h-4 text-red-600" />
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />
      default: return null
    }
  }

  const getMembershipTypeLabel = (type: string) => {
    switch (type) {
      case 'Full Provider': return 'Full Provider'
      case 'Associate Provider': return 'Associate Provider (Access)'
      case 'Corporate Affiliate': return 'Corporate Affiliate'
      case 'Professional Affiliate': return 'Professional Affiliate'
      default: return type
    }
  }

  const handleExportCSV = async () => {
    try {
      await MembershipPaymentExportService.exportToCSV();
      showNotification('success', 'Payments exported to CSV successfully');
    } catch (error: any) {
      showNotification('error', error.message || 'Failed to export to CSV');
    }
  };

  const handleExportPDF = async () => {
    try {
      await MembershipPaymentExportService.exportToPDF();
      showNotification('success', 'Payments exported to PDF successfully');
    } catch (error: any) {
      showNotification('error', error.message || 'Failed to export to PDF');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Membership Management</h1>
            <p className="text-gray-600">
              Manage institutional memberships for English Australia
            </p>
          </div>

          {/* Export Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleExportCSV}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              onClick={handleExportPDF}
              className="flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Show context for Institution Admins */}
        {!roles.includes('AdminSuper') && userInstitution.institutionId && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Institution View:</strong> Showing data for {userInstitution.institutionName} only
            </p>
          </div>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {statsLoading ? (
          <>
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </>
        ) : (
          <>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Institutions</p>
                  <p className="text-2xl font-bold">{stats.totalInstitutions}</p>
                </div>
                <Building2 className="w-8 h-8 text-blue-500" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Memberships</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.byStatus.active}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Full Providers</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {stats.byType.fullProvider}
                  </p>
                </div>
                <Award className="w-8 h-8 text-purple-500" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Members</p>
                  <p className="text-2xl font-bold text-indigo-600">
                    {stats.totalMembers}
                  </p>
                </div>
                <Users className="w-8 h-8 text-indigo-500" />
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Membership Type Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {statsLoading ? (
          <>
            <DistributionCardSkeleton />
            <DistributionCardSkeleton />
          </>
        ) : (
          <>
            {/* By Type */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Membership Types</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Full Provider</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{stats.byType.fullProvider}</span>
                    <span className="text-sm text-gray-500">
                      ({stats.totalInstitutions > 0 ? 
                        ((stats.byType.fullProvider / stats.totalInstitutions) * 100).toFixed(0) : 0}%)
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Associate Provider</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{stats.byType.associateProvider}</span>
                    <span className="text-sm text-gray-500">
                      ({stats.totalInstitutions > 0 ? 
                        ((stats.byType.associateProvider / stats.totalInstitutions) * 100).toFixed(0) : 0}%)
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Corporate Affiliate</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{stats.byType.corporateAffiliate}</span>
                    <span className="text-sm text-gray-500">
                      ({stats.totalInstitutions > 0 ? 
                        ((stats.byType.corporateAffiliate / stats.totalInstitutions) * 100).toFixed(0) : 0}%)
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Professional Affiliate</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{stats.byType.professionalAffiliate}</span>
                    <span className="text-sm text-gray-500">
                      ({stats.totalInstitutions > 0 ? 
                        ((stats.byType.professionalAffiliate / stats.totalInstitutions) * 100).toFixed(0) : 0}%)
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* By Status */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Membership Status</h3>
              <div className="space-y-3">
                {Object.entries(stats.byStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(status)}
                      <span className="text-sm capitalize">{status}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{count}</span>
                      <span className="text-sm text-gray-500">
                        ({stats.totalInstitutions > 0 ? 
                          ((count / stats.totalInstitutions) * 100).toFixed(0) : 0}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Advanced Filters */}
      <div className="mb-8">
        <AdvancedFilters
          filters={filterConfig}
          onFilterChange={handleFilterChange}
          onSearch={handleSearch}
          onExport={handleExportFiltered}
          searchPlaceholder="Search by institution name, email, or ABN..."
          showSearch={true}
          showExport={true}
        />
      </div>

      {/* Institutions List */}
      <Card className="p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold">Institution Memberships</h3>
            <p className="text-sm text-gray-600 mt-1">
              Showing {filteredInstitutions.length} of {institutions.length} institutions
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={loadInstitutions}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </div>

        {loading ? (
          <MembershipTableSkeleton rows={5} />
        ) : filteredInstitutions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {institutions.length === 0
              ? "No institutions found. Import data from the CSV to populate."
              : "No institutions match the current filters. Try adjusting your search criteria."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Institution
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Payment
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Members
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Renewal Date
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredInstitutions.map((inst) => (
                  <tr key={inst.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-gray-900">{inst.name}</div>
                        <div className="text-sm text-gray-500">{inst.primary_contact_email}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm">{getMembershipTypeLabel(inst.membership_type)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(inst.membership_status)}`}>
                        {inst.membership_status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(inst.payment_status || 'pending')}`}>
                        {(inst.payment_status || 'pending').replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {inst.total_members}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {inst.membership_renewal_date
                        ? new Date(inst.membership_renewal_date).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedInstitution(inst)
                            setShowEditModal(true)
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => window.location.href = `/admin/institutions/${inst.id}`}
                          className="text-gray-600 hover:text-gray-800"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Edit Modal */}
      {showEditModal && selectedInstitution && (
        <MembershipEditModal
          institution={selectedInstitution}
          onClose={() => {
            setShowEditModal(false)
            setSelectedInstitution(null)
          }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
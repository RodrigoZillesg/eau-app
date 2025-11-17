import React, { useState, useEffect } from 'react'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Label } from '../../../components/ui/Label'
import { Input } from '../../../components/ui/Input'
import { StatsCardSkeleton, InstitutionTableSkeleton } from '../../../components/ui/SkeletonLoader'
import { supabase } from '../../../lib/supabase/client'
import { adminClient } from '../../../lib/supabase/adminClient'
import { showNotification } from '../../../lib/notifications'
import {
  Building2, Users, Mail, Phone, Globe, MapPin,
  Plus, Edit2, Trash2, Search, Download, Upload,
  Building, GraduationCap, Briefcase, CheckCircle, XCircle
} from 'lucide-react'

interface Institution {
  id: string
  name: string
  code: string | null
  email: string | null
  phone: string | null
  website: string | null
  address: string | null
  city: string | null
  state: string | null
  country: string | null
  postal_code: string | null
  membership_type: string | null
  membership_status: string
  membership_start_date: string | null
  membership_renewal_date: string | null
  membership_fee_amount: number | null
  membership_fee_gst: number | null
  membership_fee_total: number | null
  created_at: string
  updated_at: string
  member_count?: number
  active_memberships?: number
}

interface InstitutionFormData {
  name: string
  code: string
  email: string
  phone: string
  website: string
  address: string
  city: string
  state: string
  country: string
  postal_code: string
  membership_type: string
  membership_status: string
}

export function InstitutionsManagementPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<InstitutionFormData>({
    name: '',
    code: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    state: '',
    country: 'Australia',
    postal_code: '',
    membership_type: '',
    membership_status: 'active'
  })

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    suspended: 0,
    totalMembers: 0,
    totalMemberships: 0
  })

  useEffect(() => {
    loadInstitutions()
    loadStats()
  }, [])

  const loadInstitutions = async () => {
    try {
      setLoading(true)

      // Get session token for authentication
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        throw new Error('No active session')
      }

      // Use backend API with aggregations for accurate counts
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'
      const response = await fetch(`${backendUrl}/api/v1/institutions?withCounts=true&limit=1000`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch institutions from API')
      }

      const result = await response.json()
      console.log('🔍 API Response:', result)

      if (result.success && result.data?.institutions) {
        setInstitutions(result.data.institutions)
      } else {
        throw new Error('Invalid API response format')
      }
    } catch (error) {
      console.error('Error loading institutions:', error)
      showNotification('error', 'Failed to load institutions')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      setStatsLoading(true)

      // Fazer todas as queries em paralelo para melhor performance
      const [
        institutionsResponse,
        membersResponse
      ] = await Promise.all([
        supabase
          .from('institutions')
          .select('membership_status'),
        adminClient
          .from('members')
          .select('*', { count: 'exact', head: true })
      ])

      const institutions = institutionsResponse.data || []

      // Processar status localmente
      const statusCounts = institutions.reduce((acc, inst) => {
        const status = inst.membership_status || 'active'
        acc[status] = (acc[status] || 0) + 1
        return acc
      }, { active: 0, inactive: 0, suspended: 0 })

      // Count active members (those with membership_status = 'active')
      // Use adminClient to bypass RLS restrictions
      const { count: activeMembershipCount } = await adminClient
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('membership_status', 'active')

      setStats({
        total: institutions.length,
        ...statusCounts,
        totalMembers: membersResponse.count || 0,
        totalMemberships: activeMembershipCount || 0
      })
    } catch (error) {
      console.error('Error loading stats:', error)
      showNotification('error', 'Failed to load statistics')
    } finally {
      setStatsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('🔵 HandleSubmit called!')
    console.log('Form data:', formData)

    try {
      const dataToSubmit = {
        name: formData.name,
        code: formData.code || null,
        email: formData.email || null,
        phone: formData.phone || null,
        website: formData.website || null,
        address: formData.address || null,
        city: formData.city || null,
        state: formData.state || null,
        country: formData.country || null,
        postal_code: formData.postal_code || null,
        membership_type: formData.membership_type || null,
        membership_status: formData.membership_status
      }
      console.log('Data to submit:', dataToSubmit)

      if (selectedInstitution) {
        // Update existing
        console.log('Updating institution:', selectedInstitution.id)
        const { error } = await supabase
          .from('institutions')
          .update(dataToSubmit)
          .eq('id', selectedInstitution.id)

        if (error) throw error
        console.log('✅ Institution updated successfully')
        showNotification('success', 'Institution updated successfully')
      } else {
        // Create new
        console.log('Creating new institution...')
        const { data, error } = await supabase
          .from('institutions')
          .insert([dataToSubmit])
          .select()

        if (error) {
          console.error('❌ Error creating institution:', error)
          throw error
        }
        console.log('✅ Institution created successfully:', data)
        showNotification('success', 'Institution created successfully')
      }

      setShowForm(false)
      resetForm()
      loadInstitutions()
      loadStats()
    } catch (error: any) {
      console.error('Error saving institution:', error)
      showNotification('error', error.message || 'Failed to save institution')
    }
  }

  const handleEdit = (institution: Institution) => {
    setSelectedInstitution(institution)
    setFormData({
      name: institution.name,
      code: institution.code || '',
      email: institution.email || '',
      phone: institution.phone || '',
      website: institution.website || '',
      address: institution.address || '',
      city: institution.city || '',
      state: institution.state || '',
      country: institution.country || 'Australia',
      postal_code: institution.postal_code || '',
      membership_type: institution.membership_type || '',
      membership_status: institution.membership_status
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this institution? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('institutions')
        .delete()
        .eq('id', id)

      if (error) throw error
      showNotification('success', 'Institution deleted successfully')
      loadInstitutions()
      loadStats()
    } catch (error: any) {
      console.error('Error deleting institution:', error)
      showNotification('error', error.message || 'Failed to delete institution')
    }
  }

  const resetForm = () => {
    setSelectedInstitution(null)
    setFormData({
      name: '',
      code: '',
      email: '',
      phone: '',
      website: '',
      address: '',
      city: '',
      state: '',
      country: 'Australia',
      postal_code: '',
      membership_type: '',
      membership_status: 'active'
    })
  }

  const filteredInstitutions = institutions.filter(inst =>
    inst.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inst.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inst.code?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'suspended': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string | null) => {
    switch (type?.toLowerCase()) {
      case 'university': return <GraduationCap className="w-4 h-4" />
      case 'college': return <Building className="w-4 h-4" />
      case 'institute': return <Briefcase className="w-4 h-4" />
      default: return <Building2 className="w-4 h-4" />
    }
  }

  const exportToCSV = () => {
    const headers = ['Name', 'Code', 'Email', 'Phone', 'City', 'State', 'Status', 'Members', 'Memberships']
    const rows = filteredInstitutions.map(inst => [
      inst.name,
      inst.code || '',
      inst.email || '',
      inst.phone || '',
      inst.city || '',
      inst.state || '',
      inst.membership_status,
      inst.member_count || 0,
      inst.active_memberships || 0
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `institutions-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)

    showNotification('success', `Exported ${filteredInstitutions.length} institutions`)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Institutions Management</h1>
        <p className="text-gray-600">
          Manage educational institutions, companies, and organizations
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
        {statsLoading ? (
          <>
            <StatsCardSkeleton />
            <StatsCardSkeleton />
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
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Building2 className="w-8 h-8 text-blue-500" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Inactive</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.inactive}</p>
                </div>
                <XCircle className="w-8 h-8 text-gray-500" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Suspended</p>
                  <p className="text-2xl font-bold text-red-600">{stats.suspended}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Members</p>
                  <p className="text-2xl font-bold text-indigo-600">{stats.totalMembers}</p>
                </div>
                <Users className="w-8 h-8 text-indigo-500" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Memberships</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.totalMemberships}</p>
                </div>
                <Building className="w-8 h-8 text-purple-500" />
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Search and Actions */}
      <Card className="p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search by name, email, or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => {
                resetForm()
                setShowForm(true)
              }}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Institution
            </Button>
            <Button
              variant="outline"
              onClick={exportToCSV}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>
        </div>
      </Card>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                {selectedInstitution ? 'Edit Institution' : 'Add New Institution'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Basic Information */}
                  <div>
                    <Label htmlFor="name">Institution Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="code">Institution Code</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="membership_type">Membership Type</Label>
                    <select
                      id="membership_type"
                      value={formData.membership_type}
                      onChange={(e) => setFormData({ ...formData, membership_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Select Type</option>
                      <option value="standard">Standard</option>
                      <option value="premium">Premium</option>
                      <option value="corporate">Corporate</option>
                    </select>
                  </div>
                </div>

                {/* Address Information */}
                <div className="border-t pt-4">
                  <h3 className="font-medium mb-3">Address Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="postal_code">Postal Code</Label>
                      <Input
                        id="postal_code"
                        value={formData.postal_code}
                        onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="state">State</Label>
                      <select
                        id="state"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="">Select State</option>
                        <option value="NSW">New South Wales</option>
                        <option value="VIC">Victoria</option>
                        <option value="QLD">Queensland</option>
                        <option value="WA">Western Australia</option>
                        <option value="SA">South Australia</option>
                        <option value="TAS">Tasmania</option>
                        <option value="ACT">Australian Capital Territory</option>
                        <option value="NT">Northern Territory</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="border-t pt-4">
                  <div>
                    <Label htmlFor="membership_status">Status</Label>
                    <select
                      id="membership_status"
                      value={formData.membership_status}
                      onChange={(e) => setFormData({ ...formData, membership_status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false)
                      resetForm()
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {selectedInstitution ? 'Update' : 'Create'} Institution
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}

      {/* Institutions List */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Institutions List</h2>

        {loading ? (
          <InstitutionTableSkeleton rows={8} />
        ) : filteredInstitutions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? 'No institutions found matching your search.' : 'No institutions found. Add your first institution above.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Institution
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Contact
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Location
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Members
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredInstitutions.map((institution) => (
                  <tr key={institution.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-gray-900">{institution.name}</div>
                        {institution.code && (
                          <div className="text-sm text-gray-500">Code: {institution.code}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        {institution.email && (
                          <div className="flex items-center gap-1 text-gray-600">
                            <Mail className="w-3 h-3" />
                            {institution.email}
                          </div>
                        )}
                        {institution.phone && (
                          <div className="flex items-center gap-1 text-gray-600">
                            <Phone className="w-3 h-3" />
                            {institution.phone}
                          </div>
                        )}
                        {institution.website && (
                          <div className="flex items-center gap-1 text-gray-600">
                            <Globe className="w-3 h-3" />
                            <a href={institution.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              Website
                            </a>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-600">
                        {institution.city && institution.state ? (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {institution.city}, {institution.state}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <div>{institution.member_count || 0} members</div>
                        <div className="text-gray-500">{institution.active_memberships || 0} active</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(institution.membership_status)}`}>
                        {institution.membership_status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(institution)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(institution.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
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
    </div>
  )
}

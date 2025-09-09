import React, { useState, useEffect } from 'react'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Label } from '../../../components/ui/Label'
import { Input } from '../../../components/ui/Input'
import { supabase } from '../../../lib/supabase/client'
import { showNotification } from '../../../lib/notifications'
import { 
  Building2, Users, Mail, Phone, Globe, MapPin,
  Plus, Edit2, Trash2, Search, Download, Upload,
  Building, GraduationCap, Briefcase, CheckCircle, XCircle
} from 'lucide-react'

interface Institution {
  id: string
  name: string
  parent_company: string | null
  abn: string | null
  company_email: string | null
  company_type: string | null
  cricos_code: string | null
  address_line1: string | null
  address_line2: string | null
  address_line3: string | null
  suburb: string | null
  postcode: string | null
  state: string | null
  country: string | null
  phone: string | null
  website: string | null
  primary_contact_id: string | null
  courses_offered: string | null
  logo_url: string | null
  member_since: string | null
  cancellation_details: string | null
  status: 'active' | 'inactive' | 'suspended'
  created_at: string
  updated_at: string
  member_count?: number
  active_memberships?: number
}

interface InstitutionFormData {
  name: string
  parent_company: string
  abn: string
  company_email: string
  company_type: string
  cricos_code: string
  address_line1: string
  address_line2: string
  address_line3: string
  suburb: string
  postcode: string
  state: string
  country: string
  phone: string
  website: string
  courses_offered: string
  status: 'active' | 'inactive' | 'suspended'
}

export function InstitutionsManagementPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<InstitutionFormData>({
    name: '',
    parent_company: '',
    abn: '',
    company_email: '',
    company_type: '',
    cricos_code: '',
    address_line1: '',
    address_line2: '',
    address_line3: '',
    suburb: '',
    postcode: '',
    state: '',
    country: 'Australia',
    phone: '',
    website: '',
    courses_offered: '',
    status: 'active'
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
      const { data, error } = await supabase
        .from('institutions')
        .select(`
          *,
          member_institutions(count),
          memberships(count)
        `)
        .order('name')

      if (error) throw error

      // Process the data to include counts
      const processedData = data?.map(inst => ({
        ...inst,
        member_count: inst.member_institutions?.[0]?.count || 0,
        active_memberships: inst.memberships?.[0]?.count || 0
      })) || []

      setInstitutions(processedData)
    } catch (error) {
      console.error('Error loading institutions:', error)
      showNotification('error', 'Failed to load institutions')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      // Get total institutions
      const { count: total } = await supabase
        .from('institutions')
        .select('*', { count: 'exact', head: true })

      // Get status counts
      const { data: statusData } = await supabase
        .from('institutions')
        .select('status')

      const statusCounts = statusData?.reduce((acc, inst) => {
        acc[inst.status] = (acc[inst.status] || 0) + 1
        return acc
      }, { active: 0, inactive: 0, suspended: 0 }) || { active: 0, inactive: 0, suspended: 0 }

      // Get total members associated with institutions
      const { count: totalMembers } = await supabase
        .from('member_institutions')
        .select('*', { count: 'exact', head: true })

      // Get total active memberships
      const { count: totalMemberships } = await supabase
        .from('memberships')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')

      setStats({
        total: total || 0,
        ...statusCounts,
        totalMembers: totalMembers || 0,
        totalMemberships: totalMemberships || 0
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const dataToSubmit = {
        ...formData,
        parent_company: formData.parent_company || null,
        abn: formData.abn || null,
        company_email: formData.company_email || null,
        company_type: formData.company_type || null,
        cricos_code: formData.cricos_code || null,
        address_line1: formData.address_line1 || null,
        address_line2: formData.address_line2 || null,
        address_line3: formData.address_line3 || null,
        suburb: formData.suburb || null,
        postcode: formData.postcode || null,
        state: formData.state || null,
        country: formData.country || null,
        phone: formData.phone || null,
        website: formData.website || null,
        courses_offered: formData.courses_offered || null
      }

      if (selectedInstitution) {
        // Update existing
        const { error } = await supabase
          .from('institutions')
          .update(dataToSubmit)
          .eq('id', selectedInstitution.id)

        if (error) throw error
        showNotification('success', 'Institution updated successfully')
      } else {
        // Create new
        const { error } = await supabase
          .from('institutions')
          .insert([dataToSubmit])

        if (error) throw error
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
      parent_company: institution.parent_company || '',
      abn: institution.abn || '',
      company_email: institution.company_email || '',
      company_type: institution.company_type || '',
      cricos_code: institution.cricos_code || '',
      address_line1: institution.address_line1 || '',
      address_line2: institution.address_line2 || '',
      address_line3: institution.address_line3 || '',
      suburb: institution.suburb || '',
      postcode: institution.postcode || '',
      state: institution.state || '',
      country: institution.country || 'Australia',
      phone: institution.phone || '',
      website: institution.website || '',
      courses_offered: institution.courses_offered || '',
      status: institution.status
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
      parent_company: '',
      abn: '',
      company_email: '',
      company_type: '',
      cricos_code: '',
      address_line1: '',
      address_line2: '',
      address_line3: '',
      suburb: '',
      postcode: '',
      state: '',
      country: 'Australia',
      phone: '',
      website: '',
      courses_offered: '',
      status: 'active'
    })
  }

  const filteredInstitutions = institutions.filter(inst =>
    inst.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inst.company_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inst.abn?.toLowerCase().includes(searchTerm.toLowerCase())
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
    const headers = ['Name', 'ABN', 'Email', 'Phone', 'State', 'Status', 'Members', 'Memberships']
    const rows = filteredInstitutions.map(inst => [
      inst.name,
      inst.abn || '',
      inst.company_email || '',
      inst.phone || '',
      inst.state || '',
      inst.status,
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
      </div>

      {/* Search and Actions */}
      <Card className="p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search by name, email, or ABN..."
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
                    <Label htmlFor="parent_company">Parent Company</Label>
                    <Input
                      id="parent_company"
                      value={formData.parent_company}
                      onChange={(e) => setFormData({ ...formData, parent_company: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="abn">ABN</Label>
                    <Input
                      id="abn"
                      value={formData.abn}
                      onChange={(e) => setFormData({ ...formData, abn: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="company_email">Email</Label>
                    <Input
                      id="company_email"
                      type="email"
                      value={formData.company_email}
                      onChange={(e) => setFormData({ ...formData, company_email: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="company_type">Institution Type</Label>
                    <select
                      id="company_type"
                      value={formData.company_type}
                      onChange={(e) => setFormData({ ...formData, company_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Select Type</option>
                      <option value="University">University</option>
                      <option value="College">College</option>
                      <option value="Institute">Institute</option>
                      <option value="Language School">Language School</option>
                      <option value="Training Provider">Training Provider</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="cricos_code">CRICOS Code</Label>
                    <Input
                      id="cricos_code"
                      value={formData.cricos_code}
                      onChange={(e) => setFormData({ ...formData, cricos_code: e.target.value })}
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
                </div>

                {/* Address Information */}
                <div className="border-t pt-4">
                  <h3 className="font-medium mb-3">Address Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="address_line1">Address Line 1</Label>
                      <Input
                        id="address_line1"
                        value={formData.address_line1}
                        onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="address_line2">Address Line 2</Label>
                      <Input
                        id="address_line2"
                        value={formData.address_line2}
                        onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="suburb">Suburb</Label>
                      <Input
                        id="suburb"
                        value={formData.suburb}
                        onChange={(e) => setFormData({ ...formData, suburb: e.target.value })}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="postcode">Postcode</Label>
                      <Input
                        id="postcode"
                        value={formData.postcode}
                        onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
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

                {/* Additional Information */}
                <div className="border-t pt-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="courses_offered">Courses Offered</Label>
                      <textarea
                        id="courses_offered"
                        value={formData.courses_offered}
                        onChange={(e) => setFormData({ ...formData, courses_offered: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <select
                        id="status"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </div>
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
          <div className="text-center py-8">Loading institutions...</div>
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
                    Type
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
                        {institution.abn && (
                          <div className="text-sm text-gray-500">ABN: {institution.abn}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        {institution.company_email && (
                          <div className="flex items-center gap-1 text-gray-600">
                            <Mail className="w-3 h-3" />
                            {institution.company_email}
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
                        {institution.suburb && institution.state ? (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {institution.suburb}, {institution.state}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-sm">
                        {getTypeIcon(institution.company_type)}
                        <span>{institution.company_type || '-'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <div>{institution.member_count || 0} members</div>
                        <div className="text-gray-500">{institution.active_memberships || 0} memberships</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(institution.status)}`}>
                        {institution.status}
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
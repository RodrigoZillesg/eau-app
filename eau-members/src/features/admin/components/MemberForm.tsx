import React, { useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Label } from '../../../components/ui/Label'
import { Card } from '../../../components/ui/Card'
import { PhoneInput } from '../../../components/ui/PhoneInput'
import { MembersService, type MemberWithRoles } from '../../../lib/supabase/members'
import type { MembershipStatus, MembershipType, MemberRole } from '../../../types/supabase'
import { InviteUserModal } from './InviteUserModal'

interface MemberFormProps {
  member?: MemberWithRoles | null
  onSave?: (member: MemberWithRoles) => void
  onCancel?: () => void
}

interface FormData {
  first_name: string
  last_name: string
  email: string
  phone: string
  date_of_birth: string
  address_line1: string
  address_line2: string
  city: string
  state: string
  postal_code: string
  country: string
  membership_status: MembershipStatus
  membership_type: MembershipType
  membership_start_date: string
  membership_end_date: string
  profession: string
  experience_years: string
  qualifications: string
  receive_newsletters: boolean
  receive_event_notifications: boolean
  roles: MemberRole[]
}

export const MemberForm: React.FC<MemberFormProps> = ({
  member,
  onSave,
  onCancel
}) => {
  const isEditing = !!member

  const [formData, setFormData] = useState<FormData>({
    first_name: member?.first_name || '',
    last_name: member?.last_name || '',
    email: member?.email || '',
    phone: member?.phone || '',
    date_of_birth: member?.date_of_birth || '',
    address_line1: member?.address_line1 || '',
    address_line2: member?.address_line2 || '',
    city: member?.city || '',
    state: member?.state || '',
    postal_code: member?.postal_code || '',
    country: member?.country || 'Australia',
    membership_status: member?.membership_status || 'active',
    membership_type: member?.membership_type || 'standard',
    membership_start_date: member?.membership_start_date || new Date().toISOString().split('T')[0],
    membership_end_date: member?.membership_end_date || '',
    profession: member?.profession || '',
    experience_years: member?.experience_years?.toString() || '',
    qualifications: member?.qualifications || '',
    receive_newsletters: member?.receive_newsletters ?? true,
    receive_event_notifications: member?.receive_event_notifications ?? true,
    roles: member?.member_roles?.map(r => r.role) || ['member']
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [savedMemberEmail, setSavedMemberEmail] = useState('')

  const handlePostalCodeChange = async (zipcode: string) => {
    if (!zipcode || zipcode.length < 4) return

    try {
      // Australian postcode (4 digits)
      if (/^\d{4}$/.test(zipcode)) {
        // Fallback for Australian postcodes
        const ausStates = {
          '1': 'NSW', '2': 'NSW', '3': 'VIC', '4': 'QLD', 
          '5': 'SA', '6': 'WA', '7': 'TAS', '0': 'NT'
        }
        const state = ausStates[zipcode[0] as keyof typeof ausStates] || 'NSW'
        setFormData(prev => ({
          ...prev,
          state: state,
          country: 'Australia'
        }))
        return
      }

      // US ZIP code (5 digits)
      if (/^\d{5}$/.test(zipcode)) {
        setFormData(prev => ({ ...prev, country: 'United States' }))
        return
      }

      // UK postcode (letters and numbers)
      if (/^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i.test(zipcode)) {
        setFormData(prev => ({ ...prev, country: 'United Kingdom' }))
        return
      }

      // Brazilian CEP (8 digits or 5+3 with hyphen)
      const cleanCep = zipcode.replace(/\D/g, '')
      if (/^\d{8}$/.test(cleanCep)) {
        setFormData(prev => ({ ...prev, country: 'Brazil' }))
        return
      }

      // Default to Australia
      setFormData(prev => ({ ...prev, country: 'Australia' }))

    } catch (error) {
      console.error('Error fetching address data:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const memberData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone || null,
        date_of_birth: formData.date_of_birth || null,
        address_line1: formData.address_line1 || null,
        address_line2: formData.address_line2 || null,
        city: formData.city || null,
        state: formData.state || null,
        postal_code: formData.postal_code || null,
        country: formData.country || null,
        membership_status: formData.membership_status,
        membership_type: formData.membership_type,
        membership_start_date: formData.membership_start_date || null,
        membership_end_date: formData.membership_end_date || null,
        profession: formData.profession || null,
        experience_years: formData.experience_years ? parseInt(formData.experience_years) : null,
        qualifications: formData.qualifications || null,
        receive_newsletters: formData.receive_newsletters,
        receive_event_notifications: formData.receive_event_notifications
      }

      let savedMember
      if (isEditing && member) {
        savedMember = await MembersService.updateMember(member.id, memberData)
      } else {
        savedMember = await MembersService.createMember(memberData)
      }

      // Gerenciar roles se for uma edição
      if (isEditing && member) {
        // Remover roles que não estão mais na lista
        const currentRoles = member.member_roles.map(r => r.role)
        const rolesToRemove = currentRoles.filter(role => !formData.roles.includes(role))
        const rolesToAdd = formData.roles.filter(role => !currentRoles.includes(role))

        for (const role of rolesToRemove) {
          await MembersService.removeMemberRole(member.id, role)
        }

        for (const role of rolesToAdd) {
          await MembersService.addMemberRole(member.id, role)
        }
      } else {
        // Adicionar roles para novo membro
        for (const role of formData.roles) {
          await MembersService.addMemberRole(savedMember.id, role)
        }
      }

      // Buscar o membro atualizado com roles
      const updatedMember = await MembersService.getMemberById(savedMember.id)
      if (updatedMember) {
        onSave?.(updatedMember)
        
        // Se for um novo membro, perguntar se quer convidar
        if (!isEditing) {
          setSavedMemberEmail(formData.email)
          setShowInviteModal(true)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving member')
      console.error('Erro ao salvar membro:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = (role: MemberRole, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        roles: [...prev.roles, role]
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        roles: prev.roles.filter(r => r !== role)
      }))
    }
  }

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {isEditing ? 'Edit Member' : 'New Member'}
        </h2>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações Básicas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="first_name">First Name *</Label>
            <Input
              id="first_name"
              required
              value={formData.first_name}
              onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="last_name">Last Name *</Label>
            <Input
              id="last_name"
              required
              value={formData.last_name}
              onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <PhoneInput
              value={formData.phone}
              onChange={(value) => setFormData(prev => ({ ...prev, phone: value }))}
              placeholder="Enter phone number"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="date_of_birth">Date of Birth</Label>
            <Input
              id="date_of_birth"
              type="date"
              value={formData.date_of_birth}
              onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="profession">Profession</Label>
            <Input
              id="profession"
              value={formData.profession}
              onChange={(e) => setFormData(prev => ({ ...prev, profession: e.target.value }))}
            />
          </div>
        </div>

        {/* Endereço */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Address</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <Label htmlFor="address_line1">Address Line 1</Label>
              <Input
                id="address_line1"
                value={formData.address_line1}
                onChange={(e) => setFormData(prev => ({ ...prev, address_line1: e.target.value }))}
                placeholder="123 Main Street"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="address_line2">Address Line 2</Label>
              <Input
                id="address_line2"
                value={formData.address_line2}
                onChange={(e) => setFormData(prev => ({ ...prev, address_line2: e.target.value }))}
                placeholder="Apartment 4B"
              />
            </div>

            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                placeholder="Sydney"
              />
            </div>

            <div>
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                placeholder="NSW"
              />
            </div>

            <div>
              <Label htmlFor="postal_code">Postal Code *</Label>
              <Input
                id="postal_code"
                value={formData.postal_code}
                onChange={(e) => {
                  const newPostalCode = e.target.value
                  setFormData(prev => ({ ...prev, postal_code: newPostalCode }))
                  
                  // Auto-complete address when postal code changes
                  if (newPostalCode && newPostalCode.length >= 4) {
                    handlePostalCodeChange(newPostalCode)
                  }
                }}
                placeholder="2000"
              />
            </div>

            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                placeholder="Australia"
              />
            </div>
          </div>
        </div>

        {/* Membership */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Membership</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="membership_status">Status</Label>
              <select
                id="membership_status"
                value={formData.membership_status}
                onChange={(e) => setFormData(prev => ({ ...prev, membership_status: e.target.value as MembershipStatus }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
                <option value="expired">Expired</option>
              </select>
            </div>
            <div>
              <Label htmlFor="membership_type">Type</Label>
              <select
                id="membership_type"
                value={formData.membership_type}
                onChange={(e) => setFormData(prev => ({ ...prev, membership_type: e.target.value as MembershipType }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="standard">Standard</option>
                <option value="premium">Premium</option>
                <option value="student">Student</option>
                <option value="corporate">Corporate</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="membership_start_date">Start Date</Label>
              <Input
                id="membership_start_date"
                type="date"
                value={formData.membership_start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, membership_start_date: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="membership_end_date">End Date</Label>
              <Input
                id="membership_end_date"
                type="date"
                value={formData.membership_end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, membership_end_date: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {/* Roles */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Roles</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {(['member', 'admin', 'super_admin', 'moderator', 'instructor'] as MemberRole[]).map((role) => (
              <label key={role} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.roles.includes(role)}
                  onChange={(e) => handleRoleChange(role, e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 capitalize">{role.replace('_', ' ')}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Configurações */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Settings</h3>
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.receive_newsletters}
                onChange={(e) => setFormData(prev => ({ ...prev, receive_newsletters: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Receive newsletters</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.receive_event_notifications}
                onChange={(e) => setFormData(prev => ({ ...prev, receive_event_notifications: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Receive event notifications</span>
            </label>
          </div>
        </div>

        {/* Profissional */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Professional Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="experience_years">Years of Experience</Label>
              <Input
                id="experience_years"
                type="number"
                min="0"
                value={formData.experience_years}
                onChange={(e) => setFormData(prev => ({ ...prev, experience_years: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="qualifications">Qualifications</Label>
            <textarea
              id="qualifications"
              rows={3}
              value={formData.qualifications}
              onChange={(e) => setFormData(prev => ({ ...prev, qualifications: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe the member's qualifications..."
            />
          </div>
        </div>

        {/* Botões */}
        <div className="flex justify-end space-x-4 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? 'Saving...' : (isEditing ? 'Update' : 'Create')} Member
          </Button>
        </div>
      </form>

      {/* Modal de Convite */}
      {showInviteModal && (
        <InviteUserModal
          memberEmail={savedMemberEmail}
          onClose={() => setShowInviteModal(false)}
          onSuccess={() => setShowInviteModal(false)}
        />
      )}
    </Card>
  )
}
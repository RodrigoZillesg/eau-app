import React, { useState } from 'react'
import { MembersListEnhanced } from '../components/MembersListEnhanced'
import { MemberForm } from '../components/MemberForm'
import { MemberStats } from '../components/MemberStats'
import type { MemberWithRoles } from '../../../lib/supabase/members'

type ViewMode = 'list' | 'form' | 'view'

export const MembersPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedMember, setSelectedMember] = useState<MemberWithRoles | null>(null)

  const handleAddMember = () => {
    setSelectedMember(null)
    setViewMode('form')
  }

  const handleEditMember = (member: MemberWithRoles) => {
    setSelectedMember(member)
    setViewMode('form')
  }

  const handleMemberSelect = (member: MemberWithRoles) => {
    setSelectedMember(member)
    setViewMode('view')
  }

  const handleSaveMember = (member: MemberWithRoles) => {
    setSelectedMember(member)
    setViewMode('list')
  }

  const handleCancel = () => {
    setSelectedMember(null)
    setViewMode('list')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {viewMode === 'list' && (
        <div className="space-y-8">
          <MemberStats />
          <MembersListEnhanced
            onAddMember={handleAddMember}
            onEditMember={handleEditMember}
            onMemberSelect={handleMemberSelect}
          />
        </div>
      )}

      {viewMode === 'form' && (
        <MemberForm
          member={selectedMember}
          onSave={handleSaveMember}
          onCancel={handleCancel}
        />
      )}

      {viewMode === 'view' && selectedMember && (
        <MemberDetails
          member={selectedMember}
          onEdit={() => handleEditMember(selectedMember)}
          onBack={handleCancel}
        />
      )}
    </div>
  )
}

// Component to view member details
interface MemberDetailsProps {
  member: MemberWithRoles
  onEdit: () => void
  onBack: () => void
}

const MemberDetails: React.FC<MemberDetailsProps> = ({ member, onEdit, onBack }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          {member.first_name} {member.last_name}
        </h2>
        <div className="space-x-4">
          <button
            onClick={onBack}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Back
          </button>
          <button
            onClick={onEdit}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
          >
            Edit
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Informações Pessoais */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-500">Email:</span>
              <p className="text-sm text-gray-900">{member.email}</p>
            </div>
            {member.phone && (
              <div>
                <span className="text-sm font-medium text-gray-500">Phone:</span>
                <p className="text-sm text-gray-900">{member.phone}</p>
              </div>
            )}
            {member.date_of_birth && (
              <div>
                <span className="text-sm font-medium text-gray-500">Date of Birth:</span>
                <p className="text-sm text-gray-900">
                  {new Date(member.date_of_birth).toLocaleDateString('en-AU')}
                </p>
              </div>
            )}
            {member.profession && (
              <div>
                <span className="text-sm font-medium text-gray-500">Profession:</span>
                <p className="text-sm text-gray-900">{member.profession}</p>
              </div>
            )}
          </div>
        </div>

        {/* Status e Membership */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Membership Status</h3>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-500">Status:</span>
              <p className="text-sm text-gray-900 capitalize">{member.membership_status}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Type:</span>
              <p className="text-sm text-gray-900 capitalize">{member.membership_type}</p>
            </div>
            {member.membership_start_date && (
              <div>
                <span className="text-sm font-medium text-gray-500">Start Date:</span>
                <p className="text-sm text-gray-900">
                  {new Date(member.membership_start_date).toLocaleDateString('en-AU')}
                </p>
              </div>
            )}
            <div>
              <span className="text-sm font-medium text-gray-500">Roles:</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {member.member_roles.map((role) => (
                  <span
                    key={role.id}
                    className="px-2 py-1 text-xs font-medium rounded bg-purple-100 text-purple-800"
                  >
                    {role.role}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Endereço */}
        {(member.address_line1 || member.city || member.state) && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Address</h3>
            <div className="space-y-2">
              {member.address_line1 && <p className="text-sm text-gray-900">{member.address_line1}</p>}
              {member.address_line2 && <p className="text-sm text-gray-900">{member.address_line2}</p>}
              <p className="text-sm text-gray-900">
                {[member.city, member.state, member.postal_code].filter(Boolean).join(', ')}
              </p>
              {member.country && <p className="text-sm text-gray-900">{member.country}</p>}
            </div>
          </div>
        )}

        {/* Informações Profissionais */}
        {(member.experience_years || member.qualifications) && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Professional Information</h3>
            <div className="space-y-3">
              {member.experience_years && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Years of Experience:</span>
                  <p className="text-sm text-gray-900">{member.experience_years}</p>
                </div>
              )}
              {member.qualifications && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Qualifications:</span>
                  <p className="text-sm text-gray-900">{member.qualifications}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Informações de Auditoria */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">System Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="text-sm font-medium text-gray-500">Created on:</span>
            <p className="text-sm text-gray-900">
              {new Date(member.created_at).toLocaleString('en-AU')}
            </p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">Last updated:</span>
            <p className="text-sm text-gray-900">
              {new Date(member.updated_at).toLocaleString('en-AU')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
import React, { useState, useEffect } from 'react'
import { X, User, Mail, Phone, Building, MapPin, Calendar, Check, AlertCircle } from 'lucide-react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Label } from '../ui/Label'
import { memberDuplicateService, type MergeConfig } from '../../services/memberDuplicateService'
import { supabase } from '../../lib/supabase/client'
import { showNotification } from '../../lib/notifications'
import { format } from 'date-fns'

interface MemberMergeModalProps {
  isOpen: boolean
  onClose: () => void
  duplicate: any
  onMergeComplete: () => void
}

interface MemberDetails {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  mobile?: string
  company_name?: string
  company_id?: string
  street_address?: string
  suburb?: string
  postcode?: string
  state?: string
  country?: string
  membership_status?: string
  membership_type?: string
  created_at?: string
  bio?: string
  subscriptions?: string
  cpd_activities_count?: number
  cpd_points_total?: number
}

export function MemberMergeModal({ isOpen, onClose, duplicate, onMergeComplete }: MemberMergeModalProps) {
  const [member1, setMember1] = useState<MemberDetails | null>(null)
  const [member2, setMember2] = useState<MemberDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [merging, setMerging] = useState(false)
  const [primaryMemberId, setPrimaryMemberId] = useState<string>('')
  const [fieldSelections, setFieldSelections] = useState<Record<string, 'member1' | 'member2'>>({})
  const [mergeRelationships, setMergeRelationships] = useState({
    merge_cpd_activities: true,
    merge_event_registrations: true,
    merge_payments: true,
    sum_cpd_points: true
  })

  useEffect(() => {
    if (isOpen && duplicate) {
      loadMemberDetails()
    }
  }, [isOpen, duplicate])

  const loadMemberDetails = async () => {
    try {
      setLoading(true)
      
      // Load both members with their CPD stats
      const [member1Result, member2Result, cpd1Result, cpd2Result] = await Promise.all([
        supabase.from('members').select('*').eq('id', duplicate.member1_id).single(),
        supabase.from('members').select('*').eq('id', duplicate.member2_id).single(),
        supabase.from('cpd_activities')
          .select('*', { count: 'exact' })
          .eq('member_id', duplicate.member1_id)
          .eq('status', 'approved'),
        supabase.from('cpd_activities')
          .select('*', { count: 'exact' })
          .eq('member_id', duplicate.member2_id)
          .eq('status', 'approved')
      ])

      if (member1Result.error || member2Result.error) {
        throw new Error('Failed to load member details')
      }

      const m1 = {
        ...member1Result.data,
        cpd_activities_count: cpd1Result.count || 0,
        cpd_points_total: cpd1Result.data?.reduce((sum: number, a: any) => sum + (a.points || 0), 0) || 0
      }
      
      const m2 = {
        ...member2Result.data,
        cpd_activities_count: cpd2Result.count || 0,
        cpd_points_total: cpd2Result.data?.reduce((sum: number, a: any) => sum + (a.points || 0), 0) || 0
      }

      setMember1(m1)
      setMember2(m2)

      // Default to member with more complete data as primary
      const m1Score = calculateCompletenessScore(m1)
      const m2Score = calculateCompletenessScore(m2)
      setPrimaryMemberId(m1Score >= m2Score ? m1.id : m2.id)

      // Initialize field selections (default to primary member)
      initializeFieldSelections(m1, m2, m1Score >= m2Score ? 'member1' : 'member2')
    } catch (error) {
      console.error('Error loading member details:', error)
      showNotification('error', 'Failed to load member details')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const calculateCompletenessScore = (member: MemberDetails): number => {
    let score = 0
    const fields = ['first_name', 'last_name', 'email', 'phone', 'mobile', 'company_name', 
                   'street_address', 'suburb', 'postcode', 'state', 'bio']
    
    fields.forEach(field => {
      if (member[field as keyof MemberDetails]) score++
    })
    
    // Add bonus for CPD activities
    score += Math.min(member.cpd_activities_count || 0, 5)
    
    return score
  }

  const initializeFieldSelections = (m1: MemberDetails, m2: MemberDetails, primary: 'member1' | 'member2') => {
    const fields = ['first_name', 'last_name', 'email', 'phone', 'mobile', 'company_name',
                   'street_address', 'suburb', 'postcode', 'state', 'country', 'bio', 
                   'membership_status', 'membership_type', 'subscriptions']
    
    const selections: Record<string, 'member1' | 'member2'> = {}
    
    fields.forEach(field => {
      const m1Value = m1[field as keyof MemberDetails]
      const m2Value = m2[field as keyof MemberDetails]
      
      if (m1Value && !m2Value) {
        selections[field] = 'member1'
      } else if (!m1Value && m2Value) {
        selections[field] = 'member2'
      } else {
        selections[field] = primary
      }
    })
    
    setFieldSelections(selections)
  }

  const handleFieldToggle = (field: string) => {
    setFieldSelections(prev => ({
      ...prev,
      [field]: prev[field] === 'member1' ? 'member2' : 'member1'
    }))
  }

  const handleMerge = async () => {
    if (!member1 || !member2) return

    try {
      setMerging(true)

      // Build merge config
      const config: MergeConfig = {
        primary_member_id: primaryMemberId,
        fields_to_keep: Object.keys(fieldSelections).reduce((acc, field) => {
          const keepFromPrimary = 
            (primaryMemberId === member1.id && fieldSelections[field] === 'member1') ||
            (primaryMemberId === member2.id && fieldSelections[field] === 'member2')
          
          return {
            ...acc,
            [field]: keepFromPrimary
          }
        }, {} as any),
        relationships: mergeRelationships
      }

      await memberDuplicateService.mergeMembers(duplicate.id, config)
      
      showNotification('success', 'Members merged successfully')
      onMergeComplete()
    } catch (error) {
      console.error('Error merging members:', error)
      showNotification('error', 'Failed to merge members')
    } finally {
      setMerging(false)
    }
  }

  const renderFieldComparison = (
    field: string, 
    label: string, 
    icon: React.ReactNode,
    formatter?: (value: any) => string
  ) => {
    const value1 = member1?.[field as keyof MemberDetails]
    const value2 = member2?.[field as keyof MemberDetails]
    
    if (!value1 && !value2) return null
    
    const selected = fieldSelections[field]
    const showToggle = value1 && value2 && value1 !== value2
    
    return (
      <div className="border-b border-gray-200 pb-3 mb-3 last:border-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {icon}
            <span className="text-sm font-medium text-gray-700">{label}</span>
          </div>
          {showToggle && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleFieldToggle(field)}
              className="text-xs"
            >
              Switch
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div 
            className={`p-2 rounded-md transition-all ${
              (!showToggle && value1) || (showToggle && selected === 'member1')
                ? 'bg-blue-50 border border-blue-300' 
                : 'bg-gray-50 opacity-50'
            }`}
          >
            <p className="text-sm">
              {value1 ? (formatter ? formatter(value1) : String(value1)) : '-'}
            </p>
            {showToggle && selected === 'member1' && (
              <Check className="w-3 h-3 text-blue-600 mt-1" />
            )}
          </div>
          
          <div 
            className={`p-2 rounded-md transition-all ${
              (!showToggle && value2 && !value1) || (showToggle && selected === 'member2')
                ? 'bg-blue-50 border border-blue-300' 
                : 'bg-gray-50 opacity-50'
            }`}
          >
            <p className="text-sm">
              {value2 ? (formatter ? formatter(value2) : String(value2)) : '-'}
            </p>
            {showToggle && selected === 'member2' && (
              <Check className="w-3 h-3 text-blue-600 mt-1" />
            )}
          </div>
        </div>
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Merge Duplicate Members</h2>
              <p className="text-sm text-gray-600 mt-1">
                Review and select which information to keep from each member
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Score Badge */}
          <div className="mt-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              duplicate.similarity_score >= 90 ? 'bg-red-100 text-red-800' :
              duplicate.similarity_score >= 70 ? 'bg-orange-100 text-orange-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              Similarity Score: {duplicate.similarity_score}%
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : member1 && member2 ? (
            <div className="space-y-6">
              {/* Primary Member Selection */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div className="flex-1">
                    <Label className="text-yellow-800">Select Primary Member</Label>
                    <p className="text-sm text-yellow-700 mb-3">
                      The primary member will be kept, and the other will be deleted after merging data.
                    </p>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="primary"
                          value={member1.id}
                          checked={primaryMemberId === member1.id}
                          onChange={(e) => setPrimaryMemberId(e.target.value)}
                          className="text-blue-600"
                        />
                        <span className="text-sm font-medium">
                          {member1.first_name} {member1.last_name} (Member 1)
                        </span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="primary"
                          value={member2.id}
                          checked={primaryMemberId === member2.id}
                          onChange={(e) => setPrimaryMemberId(e.target.value)}
                          className="text-blue-600"
                        />
                        <span className="text-sm font-medium">
                          {member2.first_name} {member2.last_name} (Member 2)
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Member Headers */}
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-lg ${
                  primaryMemberId === member1.id ? 'bg-blue-50 border-2 border-blue-300' : 'bg-gray-50'
                }`}>
                  <h3 className="font-semibold mb-2">Member 1 {primaryMemberId === member1.id && '(Primary)'}</h3>
                  <p className="text-sm text-gray-600">{member1.email}</p>
                  <div className="flex gap-4 mt-2 text-xs text-gray-500">
                    <span>CPD: {member1.cpd_activities_count} activities</span>
                    <span>{member1.cpd_points_total} points</span>
                  </div>
                </div>
                
                <div className={`p-4 rounded-lg ${
                  primaryMemberId === member2.id ? 'bg-blue-50 border-2 border-blue-300' : 'bg-gray-50'
                }`}>
                  <h3 className="font-semibold mb-2">Member 2 {primaryMemberId === member2.id && '(Primary)'}</h3>
                  <p className="text-sm text-gray-600">{member2.email}</p>
                  <div className="flex gap-4 mt-2 text-xs text-gray-500">
                    <span>CPD: {member2.cpd_activities_count} activities</span>
                    <span>{member2.cpd_points_total} points</span>
                  </div>
                </div>
              </div>

              {/* Field Comparisons */}
              <div className="space-y-1">
                <h4 className="font-medium text-gray-900 mb-3">Select Fields to Keep</h4>
                
                {renderFieldComparison('first_name', 'First Name', <User className="w-4 h-4" />)}
                {renderFieldComparison('last_name', 'Last Name', <User className="w-4 h-4" />)}
                {renderFieldComparison('email', 'Email', <Mail className="w-4 h-4" />)}
                {renderFieldComparison('phone', 'Phone', <Phone className="w-4 h-4" />)}
                {renderFieldComparison('mobile', 'Mobile', <Phone className="w-4 h-4" />)}
                {renderFieldComparison('company_name', 'Company', <Building className="w-4 h-4" />)}
                {renderFieldComparison('street_address', 'Street Address', <MapPin className="w-4 h-4" />)}
                {renderFieldComparison('suburb', 'Suburb', <MapPin className="w-4 h-4" />)}
                {renderFieldComparison('postcode', 'Postcode', <MapPin className="w-4 h-4" />)}
                {renderFieldComparison('state', 'State', <MapPin className="w-4 h-4" />)}
                {renderFieldComparison('membership_status', 'Membership Status', <Calendar className="w-4 h-4" />)}
                {renderFieldComparison('membership_type', 'Membership Type', <Calendar className="w-4 h-4" />)}
              </div>

              {/* Relationship Options */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Data Transfer Options</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={mergeRelationships.merge_cpd_activities}
                      onChange={(e) => setMergeRelationships(prev => ({
                        ...prev,
                        merge_cpd_activities: e.target.checked
                      }))}
                      className="rounded text-blue-600"
                    />
                    <span className="text-sm">Transfer all CPD activities to primary member</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={mergeRelationships.merge_event_registrations}
                      onChange={(e) => setMergeRelationships(prev => ({
                        ...prev,
                        merge_event_registrations: e.target.checked
                      }))}
                      className="rounded text-blue-600"
                    />
                    <span className="text-sm">Transfer all event registrations to primary member</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={mergeRelationships.sum_cpd_points}
                      onChange={(e) => setMergeRelationships(prev => ({
                        ...prev,
                        sum_cpd_points: e.target.checked
                      }))}
                      className="rounded text-blue-600"
                    />
                    <span className="text-sm">Combine CPD points from both members</span>
                  </label>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            <AlertCircle className="w-4 h-4 inline mr-1" />
            This action cannot be automatically undone after 30 days
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={merging}
            >
              Cancel
            </Button>
            <Button
              onClick={handleMerge}
              disabled={loading || merging || !primaryMemberId}
            >
              {merging ? 'Merging...' : 'Merge Members'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
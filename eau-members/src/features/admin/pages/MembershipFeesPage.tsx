import React, { useState, useEffect } from 'react'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Label } from '../../../components/ui/Label'
import { supabase } from '../../../lib/supabase/client'
import { showNotification } from '../../../lib/notifications'
import { 
  DollarSign, Calculator, Info, Save, 
  Building2, Users, GraduationCap, Briefcase
} from 'lucide-react'

interface MembershipFee {
  id: string
  membership_type: string
  base_fee: number | null
  per_site_fee: number | null
  per_student_week_fee: number | null
  fixed_annual_fee: number | null
  gst_rate: number
  description: string
  payment_terms: string
}

interface FeeCalculation {
  subtotal: number
  gst_amount: number
  total_with_gst: number
  fee_breakdown: any
}

export function MembershipFeesPage() {
  const [fees, setFees] = useState<MembershipFee[]>([])
  const [loading, setLoading] = useState(true)
  const [editingFee, setEditingFee] = useState<MembershipFee | null>(null)
  
  // Calculator state
  const [calcType, setCalcType] = useState('Full Provider')
  const [numSites, setNumSites] = useState(1)
  const [studentWeeks, setStudentWeeks] = useState(0)
  const [isExistingMember, setIsExistingMember] = useState(false)
  const [calculation, setCalculation] = useState<FeeCalculation | null>(null)

  useEffect(() => {
    loadFees()
  }, [])

  const loadFees = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('membership_fees')
        .select('*')
        .order('membership_type')

      if (error) throw error
      setFees(data || [])
    } catch (error) {
      console.error('Error loading fees:', error)
      showNotification('error', 'Failed to load membership fees')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateFee = async (fee: MembershipFee) => {
    try {
      const { error } = await supabase
        .from('membership_fees')
        .update({
          base_fee: fee.base_fee,
          per_site_fee: fee.per_site_fee,
          per_student_week_fee: fee.per_student_week_fee,
          fixed_annual_fee: fee.fixed_annual_fee,
          gst_rate: fee.gst_rate,
          description: fee.description,
          payment_terms: fee.payment_terms,
          updated_at: new Date().toISOString()
        })
        .eq('id', fee.id)

      if (error) throw error

      showNotification('success', 'Fee structure updated successfully')
      loadFees()
      setEditingFee(null)
    } catch (error) {
      console.error('Error updating fee:', error)
      showNotification('error', 'Failed to update fee structure')
    }
  }

  const calculateFee = async () => {
    try {
      const { data, error } = await supabase
        .rpc('calculate_membership_fee', {
          p_membership_type: calcType,
          p_num_sites: numSites,
          p_student_weeks: studentWeeks,
          p_is_existing_member: isExistingMember
        })

      if (error) throw error
      if (data && data.length > 0) {
        setCalculation(data[0])
      }
    } catch (error) {
      console.error('Error calculating fee:', error)
      showNotification('error', 'Failed to calculate fee')
    }
  }

  const getMembershipIcon = (type: string) => {
    switch (type) {
      case 'Full Provider': return <Building2 className="w-5 h-5 text-blue-600" />
      case 'Associate Provider': return <Users className="w-5 h-5 text-green-600" />
      case 'Corporate Affiliate': return <Briefcase className="w-5 h-5 text-purple-600" />
      case 'Professional Affiliate': return <GraduationCap className="w-5 h-5 text-orange-600" />
      default: return <DollarSign className="w-5 h-5 text-gray-600" />
    }
  }

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '-'
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
    }).format(amount)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Membership Fees Configuration</h1>
        <p className="text-gray-600">
          Configure membership fee structures based on English Australia guidelines
        </p>
      </div>

      {/* Info Card */}
      <Card className="p-6 mb-8 bg-blue-50 border-blue-200">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Fee Structure Information</p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Full Provider:</strong> Base fee + Additional site fees + Student week fees</li>
              <li><strong>Associate Provider:</strong> $2,500/year for new providers (max 12 months)</li>
              <li><strong>Corporate Affiliate:</strong> $2,500/year ($1,225 for existing members)</li>
              <li><strong>Professional Affiliate:</strong> $2,000/year for non-ELICOS institutions</li>
              <li>All fees are subject to GST (currently 10%)</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Fee Calculator */}
      <Card className="p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Fee Calculator
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <Label htmlFor="calc-type">Membership Type</Label>
            <select
              id="calc-type"
              value={calcType}
              onChange={(e) => setCalcType(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="Full Provider">Full Provider</option>
              <option value="Associate Provider">Associate Provider</option>
              <option value="Corporate Affiliate">Corporate Affiliate</option>
              <option value="Professional Affiliate">Professional Affiliate</option>
            </select>
          </div>

          {calcType === 'Full Provider' && (
            <>
              <div>
                <Label htmlFor="num-sites">Number of Sites</Label>
                <input
                  id="num-sites"
                  type="number"
                  min="1"
                  value={numSites}
                  onChange={(e) => setNumSites(parseInt(e.target.value) || 1)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <Label htmlFor="student-weeks">Student Weeks</Label>
                <input
                  id="student-weeks"
                  type="number"
                  min="0"
                  value={studentWeeks}
                  onChange={(e) => setStudentWeeks(parseInt(e.target.value) || 0)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </>
          )}

          {calcType === 'Corporate Affiliate' && (
            <div className="flex items-center">
              <input
                id="existing-member"
                type="checkbox"
                checked={isExistingMember}
                onChange={(e) => setIsExistingMember(e.target.checked)}
                className="mr-2"
              />
              <Label htmlFor="existing-member" className="cursor-pointer">
                Existing EA Member College
              </Label>
            </div>
          )}

          <div className="flex items-end">
            <Button onClick={calculateFee} className="w-full">
              Calculate Fee
            </Button>
          </div>
        </div>

        {calculation && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Calculation Result</h3>
            <div className="space-y-2">
              {calculation.fee_breakdown.base_fee && (
                <div className="flex justify-between text-sm">
                  <span>Base Fee:</span>
                  <span>{formatCurrency(calculation.fee_breakdown.base_fee)}</span>
                </div>
              )}
              {calculation.fee_breakdown.site_fees > 0 && (
                <div className="flex justify-between text-sm">
                  <span>{calculation.fee_breakdown.additional_sites} Additional Site(s):</span>
                  <span>{formatCurrency(calculation.fee_breakdown.site_fees)}</span>
                </div>
              )}
              {calculation.fee_breakdown.student_week_fees > 0 && (
                <div className="flex justify-between text-sm">
                  <span>{calculation.fee_breakdown.student_weeks} Student Weeks:</span>
                  <span>{formatCurrency(calculation.fee_breakdown.student_week_fees)}</span>
                </div>
              )}
              {calculation.fee_breakdown.fixed_fee && (
                <div className="flex justify-between text-sm">
                  <span>Annual Fee:</span>
                  <span>{formatCurrency(calculation.fee_breakdown.fixed_fee)}</span>
                </div>
              )}
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(calculation.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>GST (10%):</span>
                  <span>{formatCurrency(calculation.gst_amount)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Total (inc. GST):</span>
                  <span className="text-blue-600">{formatCurrency(calculation.total_with_gst)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Fee Configuration */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Fee Structure Configuration</h2>
        
        {loading ? (
          <div className="text-center py-8">Loading fee structures...</div>
        ) : (
          <div className="space-y-4">
            {fees.map((fee) => (
              <div key={fee.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getMembershipIcon(fee.membership_type)}
                    <h3 className="font-semibold">{fee.membership_type}</h3>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingFee(fee)}
                  >
                    Edit
                  </Button>
                </div>
                
                <p className="text-sm text-gray-600 mb-3">{fee.description}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {fee.base_fee !== null && (
                    <div>
                      <span className="text-gray-500">Base Fee:</span>
                      <p className="font-semibold">{formatCurrency(fee.base_fee)}</p>
                    </div>
                  )}
                  {fee.per_site_fee !== null && (
                    <div>
                      <span className="text-gray-500">Per Site:</span>
                      <p className="font-semibold">{formatCurrency(fee.per_site_fee)}</p>
                    </div>
                  )}
                  {fee.per_student_week_fee !== null && (
                    <div>
                      <span className="text-gray-500">Per Student Week:</span>
                      <p className="font-semibold">{formatCurrency(fee.per_student_week_fee)}</p>
                    </div>
                  )}
                  {fee.fixed_annual_fee !== null && (
                    <div>
                      <span className="text-gray-500">Annual Fee:</span>
                      <p className="font-semibold">{formatCurrency(fee.fixed_annual_fee)}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500">GST Rate:</span>
                    <p className="font-semibold">{fee.gst_rate}%</p>
                  </div>
                </div>
                
                <p className="text-xs text-gray-500 mt-3">{fee.payment_terms}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Edit Modal */}
      {editingFee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              Edit {editingFee.membership_type} Fee Structure
            </h3>
            
            <div className="space-y-4">
              {editingFee.membership_type === 'Full Provider' ? (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="edit-base">Base Fee ($)</Label>
                      <input
                        id="edit-base"
                        type="number"
                        step="0.01"
                        value={editingFee.base_fee || ''}
                        onChange={(e) => setEditingFee({
                          ...editingFee,
                          base_fee: parseFloat(e.target.value) || null
                        })}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-site">Per Site Fee ($)</Label>
                      <input
                        id="edit-site"
                        type="number"
                        step="0.01"
                        value={editingFee.per_site_fee || ''}
                        onChange={(e) => setEditingFee({
                          ...editingFee,
                          per_site_fee: parseFloat(e.target.value) || null
                        })}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-student">Per Student Week ($)</Label>
                      <input
                        id="edit-student"
                        type="number"
                        step="0.0001"
                        value={editingFee.per_student_week_fee || ''}
                        onChange={(e) => setEditingFee({
                          ...editingFee,
                          per_student_week_fee: parseFloat(e.target.value) || null
                        })}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <Label htmlFor="edit-fixed">Fixed Annual Fee ($)</Label>
                  <input
                    id="edit-fixed"
                    type="number"
                    step="0.01"
                    value={editingFee.fixed_annual_fee || ''}
                    onChange={(e) => setEditingFee({
                      ...editingFee,
                      fixed_annual_fee: parseFloat(e.target.value) || null
                    })}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              )}
              
              <div>
                <Label htmlFor="edit-gst">GST Rate (%)</Label>
                <input
                  id="edit-gst"
                  type="number"
                  step="0.01"
                  value={editingFee.gst_rate}
                  onChange={(e) => setEditingFee({
                    ...editingFee,
                    gst_rate: parseFloat(e.target.value) || 10
                  })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-desc">Description</Label>
                <textarea
                  id="edit-desc"
                  value={editingFee.description}
                  onChange={(e) => setEditingFee({
                    ...editingFee,
                    description: e.target.value
                  })}
                  rows={3}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-terms">Payment Terms</Label>
                <textarea
                  id="edit-terms"
                  value={editingFee.payment_terms}
                  onChange={(e) => setEditingFee({
                    ...editingFee,
                    payment_terms: e.target.value
                  })}
                  rows={2}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setEditingFee(null)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleUpdateFee(editingFee)}
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
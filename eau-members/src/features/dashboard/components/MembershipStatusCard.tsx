import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { supabase } from '../../../lib/supabase/client'
import { useAuthStore } from '../../../stores/authStore'
import { AlertCircle, CheckCircle, Clock, DollarSign } from 'lucide-react'

interface MembershipData {
  institution_name: string
  membership_type: string
  membership_status: string
  membership_start_date: string | null
  membership_expiry_date: string | null
  membership_fee_paid: number | null
  base_fee: number | null
  gst_amount: number | null
  total_fee: number | null
}

export const MembershipStatusCard: React.FC = () => {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [membership, setMembership] = useState<MembershipData | null>(null)
  const [loading, setLoading] = useState(true)
  const [daysUntilExpiry, setDaysUntilExpiry] = useState<number | null>(null)
  const [isExpiringSoon, setIsExpiringSoon] = useState(false)
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    const fetchMembershipData = async () => {
      if (!user?.id) return

      try {
        // First get member data
        const { data: memberData, error: memberError } = await supabase
          .from('members')
          .select('institution_id')
          .eq('user_id', user.id)
          .single()

        if (memberError || !memberData?.institution_id) {
          setLoading(false)
          return
        }

        // Then get institution membership data
        const { data: institutionData, error: institutionError } = await supabase
          .from('institutions')
          .select(`
            name,
            membership_type,
            membership_status,
            membership_start_date,
            membership_expiry_date,
            membership_fee_paid
          `)
          .eq('id', memberData.institution_id)
          .single()

        if (institutionError || !institutionData) {
          console.error('Error fetching institution data:', institutionError)
          setLoading(false)
          return
        }

        // Get membership fee details from membership_fees table
        let feeData = null
        if (institutionData.membership_type) {
          const { data: fees } = await supabase
            .from('membership_fees')
            .select('base_fee, gst_amount, total_fee')
            .eq('membership_type', institutionData.membership_type)
            .single()
          
          feeData = fees
        }

        const fullData: MembershipData = {
          institution_name: institutionData.name,
          membership_type: institutionData.membership_type || 'Not Set',
          membership_status: institutionData.membership_status || 'pending',
          membership_start_date: institutionData.membership_start_date,
          membership_expiry_date: institutionData.membership_expiry_date,
          membership_fee_paid: institutionData.membership_fee_paid,
          base_fee: feeData?.base_fee || null,
          gst_amount: feeData?.gst_amount || null,
          total_fee: feeData?.total_fee || null
        }

        setMembership(fullData)

        // Calculate days until expiry
        if (institutionData.membership_expiry_date) {
          const expiryDate = new Date(institutionData.membership_expiry_date)
          const today = new Date()
          const diffTime = expiryDate.getTime() - today.getTime()
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          
          setDaysUntilExpiry(diffDays)
          setIsExpiringSoon(diffDays <= 30 && diffDays > 0)
          setIsExpired(diffDays <= 0)
        }
      } catch (error) {
        console.error('Error fetching membership data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMembershipData()
  }, [user])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Membership Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!membership) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Membership Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-gray-500">
            <p>No membership information available</p>
            <p className="text-sm mt-2">Please contact your institution administrator</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getStatusBadge = () => {
    if (isExpired) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <AlertCircle className="h-3 w-3" />
          Expired
        </span>
      )
    }
    if (isExpiringSoon) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="h-3 w-3" />
          Expiring Soon
        </span>
      )
    }
    if (membership.membership_status === 'active') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3" />
          Active
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        {membership.membership_status}
      </span>
    )
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set'
    return new Date(dateString).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return 'Not available'
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
    }).format(amount)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Membership Status
          </span>
          {getStatusBadge()}
        </CardTitle>
        <CardDescription>
          {membership.institution_name}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Expiry Alert */}
          {isExpiringSoon && !isExpired && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800">
                    Membership expiring in {daysUntilExpiry} days
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Please contact your administrator to renew
                  </p>
                </div>
              </div>
            </div>
          )}

          {isExpired && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">
                    Membership has expired
                  </p>
                  <p className="text-xs text-red-700 mt-1">
                    Contact your administrator immediately to renew
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Membership Details */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Type:</span>
              <span className="text-sm font-medium">{membership.membership_type}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Start Date:</span>
              <span className="text-sm font-medium">
                {formatDate(membership.membership_start_date)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Expiry Date:</span>
              <span className="text-sm font-medium">
                {formatDate(membership.membership_expiry_date)}
              </span>
            </div>

            {membership.total_fee && (
              <div className="pt-3 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Annual Fee:</span>
                  <span className="text-sm font-medium">
                    {formatCurrency(membership.base_fee)}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm text-gray-600">GST:</span>
                  <span className="text-sm font-medium">
                    {formatCurrency(membership.gst_amount)}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2 pt-2 border-t">
                  <span className="text-sm font-medium text-gray-900">Total Due:</span>
                  <span className="text-lg font-bold text-primary-600">
                    {formatCurrency(membership.total_fee)}
                  </span>
                </div>
              </div>
            )}

            {membership.membership_fee_paid && (
              <div className="flex justify-between items-center pt-3 border-t">
                <span className="text-sm text-gray-600">Last Payment:</span>
                <span className="text-sm font-medium text-green-600">
                  {formatCurrency(membership.membership_fee_paid)}
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 space-y-2">
            {(isExpired || isExpiringSoon) && (
              <Button className="w-full" variant="default">
                Request Renewal
              </Button>
            )}
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => navigate('/membership/payment-history')}
            >
              View Payment History
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
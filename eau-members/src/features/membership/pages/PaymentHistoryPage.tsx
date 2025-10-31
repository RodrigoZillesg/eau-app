import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { supabase } from '../../../lib/supabase/client'
import { useAuthStore } from '../../../stores/authStore'
import { ArrowLeft, Download, FileText, DollarSign, Calendar, CheckCircle, XCircle } from 'lucide-react'

interface PaymentRecord {
  id: string
  payment_date: string
  amount: number
  payment_method: string
  status: 'completed' | 'pending' | 'failed'
  invoice_number: string
  membership_year: number
  description: string
}

export const PaymentHistoryPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [institutionName, setInstitutionName] = useState('')
  const [totalPaid, setTotalPaid] = useState(0)

  useEffect(() => {
    const fetchPaymentHistory = async () => {
      if (!user?.id) return

      try {
        // Get member's institution
        const { data: memberData } = await supabase
          .from('members')
          .select('institution_id')
          .eq('user_id', user.id)
          .single()

        if (!memberData?.institution_id) {
          setLoading(false)
          return
        }

        // Get institution details
        const { data: institutionData } = await supabase
          .from('institutions')
          .select('name')
          .eq('id', memberData.institution_id)
          .single()

        if (institutionData) {
          setInstitutionName(institutionData.name)
        }

        // Mock payment history data (in real app, this would come from a payments table)
        const mockPayments: PaymentRecord[] = [
          {
            id: '1',
            payment_date: '2024-01-15',
            amount: 5500,
            payment_method: 'Credit Card',
            status: 'completed',
            invoice_number: 'INV-2024-001',
            membership_year: 2024,
            description: 'Annual Membership Fee - Full Provider'
          },
          {
            id: '2',
            payment_date: '2023-01-20',
            amount: 5000,
            payment_method: 'Bank Transfer',
            status: 'completed',
            invoice_number: 'INV-2023-001',
            membership_year: 2023,
            description: 'Annual Membership Fee - Full Provider'
          },
          {
            id: '3',
            payment_date: '2022-01-10',
            amount: 4500,
            payment_method: 'Credit Card',
            status: 'completed',
            invoice_number: 'INV-2022-001',
            membership_year: 2022,
            description: 'Annual Membership Fee - Full Provider'
          }
        ]

        setPayments(mockPayments)
        setTotalPaid(mockPayments.reduce((sum, p) => p.status === 'completed' ? sum + p.amount : sum, 0))
      } catch (error) {
        console.error('Error fetching payment history:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPaymentHistory()
  }, [user])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3" />
            Completed
          </span>
        )
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Pending
          </span>
        )
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="h-3 w-3" />
            Failed
          </span>
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/dashboard')}
                className="p-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Payment History</h1>
                <p className="text-gray-600">{institutionName}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Summary Cards */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Total Paid
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary-600">
                {formatCurrency(totalPaid)}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                All time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Payment Count
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {payments.filter(p => p.status === 'completed').length}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Successful payments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Last Payment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {payments.length > 0 ? formatDate(payments[0].payment_date) : 'N/A'}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {payments.length > 0 ? formatCurrency(payments[0].amount) : 'No payments'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Payment History Table */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Payment Records</CardTitle>
            <CardDescription>
              Complete history of membership payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No payment history available</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium text-gray-700">Date</th>
                      <th className="text-left p-2 font-medium text-gray-700">Description</th>
                      <th className="text-left p-2 font-medium text-gray-700">Invoice</th>
                      <th className="text-left p-2 font-medium text-gray-700">Method</th>
                      <th className="text-right p-2 font-medium text-gray-700">Amount</th>
                      <th className="text-center p-2 font-medium text-gray-700">Status</th>
                      <th className="text-center p-2 font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          <div>
                            <p className="font-medium">{formatDate(payment.payment_date)}</p>
                            <p className="text-xs text-gray-500">Year {payment.membership_year}</p>
                          </div>
                        </td>
                        <td className="p-2">
                          <p className="text-sm">{payment.description}</p>
                        </td>
                        <td className="p-2">
                          <p className="text-sm font-mono">{payment.invoice_number}</p>
                        </td>
                        <td className="p-2">
                          <p className="text-sm">{payment.payment_method}</p>
                        </td>
                        <td className="p-2 text-right">
                          <p className="font-medium">{formatCurrency(payment.amount)}</p>
                        </td>
                        <td className="p-2 text-center">
                          {getStatusBadge(payment.status)}
                        </td>
                        <td className="p-2 text-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="p-1"
                            title="Download Invoice"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Payment Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600">
              <p>• Membership fees are billed annually and include GST</p>
              <p>• Invoices are automatically generated upon payment completion</p>
              <p>• For payment inquiries, please contact your institution administrator</p>
              <p>• To update payment methods, please visit your institution settings</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
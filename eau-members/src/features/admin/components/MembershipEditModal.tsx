import { useState, useEffect } from 'react';
import { X, DollarSign } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Label } from '../../../components/ui/Label';
import { PaymentsList, type Payment } from '../../../components/payments';
import { PaymentHistory } from './PaymentHistory';
import { supabase } from '../../../lib/supabase/client';
import { showNotification } from '../../../lib/notifications';
import { format } from 'date-fns';

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

interface MembershipEditModalProps {
  institution: InstitutionMembership;
  onClose: () => void;
  onSave: () => void;
}

export function MembershipEditModal({ institution, onClose, onSave }: MembershipEditModalProps) {
  const [loading, setLoading] = useState(false);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [formData, setFormData] = useState({
    membership_type: institution.membership_type,
    membership_status: institution.membership_status,
    membership_renewal_date: institution.membership_renewal_date?.split('T')[0] || '',
    payment_status: institution.payment_status || 'pending',
    notes: ''
  });
  const [payments, setPayments] = useState<Payment[]>([]);

  // Load existing payments from database
  useEffect(() => {
    loadPayments();
  }, [institution.id]);

  const loadPayments = async () => {
    setLoadingPayments(true);
    try {
      const { data, error } = await supabase
        .from('membership_payments')
        .select('*')
        .eq('institution_id', institution.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        // Convert database format to UI format
        setPayments(data.map(p => ({
          id: p.id,
          amount: p.amount_cents / 100, // Convert cents to dollars
          currency: p.currency,
          payment_method: p.payment_method || '',
          payment_date: p.payment_date ? format(new Date(p.payment_date), 'yyyy-MM-dd') : '',
          payment_reference: p.payment_reference || '',
          receipt_url: p.receipt_url || '',
          notes: p.notes || ''
        })));
      }
    } catch (error: any) {
      console.error('Error loading payments:', error);
      showNotification('error', 'Failed to load payments');
    } finally {
      setLoadingPayments(false);
    }
  };

  const calculatePaymentStatus = (payments: Payment[]): string => {
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

    if (totalPaid === 0) return 'pending';

    // If institution has a membership_fee_total, compare with it
    if (institution.membership_fee_total) {
      const expectedAmount = institution.membership_fee_total;
      if (totalPaid >= expectedAmount) return 'paid';
      if (totalPaid > 0 && totalPaid < expectedAmount) return 'partially_paid';
    }

    // Otherwise, if there are payments, assume paid
    return totalPaid > 0 ? 'paid' : 'pending';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Delete existing payments
      if (payments.some(p => p.id)) {
        const { error: deleteError } = await supabase
          .from('membership_payments')
          .delete()
          .eq('institution_id', institution.id);

        if (deleteError) throw deleteError;
      }

      // 2. Insert new payments
      if (payments.length > 0) {
        const { data: { user } } = await supabase.auth.getUser();
        const paymentsToInsert = payments.map(p => ({
          institution_id: institution.id,
          amount_cents: Math.round(p.amount * 100),
          currency: p.currency,
          payment_method: p.payment_method || null,
          payment_date: p.payment_date || null,
          payment_reference: p.payment_reference || null,
          receipt_url: p.receipt_url || null,
          notes: p.notes || null,
          created_by: user?.id
        }));

        const { error: insertError } = await supabase
          .from('membership_payments')
          .insert(paymentsToInsert);

        if (insertError) throw insertError;
      }

      // 3. Update institution
      const { error: updateError } = await supabase
        .from('institutions')
        .update({
          membership_type: formData.membership_type,
          membership_status: formData.membership_status,
          membership_renewal_date: formData.membership_renewal_date || null,
          payment_status: calculatePaymentStatus(payments),
          updated_at: new Date().toISOString()
        })
        .eq('id', institution.id);

      if (updateError) throw updateError;

      showNotification('success', 'Membership updated successfully');
      onSave();
      onClose();
    } catch (error: any) {
      console.error('Update error:', error);
      showNotification('error', error.message || 'Failed to update membership');
    } finally {
      setLoading(false);
    }
  };

  const getTotalPaid = () => {
    return payments.reduce((sum, p) => sum + p.amount, 0);
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-600';
      case 'partially_paid': return 'text-yellow-600';
      case 'pending': return 'text-gray-600';
      case 'exempt': return 'text-blue-600';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold">Edit Membership</h2>
            <p className="text-sm text-gray-600 mt-1">{institution.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Membership Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Membership Details</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="membership-type">Membership Type</Label>
                  <select
                    id="membership-type"
                    value={formData.membership_type}
                    onChange={(e) => setFormData({ ...formData, membership_type: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="Full Provider">Full Provider</option>
                    <option value="Associate Provider">Associate Provider (Access)</option>
                    <option value="Corporate Affiliate">Corporate Affiliate</option>
                    <option value="Professional Affiliate">Professional Affiliate</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="membership-status">Membership Status</Label>
                  <select
                    id="membership-status"
                    value={formData.membership_status}
                    onChange={(e) => setFormData({ ...formData, membership_status: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="expired">Expired</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="renewal-date">Renewal Date</Label>
                  <input
                    id="renewal-date"
                    type="date"
                    value={formData.membership_renewal_date}
                    onChange={(e) => setFormData({ ...formData, membership_renewal_date: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <Label htmlFor="payment-status">Payment Status</Label>
                  <select
                    id="payment-status"
                    value={formData.payment_status}
                    onChange={(e) => setFormData({ ...formData, payment_status: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="partially_paid">Partially Paid</option>
                    <option value="exempt">Exempt</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Payment Summary */}
            {institution.membership_fee_total && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  <h4 className="font-semibold text-blue-900">Payment Summary</h4>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-blue-700">Total Fee</p>
                    <p className="font-semibold text-blue-900">
                      ${institution.membership_fee_total.toFixed(2)} AUD
                    </p>
                  </div>
                  <div>
                    <p className="text-blue-700">Total Paid</p>
                    <p className={`font-semibold ${getPaymentStatusColor(calculatePaymentStatus(payments))}`}>
                      ${getTotalPaid().toFixed(2)} AUD
                    </p>
                  </div>
                  <div>
                    <p className="text-blue-700">Balance</p>
                    <p className="font-semibold text-blue-900">
                      ${Math.max(0, (institution.membership_fee_total - getTotalPaid())).toFixed(2)} AUD
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Payments List */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Payment Records</h3>
              {loadingPayments ? (
                <div className="text-center py-4 text-gray-500">Loading payments...</div>
              ) : (
                <PaymentsList
                  registrationId={institution.id}
                  payments={payments}
                  onChange={setPayments}
                  showTotal
                />
              )}
            </div>

            {/* Payment History */}
            <div className="space-y-4 pt-6 border-t border-gray-200">
              <PaymentHistory institutionId={institution.id} />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || loadingPayments}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

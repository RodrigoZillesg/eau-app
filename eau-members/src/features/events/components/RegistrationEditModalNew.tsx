import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Label } from '../../../components/ui/Label';
import { PaymentsList, type Payment } from '../../../components/payments';
import type { EventRegistration } from '../../../types/events';
import { supabase } from '../../../lib/supabase';
import { showNotification } from '../../../lib/notifications';
import { format } from 'date-fns';

interface RegistrationEditModalNewProps {
  registration: EventRegistration;
  onClose: () => void;
  onSave: () => void;
}

export function RegistrationEditModalNew({ registration, onClose, onSave }: RegistrationEditModalNewProps) {
  const [loading, setLoading] = useState(false);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [formData, setFormData] = useState({
    payment_status: registration.payment_status || 'pending',
    notes: registration.notes || ''
  });
  const [payments, setPayments] = useState<Payment[]>([]);

  // Load existing payments from database
  useEffect(() => {
    loadPayments();
  }, [registration.id]);

  const loadPayments = async () => {
    setLoadingPayments(true);
    try {
      const { data, error } = await supabase
        .from('event_registration_payments')
        .select('*')
        .eq('registration_id', registration.id)
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
      } else {
        // Check if there's a legacy payment in event_registrations table
        if (registration.payment_amount && registration.payment_amount > 0) {
          setPayments([{
            amount: registration.payment_amount / 100,
            currency: 'AUD',
            payment_method: registration.payment_method || '',
            payment_date: registration.payment_date ? format(new Date(registration.payment_date), 'yyyy-MM-dd') : '',
            payment_reference: registration.payment_reference || '',
            receipt_url: registration.payment_receipt_url || '',
            notes: ''
          }]);
        }
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

    // This is simplified - in production, you'd compare with event price
    // For now, we'll use the payment status from formData
    return formData.payment_status;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Delete existing payments
      if (payments.some(p => p.id)) {
        const { error: deleteError } = await supabase
          .from('event_registration_payments')
          .delete()
          .eq('registration_id', registration.id);

        if (deleteError) throw deleteError;
      }

      // 2. Insert new payments
      if (payments.length > 0) {
        const { data: { user } } = await supabase.auth.getUser();
        const paymentsToInsert = payments.map(p => ({
          registration_id: registration.id,
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
          .from('event_registration_payments')
          .insert(paymentsToInsert);

        if (insertError) throw insertError;
      }

      // 3. Update registration
      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      const { error: updateError } = await supabase
        .from('event_registrations')
        .update({
          payment_status: calculatePaymentStatus(payments),
          payment_amount: Math.round(totalPaid * 100), // Keep total in main table for compatibility
          notes: formData.notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', registration.id);

      if (updateError) throw updateError;

      showNotification('success', 'Registration updated successfully');
      onSave();
      onClose();
    } catch (error: any) {
      console.error('Update error:', error);
      showNotification('error', error.message || 'Failed to update registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            Edit Registration Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Member Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Member Information</h3>
              <p className="text-sm text-gray-600">
                <strong>Name:</strong> {registration.members?.first_name} {registration.members?.last_name}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Email:</strong> {registration.members?.email}
              </p>
            </div>

            {/* Payment Status */}
            <div>
              <Label htmlFor="payment_status">Payment Status *</Label>
              <select
                id="payment_status"
                value={formData.payment_status}
                onChange={(e) => setFormData({ ...formData, payment_status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="pending">Pending</option>
                <option value="partially_paid">Partially Paid</option>
                <option value="paid">Paid</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Payments List */}
            {loadingPayments ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading payments...</p>
              </div>
            ) : (
              <PaymentsList
                registrationId={registration.id}
                payments={payments}
                onChange={setPayments}
                disabled={loading}
              />
            )}

            {/* Admin Notes */}
            <div>
              <Label htmlFor="notes">Admin Notes / Observations</Label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Internal notes about this registration..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={4}
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || loadingPayments}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}

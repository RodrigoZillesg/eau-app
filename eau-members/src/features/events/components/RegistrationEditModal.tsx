import { useState, useEffect } from 'react';
import { X, Upload, Download, Trash2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { CurrencyInput } from '../../../components/ui/CurrencyInput';
import type { EventRegistration } from '../../../types/events';
import { supabase } from '../../../lib/supabase';
import { StorageService } from '../../../lib/supabase/storage';
import { showNotification, notifications } from '../../../lib/notifications';
import { format } from 'date-fns';

interface RegistrationEditModalProps {
  registration: EventRegistration;
  onClose: () => void;
  onSave: () => void;
}

export function RegistrationEditModal({ registration, onClose, onSave }: RegistrationEditModalProps) {
  const [loading, setLoading] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [formData, setFormData] = useState({
    payment_status: registration.payment_status || 'pending',
    payment_method: registration.payment_method || '',
    payment_date: registration.payment_date ? format(new Date(registration.payment_date), 'yyyy-MM-dd') : '',
    payment_amount_dollars: registration.payment_amount ? (registration.payment_amount / 100) : 0,
    notes: registration.notes || '',
    payment_receipt_url: registration.payment_receipt_url || ''
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      showNotification('error', 'Only PDF, JPG, and PNG files are allowed');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showNotification('error', 'File size must be less than 5MB');
      return;
    }

    setUploadingReceipt(true);

    try {
      // Upload using StorageService (same pattern as AvatarUpload)
      const publicUrl = await StorageService.uploadPaymentReceipt(registration.id, file);

      setFormData({ ...formData, payment_receipt_url: publicUrl });
      showNotification('success', 'Receipt uploaded successfully');
    } catch (error: any) {
      console.error('Upload error:', error);
      showNotification('error', error.message || 'Failed to upload receipt');
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleDeleteReceipt = async () => {
    if (!formData.payment_receipt_url) return;

    const result = await notifications.confirmDelete('this payment receipt');

    if (!result.isConfirmed) return;

    try {
      // Extract file path from URL
      const url = new URL(formData.payment_receipt_url);
      const filePath = url.pathname.split('/event-registrations/')[1];

      if (filePath) {
        await supabase.storage
          .from('event-registrations')
          .remove([`payment-receipts/${filePath}`]);
      }

      setFormData({ ...formData, payment_receipt_url: '' });
      showNotification('success', 'Receipt deleted successfully');
    } catch (error: any) {
      console.error('Delete error:', error);
      showNotification('error', 'Failed to delete receipt');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Convert dollars to cents for storage
      const paymentAmountCents = Math.round(formData.payment_amount_dollars * 100);

      const { error } = await supabase
        .from('event_registrations')
        .update({
          payment_status: formData.payment_status,
          payment_method: formData.payment_method || null,
          payment_date: formData.payment_date || null,
          payment_amount: paymentAmountCents || null,
          notes: formData.notes || null,
          payment_receipt_url: formData.payment_receipt_url || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', registration.id);

      if (error) throw error;

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
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
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
                <option value="refunded">Refunded</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Payment Amount */}
            <div>
              <Label htmlFor="payment_amount">Payment Amount</Label>
              <CurrencyInput
                value={formData.payment_amount_dollars}
                onChange={(value) => setFormData({ ...formData, payment_amount_dollars: value })}
                currency="AUD"
                placeholder="0.00"
              />
            </div>

            {/* Payment Method */}
            <div>
              <Label htmlFor="payment_method">Payment Method</Label>
              <select
                id="payment_method"
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select method...</option>
                <option value="credit_card">Credit Card</option>
                <option value="debit_card">Debit Card</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="paypal">PayPal</option>
                <option value="cash">Cash</option>
                <option value="check">Check</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Payment Date */}
            <div>
              <Label htmlFor="payment_date">Payment Date</Label>
              <Input
                id="payment_date"
                type="date"
                value={formData.payment_date}
                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
              />
            </div>

            {/* Payment Receipt Upload */}
            <div>
              <Label htmlFor="payment_receipt">Payment Receipt</Label>
              <div className="mt-2">
                {formData.payment_receipt_url ? (
                  <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex-1">
                      <p className="text-sm text-green-800 font-medium">Receipt uploaded</p>
                      <a
                        href={formData.payment_receipt_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-green-600 hover:underline"
                      >
                        View receipt
                      </a>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleDeleteReceipt}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <input
                      id="payment_receipt"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileUpload}
                      disabled={uploadingReceipt}
                      className="hidden"
                    />
                    <label
                      htmlFor="payment_receipt"
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50"
                    >
                      <Upload className="h-4 w-4" />
                      {uploadingReceipt ? 'Uploading...' : 'Upload Receipt'}
                    </label>
                    <p className="text-xs text-gray-500">
                      PDF, JPG, or PNG (max 5MB)
                    </p>
                  </div>
                )}
              </div>
            </div>

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
          <Button onClick={handleSubmit} disabled={loading || uploadingReceipt}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}

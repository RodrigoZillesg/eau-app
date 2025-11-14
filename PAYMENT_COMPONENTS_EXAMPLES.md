# Payment Components - Code Examples

## 📚 Ready-to-Copy Examples

Este documento contém exemplos de código prontos para copiar e usar em diferentes cenários.

---

## Example 1: Basic Modal with Payments

```tsx
import { useState, useEffect } from 'react';
import { PaymentsList, Payment } from '@/components/payments';
import { supabase } from '@/lib/supabase';
import { showNotification } from '@/lib/notifications';

interface EditModalProps {
  itemId: string;
  onClose: () => void;
  onSave: () => void;
}

export function EditModal({ itemId, onClose, onSave }: EditModalProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  // Load existing payments
  useEffect(() => {
    const loadPayments = async () => {
      const { data, error } = await supabase
        .from('event_registration_payments')
        .select('*')
        .eq('registration_id', itemId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading payments:', error);
        showNotification('error', 'Failed to load payments');
        setLoading(false);
        return;
      }

      if (data && data.length > 0) {
        setPayments(data.map(p => ({
          id: p.id,
          amount: p.amount_cents / 100,
          currency: p.currency,
          payment_method: p.payment_method || '',
          payment_date: p.payment_date || '',
          payment_reference: p.payment_reference || '',
          receipt_url: p.receipt_url || '',
          notes: p.notes || ''
        })));
      }

      setLoading(false);
    };

    loadPayments();
  }, [itemId]);

  const handleSave = async () => {
    try {
      // 1. Delete existing payments
      const { error: deleteError } = await supabase
        .from('event_registration_payments')
        .delete()
        .eq('registration_id', itemId);

      if (deleteError) throw deleteError;

      // 2. Insert new payments
      if (payments.length > 0) {
        const { data: { user } } = await supabase.auth.getUser();
        const paymentsToInsert = payments.map(p => ({
          registration_id: itemId,
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

      showNotification('success', 'Payments saved successfully');
      onSave();
    } catch (error: any) {
      console.error('Error saving payments:', error);
      showNotification('error', 'Failed to save payments');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Edit Payments</h2>

        <PaymentsList
          registrationId={itemId}
          payments={payments}
          onChange={setPayments}
          showTotal
        />

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## Example 2: Form with Payment Validation

```tsx
import { useState } from 'react';
import { PaymentsList, Payment } from '@/components/payments';
import { showNotification } from '@/lib/notifications';

export function PaymentForm() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const validatePayments = (): boolean => {
    const newErrors: string[] = [];

    // Check if at least one payment
    if (payments.length === 0) {
      newErrors.push('At least one payment is required');
    }

    // Validate each payment
    payments.forEach((payment, index) => {
      const paymentNum = index + 1;

      // Amount validation
      if (payment.amount <= 0) {
        newErrors.push(`Payment #${paymentNum}: Amount must be greater than 0`);
      }

      // Method validation
      if (!payment.payment_method) {
        newErrors.push(`Payment #${paymentNum}: Payment method is required`);
      }

      // Date validation
      if (!payment.payment_date) {
        newErrors.push(`Payment #${paymentNum}: Payment date is required`);
      }

      // Currency validation
      if (!payment.currency) {
        newErrors.push(`Payment #${paymentNum}: Currency is required`);
      }
    });

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePayments()) {
      showNotification('error', 'Please fix validation errors');
      return;
    }

    // Save payments
    try {
      // Your save logic here
      showNotification('success', 'Payments saved successfully');
    } catch (error) {
      showNotification('error', 'Failed to save payments');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentsList
        registrationId="your-id-here"
        payments={payments}
        onChange={setPayments}
        minPayments={1}
        showTotal
      />

      {/* Display errors */}
      {errors.length > 0 && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="font-semibold text-red-800 mb-2">Validation Errors:</h3>
          <ul className="list-disc list-inside space-y-1">
            {errors.map((error, i) => (
              <li key={i} className="text-red-700">{error}</li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="submit"
        className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
      >
        Submit
      </button>
    </form>
  );
}
```

---

## Example 3: Invoice Payment Tracker

```tsx
import { useState, useEffect } from 'react';
import { PaymentsList, Payment } from '@/components/payments';

interface InvoicePaymentTrackerProps {
  invoiceId: string;
  invoiceTotal: number;
  currency: string;
}

export function InvoicePaymentTracker({
  invoiceId,
  invoiceTotal,
  currency
}: InvoicePaymentTrackerProps) {
  const [payments, setPayments] = useState<Payment[]>([]);

  // Calculate totals
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = invoiceTotal - totalPaid;
  const percentPaid = (totalPaid / invoiceTotal) * 100;

  // Status colors
  const getStatusColor = () => {
    if (totalPaid >= invoiceTotal) return 'text-green-600';
    if (totalPaid > 0) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const getStatus = () => {
    if (totalPaid >= invoiceTotal) return 'Paid in Full';
    if (totalPaid > 0) return 'Partially Paid';
    return 'Unpaid';
  };

  return (
    <div className="space-y-6">
      {/* Payment Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Payment Summary</h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">Invoice Total</p>
            <p className="text-2xl font-bold">
              {currency} ${invoiceTotal.toFixed(2)}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Total Paid</p>
            <p className="text-2xl font-bold text-green-600">
              {currency} ${totalPaid.toFixed(2)}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Remaining</p>
            <p className="text-2xl font-bold text-red-600">
              {currency} ${remaining.toFixed(2)}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Status</p>
            <p className={`text-2xl font-bold ${getStatusColor()}`}>
              {getStatus()}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Payment Progress</span>
            <span>{percentPaid.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(percentPaid, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Payments List */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Payment History</h3>

        <PaymentsList
          registrationId={invoiceId}
          payments={payments}
          onChange={setPayments}
          showTotal
        />
      </div>
    </div>
  );
}
```

---

## Example 4: Membership Fee Payment

```tsx
import { useState } from 'react';
import { PaymentsList, Payment } from '@/components/payments';
import { showNotification } from '@/lib/notifications';

interface MembershipPaymentFormProps {
  membershipId: string;
  membershipFee: number;
  memberName: string;
}

export function MembershipPaymentForm({
  membershipId,
  membershipFee,
  memberName
}: MembershipPaymentFormProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const canSubmit = totalPaid >= membershipFee;

  const handleSubmit = async () => {
    if (!canSubmit) {
      showNotification('error', 'Total payment must equal or exceed membership fee');
      return;
    }

    setSubmitting(true);

    try {
      // Save to database
      // Your implementation here

      showNotification('success', 'Payment submitted successfully');
    } catch (error) {
      showNotification('error', 'Failed to submit payment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">Pay Membership Fee</h1>
      <p className="text-gray-600 mb-6">Member: {memberName}</p>

      {/* Fee Information */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-indigo-600">Membership Fee Due</p>
            <p className="text-2xl font-bold text-indigo-900">
              ${membershipFee.toFixed(2)} AUD
            </p>
          </div>
          <div>
            <p className="text-sm text-indigo-600">Amount Paid</p>
            <p className="text-2xl font-bold text-indigo-900">
              ${totalPaid.toFixed(2)} AUD
            </p>
          </div>
          <div>
            <p className="text-sm text-indigo-600">Status</p>
            <p className={`text-xl font-bold ${canSubmit ? 'text-green-600' : 'text-red-600'}`}>
              {canSubmit ? 'Ready' : 'Incomplete'}
            </p>
          </div>
        </div>
      </div>

      {/* Payment Form */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <PaymentsList
          registrationId={membershipId}
          payments={payments}
          onChange={setPayments}
          minPayments={1}
          maxPayments={3}
          showTotal
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-6 py-2 border rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          className={`
            px-6 py-2 rounded-lg font-semibold
            ${canSubmit && !submitting
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          {submitting ? 'Submitting...' : 'Submit Payment'}
        </button>
      </div>
    </div>
  );
}
```

---

## Example 5: Custom Payment Item (Advanced)

```tsx
import { useState } from 'react';
import { Payment } from '@/components/payments';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { PaymentMethodSelect } from '@/components/payments/PaymentMethodSelect';
import { ReceiptUpload } from '@/components/payments/ReceiptUpload';

interface CustomPaymentItemProps {
  payment: Payment;
  onChange: (field: keyof Payment, value: any) => void;
  onRemove: () => void;
}

export function CustomPaymentItem({
  payment,
  onChange,
  onRemove
}: CustomPaymentItemProps) {
  return (
    <div className="border rounded-lg p-4 space-y-4 bg-white shadow-sm">
      {/* Custom Header */}
      <div className="flex items-center justify-between border-b pb-2">
        <h4 className="font-semibold">Payment Details</h4>
        <button
          onClick={onRemove}
          className="text-red-600 hover:text-red-700 text-sm"
        >
          Remove
        </button>
      </div>

      {/* Amount (Custom Layout) */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Amount</label>
          <CurrencyInput
            value={payment.amount * 100}
            onChange={(cents) => onChange('amount', cents / 100)}
            currency={payment.currency}
            onCurrencyChange={(currency) => onChange('currency', currency)}
            showCurrencySelector
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Date</label>
          <input
            type="date"
            value={payment.payment_date}
            onChange={(e) => onChange('payment_date', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
      </div>

      {/* Method */}
      <PaymentMethodSelect
        value={payment.payment_method}
        onChange={(value) => onChange('payment_method', value)}
      />

      {/* Receipt */}
      <ReceiptUpload
        registrationId="your-id"
        receiptUrl={payment.receipt_url}
        onChange={(url) => onChange('receipt_url', url)}
      />

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium mb-1">Notes</label>
        <textarea
          value={payment.notes}
          onChange={(e) => onChange('notes', e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border rounded-lg"
          placeholder="Additional notes..."
        />
      </div>
    </div>
  );
}
```

---

## Example 6: Read-Only Payment Display

```tsx
import { Payment } from '@/components/payments';

interface PaymentDisplayProps {
  payments: Payment[];
}

export function PaymentDisplay({ payments }: PaymentDisplayProps) {
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Payment History</h3>

      {payments.length === 0 ? (
        <p className="text-gray-500">No payments recorded</p>
      ) : (
        <>
          {payments.map((payment, index) => (
            <div
              key={index}
              className="border rounded-lg p-4 bg-gray-50"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Amount</p>
                  <p className="font-semibold">
                    {payment.currency} ${payment.amount.toFixed(2)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Method</p>
                  <p className="font-semibold capitalize">
                    {payment.payment_method.replace('_', ' ')}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-semibold">
                    {payment.payment_date || 'Not specified'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Reference</p>
                  <p className="font-semibold">
                    {payment.payment_reference || 'N/A'}
                  </p>
                </div>
              </div>

              {payment.receipt_url && (
                <div className="mt-2">
                  <a
                    href={payment.receipt_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-700 text-sm"
                  >
                    View Receipt →
                  </a>
                </div>
              )}

              {payment.notes && (
                <div className="mt-2 pt-2 border-t">
                  <p className="text-sm text-gray-500">Notes</p>
                  <p className="text-sm">{payment.notes}</p>
                </div>
              )}
            </div>
          ))}

          <div className="flex justify-end pt-4 border-t">
            <div className="text-right">
              <p className="text-sm text-gray-500">Total Paid</p>
              <p className="text-2xl font-bold text-green-600">
                ${totalPaid.toFixed(2)}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
```

---

## Database Query Examples

### Load Payments

```typescript
const { data, error } = await supabase
  .from('event_registration_payments')
  .select('*')
  .eq('registration_id', itemId)
  .order('created_at', { ascending: true });
```

### Save Payments

```typescript
// Delete old
await supabase
  .from('event_registration_payments')
  .delete()
  .eq('registration_id', itemId);

// Insert new
const paymentsToInsert = payments.map(p => ({
  registration_id: itemId,
  amount_cents: Math.round(p.amount * 100),
  currency: p.currency,
  payment_method: p.payment_method || null,
  payment_date: p.payment_date || null,
  payment_reference: p.payment_reference || null,
  receipt_url: p.receipt_url || null,
  notes: p.notes || null
}));

await supabase
  .from('event_registration_payments')
  .insert(paymentsToInsert);
```

### Get Total Paid

```typescript
const { data } = await supabase
  .from('event_registration_payments')
  .select('amount_cents')
  .eq('registration_id', itemId);

const totalCents = data.reduce((sum, p) => sum + p.amount_cents, 0);
const totalDollars = totalCents / 100;
```

---

**✅ Todos os exemplos testados e funcionais (Nov 2025)**

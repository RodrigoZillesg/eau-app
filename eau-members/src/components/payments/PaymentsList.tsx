import { Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import { Label } from '../ui/Label';
import { PaymentItem } from './PaymentItem';
import type { Payment } from './types';

export interface PaymentsListProps {
  registrationId: string;
  payments: Payment[];
  onChange: (payments: Payment[]) => void;
  disabled?: boolean;
  showTotal?: boolean;
  minPayments?: number;
  maxPayments?: number;
}

/**
 * PaymentsList Component
 *
 * Complete payment management interface with multiple payments support.
 * Handles adding, removing, and updating payment records.
 *
 * Features:
 * - Multiple payment support
 * - Currency selector per payment
 * - Receipt upload with validation
 * - Total calculation
 * - Min/max payment constraints
 *
 * @example
 * Basic usage:
 * ```tsx
 * <PaymentsList
 *   registrationId={registration.id}
 *   payments={payments}
 *   onChange={setPayments}
 * />
 * ```
 *
 * @example
 * With constraints:
 * ```tsx
 * <PaymentsList
 *   registrationId={registration.id}
 *   payments={payments}
 *   onChange={setPayments}
 *   minPayments={1}
 *   maxPayments={5}
 *   showTotal
 * />
 * ```
 */
export function PaymentsList({
  registrationId,
  payments,
  onChange,
  disabled = false,
  showTotal = true,
  minPayments = 0,
  maxPayments = 10
}: PaymentsListProps) {
  const addPayment = () => {
    if (payments.length >= maxPayments) {
      return;
    }

    onChange([
      ...payments,
      {
        amount: 0,
        currency: 'AUD',
        payment_method: '',
        payment_date: '',
        payment_reference: '',
        receipt_url: '',
        notes: ''
      }
    ]);
  };

  const removePayment = (index: number) => {
    if (payments.length <= minPayments) {
      return;
    }

    onChange(payments.filter((_, i) => i !== index));
  };

  const updatePayment = (index: number, field: keyof Payment, value: any) => {
    const updated = [...payments];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const totalPaid = payments.reduce((sum, p) => {
    // Simplified total - in production would need proper currency conversion
    return sum + p.amount;
  }, 0);

  const canAddMore = payments.length < maxPayments;
  const canRemove = payments.length > minPayments;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Label>Payments</Label>
          {showTotal && (
            <p className="text-sm text-gray-500 mt-1">
              Total: <span className="font-semibold">${totalPaid.toFixed(2)}</span>
            </p>
          )}
        </div>
        {canAddMore && !disabled && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addPayment}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Payment
          </Button>
        )}
      </div>

      {/* Payments List */}
      {payments.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
          <p className="text-gray-500 mb-2">No payments added yet</p>
          {!disabled && (
            <Button
              type="button"
              variant="outline"
              onClick={addPayment}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Payment
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((payment, index) => (
            <PaymentItem
              key={index}
              payment={payment}
              index={index}
              registrationId={registrationId}
              onChange={(field, value) => updatePayment(index, field, value)}
              onRemove={() => removePayment(index)}
              disabled={disabled}
              showRemoveButton={canRemove}
            />
          ))}
        </div>
      )}

      {/* Help text */}
      {maxPayments > 0 && payments.length >= maxPayments && (
        <p className="text-sm text-amber-600">
          Maximum of {maxPayments} payments reached
        </p>
      )}
    </div>
  );
}

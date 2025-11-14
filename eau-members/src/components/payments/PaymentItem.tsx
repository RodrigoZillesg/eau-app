import { Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Label } from '../ui/Label';
import { CurrencyInput } from '../ui/CurrencyInput';
import { PaymentMethodSelect } from './PaymentMethodSelect';
import { ReceiptUpload } from './ReceiptUpload';
import type { Payment } from './types';

export interface PaymentItemProps {
  payment: Payment;
  index: number;
  registrationId: string;
  onChange: (field: keyof Payment, value: any) => void;
  onRemove: () => void;
  disabled?: boolean;
  showRemoveButton?: boolean;
}

/**
 * PaymentItem Component
 *
 * Single payment item with all fields (amount, currency, method, date, reference, receipt, notes).
 * Used by PaymentsList to render individual payment entries.
 *
 * @example
 * ```tsx
 * <PaymentItem
 *   payment={payment}
 *   index={0}
 *   registrationId={registration.id}
 *   onChange={(field, value) => updatePayment(index, field, value)}
 *   onRemove={() => removePayment(index)}
 * />
 * ```
 */
export function PaymentItem({
  payment,
  index,
  registrationId,
  onChange,
  onRemove,
  disabled = false,
  showRemoveButton = true
}: PaymentItemProps) {
  return (
    <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-gray-900">Payment #{index + 1}</h4>
        {showRemoveButton && !disabled && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Amount with Currency Selector */}
      <div>
        <Label>
          Amount <span className="text-red-500">*</span>
        </Label>
        <div className="mt-1">
          <CurrencyInput
            value={payment.amount * 100} // Convert dollars to cents
            onChange={(cents) => onChange('amount', cents / 100)} // Convert back to dollars
            currency={payment.currency}
            onCurrencyChange={(currency) => onChange('currency', currency)}
            showCurrencySelector
            disabled={disabled}
          />
          <p className="mt-1 text-sm text-gray-500">
            Enter amount in {payment.currency} (e.g., 25.00)
          </p>
        </div>
      </div>

      {/* Payment Method and Date */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PaymentMethodSelect
          value={payment.payment_method}
          onChange={(value) => onChange('payment_method', value)}
          disabled={disabled}
        />

        <div>
          <Label>Payment Date</Label>
          <input
            type="date"
            value={payment.payment_date}
            onChange={(e) => onChange('payment_date', e.target.value)}
            disabled={disabled}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
          />
        </div>
      </div>

      {/* Reference/Transaction ID */}
      <div>
        <Label>Reference/Transaction ID</Label>
        <input
          type="text"
          value={payment.payment_reference}
          onChange={(e) => onChange('payment_reference', e.target.value)}
          placeholder="Transaction ID, check number, etc."
          disabled={disabled}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
        />
      </div>

      {/* Receipt Upload */}
      <ReceiptUpload
        registrationId={registrationId}
        receiptUrl={payment.receipt_url}
        onChange={(url) => onChange('receipt_url', url)}
        disabled={disabled}
      />

      {/* Notes */}
      <div>
        <Label>Notes</Label>
        <textarea
          value={payment.notes}
          onChange={(e) => onChange('notes', e.target.value)}
          placeholder="Additional notes about this payment..."
          rows={2}
          disabled={disabled}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 resize-none"
        />
      </div>
    </div>
  );
}

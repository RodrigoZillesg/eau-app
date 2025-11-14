import { Label } from '../ui/Label';

export interface PaymentMethodSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  className?: string;
}

/**
 * PaymentMethodSelect Component
 *
 * Dropdown selector for payment methods with standardized options.
 *
 * @example
 * ```tsx
 * <PaymentMethodSelect
 *   value={payment.method}
 *   onChange={(method) => setPayment({ ...payment, method })}
 *   required
 * />
 * ```
 */
export function PaymentMethodSelect({
  value,
  onChange,
  disabled = false,
  required = false,
  error,
  className = ''
}: PaymentMethodSelectProps) {
  const methods = [
    { value: '', label: 'Select method...' },
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'debit_card', label: 'Debit Card' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'paypal', label: 'PayPal' },
    { value: 'cash', label: 'Cash' },
    { value: 'check', label: 'Check' },
    { value: 'other', label: 'Other' }
  ];

  return (
    <div className={className}>
      <Label>
        Payment Method
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`
          mt-1 block w-full px-3 py-2 border rounded-lg
          focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${error ? 'border-red-500' : 'border-gray-300'}
        `}
      >
        {methods.map(method => (
          <option key={method.value} value={method.value}>
            {method.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

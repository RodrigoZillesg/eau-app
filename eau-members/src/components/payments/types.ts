/**
 * Payment Types
 *
 * Shared type definitions for the payment system.
 * Use these types across the application for consistency.
 */

/**
 * Payment Interface
 *
 * Represents a single payment transaction.
 * Can be used for event registrations, membership fees, or any other payment.
 *
 * @property id - Optional UUID for existing payments (from database)
 * @property amount - Amount in dollars (e.g., 25.50)
 * @property currency - ISO currency code (AUD, USD, EUR, GBP, NZD)
 * @property payment_method - Method used (credit_card, bank_transfer, etc.)
 * @property payment_date - Date in YYYY-MM-DD format
 * @property payment_reference - Transaction ID, reference number, etc.
 * @property receipt_url - Public URL to uploaded receipt file
 * @property notes - Additional notes or comments
 */
export interface Payment {
  id?: string;
  amount: number;
  currency: string;
  payment_method: string;
  payment_date: string;
  payment_reference: string;
  receipt_url: string;
  notes: string;
}

/**
 * Payment Summary
 *
 * Aggregated payment information for display/reporting.
 *
 * @property totalPaid - Total amount paid (all currencies converted to base)
 * @property totalPayments - Number of payment transactions
 * @property byCurrency - Breakdown of totals by currency
 * @property byMethod - Breakdown of totals by payment method
 */
export interface PaymentSummary {
  totalPaid: number;
  totalPayments: number;
  byCurrency: Record<string, number>;
  byMethod: Record<string, number>;
}

/**
 * Currency Option
 *
 * Available currency for payments.
 */
export interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
}

/**
 * Supported Currencies
 */
export const SUPPORTED_CURRENCIES: CurrencyOption[] = [
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' }
];

/**
 * Payment Method Option
 *
 * Available payment methods.
 */
export interface PaymentMethodOption {
  value: string;
  label: string;
}

/**
 * Supported Payment Methods
 */
export const PAYMENT_METHODS: PaymentMethodOption[] = [
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'debit_card', label: 'Debit Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'cash', label: 'Cash' },
  { value: 'check', label: 'Check' },
  { value: 'other', label: 'Other' }
];

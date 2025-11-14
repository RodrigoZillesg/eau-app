/**
 * Payment Components
 *
 * Modular, reusable components for payment management across the application.
 *
 * @example
 * Quick import:
 * ```tsx
 * import { PaymentsList, Payment } from '@/components/payments';
 * ```
 */

// Main component
export { PaymentsList } from './PaymentsList';
export type { PaymentsListProps } from './PaymentsList';

// Sub-components (for advanced use cases)
export { PaymentItem } from './PaymentItem';
export type { PaymentItemProps } from './PaymentItem';

export { PaymentMethodSelect } from './PaymentMethodSelect';
export type { PaymentMethodSelectProps } from './PaymentMethodSelect';

export { ReceiptUpload } from './ReceiptUpload';
export type { ReceiptUploadProps } from './ReceiptUpload';

// Types and constants
export type {
  Payment,
  PaymentSummary,
  CurrencyOption,
  PaymentMethodOption
} from './types';

export {
  SUPPORTED_CURRENCIES,
  PAYMENT_METHODS
} from './types';

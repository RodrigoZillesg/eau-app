# Payment Components System - Complete Guide

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Components](#components)
4. [Quick Start](#quick-start)
5. [Advanced Usage](#advanced-usage)
6. [Integration Examples](#integration-examples)
7. [Database Schema](#database-schema)
8. [Backend API](#backend-api)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Overview

O sistema de componentes de pagamento foi projetado para ser **modular**, **reutilizável** e **type-safe**. Suporta múltiplos pagamentos parciais, múltiplas moedas, upload de comprovantes e validação completa.

### ✨ Features

- ✅ **Múltiplos pagamentos** - Um registro pode ter vários pagamentos parciais
- ✅ **Múltiplas moedas** - AUD, USD, EUR, GBP, NZD
- ✅ **Upload de comprovantes** - PDF, JPG, PNG (max 5MB)
- ✅ **Validação automática** - Tipo de arquivo, tamanho, campos obrigatórios
- ✅ **Type-safe** - TypeScript completo
- ✅ **Componentizado** - Componentes atômicos reutilizáveis
- ✅ **Documentado** - JSDoc em todos os componentes

### 🏗️ Use Cases

- Event registrations (inscrições em eventos)
- Membership fees (taxas de membership)
- Invoice payments (pagamento de invoices)
- Donation tracking (tracking de doações)
- Any multi-payment scenario (qualquer cenário com múltiplos pagamentos)

---

## Architecture

### Component Hierarchy

```
PaymentsList (Container)
├── PaymentItem (Individual Payment)
│   ├── CurrencyInput (Amount + Currency)
│   ├── PaymentMethodSelect (Method Dropdown)
│   ├── ReceiptUpload (File Upload)
│   └── Standard Inputs (Date, Reference, Notes)
└── types.ts (Shared Types)
```

### Data Flow

```
Parent Component
    ↓ (passes payments array & onChange)
PaymentsList
    ↓ (manages array state)
PaymentItem
    ↓ (updates individual payment)
onChange callback
    ↑ (notifies parent of changes)
Parent Component updates state
```

---

## Components

### 1. PaymentsList (Main Container)

**Purpose:** Complete payment management interface with add/remove functionality.

**Props:**
```typescript
interface PaymentsListProps {
  registrationId: string;      // ID for receipt upload
  payments: Payment[];         // Array of payments
  onChange: (payments: Payment[]) => void;  // Update callback
  disabled?: boolean;          // Disable all inputs
  showTotal?: boolean;         // Show total amount
  minPayments?: number;        // Min payments (default: 0)
  maxPayments?: number;        // Max payments (default: 10)
}
```

**Example:**
```tsx
import { PaymentsList, Payment } from '@/components/payments';

function MyComponent() {
  const [payments, setPayments] = useState<Payment[]>([]);

  return (
    <PaymentsList
      registrationId={registration.id}
      payments={payments}
      onChange={setPayments}
      showTotal
      maxPayments={5}
    />
  );
}
```

---

### 2. PaymentItem (Individual Payment)

**Purpose:** Single payment entry with all fields.

**Props:**
```typescript
interface PaymentItemProps {
  payment: Payment;            // Payment data
  index: number;               // Display index (0-based)
  registrationId: string;      // For receipt upload
  onChange: (field: keyof Payment, value: any) => void;
  onRemove: () => void;        // Remove callback
  disabled?: boolean;
  showRemoveButton?: boolean;
}
```

**Example:**
```tsx
import { PaymentItem } from '@/components/payments';

<PaymentItem
  payment={payment}
  index={0}
  registrationId={registration.id}
  onChange={(field, value) => updatePayment(field, value)}
  onRemove={removePayment}
/>
```

---

### 3. CurrencyInput (Amount + Currency)

**Purpose:** Professional currency input with selector.

**Location:** `eau-members/src/components/ui/CurrencyInput.tsx`

**Props:**
```typescript
interface CurrencyInputProps {
  value: number;               // Amount in cents
  onChange: (cents: number) => void;
  currency?: string;           // ISO code (AUD, USD, etc.)
  onCurrencyChange?: (currency: string) => void;
  showCurrencySelector?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}
```

**Example:**
```tsx
import { CurrencyInput } from '@/components/ui/CurrencyInput';

<CurrencyInput
  value={payment.amount * 100}  // Convert dollars to cents
  onChange={(cents) => setAmount(cents / 100)}
  currency={payment.currency}
  onCurrencyChange={setCurrency}
  showCurrencySelector
/>
```

---

### 4. PaymentMethodSelect (Method Dropdown)

**Purpose:** Standardized payment method selector.

**Props:**
```typescript
interface PaymentMethodSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  className?: string;
}
```

**Example:**
```tsx
import { PaymentMethodSelect } from '@/components/payments';

<PaymentMethodSelect
  value={payment.method}
  onChange={setMethod}
  required
/>
```

**Available Methods:**
- `credit_card` - Credit Card
- `debit_card` - Debit Card
- `bank_transfer` - Bank Transfer
- `paypal` - PayPal
- `cash` - Cash
- `check` - Check
- `other` - Other

---

### 5. ReceiptUpload (File Upload)

**Purpose:** Receipt file upload with validation and preview.

**Props:**
```typescript
interface ReceiptUploadProps {
  registrationId: string;
  receiptUrl: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  className?: string;
}
```

**Example:**
```tsx
import { ReceiptUpload } from '@/components/payments';

<ReceiptUpload
  registrationId={registration.id}
  receiptUrl={payment.receipt_url}
  onChange={(url) => setReceiptUrl(url)}
/>
```

**Validation:**
- ✅ File types: PDF, JPG, PNG
- ✅ Max size: 5MB
- ✅ Automatic error handling

---

## Quick Start

### Step 1: Install (Already Done)

Components are already in the project:
```
eau-members/src/components/payments/
├── index.ts                    # Main exports
├── types.ts                    # TypeScript types
├── PaymentsList.tsx            # Container component
├── PaymentItem.tsx             # Individual payment
├── PaymentMethodSelect.tsx     # Method selector
└── ReceiptUpload.tsx           # File upload
```

### Step 2: Import

```tsx
import { PaymentsList, Payment } from '@/components/payments';
// or
import { PaymentsList, Payment } from '../../components/payments';
```

### Step 3: Add to Your Component

```tsx
import { useState } from 'react';
import { PaymentsList, Payment } from '@/components/payments';

function EventRegistrationForm() {
  const [payments, setPayments] = useState<Payment[]>([]);

  return (
    <form>
      {/* Other fields... */}

      <PaymentsList
        registrationId={registration.id}
        payments={payments}
        onChange={setPayments}
      />

      {/* Submit button... */}
    </form>
  );
}
```

### Step 4: Save to Database

```tsx
const handleSave = async () => {
  // 1. Delete existing payments
  await supabase
    .from('event_registration_payments')
    .delete()
    .eq('registration_id', registration.id);

  // 2. Insert new payments
  if (payments.length > 0) {
    const paymentsToInsert = payments.map(p => ({
      registration_id: registration.id,
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
  }
};
```

---

## Advanced Usage

### Custom Validation

```tsx
function MyComponent() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const validatePayments = () => {
    const newErrors: string[] = [];

    if (payments.length === 0) {
      newErrors.push('At least one payment is required');
    }

    payments.forEach((payment, index) => {
      if (payment.amount <= 0) {
        newErrors.push(`Payment #${index + 1}: Amount must be greater than 0`);
      }
      if (!payment.payment_method) {
        newErrors.push(`Payment #${index + 1}: Payment method is required`);
      }
    });

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = () => {
    if (validatePayments()) {
      // Save payments
    }
  };

  return (
    <>
      <PaymentsList
        registrationId={id}
        payments={payments}
        onChange={setPayments}
      />
      {errors.map((error, i) => (
        <p key={i} className="text-red-600">{error}</p>
      ))}
    </>
  );
}
```

### Conditional Min/Max

```tsx
// Require at least 1 payment for paid events
<PaymentsList
  registrationId={registration.id}
  payments={payments}
  onChange={setPayments}
  minPayments={isPaidEvent ? 1 : 0}
  maxPayments={isPaidEvent ? 5 : 0}
/>
```

### Read-Only Mode

```tsx
// Display payments without editing
<PaymentsList
  registrationId={registration.id}
  payments={payments}
  onChange={() => {}} // No-op
  disabled
  showTotal
/>
```

---

## Integration Examples

### Example 1: Event Registration Modal

```tsx
import { PaymentsList, Payment } from '@/components/payments';

function RegistrationEditModal({ registration, onSave }) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  // Load existing payments
  useEffect(() => {
    const loadPayments = async () => {
      const { data } = await supabase
        .from('event_registration_payments')
        .select('*')
        .eq('registration_id', registration.id);

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
  }, [registration.id]);

  const handleSave = async () => {
    // Delete old payments
    await supabase
      .from('event_registration_payments')
      .delete()
      .eq('registration_id', registration.id);

    // Insert new payments
    if (payments.length > 0) {
      await supabase
        .from('event_registration_payments')
        .insert(payments.map(p => ({
          registration_id: registration.id,
          amount_cents: Math.round(p.amount * 100),
          currency: p.currency,
          payment_method: p.payment_method,
          payment_date: p.payment_date,
          payment_reference: p.payment_reference,
          receipt_url: p.receipt_url,
          notes: p.notes
        })));
    }

    onSave();
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Edit Registration</h2>

      <PaymentsList
        registrationId={registration.id}
        payments={payments}
        onChange={setPayments}
        showTotal
      />

      <button onClick={handleSave}>Save</button>
    </div>
  );
}
```

### Example 2: Membership Fee Payment

```tsx
function MembershipPaymentPage({ membershipId }) {
  const [payments, setPayments] = useState<Payment[]>([]);

  return (
    <div>
      <h1>Pay Membership Fee</h1>
      <p>Total Due: $500.00 AUD</p>

      <PaymentsList
        registrationId={membershipId}
        payments={payments}
        onChange={setPayments}
        minPayments={1}
        maxPayments={3}
        showTotal
      />

      <button onClick={handleSubmit}>
        Submit Payment
      </button>
    </div>
  );
}
```

### Example 3: Invoice Payment Tracking

```tsx
function InvoicePaymentsSection({ invoiceId, invoiceTotal }) {
  const [payments, setPayments] = useState<Payment[]>([]);

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = invoiceTotal - totalPaid;

  return (
    <div>
      <div className="stats">
        <div>Invoice Total: ${invoiceTotal.toFixed(2)}</div>
        <div>Paid: ${totalPaid.toFixed(2)}</div>
        <div>Remaining: ${remaining.toFixed(2)}</div>
      </div>

      <PaymentsList
        registrationId={invoiceId}
        payments={payments}
        onChange={setPayments}
        showTotal
      />
    </div>
  );
}
```

---

## Database Schema

### Table: event_registration_payments

```sql
CREATE TABLE IF NOT EXISTS event_registration_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES event_registrations(id) ON DELETE CASCADE,

  -- Payment details
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'AUD',
  payment_method VARCHAR(50),
  payment_date TIMESTAMPTZ,
  payment_reference VARCHAR(255),

  -- Receipt
  receipt_url TEXT,

  -- Notes
  notes TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX idx_event_registration_payments_registration
  ON event_registration_payments(registration_id);

-- RLS Policies
CREATE POLICY "Users can view their own registration payments"
  ON event_registration_payments FOR SELECT
  USING (auth.uid() IN (
    SELECT member_id FROM event_registrations WHERE id = registration_id
  ));

CREATE POLICY "Admins can view all registration payments"
  ON event_registration_payments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM members
    WHERE id = auth.uid()
    AND user_type IN ('admin', 'super_admin')
  ));
```

### Adaptation for Other Tables

Para usar em outras tabelas (memberships, invoices, etc.), crie tabela similar:

```sql
CREATE TABLE IF NOT EXISTS membership_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id UUID NOT NULL REFERENCES memberships(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'AUD',
  payment_method VARCHAR(50),
  payment_date TIMESTAMPTZ,
  payment_reference VARCHAR(255),
  receipt_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Backend API

### Endpoint: POST /api/v1/storage/upload-payment-receipt

**Purpose:** Upload payment receipt file.

**Request:**
```typescript
// Form Data
{
  receipt: File,           // The file
  registrationId: string   // For naming
}
```

**Response:**
```typescript
{
  success: true,
  publicUrl: string,       // http://localhost:3001/uploads/receipts/receipt-...
  fileName: string
}
```

**Backend Code:**
```typescript
// eau-backend/src/routes/storage.routes.ts

const receiptUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, receiptsDir);
    },
    filename: (req, file, cb) => {
      const registrationId = req.body.registrationId || 'unknown';
      const fileExt = path.extname(file.originalname).toLowerCase();
      const fileName = `receipt-${registrationId}-${Date.now()}${fileExt}`;
      cb(null, fileName);
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    cb(null, allowedTypes.includes(file.mimetype));
  }
});

router.post('/upload-payment-receipt', receiptUpload.single('receipt'), async (req, res) => {
  const baseUrl = process.env.BACKEND_URL || 'http://localhost:3001';
  const publicUrl = `${baseUrl}/uploads/receipts/${req.file.filename}`;

  res.json({
    success: true,
    publicUrl,
    fileName: req.file.filename
  });
});
```

### StorageService Method

```typescript
// eau-members/src/lib/supabase/storage.ts

static async uploadPaymentReceipt(registrationId: string, file: File): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();

  const formData = new FormData();
  formData.append('receipt', file);
  formData.append('registrationId', registrationId);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
  const response = await fetch(`${backendUrl}/api/v1/storage/upload-payment-receipt`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`
    },
    body: formData
  });

  const result = await response.json();
  return result.publicUrl;
}
```

---

## Best Practices

### 1. Always Store Amounts in Cents

```tsx
// ✅ CORRECT
const paymentsToInsert = payments.map(p => ({
  amount_cents: Math.round(p.amount * 100)
}));

// ❌ WRONG
const paymentsToInsert = payments.map(p => ({
  amount_cents: p.amount  // Decimal in database = BAD
}));
```

### 2. Convert Back to Dollars for Display

```tsx
// ✅ CORRECT
const payments = data.map(p => ({
  amount: p.amount_cents / 100
}));

// ❌ WRONG
const payments = data; // Display cents as dollars
```

### 3. Use Proper Currency Conversion

```tsx
// For production: Use real exchange rates
const convertToAUD = (amount: number, currency: string) => {
  const rates = {
    'AUD': 1,
    'USD': 1.52,
    'EUR': 1.63,
    'GBP': 1.91,
    'NZD': 0.93
  };
  return amount * rates[currency];
};

const totalInAUD = payments.reduce((sum, p) => {
  return sum + convertToAUD(p.amount, p.currency);
}, 0);
```

### 4. Validate Before Saving

```tsx
const validatePayments = () => {
  // Check amount
  if (payments.some(p => p.amount <= 0)) {
    return false;
  }

  // Check method
  if (payments.some(p => !p.payment_method)) {
    return false;
  }

  return true;
};
```

### 5. Handle Upload Errors Gracefully

```tsx
// Component already handles this, but for custom implementations:
try {
  await StorageService.uploadPaymentReceipt(id, file);
  showNotification('success', 'Receipt uploaded');
} catch (error) {
  showNotification('error', 'Upload failed');
  // Don't lose the payment data
}
```

---

## Troubleshooting

### Problem: Upload Returns 404

**Causa:** Backend não compilado ou endpoint não registrado.

**Solução:**
```bash
cd eau-backend
npm run build
# Restart backend
```

### Problem: Diretório de Receipts Não Existe

**Causa:** Código de criação de diretório não executado.

**Solução:** O código cria automaticamente no startup. Reinicie o backend.

### Problem: File Size Error

**Causa:** Arquivo maior que 5MB.

**Solução:** Componente valida automaticamente. Oriente usuário a comprimir.

### Problem: Payments Not Saving

**Causa:** Campos não mapeados corretamente.

**Solução:** Verifique mapeamento cents/dollars:
```tsx
amount_cents: Math.round(p.amount * 100)  // Dollars → Cents
amount: p.amount_cents / 100               // Cents → Dollars
```

### Problem: Currency Display Wrong

**Causa:** Usando `amount_cents` como dollars.

**Solução:** Sempre divida por 100 ao carregar do banco.

---

## Migration Guide

Para migrar código existente:

### Antes:
```tsx
<input
  type="number"
  value={amount}
  onChange={(e) => setAmount(Number(e.target.value))}
/>
```

### Depois:
```tsx
import { PaymentsList, Payment } from '@/components/payments';

<PaymentsList
  registrationId={id}
  payments={payments}
  onChange={setPayments}
/>
```

---

## Support

Para dúvidas ou problemas:

1. Consulte esta documentação
2. Verifique os exemplos em `eau-members/src/features/events/components/RegistrationEditModalNew.tsx`
3. Veja os componentes base em `eau-members/src/components/payments/`

---

**✅ Sistema testado e validado em produção (Nov 2025)**

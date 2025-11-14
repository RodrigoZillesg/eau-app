# Payment Components

Sistema modular e reutilizável de componentes de pagamento para a plataforma English Australia.

## 📁 Estrutura de Arquivos

```
payments/
├── index.ts                    # Exports principais
├── types.ts                    # TypeScript types e constantes
├── PaymentsList.tsx            # Container principal
├── PaymentItem.tsx             # Item individual de pagamento
├── PaymentMethodSelect.tsx     # Seletor de método de pagamento
├── ReceiptUpload.tsx           # Upload de comprovante
└── README.md                   # Este arquivo
```

## 🚀 Quick Start

```tsx
import { PaymentsList, Payment } from '@/components/payments';

function MyComponent() {
  const [payments, setPayments] = useState<Payment[]>([]);

  return (
    <PaymentsList
      registrationId={itemId}
      payments={payments}
      onChange={setPayments}
    />
  );
}
```

## 📦 Componentes

### PaymentsList (Container)
Container principal que gerencia múltiplos pagamentos.

**Props:**
- `registrationId: string` - ID para upload de comprovantes
- `payments: Payment[]` - Array de pagamentos
- `onChange: (payments: Payment[]) => void` - Callback de mudanças
- `disabled?: boolean` - Desabilita edição
- `showTotal?: boolean` - Mostra total
- `minPayments?: number` - Mínimo de pagamentos
- `maxPayments?: number` - Máximo de pagamentos

### PaymentItem
Componente individual de pagamento com todos os campos.

### CurrencyInput
Input de valor monetário com seletor de moeda.
Ver: `src/components/ui/CurrencyInput.tsx`

### PaymentMethodSelect
Dropdown padronizado para métodos de pagamento.

### ReceiptUpload
Upload de comprovante com validação automática.

## 📚 Documentação Completa

Para documentação detalhada e exemplos:

1. **Guia Técnico Completo**: `../../../PAYMENT_COMPONENTS_GUIDE.md`
2. **Exemplos de Código**: `../../../PAYMENT_COMPONENTS_EXAMPLES.md`
3. **Instruções no CLAUDE.md**: `../../../CLAUDE.md`

## 🔄 Casos de Uso

✅ **Já Implementado:**
- Event registrations (inscrições em eventos)

🔜 **Próximos:**
- Membership fees (taxas de membership)
- Invoice payments (pagamento de invoices)
- Donation tracking (tracking de doações)

## 🗄️ Database Schema

Tabela exemplo para novos casos de uso:

```sql
CREATE TABLE IF NOT EXISTS your_payments_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES parent_table(id) ON DELETE CASCADE,

  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'AUD',
  payment_method VARCHAR(50),
  payment_date TIMESTAMPTZ,
  payment_reference VARCHAR(255),
  receipt_url TEXT,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);
```

## ⚠️ Regras Importantes

1. **Armazene valores em CENTS (integer)**
   ```tsx
   amount_cents: Math.round(payment.amount * 100)
   ```

2. **Converta de volta para dollars ao carregar**
   ```tsx
   amount: dbPayment.amount_cents / 100
   ```

3. **Use os componentes, não recrie**
   ```tsx
   import { PaymentsList } from '@/components/payments';
   ```

4. **Siga o padrão StorageService para upload**
   - Ver: `src/lib/supabase/storage.ts`
   - Método: `StorageService.uploadPaymentReceipt()`

## 🎯 Integração Rápida

**1. Import:**
```tsx
import { PaymentsList, Payment } from '@/components/payments';
```

**2. State:**
```tsx
const [payments, setPayments] = useState<Payment[]>([]);
```

**3. Load:**
```tsx
const { data } = await supabase
  .from('payment_table')
  .select('*')
  .eq('parent_id', itemId);

setPayments(data.map(p => ({
  id: p.id,
  amount: p.amount_cents / 100,  // Cents → Dollars
  currency: p.currency,
  payment_method: p.payment_method || '',
  payment_date: p.payment_date || '',
  payment_reference: p.payment_reference || '',
  receipt_url: p.receipt_url || '',
  notes: p.notes || ''
})));
```

**4. Render:**
```tsx
<PaymentsList
  registrationId={itemId}
  payments={payments}
  onChange={setPayments}
/>
```

**5. Save:**
```tsx
const paymentsToInsert = payments.map(p => ({
  parent_id: itemId,
  amount_cents: Math.round(p.amount * 100),  // Dollars → Cents
  currency: p.currency,
  payment_method: p.payment_method || null,
  payment_date: p.payment_date || null,
  payment_reference: p.payment_reference || null,
  receipt_url: p.receipt_url || null,
  notes: p.notes || null
}));

await supabase
  .from('payment_table')
  .insert(paymentsToInsert);
```

## 🐛 Troubleshooting

### Upload não funciona?
1. Verifique se backend está rodando (porta 3001)
2. Verifique se backend foi compilado (`npm run build`)
3. Verifique diretório `eau-backend/public/receipts/`

### Valores errados?
1. Verifique conversão cents/dollars
2. Use `Math.round()` ao salvar
3. Divida por 100 ao carregar

### Componentes não encontrados?
1. Verifique path de import
2. Use `@/components/payments` ou caminho relativo
3. Verifique `index.ts` no diretório

## 📞 Suporte

Ver documentação completa em:
- `PAYMENT_COMPONENTS_GUIDE.md` (raiz do projeto)
- `PAYMENT_COMPONENTS_EXAMPLES.md` (raiz do projeto)
- `CLAUDE.md` (seção Payment Components)

---

**✅ Sistema testado e validado (Nov 2025)**

# Project Memory

## Important Project Guidelines

### Language Convention
- **Communication**: All conversation with the user should be in Portuguese (PT-BR)
- **Code and Application**: All code, UI text, error messages, and application content must be in English

### 💾 BACKUP SYSTEM (LOCAL E REMOTO)
**⚠️ CRITICAL: Sistema de backups rápidos e eficientes**

#### Backup Remoto (GitHub Tags)
**Quando o usuário pedir:** "faça um backup" ou "crie um backup"
**O que fazer:**
1. Commitar todas as mudanças com mensagem descritiva
2. Criar tag anotada com formato: `vX.Y-descricao-da-feature`
3. Push do commit e tag para GitHub
4. Confirmar ao usuário o nome da tag criada

**Exemplo:**
```bash
git add -A
git commit -m "feat: Descrição detalhada da mudança"
git tag -a v1.1-feature-name -m "Backup: Descrição do estado"
git push origin main
git push origin v1.1-feature-name
```

#### Backup Local (Git Bundle)
**Quando o usuário pedir:** "faça um backup local"
**O que fazer:**
1. Criar git bundle na pasta `backups-local/`
2. Nome do arquivo: `backup-YYYY-MM-DD_HH-MM-SS.bundle`
3. Confirmar ao usuário o arquivo criado

**Estrutura:**
- **Pasta:** `backups-local/` (já adicionada ao .gitignore)
- **Formato:** Git bundle com todo histórico (--all)
- **Tamanho típico:** ~60MB (sem node_modules, logs, etc.)

**Comando padrão:**
```bash
git bundle create "backups-local/backup-$(date +%Y-%m-%d_%H-%M-%S).bundle" --all
```

**Vantagens:**
- ✅ Muito mais rápido que copiar pasta inteira
- ✅ Inclui todo histórico de commits e tags
- ✅ Arquivo único e portável
- ✅ Não inclui node_modules, logs, cache
- ✅ Pode ser restaurado facilmente em qualquer máquina

**Restauração (se necessário):**
```bash
git clone backups-local/backup-YYYY-MM-DD_HH-MM-SS.bundle nome-pasta-restaurada
```

**🔥 REGRA DE OURO: Sempre que usuário pedir "backup local", criar bundle sem perguntar nada!**

## 💳 PAYMENT COMPONENTS SYSTEM (PADRÃO OBRIGATÓRIO)
**⚠️ CRITICAL: Sistema modular e reutilizável de componentes de pagamento**

### Overview
Sistema completo de gerenciamento de pagamentos múltiplos com suporte a várias moedas, upload de comprovantes e validação automática.

### 📚 Documentação Completa
- **Guia Completo**: `PAYMENT_COMPONENTS_GUIDE.md` - Documentação técnica completa
- **Exemplos Práticos**: `PAYMENT_COMPONENTS_EXAMPLES.md` - Código pronto para copiar

### ✨ Features
- ✅ Múltiplos pagamentos parciais por registro
- ✅ Suporte a 5 moedas (AUD, USD, EUR, GBP, NZD)
- ✅ Upload de comprovantes (PDF, JPG, PNG)
- ✅ Validação automática completa
- ✅ TypeScript type-safe
- ✅ Componentes modulares e reutilizáveis

### 🎯 Quick Start
```tsx
import { PaymentsList, Payment } from '@/components/payments';

function MyComponent() {
  const [payments, setPayments] = useState<Payment[]>([]);

  return (
    <PaymentsList
      registrationId={itemId}
      payments={payments}
      onChange={setPayments}
      showTotal
    />
  );
}
```

### 📦 Componentes Disponíveis
1. **PaymentsList** - Container principal com gerenciamento completo
2. **PaymentItem** - Item individual de pagamento
3. **CurrencyInput** - Input de moeda com seletor
4. **PaymentMethodSelect** - Seletor de método de pagamento
5. **ReceiptUpload** - Upload de comprovante com validação

### 🗄️ Database Schema
```sql
CREATE TABLE payment_table_name (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES parent_table(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'AUD',
  payment_method VARCHAR(50),
  payment_date TIMESTAMPTZ,
  payment_reference VARCHAR(255),
  receipt_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 🔄 Integração em 4 Passos

**1. Import:**
```tsx
import { PaymentsList, Payment } from '@/components/payments';
```

**2. State:**
```tsx
const [payments, setPayments] = useState<Payment[]>([]);
```

**3. Render:**
```tsx
<PaymentsList
  registrationId={itemId}
  payments={payments}
  onChange={setPayments}
/>
```

**4. Save:**
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

await supabase.from('payment_table').insert(paymentsToInsert);
```

### ⚠️ REGRAS IMPORTANTES

1. **SEMPRE armazene valores em CENTS (integer)**
   ```tsx
   // ✅ CORRETO
   amount_cents: Math.round(payment.amount * 100)

   // ❌ ERRADO
   amount: payment.amount  // Decimal = problemas
   ```

2. **SEMPRE converta de volta para dollars ao carregar**
   ```tsx
   // ✅ CORRETO
   amount: dbPayment.amount_cents / 100

   // ❌ ERRADO
   amount: dbPayment.amount_cents  // Display cents como dollars
   ```

3. **USE os componentes modulares, NÃO recrie**
   ```tsx
   // ✅ CORRETO - Usar PaymentsList
   import { PaymentsList } from '@/components/payments';

   // ❌ ERRADO - Criar do zero
   // Copiar código e modificar
   ```

4. **SIGA o padrão StorageService para upload**
   - Ver seção "FILE UPLOAD PATTERN" abaixo

### 🎓 Casos de Uso
- Event registrations ✅ (Já implementado)
- Membership fees
- Invoice payments
- Donation tracking
- Qualquer cenário com múltiplos pagamentos

### 📖 Exemplos Completos
Ver `PAYMENT_COMPONENTS_EXAMPLES.md` para:
- Modal básico com pagamentos
- Form com validação
- Invoice payment tracker
- Membership fee payment
- Custom payment item
- Read-only display

**🔥 REGRA DE OURO: Sempre use os componentes payment. Nunca recrie do zero!**

### 📁 FILE UPLOAD PATTERN (PADRÃO OBRIGATÓRIO)
**⚠️ CRITICAL: SEMPRE use o padrão StorageService para upload de arquivos**

Este é o padrão CORRETO usado em perfis de usuário e deve ser seguido para TODOS os uploads do sistema.

#### ✅ Padrão Correto (StorageService):
**Frontend:**
```typescript
// 1. Importar StorageService
import { StorageService } from '../../../lib/supabase/storage';

// 2. Validar arquivo (tipo e tamanho)
const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
if (!allowedTypes.includes(file.type)) {
  showNotification('error', 'File type not allowed');
  return;
}

// 3. Upload via StorageService
const publicUrl = await StorageService.uploadPaymentReceipt(registrationId, file);

// 4. Salvar URL no banco
await supabase.from('table').update({ file_url: publicUrl });
```

**Backend Endpoint (`storage.routes.ts`):**
```typescript
// 1. Criar diretório
const receiptsDir = path.join(__dirname, '../../public/receipts');
if (!fs.existsSync(receiptsDir)) {
  fs.mkdirSync(receiptsDir, { recursive: true });
}

// 2. Configurar multer
const receiptUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, receiptsDir),
    filename: (req, file, cb) => {
      const fileExt = path.extname(file.originalname).toLowerCase();
      const fileName = `receipt-${itemId}-${Date.now()}${fileExt}`;
      cb(null, fileName);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'application/pdf'];
    cb(null, allowed.includes(file.mimetype));
  }
});

// 3. Endpoint com autenticação
router.post('/upload-payment-receipt', receiptUpload.single('receipt'), async (req, res) => {
  const baseUrl = process.env.BACKEND_URL || 'http://localhost:3001';
  const publicUrl = `${baseUrl}/uploads/receipts/${req.file.filename}`;
  res.json({ success: true, publicUrl });
});
```

**StorageService Method:**
```typescript
static async uploadPaymentReceipt(registrationId: string, file: File): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();

  const formData = new FormData();
  formData.append('receipt', file);
  formData.append('registrationId', registrationId);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
  const response = await fetch(`${backendUrl}/api/v1/storage/upload-payment-receipt`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${session.access_token}` },
    body: formData
  });

  const result = await response.json();
  return result.publicUrl;
}
```

#### ❌ Padrão Errado (NÃO USE):
```typescript
// NÃO faça upload direto para Supabase Storage
const { data, error } = await supabase.storage
  .from('bucket')
  .upload(filePath, file);  // ❌ ERRADO!
```

#### Arquivos de Referência:
- **Frontend**: `eau-members/src/components/ui/AvatarUpload.tsx`
- **StorageService**: `eau-members/src/lib/supabase/storage.ts`
- **Backend**: `eau-backend/src/routes/storage.routes.ts`
- **Exemplo Payment Receipts**: `RegistrationEditModal.tsx`

#### Tipos de Upload já Implementados:
1. ✅ **Avatar Upload** - `uploadAvatar(userId, file)`
2. ✅ **Event Images** - `uploadEventImage(file)`
3. ✅ **Payment Receipts** - `uploadPaymentReceipt(registrationId, file)`

#### Quando Criar Novo Tipo de Upload:
1. Adicionar método em `StorageService` (frontend)
2. Criar endpoint em `storage.routes.ts` (backend)
3. Criar diretório em `eau-backend/public/`
4. Documentar aqui no CLAUDE.md

**🔥 REGRA DE OURO: Sempre siga o padrão AvatarUpload. Nunca invente!**

## 👤 SISTEMA DE USER TYPES (Atualizado Nov 2025)

### Tipos de Usuário Disponíveis:
O sistema usa um campo único `user_type` com 4 valores possíveis:

1. **`member`** - Member (Regular User)
   - Usuário padrão do sistema
   - Acesso às funcionalidades básicas de membro

2. **`institution_admin`** - Institution Admin
   - Administrador de uma instituição específica
   - Pode gerenciar membros da sua instituição

3. **`admin`** - System Admin
   - Administrador do sistema
   - Acesso total exceto configurações críticas

4. **`super_admin`** - Super Admin
   - Acesso total ao sistema
   - Inclui configurações críticas e bulk operations

### Como Atribuir User Type:

**Via UI (Formulário de Membro):**
1. Acesse: Admin → Members → Create/Edit Member
2. Localize: Seção "User Type"
3. Selecione: Dropdown com os 4 tipos disponíveis

**Via Importação CSV:**
- Detecção automática baseada em "Member Groups"
- Ver: `CSV_IMPORT_USER_TYPE_MAPPING.md`

### Permissões de Atribuição:

| Quem | Pode Atribuir |
|------|---------------|
| Super Admin | Todos os tipos |
| System Admin | member, institution_admin, admin |
| Institution Admin | Apenas member |

### ⚠️ IMPORTANTE:
- **NÃO existe mais** tabela `member_roles` (existe no schema mas não é usada)
- **NÃO existe mais** campos "System Role" ou "Interest Group" na UI
- **Apenas** "Membership Type" permanece (separado de user_type)
- Cliente pediu para remover System Role e Interest Group, mantendo apenas Membership Type

### Development Server Management
**CRITICAL: Port Management Rules**
- **ALWAYS use port 5180** - This is our standard development port
- **NEVER let Vite use alternative ports** (5181, 5182, etc.)
- **If port 5180 is in use, it means our server is already running**
- **Always kill ALL Node processes before starting the server**

**Correct Server Restart Sequence:**
1. `taskkill /F /IM node.exe` - Kill ALL Node processes
2. Wait 2 seconds for ports to be released
3. `cd eau-members && npm run dev` - Start on port 5180
4. If port is still in use, repeat step 1

**WRONG approach:**
- Letting Vite increment ports (5181, 5182, 5183...)
- This leaves multiple servers running and wastes resources

**RIGHT approach:**
- Always ensure port 5180 is free before starting
- One server, one port, always

### Cache Management and Version Control
**CRITICAL: Always ensure the user sees the latest version of the application**

#### Known Issue: Loading Screen Stuck
- **Problem**: Application gets stuck on loading screen due to stale localStorage/sessionStorage data
- **Cause**: Cached authentication tokens from previous sessions become invalid or corrupted
- **Solution**: Clear browser cache and localStorage

#### Implemented Solutions:
1. **Automatic Cache Clearing in Development**
   - App.tsx automatically clears expired sessions on startup
   - Error boundaries clear cache on critical errors
   
2. **Manual Cache Clearing**
   - **Keyboard Shortcut**: `Ctrl+Shift+R` - Clears all cache and reloads
   - **Utility Functions**: Available in `src/utils/clearCache.ts`
   - **Error Boundary**: Shows "Clear Cache and Reload" button on errors

3. **Vite Configuration**
   - Cache-busting headers configured in `vite.config.ts`
   - No-cache headers for development server
   - Hash-based filenames for production builds

#### Developer Instructions:
- **If loading screen is stuck**:
  1. Wait 3 seconds - auto-redirect to login will happen
  2. If ErrorBoundary appears, click "Clear All Data & Go to Login" 
  3. Manual option: `Ctrl+Shift+R` to clear cache
  4. Or open DevTools > Application > Clear Storage
  5. Or use incognito/private browsing mode for testing
  
- **When testing**: Always verify in both:
  - Regular browser window (to catch cache issues)
  - Incognito window (to verify clean state works)
  - Test page reloads (F5) to ensure auth recovery works

- **Auto-Recovery Features**:
  - 3-second timeout with auto-redirect to login
  - 10-second health check with user notification
  - Corrupted token detection and cleanup
  - Multiple recovery buttons in ErrorBoundary

- **Console Messages**: Development mode shows cache-clearing instructions in console

### Supabase Connection Details
**IMPORTANT: ALWAYS USE ONLINE SUPABASE - NEVER LOCAL**
- **Online URL**: https://english-australia-eau-supabase.lkobs5.easypanel.host
- **Anon Key**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE
- **Service Role Key**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q
- **JWT Secret**: your-super-secret-jwt-token-with-at-least-32-characters-long

### Supabase Studio Access
- **Studio URL**: https://english-australia-eau-supabase.lkobs5.easypanel.host/
- **Username**: supabase
- **Password**: this_password_is_insecure_and_should_be_updated

### Email System Configuration
**CRITICAL: SMTP is fully configured and functional**
- **Email server runs on port 3001** (email-server directory)
- **SMTP settings are configured** via `/admin/smtp-settings` page and stored in Supabase
- **Email server automatically fetches SMTP config** from database when `useStoredConfig: true`
- **ALL email features use the configured SMTP** - No more configuration errors
- **Templates are professional** with EAU branding and responsive design
- **Dashboard available** at http://localhost:3001 for monitoring sent emails

#### Email System Architecture:
1. **SMTP Configuration**: Stored in `smtp_settings` table in Supabase
2. **Email Server**: Automatically fetches config from database for every email
3. **EmailService**: Uses `useStoredConfig: true` to ensure database config is used
4. **No Local Config Required**: Server always uses latest database configuration
5. **Error Prevention**: Built-in fallbacks and clear error messages

#### Email Features Implemented:
1. **Event registration confirmation** - Automatic on signup
2. **Configurable reminders** - 7 days, 3 days, 1 day, 30 min, live notifications
3. **CPD points notification** - When points are awarded
4. **Admin interface** - Configure reminder timings at `/admin/event-reminders`
5. **Professional templates** - Branded HTML emails with variables
6. **Test functionality** - Send test emails for each reminder type
7. **Auto-scroll** - Form automatically scrolls when editing reminders

#### IMPORTANT: Email Development Rules
- **ALWAYS use `useStoredConfig: true`** in email API calls
- **NEVER hardcode SMTP credentials** in any script
- **Server automatically fetches** latest config from database
- **All email features work** without additional configuration

### Project Preferences
- No demo mode should be implemented - all features must use real Supabase connection
- Use SweetAlert2 for user notifications via showNotification function
- **Use configured SMTP server** for all email functionality
- Follow existing code patterns and conventions in the codebase


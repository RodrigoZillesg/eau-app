# 🚨 SISTEMA DE EMAIL - TEST MODE

## Visão Geral

O sistema de emails possui um **modo de teste** que redireciona TODOS os emails para um endereço específico, garantindo que nenhum email seja enviado acidentalmente para usuários reais durante desenvolvimento e testes.

## Como Funciona

### Configuração (Admin)

1. Acesse: `/admin/smtp-settings`
2. Configure o servidor SMTP (host, porta, credenciais, etc.)
3. **Ative "Test Mode"**: Marque o checkbox "Enable Test Mode"
4. **Configure "Test Email"**: Digite o email que receberá TODOS os emails
5. Salve as configurações

### Comportamento em Test Mode

Quando `test_mode = true`:

✅ **TODOS os emails são redirecionados** para `test_email`
✅ **Subject é modificado**: `[TEST MODE] Assunto Original (Original to: usuario@email.com)`
✅ **Original recipient é preservado** em email_logs.metadata
✅ **Console mostra redirecionamento**: Logs claros no backend
✅ **Email_logs registra tudo**: Histórico completo mantido

### Comportamento em Production Mode

Quando `test_mode = false`:

✅ Emails são enviados para destinatários reais
✅ Subject permanece inalterado
✅ Comportamento normal do sistema

## Arquitetura Técnica

### Frontend (`eau-members/src/services/emailService.ts`)

```typescript
// Frontend SEMPRE envia o destinatário original
static async sendEmail(params: { to: string; subject: string; ... }) {
  // Backend recebe: to = 'usuario@real.com'
  const response = await fetch(getApiUrl('/email/send'), {
    body: JSON.stringify({ to: 'usuario@real.com', ... })
  });
}
```

**IMPORTANTE**: Frontend NUNCA modifica o destinatário. Sempre envia o original.

### Backend (`eau-backend/src/services/email.service.ts`)

```typescript
// Backend verifica test_mode e redireciona se necessário
const settings = await this.getEnabledSMTPSettings();

const finalRecipient = settings.test_mode && settings.test_email
  ? settings.test_email           // Redireciona para test_email
  : options.to;                    // Usa destinatário original

const finalSubject = settings.test_mode && settings.test_email
  ? `[TEST MODE] ${options.subject} (Original to: ${options.to})`
  : options.subject;

// Logs claros no console
if (settings.test_mode) {
  console.warn('🚨 TEST MODE ACTIVE - Email redirected!');
  console.warn(`  Original recipient: ${options.to}`);
  console.warn(`  Actual recipient: ${finalRecipient}`);
}
```

### Database (`smtp_settings` table)

```sql
CREATE TABLE smtp_settings (
  id UUID PRIMARY KEY,
  smtp_host TEXT NOT NULL,
  smtp_port INTEGER NOT NULL,
  smtp_username TEXT NOT NULL,
  smtp_password TEXT,
  from_email TEXT NOT NULL,
  from_name TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  test_mode BOOLEAN DEFAULT false,    -- 🚨 Flag de modo teste
  test_email TEXT,                     -- 🚨 Email de redirecionamento
  -- ... outros campos
);
```

### Email Logs (`email_logs` table)

```sql
-- Todos os emails são registrados
CREATE TABLE email_logs (
  id UUID PRIMARY KEY,
  recipient_email TEXT NOT NULL,     -- Email ORIGINAL (não modificado)
  subject TEXT NOT NULL,              -- Subject ORIGINAL
  email_type TEXT,
  status TEXT,                        -- 'sent', 'failed'
  metadata JSONB,                     -- Contém test_mode info
  created_at TIMESTAMPTZ
);

-- Exemplo de metadata em test mode:
{
  "original_to": "usuario@real.com",
  "test_mode": true,
  "actual_recipient": "teste@developer.com",
  "message_id": "..."
}
```

## Exemplos de Uso

### Exemplo 1: Email de Registro em Evento (Test Mode)

**Frontend envia:**
```json
{
  "to": "joao@example.com",
  "subject": "Registration Confirmed - Workshop 2025",
  "html": "<html>...</html>"
}
```

**Backend redireciona (test_mode = true):**
```
📧 Email enviado para: teste@developer.com
Subject: [TEST MODE] Registration Confirmed - Workshop 2025 (Original to: joao@example.com)
```

**email_logs registra:**
```json
{
  "recipient_email": "joao@example.com",  // Original mantido
  "status": "sent",
  "metadata": {
    "original_to": "joao@example.com",
    "test_mode": true,
    "actual_recipient": "teste@developer.com"
  }
}
```

### Exemplo 2: Mesmo Email em Production Mode

**Frontend envia:**
```json
{
  "to": "joao@example.com",
  "subject": "Registration Confirmed - Workshop 2025",
  "html": "<html>...</html>"
}
```

**Backend envia normalmente (test_mode = false):**
```
📧 Email enviado para: joao@example.com
Subject: Registration Confirmed - Workshop 2025
```

**email_logs registra:**
```json
{
  "recipient_email": "joao@example.com",
  "status": "sent",
  "metadata": {
    "test_mode": false,
    "message_id": "..."
  }
}
```

## Checklist de Segurança

Antes de ativar production mode:

- [ ] Teste enviado com test_mode ativo?
- [ ] Email recebido no test_email correto?
- [ ] Subject mostra "[TEST MODE]"?
- [ ] Console do backend mostra redirecionamento?
- [ ] email_logs tem metadata correto?
- [ ] Todos os tipos de email testados? (registro, CPD, pagamento, etc.)
- [ ] Backend está rodando? (porta 3001)

## Troubleshooting

### Problema: Emails não são redirecionados

**Possível causa**: Backend não está rodando
**Solução**: Iniciar backend `cd eau-backend && npm start`

### Problema: test_email não recebe emails

**Possível causa 1**: test_mode não está ativo
**Solução**: Verificar `/admin/smtp-settings` e ativar

**Possível causa 2**: test_email não configurado
**Solução**: Adicionar email de teste nas configurações

### Problema: Emails vão para usuários reais em desenvolvimento

**🚨 CRÍTICO**: Isso NÃO deve acontecer!
**Diagnóstico**:
1. Verificar smtp_settings no banco: `SELECT test_mode, test_email FROM smtp_settings;`
2. Verificar logs do backend: Deve mostrar "TEST MODE ACTIVE"
3. Verificar email_logs: metadata deve ter `test_mode: true`

**Solução**: Ativar test_mode imediatamente!

## Regras de Ouro

1. ✅ **SEMPRE** use test_mode durante desenvolvimento
2. ✅ **SEMPRE** configure test_email antes de ativar test_mode
3. ✅ **SEMPRE** verifique console do backend para confirmar redirecionamento
4. ✅ **SEMPRE** rode backend E frontend juntos para testes de email
5. ✅ **NUNCA** desative test_mode em desenvolvimento
6. ✅ **NUNCA** modifique destinatário no frontend (backend gerencia isso)

## Quando Desativar Test Mode

Test mode deve ser desativado APENAS quando:

1. ✅ Sistema está em produção
2. ✅ TODOS os testes foram concluídos com sucesso
3. ✅ Cliente autorizou envio para usuários reais
4. ✅ Monitoramento de emails está ativo
5. ✅ Backup de email_logs está configurado

---

**Última atualização**: 07/11/2025
**Versão do documento**: 1.0

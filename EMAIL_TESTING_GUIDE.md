# 📧 Guia Completo de Testes do Sistema de Emails

## 🎯 Objetivo
Validar que todo o sistema de emails está funcionando corretamente antes do deploy em produção.

## ✅ Checklist Pré-Teste

### 1. Backend Rodando
```bash
cd eau-backend
npm run dev
```
Verifique em: http://localhost:3001/health

### 2. Frontend Rodando (opcional, para visualizar)
```bash
cd eau-members
npm run dev
```
Acesse: http://localhost:5180

### 3. Configurações SMTP
- Acesse: http://localhost:5180/admin/smtp-settings
- Verifique se as configurações Brevo estão salvas:
  - **Host**: smtp-relay.brevo.com
  - **Porta**: 587
  - **Usuário**: 8bbde8001@smtp-brevo.com
  - **Email From**: eau.platty.system@gmail.com

## 🧪 Scripts de Teste Disponíveis

### 1. **test-email-system.js** - Teste Rápido
**O que faz:**
- Cria evento e inscrição
- Agenda 5 reminders para processamento imediato
- Todos os emails são enviados em sequência rápida

**Como executar:**
```bash
node test-email-system.js
```

**Tempo total:** ~30 segundos

### 2. **test-complete-email-flow.js** - Teste Completo (RECOMENDADO)
**O que faz:**
- Interface colorida e interativa
- Limpa dados de teste anteriores
- Ativa Test Mode automaticamente
- Cria evento realista
- Monitora status em tempo real
- Mostra progresso visual

**Como executar:**
```bash
# Instalar dependência se necessário
npm install axios

# Executar teste
node test-complete-email-flow.js
```

**Tempo total:** ~2 minutos

## 📬 Emails que Você Receberá

### Sequência Completa (6 emails):

1. **Email de Confirmação** (imediato)
   - Assunto: `[TEST MODE] Registration Confirmed: [Nome do Evento]`
   - Confirma inscrição no evento

2. **Reminder 7 dias** (+10 segundos)
   - Assunto: `[TEST MODE] 📅 Reminder: [Nome do Evento] is in 7 days`

3. **Reminder 3 dias** (+20 segundos)
   - Assunto: `[TEST MODE] 📅 Reminder: [Nome do Evento] is in 3 days`

4. **Reminder 1 dia** (+30 segundos)
   - Assunto: `[TEST MODE] ⏰ Tomorrow: [Nome do Evento]`

5. **Reminder 30 minutos** (+40 segundos)
   - Assunto: `[TEST MODE] 🔔 Starting Soon: [Nome do Evento]`

6. **Reminder LIVE** (+50 segundos)
   - Assunto: `[TEST MODE] 🔴 LIVE NOW: [Nome do Evento]`

## 🔍 Como Verificar se Funcionou

### ✅ Sucesso Total:
- [ ] Todos os 6 emails recebidos
- [ ] Todos com prefixo `[TEST MODE]`
- [ ] Conteúdo HTML renderizado corretamente
- [ ] Links funcionando
- [ ] Informações do evento corretas

### ⚠️ Problemas Comuns:

**1. Emails não chegam:**
- Verifique spam/lixo eletrônico
- Confirme que o backend está rodando
- Verifique logs do backend: `eau-backend/logs/`

**2. Apenas alguns emails chegam:**
- O cron job processa a cada minuto
- Aguarde até 2 minutos para todos processarem

**3. Erro de SMTP:**
- Verifique credenciais em http://localhost:5180/admin/smtp-settings
- Teste conexão com botão "Test Connection"

## 🗄️ Verificação no Banco de Dados

### Via Supabase UI:
1. Acesse: https://english-australia-eau-supabase.lkobs5.easypanel.host
2. Login: supabase / this_password_is_insecure_and_should_be_updated

### Tabelas para Verificar:

**event_reminder_jobs:**
```sql
SELECT * FROM event_reminder_jobs 
WHERE event_id IN (
  SELECT id FROM events 
  WHERE slug LIKE 'teste-emails-%'
)
ORDER BY scheduled_for;
```

**email_logs:**
```sql
SELECT * FROM email_logs 
WHERE subject LIKE '%TEST MODE%'
ORDER BY created_at DESC
LIMIT 10;
```

## 🧹 Limpeza Após Testes

### Automática (pelo script):
O script `test-complete-email-flow.js` limpa dados antigos automaticamente.

### Manual (SQL):
```sql
-- Encontrar IDs dos eventos de teste
SELECT id, title FROM events WHERE slug LIKE 'teste-emails-%';

-- Limpar tudo (substitua EVENT_ID pelo ID real)
DELETE FROM event_reminder_jobs WHERE event_id = 'EVENT_ID';
DELETE FROM event_registrations WHERE event_id = 'EVENT_ID';
DELETE FROM events WHERE id = 'EVENT_ID';

-- Desativar Test Mode
UPDATE smtp_settings SET test_mode = false;
```

## 🚀 Preparação para Produção

### 1. Desativar Test Mode
```sql
UPDATE smtp_settings SET test_mode = false;
```

### 2. Verificar Configurações
- Confirme que `enabled = true` em smtp_settings
- Verifique que todas as credenciais estão corretas

### 3. Testar em Produção (cuidadosamente)
- Crie um evento de teste real
- Use um email de teste real
- Confirme recebimento sem `[TEST MODE]`

## 📊 Monitoramento em Produção

### Logs do Backend:
```bash
# Ver logs em tempo real
tail -f eau-backend/logs/app.log

# Filtrar apenas emails
grep "Email sent" eau-backend/logs/app.log
```

### Verificar Falhas:
```sql
-- Reminders falhados
SELECT * FROM event_reminder_jobs 
WHERE status = 'failed' 
AND attempts >= 3;

-- Emails falhados
SELECT * FROM email_logs 
WHERE status = 'failed' 
ORDER BY created_at DESC;
```

## 🆘 Troubleshooting

### Backend não processa reminders:
1. Verifique se o cron está rodando:
   - Deve aparecer no console: `⏰ Running reminder check...` a cada minuto

2. Reinicie o backend:
```bash
# Ctrl+C para parar
cd eau-backend
npm run dev
```

### Emails em spam:
1. Configure SPF/DKIM no domínio
2. Use reply-to correto
3. Evite palavras spam no assunto

### Rate limiting Brevo:
- Limite: 300 emails/dia no plano free
- Monitore em: https://app.brevo.com

## 📝 Notas Importantes

1. **Test Mode é seu amigo**: Sempre teste com Test Mode ativo primeiro
2. **Monitore os logs**: Backend mostra todo o processamento
3. **Cron jobs**: Reminders são processados a cada minuto
4. **Retry automático**: Falhas são retentadas até 3x
5. **Cleanup**: Sempre limpe dados de teste após validação

## ✨ Comandos Úteis

```bash
# Ver todos os backgrounds rodando
/bashes

# Matar processo específico
/kill [bash_id]

# Verificar porta 3001
netstat -ano | findstr :3001

# Logs do backend
tail -f eau-backend/logs/app.log
```

---

**Última atualização:** Sistema completamente migrado para backend Node.js com processamento via cron jobs. Testado e validado com Brevo SMTP.
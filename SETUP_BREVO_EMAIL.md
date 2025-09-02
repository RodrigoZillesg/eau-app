# 📧 Configuração de Email com Brevo (Sendinblue)

## ✅ Passo a Passo para Configurar Brevo

### 1️⃣ Obtenha suas credenciais SMTP da Brevo

1. **Acesse sua conta Brevo:** https://app.brevo.com
2. **Vá para:** Settings → SMTP & API
3. **Copie as informações:**
   - **SMTP Server:** smtp-relay.brevo.com (ou smtp-relay.sendinblue.com)
   - **Port:** 587
   - **Login:** Seu email cadastrado na Brevo
   - **Password:** Sua Master Password SMTP (não é a senha da conta!)

### 2️⃣ Configure no Sistema

1. **Acesse:** `/admin/smtp-settings`
2. **Preencha:**
   - **SMTP Host:** smtp-relay.brevo.com
   - **SMTP Port:** 587
   - **Username:** seu-email@exemplo.com (o email da sua conta Brevo)
   - **Password:** sua-master-password-smtp (⚠️ NÃO é a senha de login!)
   - **From Email:** noreply@seudominio.com (deve ser verificado na Brevo)
   - **From Name:** English Australia
   - ✅ **Use TLS/SSL encryption:** Marcado
   - ✅ **Enable email sending:** Marcado

### 3️⃣ Deploy da Edge Function

No terminal, execute:

```bash
# Se não tiver o Supabase CLI instalado
npm install -g supabase

# Login no Supabase
supabase login

# Link ao seu projeto (substitua pelo ID do seu projeto)
supabase link --project-ref seu-projeto-id

# Deploy da função SMTP
supabase functions deploy send-email-smtp

# Opcional: Se quiser usar a API da Brevo como fallback
supabase secrets set BREVO_API_KEY="sua-api-key-brevo"
```

### 4️⃣ Teste o Envio

1. Volte para `/admin/smtp-settings`
2. Digite um email de teste
3. Clique em "Send Test"
4. Verifique sua caixa de entrada

## 🔍 Troubleshooting

### ❌ Erro: "SMTP connection failed"

**Possíveis causas:**

1. **Senha incorreta:** Você está usando a Master Password SMTP, não a senha de login?
   - Vá para Brevo → Settings → SMTP & API → Generate a new SMTP key

2. **Domínio não verificado:**
   - Vá para Brevo → Settings → Senders & IP
   - Adicione e verifique seu domínio

3. **Limite de envio atingido:**
   - Plano gratuito: 300 emails/dia
   - Verifique em Brevo → Dashboard

### ❌ Erro: "Email service not deployed"

A Edge Function não está deployada. Execute:
```bash
supabase functions deploy send-email-smtp
```

### ❌ Email vai para SPAM

1. **Configure SPF no seu DNS:**
```
TXT  @  v=spf1 include:spf.brevo.com ~all
```

2. **Configure DKIM:**
   - Brevo → Settings → Senders & IP → Configure DKIM
   - Adicione os registros TXT no seu DNS

3. **Use um domínio próprio** no "From Email", não gmail/hotmail

## 📊 Verificar Logs

```bash
# Ver logs da função
supabase functions logs send-email-smtp

# Ver logs em tempo real
supabase functions logs send-email-smtp --tail
```

## 🚀 Configuração Avançada (Opcional)

### Usar API da Brevo como Fallback

Se o SMTP falhar, o sistema tentará usar a API:

1. **Pegue sua API Key:**
   - Brevo → Settings → SMTP & API → API Keys
   - Crie uma nova key ou use existente

2. **Configure no Supabase:**
```bash
supabase secrets set BREVO_API_KEY="xkeysib-xxxxxxxxxx"
```

### Configurar Webhooks para Rastreamento

1. **Brevo → Settings → Webhooks**
2. Configure para receber notificações de:
   - Emails entregues
   - Emails abertos
   - Links clicados
   - Bounces

## 📝 Informações Importantes da Brevo

- **Limite Gratuito:** 300 emails/dia
- **Suporte SMTP:** TLS na porta 587
- **API Rate Limit:** 400 requests/segundo
- **Tamanho máximo:** 10MB por email

## 🔗 Links Úteis

- **Dashboard Brevo:** https://app.brevo.com
- **Documentação SMTP:** https://developers.brevo.com/docs/smtp-api-overview
- **Documentação API:** https://developers.brevo.com/reference/sendtransacemail
- **Status do Serviço:** https://status.brevo.com

## ✅ Checklist de Configuração

- [ ] Master Password SMTP gerada na Brevo
- [ ] Domínio verificado na Brevo
- [ ] SPF configurado no DNS
- [ ] DKIM configurado no DNS (opcional mas recomendado)
- [ ] Edge Function deployada
- [ ] Teste de envio funcionando
- [ ] Emails chegando na caixa de entrada (não SPAM)

## 🆘 Suporte

- **Suporte Brevo:** https://help.brevo.com
- **Community:** https://community.brevo.com
- **Email:** contact@brevo.com
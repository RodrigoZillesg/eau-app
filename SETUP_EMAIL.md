# 📧 Configuração de Envio de Emails

## ⚠️ Importante: Por que emails não funcionam diretamente do navegador?

Navegadores **não podem enviar emails diretamente** por questões de segurança. É necessário um servidor/backend. Aqui estão as opções:

## 🚀 Opção 1: Usar um Serviço de Email (Recomendado)

### A. Resend (Mais fácil - Grátis até 100 emails/dia)

1. **Criar conta no Resend:**
   - Acesse: https://resend.com
   - Crie uma conta gratuita
   - Pegue sua API Key

2. **Configurar no Supabase:**
   ```bash
   # No terminal, na pasta do projeto
   supabase secrets set RESEND_API_KEY="sua-api-key-aqui"
   ```

3. **Deploy da Edge Function:**
   ```bash
   supabase functions deploy send-email
   ```

### B. SendGrid (Grátis até 100 emails/dia)

1. **Criar conta no SendGrid:**
   - Acesse: https://sendgrid.com
   - Crie uma conta
   - Gere uma API Key em Settings > API Keys

2. **Configurar no Supabase:**
   ```bash
   supabase secrets set SENDGRID_API_KEY="sua-api-key-aqui"
   ```

3. **Deploy da Edge Function:**
   ```bash
   supabase functions deploy send-email
   ```

### C. SMTP2GO (Grátis até 1000 emails/mês)

1. **Criar conta no SMTP2GO:**
   - Acesse: https://www.smtp2go.com
   - Crie uma conta
   - Pegue sua API Key

2. **Configurar no Supabase:**
   ```bash
   supabase secrets set SMTP2GO_API_KEY="sua-api-key-aqui"
   ```

3. **Deploy da Edge Function:**
   ```bash
   supabase functions deploy send-email
   ```

## 🔧 Opção 2: Usar Gmail SMTP (Limitado)

### ⚠️ Limitações do Gmail:
- Máximo 500 emails/dia
- Pode ser bloqueado se parecer spam
- Requer configuração especial

### Configuração:

1. **Na sua conta Google:**
   - Ative autenticação de 2 fatores
   - Gere uma "Senha de App": https://myaccount.google.com/apppasswords
   - Selecione "Email" e "Outro"
   - Copie a senha gerada

2. **No sistema (já implementado):**
   - Vá para `/admin/smtp-settings`
   - Escolha preset "Gmail"
   - Username: seu-email@gmail.com
   - Password: senha-de-app-gerada
   - From Email: seu-email@gmail.com

## 🌐 Opção 3: API do seu Provedor de Email

Se você tem um provedor de email corporativo, eles podem oferecer uma API:

- **Microsoft 365:** Use Microsoft Graph API
- **Google Workspace:** Use Gmail API
- **Amazon SES:** Use AWS SDK

## 📝 Como testar após configurar:

1. Acesse `/admin/smtp-settings`
2. Configure as credenciais
3. Clique em "Save Settings"
4. Digite um email de teste
5. Clique em "Send Test"

## 🔍 Diagnóstico de Problemas:

### Email não chega:

1. **Verifique a caixa de SPAM**
2. **Verifique os logs no Supabase:**
   ```bash
   supabase functions logs send-email
   ```

3. **Teste a Edge Function manualmente:**
   ```bash
   curl -X POST https://seu-projeto.supabase.co/functions/v1/send-email \
     -H "Authorization: Bearer SEU_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{"to":"teste@email.com","subject":"Teste","html":"<p>Teste</p>"}'
   ```

### Erro "Email service not deployed":

A Edge Function não está deployada. Execute:
```bash
# Instale Supabase CLI se não tiver
npm install -g supabase

# Login no Supabase
supabase login

# Link ao seu projeto
supabase link --project-ref seu-projeto-id

# Deploy da função
supabase functions deploy send-email
```

## 💡 Recomendação Final:

Para produção, recomendo usar **Resend** ou **SendGrid** pois:
- São gratuitos para começar
- Têm boa entregabilidade
- Oferecem analytics
- São fáceis de configurar
- Têm suporte profissional

## 📚 Documentação das APIs:

- **Resend:** https://resend.com/docs
- **SendGrid:** https://docs.sendgrid.com
- **SMTP2GO:** https://smtp2go.com/docs

## 🆘 Precisa de Ajuda?

1. Verifique os logs do Supabase
2. Teste com diferentes provedores
3. Certifique-se que o domínio do remetente está verificado (alguns serviços exigem)
4. Configure SPF/DKIM/DMARC para melhor entregabilidade
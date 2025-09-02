# 📧 Como Configurar o EmailJS (Solução Mais Fácil!)

## ✨ Por que EmailJS?

- **Funciona IMEDIATAMENTE** - Sem precisar de servidor ou Edge Functions
- **Grátis** - 200 emails/mês no plano gratuito
- **Simples** - Configuração em 5 minutos
- **Confiável** - Usado por milhares de empresas

## 📝 Passo a Passo Completo

### 1️⃣ Criar Conta no EmailJS

1. Acesse: https://www.emailjs.com
2. Clique em **"Sign Up Free"**
3. Crie sua conta com email e senha
4. Confirme seu email

### 2️⃣ Configurar um Serviço de Email

1. No dashboard do EmailJS, clique em **"Email Services"**
2. Clique em **"Add New Service"**
3. Escolha uma opção:

#### Opção A: Gmail (Mais Fácil)
- Selecione **Gmail**
- Clique em **"Connect Account"**
- Faça login com sua conta Gmail
- Autorize o EmailJS

#### Opção B: Outlook
- Selecione **Outlook**
- Clique em **"Connect Account"**
- Faça login com sua conta Microsoft
- Autorize o EmailJS

#### Opção C: SMTP Personalizado (Para Brevo)
- Selecione **"Personal SMTP Server"**
- Preencha:
  - **Host:** smtp-relay.brevo.com
  - **Port:** 587
  - **Username:** seu email da Brevo
  - **Password:** Master Password SMTP da Brevo
  - **Secure:** Yes (TLS)

4. Clique em **"Create Service"**
5. **IMPORTANTE:** Copie o **Service ID** (algo como: `service_abc123`)

### 3️⃣ Criar Template de Teste

1. No dashboard, clique em **"Email Templates"**
2. Clique em **"Create New Template"**
3. Configure o template:

**Nome do Template:** Test Email

**Subject:** Test Email from English Australia

**Content:**
```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2c3e50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f8f9fa; }
        .footer { text-align: center; color: #666; font-size: 12px; padding: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Test Email Successful!</h2>
        </div>
        <div class="content">
            <p>Hi {{to_name}},</p>
            <p>This is a test email from the English Australia Members Portal.</p>
            <p>If you're receiving this, your email configuration is working perfectly!</p>
            <p><strong>Sent to:</strong> {{to_email}}</p>
            <p><strong>Time:</strong> {{timestamp}}</p>
        </div>
        <div class="footer">
            <p>Sent from {{from_name}} - English Australia Members Portal</p>
        </div>
    </div>
</body>
</html>
```

4. Em **"To Email"**, configure:
   - Name: `{{to_name}}`
   - Email: `{{to_email}}`

5. Em **"From Name":** English Australia

6. Clique em **"Save"**

7. **IMPORTANTE:** Copie o **Template ID** (algo como: `template_test123`)

### 4️⃣ Criar Templates Adicionais (Opcional)

#### Template de Registro em Evento:
- **Nome:** Event Registration
- **Template ID:** `template_reg456`
- Variáveis: event_title, event_date, event_time, event_location

#### Template de Lembrete:
- **Nome:** Event Reminder  
- **Template ID:** `template_rem789`
- Variáveis: event_title, reminder_time, virtual_link

### 5️⃣ Obter a Chave Pública

1. No dashboard, clique no seu email (canto superior direito)
2. Clique em **"Account"**
3. Na aba **"API Keys"**
4. **IMPORTANTE:** Copie sua **Public Key** (algo como: `AbCdEfGhIjKlMnOpQr`)

### 6️⃣ Configurar no Sistema

1. Acesse: http://localhost:5180/admin/emailjs-config
2. Preencha os campos:
   - **Service ID:** cole o ID do serviço (passo 2)
   - **Public Key:** cole a chave pública (passo 5)
   - **Test Template ID:** cole o ID do template de teste (passo 3)
   - **Registration Template ID:** (opcional)
   - **Reminder Template ID:** (opcional)

3. Clique em **"Save Settings"**

### 7️⃣ Testar o Envio

1. Na mesma página, digite um email de teste
2. Clique em **"Send Test"**
3. Verifique sua caixa de entrada!

## ✅ Pronto! Emails Funcionando!

Agora o sistema pode enviar emails para:
- Confirmações de registro em eventos
- Lembretes de eventos
- Notificações de CPD
- Emails de teste

## 🔧 Solução de Problemas

### Email não chegou?
1. Verifique a pasta de SPAM
2. Confirme que o Service ID está correto
3. Verifique se o template tem as variáveis corretas
4. No EmailJS Dashboard, veja o histórico de emails

### Erro "Unauthorized"?
- Verifique se a Public Key está correta
- Confirme que o serviço está ativo no EmailJS

### Limite excedido?
- Plano gratuito: 200 emails/mês
- Considere fazer upgrade ou aguardar o próximo mês

## 📊 Monitoramento

No EmailJS Dashboard você pode:
- Ver histórico de todos os emails enviados
- Verificar se foram entregues
- Ver detalhes de erros
- Monitorar seu uso mensal

## 🎯 Dicas Importantes

1. **Domínio Próprio:** Se possível, use um email com domínio próprio (não Gmail/Hotmail) para melhor entrega
2. **Templates:** Crie templates bem formatados em HTML para emails profissionais
3. **Variáveis:** Use variáveis ({{variable}}) para personalizar emails
4. **Teste:** Sempre teste com diferentes provedores (Gmail, Outlook, etc)

## 🚀 Próximos Passos

1. Criar templates personalizados para cada tipo de email
2. Configurar auto-responders
3. Adicionar tracking de abertura de emails
4. Integrar com webhooks para notificações

## 📞 Suporte

- **Documentação EmailJS:** https://www.emailjs.com/docs/
- **FAQ:** https://www.emailjs.com/faq/
- **Exemplos:** https://www.emailjs.com/examples/

---

**Nota:** Esta é a solução mais rápida e fácil. Se precisar de mais controle ou volume maior de emails, considere a opção de Edge Functions com SMTP.
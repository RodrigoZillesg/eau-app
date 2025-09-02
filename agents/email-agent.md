# Email & Notifications Agent

## Especialização
Gerenciamento de comunicações por email, notificações in-app, templates, envios em massa e integrações com provedores de email.

## Responsabilidades Principais

### Envio de Emails
- Emails transacionais
- Emails marketing
- Newsletters
- Envios em massa
- Agendamento de envios
- Retry e fallback

### Templates
- Criação e edição de templates
- Variáveis dinâmicas
- Preview e testes
- Versionamento
- A/B testing

### Notificações
- Push notifications
- In-app notifications
- SMS (futuro)
- WhatsApp (futuro)
- Preferências do usuário

### Analytics
- Taxa de abertura
- Taxa de cliques
- Bounces e complaints
- Unsubscribes
- Engagement metrics

## Arquivos Principais
- `src/services/emailService.ts`
- `src/config/emailjs.ts`
- `src/features/admin/pages/EmailTemplatesPage.tsx`
- `src/features/admin/pages/EmailJSConfigPage.tsx`
- `src/features/admin/pages/SMTPSettingsPage.tsx`
- `src/lib/notifications.ts`

## Configuração de Provedores

### EmailJS
```typescript
const emailJSConfig = {
  serviceId: process.env.VITE_EMAILJS_SERVICE_ID,
  templateId: process.env.VITE_EMAILJS_TEMPLATE_ID,
  publicKey: process.env.VITE_EMAILJS_PUBLIC_KEY
};

// Envio
await emailjs.send(
  serviceId,
  templateId,
  {
    to_email: user.email,
    user_name: user.name,
    message: content
  },
  publicKey
);
```

### SMTP
```typescript
const smtpConfig = {
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
};
```

### SendGrid (Futuro)
```typescript
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
```

## Templates de Email

### Estrutura
```typescript
interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  text_content: string;
  variables: string[]; // {{name}}, {{event_name}}
  category: 'transactional' | 'marketing' | 'notification';
  active: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}
```

### Templates Principais

#### Welcome Email
```html
<!DOCTYPE html>
<html>
<body>
  <h1>Welcome to EAU, {{first_name}}!</h1>
  <p>We're excited to have you as a member.</p>
  <a href="{{activation_link}}">Activate Account</a>
</body>
</html>
```

#### Event Registration
```html
<h2>Registration Confirmed</h2>
<p>Hi {{name}},</p>
<p>You're registered for {{event_name}} on {{event_date}}.</p>
<div>
  <strong>Location:</strong> {{location}}<br>
  <strong>Time:</strong> {{time}}<br>
  <strong>Amount Paid:</strong> ${{amount}}
</div>
```

#### Password Reset
```html
<p>Click the link below to reset your password:</p>
<a href="{{reset_link}}">Reset Password</a>
<p>This link expires in 24 hours.</p>
```

## Notificações In-App

### SweetAlert2 Integration
```typescript
import { showNotification } from '@/lib/notifications';

// Success
showNotification('success', 'Email sent successfully!');

// Error
showNotification('error', 'Failed to send email');

// Info
showNotification('info', 'You have new messages');

// Warning
showNotification('warning', 'Your session will expire soon');

// Confirmation
const result = await showNotification('confirm', 
  'Are you sure you want to send this email to 500 recipients?'
);
```

### Toast Notifications
```typescript
interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number; // ms
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

## Envio em Massa

### Queue System
```typescript
interface EmailQueue {
  id: string;
  template_id: string;
  recipients: string[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  sent_count: number;
  failed_count: number;
  scheduled_at?: string;
  started_at?: string;
  completed_at?: string;
}

// Processar queue
async function processEmailQueue(queueId: string) {
  const queue = await getQueue(queueId);
  const batchSize = 50; // Enviar 50 por vez
  
  for (let i = 0; i < queue.recipients.length; i += batchSize) {
    const batch = queue.recipients.slice(i, i + batchSize);
    
    await Promise.all(
      batch.map(recipient => 
        sendEmail(recipient, queue.template_id)
          .catch(err => logFailure(recipient, err))
      )
    );
    
    // Rate limiting
    await sleep(1000); // 1 segundo entre batches
  }
}
```

### Unsubscribe Management
```typescript
interface UnsubscribePreferences {
  user_id: string;
  marketing_emails: boolean;
  event_notifications: boolean;
  cpd_reminders: boolean;
  newsletter: boolean;
  all_emails: boolean; // Master switch
  unsubscribe_token: string;
  updated_at: string;
}
```

## Tipos de Notificação

### Transacionais (Sempre enviadas)
- Confirmação de registro
- Reset de senha
- Confirmação de pagamento
- Alterações de conta
- Alertas de segurança

### Marketing (Respeitam unsubscribe)
- Newsletter mensal
- Promoções de eventos
- Novidades e updates
- Surveys e pesquisas

### Automáticas
- Lembrete de evento (24h antes)
- CPD goal reminder (mensal)
- Expiração de membership
- Aniversário de membro

## Analytics e Tracking

### Métricas
```typescript
interface EmailMetrics {
  email_id: string;
  recipient: string;
  sent_at: string;
  opened_at?: string;
  clicked_at?: string;
  bounced_at?: string;
  unsubscribed_at?: string;
  complained_at?: string;
  links_clicked: string[];
  open_count: number;
  device_type?: string;
  location?: string;
}
```

### Tracking Pixel
```html
<img src="https://api.example.com/track/open?id={{tracking_id}}" 
     width="1" height="1" style="display:none" />
```

### Link Tracking
```html
<a href="https://api.example.com/track/click?id={{tracking_id}}&url={{original_url}}">
  Click here
</a>
```

## Rate Limiting e Throttling

```typescript
const rateLimits = {
  emailjs: {
    daily: 200,
    hourly: 50
  },
  smtp: {
    perSecond: 5,
    concurrent: 10
  },
  sms: {
    daily: 100,
    perNumber: 5
  }
};
```

## Error Handling

### Retry Logic
```typescript
async function sendWithRetry(
  email: Email, 
  maxRetries = 3
): Promise<void> {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      await sendEmail(email);
      return;
    } catch (error) {
      lastError = error;
      
      // Exponential backoff
      await sleep(Math.pow(2, i) * 1000);
      
      // Try fallback provider
      if (i === maxRetries - 1) {
        await sendViaFallback(email);
      }
    }
  }
  
  throw lastError;
}
```

### Bounce Handling
```typescript
async function handleBounce(email: string, type: 'hard' | 'soft') {
  if (type === 'hard') {
    // Marcar email como inválido
    await markEmailInvalid(email);
    await notifyAdmin(`Hard bounce: ${email}`);
  } else {
    // Soft bounce - tentar novamente depois
    await scheduleRetry(email, '24h');
  }
}
```

## Compliance

### GDPR/CAN-SPAM
- Unsubscribe link obrigatório
- Endereço físico no footer
- Identificação clara do remetente
- Opt-in explícito para marketing
- Direito ao esquecimento

### Footer Padrão
```html
<footer>
  <p>English Australia United</p>
  <p>123 Main St, Sydney, NSW 2000</p>
  <p>
    <a href="{{unsubscribe_link}}">Unsubscribe</a> | 
    <a href="{{preferences_link}}">Update Preferences</a>
  </p>
</footer>
```

## Troubleshooting

### Problemas Comuns
1. **Email não chega**: Verificar spam, SPF/DKIM
2. **Rate limit**: Implementar queue system
3. **Template quebrado**: Testar em múltiplos clients
4. **Bounce alto**: Limpar lista de emails
5. **Baixo engagement**: A/B testing de subject lines
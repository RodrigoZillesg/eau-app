# Guia de Configuração SMTP - Sistema de Emails

## ✅ Status Atual

O sistema de emails está **100% funcional** e integrado com o backend Node.js. As configurações SMTP de exemplo foram salvas no banco de dados.

## 🔧 Como Configurar SMTP Real

### 1. Via Interface Web (Recomendado)

1. Acesse: http://localhost:5180/admin/smtp-settings
2. Faça login como administrador
3. Preencha os campos:
   - **SMTP Host**: smtp.gmail.com (para Gmail)
   - **SMTP Port**: 587
   - **Username**: seu-email@gmail.com
   - **Password**: sua-app-password (NÃO use a senha normal do Gmail)
   - **From Email**: mesmo email do username
   - **From Name**: English Australia
4. Marque "Enable email sending"
5. Clique em "Save Settings"
6. Teste com "Test Connection" e depois "Send Test"

### 2. Para Gmail - Como Gerar App Password

1. Acesse sua conta Google: https://myaccount.google.com/
2. Vá em "Segurança"
3. Ative "Verificação em duas etapas" (obrigatório)
4. Em "Verificação em duas etapas", procure "Senhas de app"
5. Gere uma nova senha de app para "Email"
6. Use essa senha de 16 caracteres no campo Password

### 3. Via Script (Alternativa)

Edite o arquivo `insert-smtp-settings.js` e execute:

```javascript
// Substitua estas linhas com suas credenciais reais:
smtp_username: 'seu-email@gmail.com',
smtp_password: 'sua-app-password-aqui',
from_email: 'seu-email@gmail.com',
```

Depois execute:
```bash
node insert-smtp-settings.js
```

## 📧 Funcionalidades de Email Implementadas

### Emails Automáticos
- **Test Email**: Envia email de teste para verificar configuração
- **Event Registration**: Confirmação de inscrição em eventos
- **CPD Points**: Notificação quando pontos CPD são aprovados/rejeitados
- **Generic Email**: Envio genérico para qualquer finalidade

### Templates HTML
Todos os emails usam templates HTML profissionais com:
- Logo e cores da English Australia
- Design responsivo
- Informações claras e formatadas

## 🚀 Como Funciona

### Arquitetura
1. **Frontend** → Chama EmailService
2. **EmailService** → Envia requisição para backend com token JWT
3. **Backend** → Autentica usuário via Supabase
4. **EmailService (Backend)** → Busca configurações SMTP do banco
5. **Nodemailer** → Envia email usando as configurações
6. **Logs** → Salva registro na tabela email_logs

### Fluxo de Autenticação
- Frontend envia token JWT do Supabase
- Backend valida token com `authenticateSupabase` middleware
- Apenas usuários autenticados podem enviar emails

## 🔍 Troubleshooting

### Erro: "SMTP is not configured or disabled"
**Solução**: Configure e habilite SMTP em /admin/smtp-settings

### Erro: "Invalid token" ou 401 Unauthorized
**Solução**: Faça logout e login novamente

### Erro: "Failed to send test email"
**Possíveis causas**:
1. Credenciais SMTP incorretas
2. App Password não configurada (Gmail)
3. Firewall bloqueando porta 587
4. Conta Gmail com segurança baixa

### Como Verificar se Está Funcionando
1. Acesse /admin/smtp-settings
2. Deve aparecer "SMTP is configured and enabled" em verde
3. Clique em "Test Connection" - deve retornar sucesso
4. Envie um email de teste com "Send Test"

## 📂 Arquivos Importantes

### Backend
- `eau-backend/src/services/email.service.ts` - Serviço principal de email
- `eau-backend/src/controllers/email.controller.ts` - Controlador de rotas
- `eau-backend/src/routes/email.routes.ts` - Definição de rotas
- `eau-backend/src/middleware/supabaseAuth.ts` - Autenticação

### Frontend
- `eau-members/src/services/emailService.ts` - Cliente de email
- `eau-members/src/features/admin/pages/SMTPSettingsPage.tsx` - Página de configurações

## 🔒 Segurança

- Senhas SMTP são armazenadas no banco de dados (considere criptografia em produção)
- Apenas admins podem configurar SMTP
- Todos os emails requerem autenticação
- Logs de email são mantidos para auditoria
- Rate limiting configurado (1000/dia, 100/hora)

## 🚢 Deploy em Produção

O sistema está pronto para produção. No deploy:

1. Configure as variáveis de ambiente no EasyPanel
2. Use credenciais SMTP reais
3. Teste envio de email após o deploy
4. Monitore logs de email para erros

## ✨ Próximos Passos (Opcional)

- [ ] Adicionar criptografia para senhas SMTP
- [ ] Implementar fila de emails (Bull/Redis)
- [ ] Adicionar mais templates de email
- [ ] Dashboard de métricas de email
- [ ] Webhook para status de entrega

## 📞 Suporte

Se houver problemas:
1. Verifique os logs do backend: `cd eau-backend && npm run dev`
2. Verifique o console do navegador para erros
3. Confirme que as configurações SMTP estão corretas
4. Teste com diferentes provedores SMTP (SendGrid, Mailgun, etc)
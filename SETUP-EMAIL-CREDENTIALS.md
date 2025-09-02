# 📧 Configuração de Credenciais de Email

## Problema Atual
O sistema de email precisa de credenciais válidas do Gmail para funcionar. 

## Solução: Configurar Senha de App do Gmail

### Passo 1: Gerar Senha de App
1. **Vá para**: https://myaccount.google.com
2. **Clique em**: Security (Segurança)
3. **Ative**: 2-Step Verification (se não estiver ativado)
4. **Clique em**: App passwords (Senhas de app)
5. **Gere uma senha** para "Mail"
6. **Copie** a senha gerada (16 caracteres, sem espaços)

### Passo 2: Configurar no Sistema

#### Opção A: Via Interface Admin (Recomendado)
1. **Acesse**: http://localhost:5180/admin/smtp-settings
2. **Configure**:
   - Host: `smtp.gmail.com`
   - Port: `587`
   - Username: `rrzillesg@gmail.com`
   - Password: `[sua-senha-de-app-aqui]`
   - From Email: `rrzillesg@gmail.com`
   - From Name: `EAU Members System`
3. **Teste** a configuração

#### Opção B: Via Script Direto
1. **Edite** o arquivo `configure-smtp-direct.js`
2. **Substitua** `vbtf onpd eyvw ropk` pela sua senha de app
3. **Execute**: `node configure-smtp-direct.js`

### Passo 3: Testar Emails
```bash
# Configurar SMTP
node configure-smtp-direct.js

# Testar todos os lembretes
node test-reminders-now.js
```

## Exemplo de Senha de App
```
Senha original: abcd efgh ijkl mnop
Use no código: abcdefghijklmnop (sem espaços)
```

## Verificação
Após configurar, você deve ver:
- ✅ Emails sendo enviados
- ✅ Dashboard funcionando em http://localhost:3001
- ✅ Confirmações de inscrição automáticas

## Troubleshooting

### Erro: "Username and Password not accepted"
- ✅ Verifique se 2FA está ativado no Gmail
- ✅ Use senha de app, não a senha normal da conta
- ✅ Remova espaços da senha de app

### Erro: "SMTP configuration not provided"
- ✅ Execute `node configure-smtp-direct.js` primeiro
- ✅ Ou configure via interface admin

### Emails não chegando
- ✅ Verifique pasta de spam
- ✅ Confirme endereço de email correto
- ✅ Verifique dashboard: http://localhost:3001

## Status dos Servidores

```bash
# Verificar aplicação (deve estar na porta 5180)
curl http://localhost:5180

# Verificar servidor de email
curl http://localhost:3001/health
```

**Portas corretas:**
- 🌐 Aplicação: http://localhost:5180
- 📧 Email Server: http://localhost:3001
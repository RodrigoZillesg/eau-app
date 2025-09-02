# 🚀 Guia Completo: Como Fazer os Emails Funcionarem com Brevo

## 📝 O que é uma Edge Function?

Edge Function é um pequeno programa que roda no servidor do Supabase. Como o navegador não pode enviar emails diretamente (por segurança), precisamos de um servidor para fazer isso. A Edge Function é esse servidor.

## ✅ PASSO 1: Instalar o Supabase CLI (Ferramenta de Comando)

Abra o **Terminal** (ou PowerShell no Windows) e execute:

```bash
npm install -g supabase
```

**Aguarde a instalação completar** (pode demorar 1-2 minutos).

Para verificar se instalou corretamente:
```bash
supabase --version
```

Deve mostrar algo como: `1.142.2` (ou versão similar)

## ✅ PASSO 2: Fazer Login no Supabase

No terminal, execute:

```bash
supabase login
```

**O que vai acontecer:**
1. Vai abrir seu navegador automaticamente
2. Faça login na sua conta Supabase (se necessário)
3. Clique em "Authorize" para permitir o acesso
4. Volte ao terminal - deve mostrar "Logged in successfully"

## ✅ PASSO 3: Conectar ao Seu Projeto

### 3.1 Primeiro, descubra o ID do seu projeto:

1. Acesse o Supabase Dashboard: https://app.supabase.com
2. Clique no seu projeto
3. Vá em **Settings** (⚙️) → **General**
4. Copie o **Reference ID** (algo como: `lkobs5xxxxxx`)

### 3.2 No terminal, navegue até a pasta do projeto:

```bash
cd C:\Users\rrzil\Documents\Projetos\EAU React
```

### 3.3 Conecte ao projeto:

```bash
supabase link --project-ref SEU_REFERENCE_ID_AQUI
```

**Exemplo:**
```bash
supabase link --project-ref lkobs5xxxxxx
```

**Vai pedir a senha do banco de dados:**
- Digite a senha que você criou quando configurou o Supabase
- Se não lembrar, pode resetar em: Settings → Database → Reset Database Password

## ✅ PASSO 4: Configurar Variáveis de Ambiente (Opcional mas Recomendado)

Se você quiser usar a API da Brevo como backup (caso SMTP falhe):

### 4.1 Pegue sua API Key da Brevo:

1. Acesse: https://app.brevo.com
2. Vá em: **Settings** → **SMTP & API** → **API Keys**
3. Copie sua API key (começa com `xkeysib-`)

### 4.2 Configure no Supabase:

```bash
supabase secrets set BREVO_API_KEY="xkeysib-XXXXXXXXXXXXXXXX"
```

## ✅ PASSO 5: Fazer Deploy da Edge Function

Agora vamos enviar a função para o servidor:

```bash
supabase functions deploy send-email-smtp
```

**O que vai acontecer:**
- Vai compilar a função
- Fazer upload para o Supabase
- Deve mostrar: "Function deployed successfully"

## ✅ PASSO 6: Testar se Funcionou

1. **Volte ao sistema:** http://localhost:5180/admin/smtp-settings
2. **Verifique as configurações:**
   - Host: `smtp-relay.brevo.com`
   - Port: `587`
   - Username: seu email da Brevo
   - Password: Master Password SMTP (não a senha de login!)
3. **Clique em "Send Test"**
4. **Verifique seu email** (incluindo SPAM)

## 🔍 PASSO 7: Verificar Logs (Se Houver Problemas)

Para ver o que está acontecendo:

```bash
supabase functions logs send-email-smtp
```

Para ver logs em tempo real:
```bash
supabase functions logs send-email-smtp --tail
```

## ❌ Problemas Comuns e Soluções

### Erro: "command not found: supabase"
**Solução:** O Supabase CLI não foi instalado. Execute novamente:
```bash
npm install -g supabase
```

### Erro: "Project not linked"
**Solução:** Você precisa executar o `supabase link` primeiro (Passo 3)

### Erro: "Invalid credentials"
**Solução:** A senha do banco está errada. Resete em Settings → Database

### Erro: "Function not found"
**Solução:** O deploy não funcionou. Tente novamente:
```bash
supabase functions deploy send-email-smtp
```

### Email não chega
**Possíveis causas:**
1. **Master Password errada** - Gere uma nova na Brevo
2. **Domínio não verificado** - Verifique seu domínio na Brevo
3. **Está no SPAM** - Verifique a pasta de SPAM

## 📊 Comandos Úteis

```bash
# Ver status do projeto
supabase status

# Ver lista de funções
supabase functions list

# Deletar uma função (se precisar)
supabase functions delete send-email-smtp

# Ver todas as variáveis secretas
supabase secrets list
```

## ✅ Checklist Final

- [ ] Supabase CLI instalado (`supabase --version` funciona)
- [ ] Login feito (`supabase login` executado com sucesso)
- [ ] Projeto linkado (`supabase link --project-ref xxx` executado)
- [ ] Edge Function deployada (`supabase functions deploy send-email-smtp`)
- [ ] Configurações SMTP corretas no sistema
- [ ] Master Password SMTP da Brevo (não a senha de login!)
- [ ] Email de teste enviado com sucesso

## 🎉 Pronto!

Quando todos os passos estiverem completos, seus emails estarão funcionando!

### Como funciona agora:
1. Você clica em "Send Test" no sistema
2. O sistema chama a Edge Function no Supabase
3. A Edge Function conecta na Brevo via SMTP
4. A Brevo envia o email real
5. O email chega no destinatário

## 🆘 Precisa de Ajuda?

Se algo não funcionou:
1. Copie a mensagem de erro completa
2. Execute `supabase functions logs send-email-smtp`
3. Copie os logs
4. Me mostre para eu poder ajudar!

---

**DICA:** Salve este arquivo! Você vai precisar fazer deploy sempre que atualizar a função.
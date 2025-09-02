# Como fazer Deploy da Edge Function para Envio de Emails SMTP

## Passo 1: Faça login no Supabase Dashboard
1. Acesse: https://supabase.com/dashboard
2. Faça login com sua conta

## Passo 2: Crie um Access Token
1. Vá para: https://supabase.com/dashboard/account/tokens
2. Clique em "Generate new token"
3. Dê um nome: "EAU Email Function"
4. Copie o token gerado (será mostrado apenas uma vez!)

## Passo 3: Configure o Token Localmente
Execute no terminal:
```bash
cd "C:\Users\rrzil\Documents\Projetos\EAU React"
set SUPABASE_ACCESS_TOKEN=seu-token-aqui
```

## Passo 4: Link com seu Projeto Supabase
1. Vá para o dashboard do seu projeto: https://supabase.com/dashboard/project/_
2. Vá em Settings > General
3. Copie o "Reference ID" do projeto (algo como: lkobs5ea)
4. Execute:
```bash
npx supabase link --project-ref seu-reference-id
```

## Passo 5: Deploy da Edge Function
Execute:
```bash
npx supabase functions deploy send-email-smtp
```

## Passo 6: Configure as Variáveis de Ambiente (Opcional)
Se quiser usar Brevo API como fallback:
1. No dashboard do Supabase, vá em Edge Functions
2. Clique na função "send-email-smtp"
3. Vá em Settings
4. Adicione a variável: BREVO_API_KEY = sua-api-key

## Passo 7: Teste a Função
A função já está integrada no código! Basta:
1. Ir em http://localhost:5180/admin/smtp-settings
2. Configurar seu SMTP
3. Clicar em "Send Test"

## Informações Importantes:
- A Edge Function já está criada em: `/supabase/functions/send-email-smtp/`
- Ela lê as configurações SMTP do banco de dados
- Suporta fallback para Brevo API se configurado
- Autentica usuários automaticamente

## Comandos Úteis:
```bash
# Ver logs da função
npx supabase functions logs send-email-smtp

# Ver status das funções
npx supabase functions list

# Deletar função (se necessário)
npx supabase functions delete send-email-smtp
```
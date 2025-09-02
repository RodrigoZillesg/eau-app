# Deploy Edge Function for User Import

## ⚠️ IMPORTANTE: Você precisa fazer deploy da Edge Function antes de poder importar usuários com autenticação!

## Passo a Passo:

### 1. Instale o Supabase CLI (se ainda não tiver)
```bash
npm install -g supabase
```

### 2. Faça login no Supabase
```bash
supabase login
```

### 3. Obtenha o Project Reference
- Acesse: https://english-australia-eau-supabase.lkobs5.easypanel.host
- Vá em Settings → General
- Copie o "Reference ID" do projeto

### 4. Link o projeto
```bash
cd eau-members
supabase link --project-ref [YOUR-PROJECT-REF]
```

### 5. Deploy da Edge Function
```bash
supabase functions deploy import-users
```

### 6. Configure as variáveis de ambiente no Supabase
No painel do Supabase:
- Vá em Settings → Edge Functions
- Adicione as seguintes variáveis:
  - `SUPABASE_URL`: https://english-australia-eau-supabase.lkobs5.easypanel.host
  - `SUPABASE_SERVICE_ROLE_KEY`: (sua service role key)

## Como obter a Service Role Key:
1. Acesse o painel do Supabase
2. Vá em Settings → API
3. Copie a "service_role" key (⚠️ NUNCA exponha essa chave publicamente!)

## Alternativa: Importação sem Edge Function

Se não quiser fazer deploy da Edge Function, você tem duas opções:

### Opção 1: Importar sem criar contas de autenticação
- Desmarque "Create authentication accounts"
- Importe apenas os dados dos membros
- Crie contas manualmente depois

### Opção 2: Script Python/Node.js local
Posso criar um script que roda localmente com a service role key para importar usuários com autenticação. Seria mais seguro e não precisaria de deploy.

## Verificando se a Edge Function está funcionando:

Após o deploy, teste com:
```bash
curl -X POST https://english-australia-eau-supabase.lkobs5.easypanel.host/functions/v1/import-users \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"users": [], "createAuth": false}'
```

Deve retornar:
```json
{"total":0,"successful":0,"failed":0,"existing":0,"errors":[]}
```
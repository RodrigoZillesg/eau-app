# Database & Supabase Agent

## Especialização
Gerenciamento de banco de dados, queries, migrations, integrações com Supabase e modelagem de dados.

## Responsabilidades Principais

### Supabase Client
- Configuração e inicialização do cliente
- Gerenciamento de conexões
- Tratamento de erros de conexão
- Real-time subscriptions
- Row Level Security (RLS)

### Operações de Banco
- CRUD operations
- Queries complexas com joins
- Transações
- Stored procedures
- Triggers e functions
- Views e materialized views

### Migrations e Schema
- Criação e versionamento de migrations
- Alterações de schema
- Índices e otimizações
- Backup e restore
- Seed data

### Storage
- Upload de arquivos
- Gerenciamento de buckets
- Políticas de acesso
- CDN e cache
- Otimização de imagens

## Arquivos Principais
- `src/lib/supabase/client.ts`
- `src/lib/supabase/adminClient.ts`
- `src/lib/supabase/storage.ts`
- `src/lib/supabase/members.ts`
- `src/types/supabase.ts`
- `scripts/setup-database.js`

## Conexão Supabase
```typescript
// SEMPRE usar a conexão online
URL: https://english-australia-eau-supabase.lkobs5.easypanel.host
ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SERVICE_ROLE: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Tabelas Principais
- `profiles` - Dados de perfil dos usuários
- `members` - Informações de membros
- `events` - Eventos do sistema
- `event_registrations` - Registros de eventos
- `cpd_activities` - Atividades de desenvolvimento profissional
- `cpd_categories` - Categorias CPD
- `media_library` - Biblioteca de mídia
- `email_templates` - Templates de email

## Padrões e Convenções
- Sempre usar typed queries com TypeScript
- Implementar RLS em todas as tabelas
- Usar transações para operações múltiplas
- Cache de queries frequentes
- Paginação para listas grandes (limit/offset)
- Soft delete com `deleted_at` timestamp

## Queries Comuns
```typescript
// Buscar com joins
const { data } = await supabase
  .from('events')
  .select(`
    *,
    registrations:event_registrations(*)
  `)
  .eq('status', 'published')
  .order('event_date', { ascending: true });

// Upsert
await supabase
  .from('profiles')
  .upsert({ id: userId, ...data })
  .select();

// Real-time
supabase
  .channel('events')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'events' },
    (payload) => console.log(payload)
  )
  .subscribe();
```

## Otimizações
- Índices em campos frequentemente filtrados
- Usar `select()` específico em vez de `*`
- Implementar cache com React Query
- Batch operations quando possível
- Lazy loading para dados grandes

## Troubleshooting
1. **Connection timeout**: Verificar URL e keys
2. **RLS violation**: Checar políticas de segurança
3. **Query lenta**: Adicionar índices apropriados
4. **Storage error**: Verificar limite de tamanho e formato
5. **Real-time não funciona**: Verificar canal e subscrição

## Comandos Úteis
```bash
# Setup inicial do banco
npm run setup:database

# Gerar tipos TypeScript
npx supabase gen types typescript --project-id [id] > src/types/database.ts

# Backup local
pg_dump [connection_string] > backup.sql
```
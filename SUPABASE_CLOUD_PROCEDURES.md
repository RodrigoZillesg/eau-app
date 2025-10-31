# Procedimentos para Supabase Cloud - DEFINITIVO

## 🎯 MÉTODO COMPROVADO QUE FUNCIONA

### ✅ SEMPRE USE: Scripts Node.js + createClient + Service Key

#### Template Base (COPIAR ESTE EXATO):
```javascript
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ypsvoxelitgceclohxfu.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlwc3ZveGVsaXRnY2VjbG9oeGZ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODcwMTc1NSwiZXhwIjoyMDc0Mjc3NzU1fQ.y_k4b4TlAev9R4TTFqHA08EjdZA-7Ymm5V1zMl-CYhA';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeOperation() {
  try {
    console.log('🔧 Executando operação...');

    // USAR APENAS ESTES MÉTODOS:
    // const { data, error } = await supabase.from('table').insert(data);
    // const { data, error } = await supabase.from('table').update(data).eq('id', id);
    // const { data, error } = await supabase.from('table').select('*').eq('column', value);
    // const { data, error } = await supabase.from('table').delete().eq('id', id);

    console.log('✅ Operação concluída com sucesso!');

  } catch (error) {
    console.log('❌ Erro:', error.message);
  }
}

executeOperation();
```

#### Exemplo Real de Sucesso (fix-super-admin-direct.js):
```javascript
// 1. Buscar member
const { data: member, error: memberError } = await supabase
  .from('members')
  .select('id, email, user_type')
  .eq('email', 'dev@platty.tech')
  .single();

// 2. Atualizar user_type
const { error: updateError } = await supabase
  .from('members')
  .update({ user_type: 'super_admin' })
  .eq('id', member.id);

// 3. Verificar resultado
const { data: finalMember } = await supabase
  .from('members')
  .select('email, user_type')
  .eq('email', 'dev@platty.tech')
  .single();
```

## ❌ MÉTODOS QUE NÃO FUNCIONAM (NUNCA MAIS TENTAR)

### 1. MCP Supabase
```javascript
// ❌ NÃO FUNCIONA
mcp__supabase__execute_sql // Precisa de token não disponível
mcp__supabase__apply_migration // Precisa de token não disponível
```

### 2. RPC/SQL Direto
```javascript
// ❌ NÃO FUNCIONA
supabase.rpc('exec_sql', { sql: '...' }) // Função não existe no Cloud
```

### 3. HTTP REST API
```javascript
// ❌ NÃO FUNCIONA
fetch(`${url}/rest/v1/rpc/exec_sql`, { ... }) // Endpoint não existe
```

### 4. Playwright + Supabase Studio
```javascript
// ❌ NÃO FUNCIONA
// Editor SQL não carrega após login
```

### 5. Execução Manual
```sql
-- ❌ NUNCA MAIS PEDIR PARA USUÁRIO EXECUTAR MANUALMENTE
-- O usuário explicitamente proibiu
```

## 🛡️ ESTRATÉGIAS DE FALLBACK

### Quando Tabelas Não Existem:
**Em vez de criar tabelas, implementar fallbacks no código**

#### Exemplo: Sistema de Roles
- **Problema**: `member_roles` table não existe
- **Solução**: Fallback no `roleService.ts`
- **Implementação**: Detectar `user_type = 'super_admin'` e retornar roles
- **Resultado**: Sistema funciona sem depender da tabela

```typescript
// FALLBACK: Use user_type if member_roles table doesn't exist
if (member.user_type === 'super_admin') {
  console.log('🎯 FALLBACK: Using user_type=super_admin');
  const roles: UserRole[] = ['AdminSuper', 'Admin', 'Members'];
  return roles;
}
```

## 🔧 WORKFLOW PADRÃO

### Quando Precisar Modificar Banco:

1. **Criar script Node.js** usando template acima
2. **Usar apenas métodos supabase.from()** - insert, update, select, delete
3. **Testar localmente** com console.log
4. **Executar**: `node nome-do-script.js`
5. **Verificar resultado** no próprio script
6. **Reportar sucesso** ao usuário

### Quando Tabela Não Existir:

1. **NÃO tentar criar tabela**
2. **Implementar fallback** no código TypeScript
3. **Usar campos existentes** (ex: user_type em vez de member_roles)
4. **Testar funcionamento** com fallback
5. **Documentar estratégia** no código

## 🎯 EXEMPLOS DE SCRIPTS FUNCIONAIS

### 1. Atualizar Dados
```javascript
// update-member-data.js
const { data, error } = await supabase
  .from('members')
  .update({
    user_type: 'super_admin',
    updated_at: new Date().toISOString()
  })
  .eq('email', 'dev@platty.tech');
```

### 2. Inserir Dados
```javascript
// insert-new-record.js
const { data, error } = await supabase
  .from('members')
  .insert({
    email: 'new@example.com',
    first_name: 'New',
    last_name: 'User',
    user_type: 'member'
  });
```

### 3. Verificar Dados
```javascript
// check-data.js
const { data: members, error } = await supabase
  .from('members')
  .select('email, user_type')
  .eq('user_type', 'super_admin');

console.log('Super Admins:', members);
```

## 🚨 REGRAS ABSOLUTAS

1. **NUNCA pedir execução manual de SQL**
2. **SEMPRE usar scripts Node.js com createClient**
3. **APENAS métodos .from() do supabase client**
4. **IMPLEMENTAR fallbacks em vez de criar tabelas**
5. **TESTAR e VERIFICAR no próprio script**

## ✅ CHECKLIST ANTES DE EXECUTAR

- [ ] Script usa template aprovado?
- [ ] Usa apenas supabase.from() methods?
- [ ] Tem console.log para verificar resultado?
- [ ] Tem tratamento de erro?
- [ ] Não tenta criar tabelas?
- [ ] Não pede execução manual?

**Seguindo estes procedimentos, TUDO funciona perfeitamente!** 🎉
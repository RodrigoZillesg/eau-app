# 🎯 PLANO DE CORREÇÃO DEFINITIVO - SISTEMA DE USER TYPES

**Data:** 04/11/2025
**Status:** 🔴 CRÍTICO - Sistema inconsistente em múltiplas áreas
**Objetivo:** Resolver DEFINITIVAMENTE todos os problemas relacionados a User Types

---

## 📊 DIAGNÓSTICO DO PROBLEMA

### Sintomas Identificados:
1. ✅ CSV import não detecta Institution Admins corretamente
2. ✅ Mudanças em uma área quebram outras (domino effect)
3. ✅ Falta de consistência entre: Database → Import → Frontend → Auth
4. ✅ Documentação desatualizada causando retrabalho

### Impacto:
- 🔴 **CRÍTICO**: Afeta autenticação, permissões, RLS policies
- 🔴 **CRÍTICO**: Afeta todas as funcionalidades do sistema
- 🔴 **CRÍTICO**: Pode gerar brechas de segurança

---

## 🔍 FASE 1: AUDITORIA COMPLETA (2-3 horas)

### 1.1 Inventário de Todos os Pontos de Contato
**Objetivo:** Mapear TODOS os locais onde user_type é usado ou afetado

**Checklist:**
- [ ] **Database Schema**
  - [ ] Tabela `members` - campo `user_type`
  - [ ] Valores permitidos e constraints
  - [ ] Triggers ou procedures que afetam user_type
  - [ ] RLS policies que dependem de user_type

- [ ] **Backend Services**
  - [ ] `roleService.ts` - mapeamento de roles
  - [ ] `members.ts` - CRUD operations
  - [ ] `institutionService.ts` - lógica de Institution Admin
  - [ ] Função `is_admin()` no PostgreSQL

- [ ] **CSV Import System**
  - [ ] `CompleteImportPage.tsx` - lógica de detecção
  - [ ] Algoritmo de detecção atual
  - [ ] Casos de teste conhecidos

- [ ] **Manual Member Creation**
  - [ ] `MemberForm.tsx` - dropdown de user_type
  - [ ] Validações e regras de negócio
  - [ ] Permissões para atribuir tipos

- [ ] **Frontend Display**
  - [ ] `MembersListEnhanced.tsx` - coluna e filtro
  - [ ] `AdminDashboard.tsx` - stats de user types
  - [ ] Outros componentes que mostram user_type

- [ ] **Authentication & Authorization**
  - [ ] `usePermissions.ts` - verificação de permissões
  - [ ] `RoleBasedRoute.tsx` - proteção de rotas
  - [ ] `authStore.ts` - gerenciamento de state
  - [ ] Mapeamento user_type → UserRole

**Deliverable:** Documento `USER_TYPE_INVENTORY.md` com todos os pontos mapeados

---

## 🧪 FASE 2: ANÁLISE DE DADOS REAIS (1-2 horas)

### 2.1 Análise do CSV de Produção
**Objetivo:** Entender exatamente o que vem no CSV e como deve ser mapeado

**Queries de Análise:**
```sql
-- 1. Quantos membros temos por user_type atual?
SELECT user_type, COUNT(*) as total
FROM members
GROUP BY user_type
ORDER BY total DESC;

-- 2. Quem são os Primary Contacts (deveriam ser Institution Admins)?
SELECT m.id, m.email, m.first_name, m.last_name, m.user_type,
       i.name as institution_name
FROM members m
JOIN institutions i ON m.institution_id = i.id
WHERE m.id IN (
  SELECT primary_contact_id FROM institutions WHERE primary_contact_id IS NOT NULL
);

-- 3. Qual a discrepância? (Primary Contacts que NÃO são institution_admin)
SELECT m.id, m.email, m.first_name, m.last_name, m.user_type,
       i.name as institution_name,
       'SHOULD BE institution_admin' as issue
FROM members m
JOIN institutions i ON m.institution_id = i.id
WHERE m.id IN (
  SELECT primary_contact_id FROM institutions WHERE primary_contact_id IS NOT NULL
)
AND m.user_type != 'institution_admin';

-- 4. Verificar member_roles vs user_type (inconsistências)
SELECT m.email, m.user_type,
       STRING_AGG(mr.role, ', ') as roles_in_table
FROM members m
LEFT JOIN member_roles mr ON m.id = mr.member_id
GROUP BY m.id, m.email, m.user_type
HAVING m.user_type IS DISTINCT FROM STRING_AGG(mr.role, ', ')
LIMIT 50;
```

**Tarefas:**
- [ ] Executar queries acima e documentar resultados
- [ ] Obter amostra do CSV original (últimos 100 registros)
- [ ] Identificar padrões nos campos "Member Groups", "primaryContactUserId"
- [ ] Criar tabela de mapeamento esperado vs atual

**Deliverable:** Documento `USER_TYPE_DATA_ANALYSIS.md` com resultados e insights

---

## 📋 FASE 3: DEFINIÇÃO DA FONTE DA VERDADE (30 min)

### 3.1 Estabelecer o "Single Source of Truth"
**Decisão a ser tomada:**

```
┌─────────────────────────────────────────────────────┐
│  FONTE DA VERDADE: Campo `user_type` na tabela     │
│  `members` do PostgreSQL                            │
│                                                     │
│  Valores permitidos:                                │
│  - 'member'             (default)                   │
│  - 'institution_admin'  (Primary Contacts)          │
│  - 'admin'              (System Admins)             │
│  - 'super_admin'        (dev@platty.tech)           │
│                                                     │
│  DEPRECATED: Tabela `member_roles`                  │
│  - Existe no schema mas NÃO deve ser usada          │
│  - Manter apenas para histórico/migração            │
└─────────────────────────────────────────────────────┘
```

### 3.2 Regras de Negócio Definitivas

**Regra 1: Detecção Automática no CSV Import**
```typescript
if (email === 'dev@platty.tech') {
  userType = 'super_admin'
} else if (memberGroups.includes('admin')) {
  userType = 'admin'
} else if (isPrimaryContactOfInstitution) {
  userType = 'institution_admin'
} else {
  userType = 'member'
}
```

**Regra 2: Quem Pode Atribuir User Types**
```
super_admin → pode atribuir: member, institution_admin, admin, super_admin
admin       → pode atribuir: member, institution_admin, admin
inst_admin  → pode atribuir: member (apenas)
member      → não pode atribuir
```

**Regra 3: Mapeamento para Roles da Aplicação**
```typescript
user_type: 'super_admin'      → roles: ['AdminSuper', 'Admin', 'Members']
user_type: 'admin'            → roles: ['Admin', 'Members']
user_type: 'institution_admin' → roles: ['InstitutionAdmin', 'Members']
user_type: 'member'           → roles: ['Members']
```

**Deliverable:** Este próprio documento com as regras aprovadas

---

## 🔨 FASE 4: IMPLEMENTAÇÃO CORRETIVA (4-6 horas)

### 4.1 Database - Garantir Integridade (30 min)
```sql
-- 1. Adicionar constraint para valores válidos
ALTER TABLE members
DROP CONSTRAINT IF EXISTS members_user_type_check;

ALTER TABLE members
ADD CONSTRAINT members_user_type_check
CHECK (user_type IN ('member', 'institution_admin', 'admin', 'super_admin'));

-- 2. Corrigir Primary Contacts que não são institution_admin
UPDATE members m
SET user_type = 'institution_admin'
WHERE m.id IN (
  SELECT primary_contact_id
  FROM institutions
  WHERE primary_contact_id IS NOT NULL
)
AND m.user_type != 'institution_admin';

-- 3. Garantir dev@platty.tech como super_admin
UPDATE members
SET user_type = 'super_admin'
WHERE email = 'dev@platty.tech';

-- 4. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_members_user_type
ON members(user_type);
```

**Tasks:**
- [ ] Executar migration acima
- [ ] Verificar integridade: `SELECT COUNT(*) FROM members WHERE user_type IS NULL;`
- [ ] Documentar em `DATABASE_SCHEMA.md`

---

### 4.2 CSV Import - Lógica Robusta (2 horas)

**Arquivo:** `eau-members/src/features/admin/pages/CompleteImportPage.tsx`

**Melhorias Necessárias:**

1. **Detecção Melhorada de Institution Admin:**
```typescript
// BEFORE (buggy):
if (record.primaryContactUserId &&
    parseInt(record.userId) === parseInt(record.primaryContactUserId)) {
  userType = 'institution_admin'
}

// AFTER (robust):
const isPrimaryContact = () => {
  // Método 1: Comparar IDs do CSV
  if (record.primaryContactUserId && record.userId) {
    if (parseInt(record.userId) === parseInt(record.primaryContactUserId)) {
      return true
    }
  }

  // Método 2: Verificar se já existe instituição com esse email como primary
  const institution = importedInstitutions.find(
    inst => inst.primary_contact_email === record.memberEmail
  )
  if (institution) {
    return true
  }

  // Método 3: Verificar campo específico no CSV (se existir)
  if (record.memberGroups?.toLowerCase().includes('primary contact')) {
    return true
  }

  return false
}

if (isPrimaryContact()) {
  userType = 'institution_admin'
  console.log(`✅ Institution Admin detected: ${record.memberEmail}`)
}
```

2. **Logging Detalhado:**
```typescript
// Adicionar logs para cada decisão
console.log(`
📋 USER TYPE DETECTION FOR: ${record.memberEmail}
  - Member Groups: ${record.memberGroups}
  - User ID: ${record.userId}
  - Primary Contact ID: ${record.primaryContactUserId}
  - Is Primary Contact: ${isPrimaryContact()}
  - Final User Type: ${userType}
`)
```

3. **Validação Pós-Import:**
```typescript
// Após importar todos os membros, validar:
const validationResults = {
  totalImported: 0,
  byUserType: {
    super_admin: 0,
    admin: 0,
    institution_admin: 0,
    member: 0
  },
  primaryContactsDetected: 0,
  potentialIssues: []
}

// Preencher estatísticas e mostrar ao usuário
showImportSummary(validationResults)
```

**Tasks:**
- [ ] Implementar melhorias acima
- [ ] Criar testes com CSV de amostra
- [ ] Documentar algoritmo em `CSV_IMPORT_USER_TYPE_MAPPING.md`

---

### 4.3 Manual Form - Consistência (1 hora)

**Arquivo:** `eau-members/src/features/admin/components/MemberForm.tsx`

**Verificações:**
- [ ] Dropdown mostra 4 opções corretas
- [ ] Permissões de atribuição funcionam (super_admin pode tudo, etc.)
- [ ] Ao editar, user_type atual é pré-selecionado
- [ ] Ao salvar, user_type é enviado corretamente ao backend
- [ ] Validação: não pode remover super_admin de dev@platty.tech

**Código de Proteção:**
```typescript
const handleSubmit = async () => {
  // Proteção: não permitir alterar dev@platty.tech
  if (member?.email === 'dev@platty.tech' && formData.user_type !== 'super_admin') {
    showNotification('error', 'Cannot change user type for system administrator')
    return
  }

  // Proteção: verificar permissão para atribuir o tipo escolhido
  if (!canAssignUserType(formData.user_type)) {
    showNotification('error', `You don't have permission to assign ${formData.user_type}`)
    return
  }

  // Continuar com save...
}
```

---

### 4.4 RLS & Auth - Segurança (1 hora)

**Verificações:**
- [ ] Função `is_admin()` usa `user_type` (já corrigido)
- [ ] `roleService.ts` mapeia corretamente
- [ ] `usePermissions` retorna roles corretas
- [ ] Rotas protegidas funcionam com novos tipos

**Testes Manuais:**
```typescript
// Criar script de teste: test-user-types.ts
const testUserTypes = async () => {
  const testCases = [
    { email: 'dev@platty.tech', expectedRoles: ['AdminSuper', 'Admin', 'Members'] },
    { email: 'admin@test.com', expectedRoles: ['Admin', 'Members'] },
    { email: 'inst.admin@test.com', expectedRoles: ['InstitutionAdmin', 'Members'] },
    { email: 'regular@test.com', expectedRoles: ['Members'] }
  ]

  for (const test of testCases) {
    const roles = await fetchUserRolesByEmail(test.email)
    console.assert(
      JSON.stringify(roles.sort()) === JSON.stringify(test.expectedRoles.sort()),
      `FAILED: ${test.email} - Expected ${test.expectedRoles}, Got ${roles}`
    )
  }
}
```

---

### 4.5 Frontend Display - Consistência (30 min)

**Arquivos a Verificar:**
- [ ] `MembersListEnhanced.tsx` - coluna e filtro (já corrigido)
- [ ] `AdminDashboard.tsx` - adicionar stats de user types
- [ ] `MemberDetailsPage.tsx` - mostrar user_type no perfil
- [ ] Qualquer outro local que mostre informações de membro

**Adicionar ao Dashboard:**
```typescript
const userTypeStats = {
  super_admins: members.filter(m => m.user_type === 'super_admin').length,
  admins: members.filter(m => m.user_type === 'admin').length,
  institution_admins: members.filter(m => m.user_type === 'institution_admin').length,
  members: members.filter(m => m.user_type === 'member').length,
}

// Exibir em cards no dashboard
```

---

## ✅ FASE 5: TESTES COMPLETOS (2-3 horas)

### 5.1 Testes de Integração

**Cenário 1: CSV Import → Institution Admin Detection**
```
1. Preparar CSV com Primary Contacts identificáveis
2. Executar import completo
3. Verificar que Primary Contacts foram criados como institution_admin
4. Verificar logs de detecção
5. Conferir no banco: SELECT * FROM members WHERE user_type = 'institution_admin'
```

**Cenário 2: Manual Creation → Todas as Combinações**
```
1. Como super_admin: criar member, institution_admin, admin, super_admin ✅
2. Como admin: criar member, institution_admin, admin ✅ / super_admin ❌
3. Como institution_admin: criar member ✅ / outros ❌
4. Verificar que permissões foram respeitadas
```

**Cenário 3: Authentication → Correct Roles**
```
1. Login como super_admin → verificar roles retornadas
2. Login como admin → verificar roles retornadas
3. Login como institution_admin → verificar roles retornadas
4. Login como member → verificar roles retornadas
5. Testar acesso a rotas protegidas para cada tipo
```

**Cenário 4: RLS Policies → Data Access**
```
1. Como super_admin: deve ver todos os membros
2. Como admin: deve ver todos os membros
3. Como institution_admin: deve ver apenas membros da sua instituição
4. Como member: deve ver apenas seu próprio perfil
```

**Cenário 5: Bulk Delete → Cascade Behavior**
```
1. Deletar members de teste
2. Verificar que foreign keys foram tratados
3. Confirmar que não quebrou o sistema
```

### 5.2 Testes de Regressão

**Checklist de Funcionalidades Críticas:**
- [ ] Login/Logout funciona
- [ ] Dashboard carrega
- [ ] Lista de membros carrega e filtra
- [ ] Criar membro manual funciona
- [ ] Editar membro funciona
- [ ] Importar CSV funciona
- [ ] Bulk operations funcionam
- [ ] CPD system funciona (depende de permissões)
- [ ] Events system funciona (depende de permissões)

---

## 📚 FASE 6: DOCUMENTAÇÃO FINAL (1 hora)

### 6.1 Atualizar Documentação

**Arquivos a Atualizar:**
- [ ] `CLAUDE.md` - Seção "SISTEMA DE USER TYPES"
- [ ] `DATABASE_SCHEMA.md` - Tabela members, campo user_type
- [ ] `CSV_IMPORT_USER_TYPE_MAPPING.md` - Algoritmo atualizado
- [ ] `RESUMO_MUDANCAS_USER_TYPES.md` - Adicionar esta correção

### 6.2 Criar Documentação Nova

**Criar:** `USER_TYPE_SYSTEM_COMPLETE_GUIDE.md`
```markdown
# Sistema de User Types - Guia Completo

## Visão Geral
- Como funciona
- Arquitetura
- Fluxo de dados

## Regras de Negócio
- Detecção automática
- Permissões
- Mapeamento

## Troubleshooting
- Problemas comuns
- Como debugar
- Logs importantes

## Manutenção
- Como adicionar novo tipo (se necessário no futuro)
- Como fazer migration
- Como testar
```

---

## 🎯 FASE 7: VALIDAÇÃO FINAL (30 min)

### 7.1 Checklist Final

**Database:**
- [ ] Constraint de user_type ativo
- [ ] Todos os Primary Contacts são institution_admin
- [ ] dev@platty.tech é super_admin
- [ ] Não há user_type NULL

**Code:**
- [ ] CSV import detecta institution_admins corretamente
- [ ] Manual form valida permissões
- [ ] RLS policies funcionam
- [ ] Frontend mostra user_type corretamente
- [ ] Filtros funcionam

**Tests:**
- [ ] Todos os cenários de teste passam
- [ ] Nenhuma funcionalidade quebrada
- [ ] Logs detalhados implementados

**Docs:**
- [ ] Toda documentação atualizada
- [ ] Guia completo criado
- [ ] Regras de negócio documentadas

---

## 📊 ESTIMATIVA TOTAL

| Fase | Tempo Estimado | Prioridade |
|------|----------------|------------|
| 1. Auditoria | 2-3 horas | 🔴 CRÍTICA |
| 2. Análise de Dados | 1-2 horas | 🔴 CRÍTICA |
| 3. Definição de Regras | 30 min | 🔴 CRÍTICA |
| 4. Implementação | 4-6 horas | 🔴 CRÍTICA |
| 5. Testes | 2-3 horas | 🟠 ALTA |
| 6. Documentação | 1 hora | 🟡 MÉDIA |
| 7. Validação | 30 min | 🟠 ALTA |
| **TOTAL** | **11-16 horas** | - |

---

## 🚀 PRÓXIMOS PASSOS IMEDIATOS

1. **Aprovar este plano** - Review com usuário
2. **Executar Fase 1** - Auditoria completa (começar AGORA)
3. **Executar Fase 2** - Análise de dados reais
4. **Definir regras** - Aprovar regras de negócio definitivas
5. **Implementar** - Seguir plano à risca
6. **Testar** - Não pular testes
7. **Documentar** - Garantir que não se perca

---

## ⚠️ PRINCÍPIOS PARA ESTE TRABALHO

1. **NÃO pular etapas** - Cada fase é importante
2. **DOCUMENTAR tudo** - Logs, decisões, resultados
3. **TESTAR antes de avançar** - Não criar débito técnico
4. **VALIDAR com dados reais** - Não assumir, confirmar
5. **ATUALIZAR docs imediatamente** - Não deixar para depois

---

## 🎬 COMEÇAR AGORA?

Deseja que eu execute a **FASE 1: AUDITORIA COMPLETA** agora mesmo?

Vou mapear todos os 40+ arquivos que tocam em user_type e criar o inventário completo.

**Responda:**
- "Sim, execute Fase 1" → Começo auditoria agora
- "Vamos ajustar o plano primeiro" → Discutimos ajustes
- "Quero fazer manualmente" → Forneço checklist detalhado

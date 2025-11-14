# 📊 USER TYPE SYSTEM - INVENTÁRIO COMPLETO

**Data da Auditoria:** 04/11/2025
**Fase:** 1 - AUDITORIA COMPLETA (CONCLUÍDA)
**Status:** 🔴 CRÍTICO - Sistema com problemas sistêmicos identificados

---

## 🚨 DESCOBERTAS CRÍTICAS

### Problema #1: 99.98% dos Membros São "member"
```sql
-- Resultado da query no banco de dados (6057 membros totais):
user_type       | total | percentage
----------------|-------|------------
'member'        | 6056  | 99.98%
'super_admin'   | 1     | 0.02%
'institution_admin' | 0 | 0.00%  ❌ CRÍTICO
'admin'         | 0     | 0.00%  ❌ CRÍTICO
```

**Impacto:**
- Nenhum Institution Admin detectado (esperado: ~129, um por instituição ativa)
- Nenhum System Admin além do super_admin
- Sistema de permissões não está funcionando como deveria

---

### Problema #2: Arquivo de Import Errado Está Ativo
**Arquivo ATIVO:** `CompleteImportPageFixed.tsx` (Linha 128)
```typescript
user_type: 'member'  // ❌ HARDCODED - todos viram 'member'
```

**Arquivo OBSOLETO:** `CompleteImportPage.tsx` (Linhas 732-734)
```typescript
// ✅ TEM A LÓGICA CORRETA mas não é usado
else if (record.primaryContactUserId && parseInt(record.userId) === parseInt(record.primaryContactUserId)) {
  userType = 'institution_admin'
  console.log(`✅ Institution Admin detected: ${record.memberEmail}`)
}
```

**Rota Ativa:** `/admin/import-system` usa `CompleteImportPageFixed` (AppRoutes.tsx:492)

---

### Problema #3: Database Schema Incompleto
**Tabela `institutions` NÃO tem:**
- ❌ Campo `primary_contact_id` (para armazenar quem é o admin)
- ❌ Campo `primary_contact_email` (fallback)
- ❌ Forma de persistir essa informação após import

**Impacto:**
- Informação de "Primary Contact" existe APENAS no CSV
- Após import, não há como saber quem deveria ser institution_admin
- Impossível corrigir dados existentes sem re-import

---

### Problema #4: Múltiplos Arquivos Obsoletos
**Arquivos encontrados mas NÃO usados:**
- `CompleteImportPage.tsx` - TEM lógica correta mas obsoleto
- `ImprovedImportPage.tsx` - Mencionado mas não usado
- Possíveis outros arquivos de import antigos

**Risco:** Confusão sobre qual arquivo é o correto

---

## 📁 INVENTÁRIO DE ARQUIVOS POR CATEGORIA

### 1️⃣ DATABASE LAYER

#### Tabela: `members`
**Arquivo:** Schema do Supabase
**Campo Crítico:** `user_type` (string, nullable)
**Valores Permitidos:** Nenhum constraint! ⚠️
**Valores Esperados:** 'member', 'institution_admin', 'admin', 'super_admin'

**Campos Relacionados:**
- `institution_id` (uuid) - 6056/6057 preenchidos (99.98%)
- `institution_linked_at` (timestamp)
- `institution_linked_by` (uuid)

**Constraint Faltando:**
```sql
-- ❌ NÃO EXISTE ATUALMENTE
ALTER TABLE members
ADD CONSTRAINT members_user_type_check
CHECK (user_type IN ('member', 'institution_admin', 'admin', 'super_admin'));
```

---

#### Tabela: `institutions`
**Arquivo:** Schema do Supabase
**Total de Registros:** 129 instituições ativas (com membros)

**Campos Atuais:**
- id, name, code, email, phone, website
- address, city, state, country, postal_code
- membership_type, membership_status
- membership_start_date, membership_renewal_date
- membership_fee_amount, membership_fee_gst, membership_fee_total

**Campos FALTANDO:**
- ❌ `primary_contact_id` (uuid, FK para members.id)
- ❌ `primary_contact_user_id` (integer, para matching com CSV)

**Top 10 Instituições por Número de Membros:**
1. TAFE QLD - Brisbane: 339 membros
2. UQ College: 259 membros
3. Navitas English - Hyde Park Sydney: 243 membros
4. Monash College: 240 membros
5. UNSW College: 213 membros
6. RMIT University Pathways: 180 membros
7. TAFE NSW - Ultimo: 170 membros
8. UTS College: 149 membros
9. ILSC Australia - Sydney: 149 membros
10. Macquarie University College: 145 membros

---

#### Tabela: `member_roles`
**Status:** ⚠️ DEPRECATED - Existe mas NÃO é usada
**Campos:** id, member_id, role, created_at
**Uso Atual:** NENHUM - Sistema usa apenas `members.user_type`

**Ação Recomendada:** Manter apenas para histórico, não usar em novo código

---

#### Função SQL: `is_admin()`
**Arquivo:** Migration `fix_is_admin_function_to_use_user_type`
**Status:** ✅ CORRIGIDA recentemente (03/11/2025)
**Funcionalidade:** Verifica se usuário atual é admin/super_admin

```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_type_value TEXT;
    has_admin_role BOOLEAN;
BEGIN
    -- Get user_type from members table
    SELECT m.user_type INTO user_type_value
    FROM public.members m
    WHERE m.user_id = auth.uid()
    LIMIT 1;

    -- Check if admin or super_admin
    IF user_type_value IN ('admin', 'super_admin') THEN
        RETURN TRUE;
    END IF;

    -- Fallback: check member_roles table
    SELECT EXISTS (
        SELECT 1
        FROM public.member_roles mr
        JOIN public.members m ON mr.member_id = m.id
        WHERE m.user_id = auth.uid()
        AND mr.role IN ('Admin', 'AdminSuper', 'admin', 'super_admin')
    ) INTO has_admin_role;

    RETURN COALESCE(has_admin_role, FALSE);
END;
$$;
```

**Usado Por:** Políticas RLS em múltiplas tabelas

---

### 2️⃣ CSV IMPORT SYSTEM

#### Arquivo ATIVO: `CompleteImportPageFixed.tsx`
**Localização:** `eau-members/src/features/admin/pages/CompleteImportPageFixed.tsx`
**Linhas Total:** 587
**Rota:** `/admin/import-system`
**Status:** ✅ ATIVO mas 🔴 COM BUG CRÍTICO

**Problema (Linha 128):**
```typescript
user_type: 'member'  // ❌ HARDCODED - TODOS viram 'member'
```

**Campos do CSV que LEEM:**
- Member Groups (usado?)
- Primary Contact's User ID (NÃO usado)
- User ID (NÃO usado para comparação)

**O Que Precisa:**
- Portar lógica de detecção do `CompleteImportPage.tsx`
- Adicionar logging detalhado
- Validar após import

---

#### Arquivo OBSOLETO: `CompleteImportPage.tsx`
**Localização:** `eau-members/src/features/admin/pages/CompleteImportPage.tsx`
**Status:** ⚠️ NÃO USADO mas TEM LÓGICA CORRETA

**Lógica Correta (Linhas 707-740):**
```typescript
/**
 * ✅ SIMPLIFIED USER TYPE SYSTEM (Nov 2025)
 * Only 4 types: member, institution_admin, admin, super_admin
 */
let userType = 'member' // Default

const memberGroups = record.memberGroups
  ? record.memberGroups.split(',').map(g => g.trim().toLowerCase())
  : []

// Priority hierarchy:
if (memberGroups.includes('super_admin') || memberGroups.includes('super admin')) {
  userType = 'super_admin'
  console.log(`✅ Super Admin detected: ${record.memberEmail}`)
} else if (memberGroups.includes('admin')) {
  userType = 'admin'
  console.log(`✅ System Admin detected: ${record.memberEmail}`)
} else if (record.primaryContactUserId &&
           parseInt(record.userId) === parseInt(record.primaryContactUserId)) {
  userType = 'institution_admin'
  console.log(`✅ Institution Admin detected: ${record.memberEmail}`)
} else {
  // All others → member
  userType = 'member'
  if (memberGroups.length > 0) {
    console.log(`ℹ️ Member with groups [${record.memberGroups}]: ${record.memberEmail} → member`)
  }
}
```

**Campos CSV Usados:**
- `memberGroups` - para detectar super_admin/admin
- `primaryContactUserId` - ID do primary contact da instituição
- `userId` - ID do membro atual
- `memberEmail` - para logging

---

#### Arquivo: `ImprovedImportPage.tsx`
**Localização:** `eau-members/src/features/admin/pages/ImprovedImportPage.tsx`
**Status:** ❓ DESCONHECIDO - Mencionado mas não usado
**Ação:** Verificar se deve ser deletado

---

### 3️⃣ MANUAL MEMBER CREATION

#### Arquivo: `MemberForm.tsx`
**Localização:** `eau-members/src/features/admin/components/MemberForm.tsx`
**Status:** ✅ FUNCIONA CORRETAMENTE

**Dropdown de User Type (Linhas 330-347):**
```typescript
<select
  id="user_type"
  value={formData.user_type}
  onChange={(e) => setFormData(prev => ({
    ...prev,
    user_type: e.target.value as UserType
  }))}
>
  {getAvailableUserTypes().map((userType) => (
    <option key={userType} value={userType}>
      {formatUserTypeName(userType)}
    </option>
  ))}
</select>
```

**Permissões de Atribuição (Linhas 52-67):**
```typescript
const getAvailableUserTypes = (): UserType[] => {
  const isSuperAdmin = roles.includes('AdminSuper')
  const isAdmin = roles.includes('Admin')

  if (isSuperAdmin) {
    return ['member', 'institution_admin', 'admin', 'super_admin']
  } else if (isAdmin) {
    return ['member', 'institution_admin', 'admin']
  }
  return ['member']
}
```

**Status:** ✅ Correto - Respeita hierarquia de permissões

---

### 4️⃣ FRONTEND DISPLAY

#### Arquivo: `MembersListEnhanced.tsx`
**Localização:** `eau-members/src/features/admin/components/MembersListEnhanced.tsx`
**Status:** ✅ ATUALIZADO RECENTEMENTE (04/11/2025)

**Coluna User Type (Linhas 509-518):**
```typescript
<td className="px-6 py-4">
  {(() => {
    const userTypeInfo = formatUserType(member.user_type)
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${userTypeInfo.color}`}>
        {userTypeInfo.label}
      </span>
    )
  })()}
</td>
```

**Filtro User Type (Linhas 330-347):**
```typescript
<select
  id="usertype-filter"
  value={filters.userType}
  onChange={(e) => setFilters(prev => ({
    ...prev,
    userType: e.target.value as UserType
  }))}
>
  <option value="">All User Types</option>
  <option value="member">Member</option>
  <option value="institution_admin">Institution Admin</option>
  <option value="admin">System Admin</option>
  <option value="super_admin">Super Admin</option>
</select>
```

**Formatação (Linhas 30-44):**
```typescript
const formatUserType = (userType: string | null | undefined): { label: string; color: string } => {
  switch (userType) {
    case 'super_admin':
      return { label: 'Super Admin', color: 'bg-red-100 text-red-800' }
    case 'admin':
      return { label: 'System Admin', color: 'bg-purple-100 text-purple-800' }
    case 'institution_admin':
      return { label: 'Institution Admin', color: 'bg-blue-100 text-blue-800' }
    case 'member':
      return { label: 'Member', color: 'bg-gray-100 text-gray-800' }
    default:
      return { label: 'Member', color: 'bg-gray-100 text-gray-800' }
  }
}
```

**Status:** ✅ Correto e funcional

---

#### Arquivo: `AdminDashboard.tsx`
**Localização:** `eau-members/src/features/dashboard/components/AdminDashboard.tsx`
**User Type Stats:** ❌ NÃO IMPLEMENTADO

**Sugestão:** Adicionar cards com stats por user_type:
```typescript
const userTypeStats = {
  super_admins: members.filter(m => m.user_type === 'super_admin').length,
  admins: members.filter(m => m.user_type === 'admin').length,
  institution_admins: members.filter(m => m.user_type === 'institution_admin').length,
  members: members.filter(m => m.user_type === 'member').length,
}
```

---

### 5️⃣ BACKEND SERVICES

#### Arquivo: `members.ts`
**Localização:** `eau-members/src/lib/supabase/members.ts`
**Status:** ✅ ATUALIZADO (04/11/2025)

**searchMembersPaginated (Linhas 336-348):**
```typescript
static async searchMembersPaginated(filters: {
  search?: string
  status?: MembershipStatus
  type?: MembershipType
  userType?: 'member' | 'institution_admin' | 'admin' | 'super_admin' | '' // ✅ NOVO
  city?: string
  state?: string
  // ...
}): Promise<{ data: Member[], count: number }>
```

**Filtro Aplicado (Linhas 388-390):**
```typescript
if (filters.userType) {
  query = query.eq('user_type', filters.userType)
}
```

**Status:** ✅ Suporta filtro por user_type

---

#### Arquivo: `roleService.ts`
**Localização:** `eau-members/src/services/roleService.ts`
**Status:** ✅ FUNCIONA COM FALLBACKS

**Mapeamento user_type → UserRole (Linhas 22-34):**
```typescript
const roleMapping: Record<string, UserRole> = {
  'super_admin': 'AdminSuper',
  'admin': 'Admin',
  'institution_admin': 'InstitutionAdmin',
  'board_member': 'BoardMembers',  // Legacy
  'affiliate': 'Affiliates',        // Legacy
  'staff': 'Members',               // Legacy
  'member': 'Members',
}
```

**fetchUserRoles - com Fallbacks (Linhas 135-148):**
```typescript
// CRITICAL FALLBACK: Hardcoded super admins ALWAYS get full permissions
if (SUPER_ADMIN_EMAILS.includes(member.email)) {
  console.log('🔴 CRITICAL: Hardcoded super admin detected:', member.email);
  const roles: UserRole[] = ['AdminSuper', 'Admin', 'Members'];
  cacheRoles(userId, roles);
  return roles;
}

// FALLBACK: If user_type is super_admin, return super admin roles immediately
if (member.user_type === 'super_admin') {
  console.log('🎯 FALLBACK: Using user_type=super_admin, returning AdminSuper roles');
  const roles: UserRole[] = ['AdminSuper', 'Admin', 'Members'];
  cacheRoles(userId, roles);
  return roles;
}
```

**Status:** ✅ Robusto com múltiplos fallbacks

---

### 6️⃣ AUTHENTICATION & AUTHORIZATION

#### Arquivo: `usePermissions.ts`
**Localização:** `eau-members/src/hooks/usePermissions.ts`
**Status:** ✅ FUNCIONA

**hasAnyRole (Linhas 74-85):**
```typescript
const hasAnyRole = (requiredRoles: UserRole[]): boolean => {
  const effectiveRoles = getEffectiveRoles()
  const result = requiredRoles.some(role =>
    effectiveRoles.includes(role) || hasRole(role)
  )
  console.log('✅ hasAnyRole check:', {
    requiredRoles,
    effectiveRoles,
    result
  })
  return result
}
```

**isSuper (Linhas 100-103):**
```typescript
const isSuper = (): boolean => {
  const effectiveRoles = getEffectiveRoles()
  return effectiveRoles.includes('AdminSuper') || hasRole('AdminSuper')
}
```

**Status:** ✅ Funciona baseado em roles do authStore

---

#### Arquivo: `RoleBasedRoute.tsx`
**Localização:** `eau-members/src/components/shared/RoleBasedRoute.tsx`
**Status:** ✅ FUNCIONA

**Proteção de Rota (Linhas 37-55):**
```typescript
const hasAccess = (() => {
  if (permission) {
    return hasPermission(permission)
  }

  if (roles) {
    const access = requireAll ? hasAllRoles(roles) : hasAnyRole(roles)
    console.log('🔐 RoleBasedRoute check:', {
      requiredRoles: roles,
      requireAll,
      hasAccess: access,
      rolesLoaded,
      isLoading
    })
    return access
  }

  return true
})()
```

**Exemplo de Uso (AppRoutes.tsx:657):**
```typescript
<RoleBasedRoute roles={['AdminSuper']}>
  <BulkManagementPage />
</RoleBasedRoute>
```

**Status:** ✅ Funciona corretamente

---

### 7️⃣ BACKEND API (Node.js)

**Arquivos com user_type no Backend:**
```
eau-backend/src/controllers/auth.controller.ts
eau-backend/src/controllers/cpd.controller.ts
eau-backend/src/controllers/institutionLink.controller.ts
eau-backend/src/controllers/institutions.controller.ts
eau-backend/src/controllers/invitations.controller.ts
eau-backend/src/controllers/members.controller.ts
eau-backend/src/middleware/auth.ts
eau-backend/src/middleware/openlearningAuth.ts
eau-backend/src/middleware/supabaseAuth.ts
eau-backend/src/services/institutionLink.service.ts
eau-backend/src/services/membershipApplication.service.ts
eau-backend/src/types/index.ts
```

**Status:** ⚠️ NÃO AUDITADOS - Backend não foi escaneado em detalhes nesta fase

**Ação:** Incluir backend na próxima fase de auditoria

---

## 🔄 FLUXO COMPLETO: DB → Import → Form → Display

### Fluxo 1: CSV Import → Database
```
CSV File
  ├─ Field: "Member Groups" (texto, separado por vírgulas)
  ├─ Field: "User ID" (integer)
  ├─ Field: "Primary Contact's User ID" (integer)
  │
  ↓
CompleteImportPageFixed.tsx (ATIVO)
  ├─ ❌ IGNORA "Member Groups"
  ├─ ❌ IGNORA "Primary Contact's User ID"
  ├─ HARDCODE: user_type = 'member'
  │
  ↓
Supabase Database
  ├─ Table: members
  ├─ Field: user_type = 'member' (SEMPRE)
  │
  ↓
Resultado: 6056 'member', 0 'institution_admin' ❌
```

### Fluxo 2: Manual Creation → Database
```
MemberForm.tsx
  ├─ Dropdown: User Type
  ├─ Validation: Check permissions
  │  ├─ SuperAdmin → can assign ALL
  │  ├─ Admin → can assign (member, institution_admin, admin)
  │  └─ InstitutionAdmin → can assign (member)
  │
  ↓
Supabase Database
  ├─ Table: members
  ├─ Field: user_type = <selected>
  │
  ↓
Resultado: ✅ Correto, respeita permissões
```

### Fluxo 3: Database → Authentication
```
Supabase Database
  ├─ Table: members.user_type
  │
  ↓
roleService.fetchUserRoles()
  ├─ Query: SELECT user_type FROM members WHERE user_id = ?
  ├─ Mapping: user_type → UserRole[]
  │  ├─ 'super_admin' → ['AdminSuper', 'Admin', 'Members']
  │  ├─ 'admin' → ['Admin', 'Members']
  │  ├─ 'institution_admin' → ['InstitutionAdmin', 'Members']
  │  └─ 'member' → ['Members']
  │
  ↓
authStore.setRoles(roles)
  │
  ↓
usePermissions()
  ├─ hasAnyRole()
  ├─ hasAllRoles()
  ├─ isAdmin()
  └─ isSuper()
  │
  ↓
RoleBasedRoute
  ├─ Check: hasAnyRole(requiredRoles)
  ├─ Allow: Show component
  └─ Deny: Redirect to /unauthorized
  │
  ↓
Resultado: ✅ Funciona, mas 99.98% são 'member' então poucos têm permissões
```

### Fluxo 4: Database → Display
```
Supabase Database
  ├─ Table: members.user_type
  │
  ↓
MembersListEnhanced.tsx
  ├─ Query: MembersService.searchMembersPaginated()
  │  └─ Filter: userType (optional)
  ├─ Display: formatUserType()
  │  ├─ 'super_admin' → Red badge "Super Admin"
  │  ├─ 'admin' → Purple badge "System Admin"
  │  ├─ 'institution_admin' → Blue badge "Institution Admin"
  │  └─ 'member' → Gray badge "Member"
  │
  ↓
User sees: ✅ Badges corretos, mas 6056 são "Member"
```

---

## 📊 ESTATÍSTICAS DO SISTEMA

### Arquivos Escaneados:
- **Frontend (TypeScript/React):** 10 arquivos
- **Backend (Node.js):** 17 arquivos (não auditados em detalhes)
- **Documentação (Markdown):** 15 arquivos

### Tabelas do Banco:
- **Total:** 28 tabelas no schema `public`
- **Relacionadas a user_type:** 2 (`members`, `member_roles`)
- **Membros:** 6057 registros
- **Instituições:** 129 ativas (com membros)

### Distribuição Atual:
```
Total Members: 6057
├─ member (99.98%):            6056 ✅
├─ super_admin (0.02%):        1    ✅ (dev@platty.tech)
├─ admin (0%):                 0    ❌ ESPERADO: ~5-10
└─ institution_admin (0%):     0    ❌ ESPERADO: ~129 (1 por instituição)
```

---

## 🎯 PRÓXIMOS PASSOS (FASE 2)

### Análise de Dados Necessária:

1. **Obter amostra do CSV original**
   - Últimos 100 registros
   - Verificar formato dos campos:
     - "Member Groups"
     - "User ID"
     - "Primary Contact's User ID"
   - Identificar padrões

2. **Queries SQL de Validação:**
   ```sql
   -- Quantas instituições deveriam ter Institution Admins?
   SELECT COUNT(DISTINCT institution_id)
   FROM members
   WHERE institution_id IS NOT NULL;

   -- Quais membros aparecem primeiro por instituição? (candidatos a admin)
   SELECT DISTINCT ON (institution_id)
     institution_id,
     id,
     email,
     first_name,
     last_name,
     created_at
   FROM members
   WHERE institution_id IS NOT NULL
   ORDER BY institution_id, created_at ASC;
   ```

3. **Definir Estratégia de Correção:**
   - Re-import completo com lógica correta?
   - Script de correção baseado em heurísticas?
   - Identificação manual dos Primary Contacts?

---

## ✅ CONCLUSÃO DA FASE 1

### Arquivos ATIVOS que precisam CORREÇÃO:
1. ✅ `CompleteImportPageFixed.tsx` - Portar lógica de detecção
2. ✅ `DATABASE_SCHEMA.md` - Atualizar com constraints
3. ✅ `CSV_IMPORT_USER_TYPE_MAPPING.md` - Atualizar algoritmo

### Arquivos OBSOLETOS para EXCLUSÃO:
1. ❓ `CompleteImportPage.tsx` - Manter como referência ou deletar?
2. ❓ `ImprovedImportPage.tsx` - Verificar e deletar se não usado

### Database Migrations Necessárias:
1. ✅ Adicionar constraint em `members.user_type`
2. ✅ Adicionar `primary_contact_id` em `institutions`
3. ✅ Criar script de correção de dados

### Próxima Fase:
**FASE 2: ANÁLISE DE DADOS REAIS** - Aguardando aprovação para continuar

---

**Documento Completo:** Este inventário serve como base para todas as decisões técnicas relacionadas ao sistema de User Types.

**Data:** 04/11/2025
**Auditado por:** Claude (Sonnet 4.5)
**Aprovado por:** [Aguardando]

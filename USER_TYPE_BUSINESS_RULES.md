# USER TYPE BUSINESS RULES
## Regras de Negócio Definitivas - Source of Truth

**Data:** 04/11/2025
**Fase:** 3 de 7 - Define Source of Truth
**Status:** ✅ DEFINITIVO - ESTE DOCUMENTO É A FONTE DA VERDADE

---

## 🎯 1. SISTEMA DE USER TYPES - OVERVIEW

### Tipos Disponíveis (4 tipos únicos):
```typescript
type UserType = 'member' | 'institution_admin' | 'admin' | 'super_admin'
```

### Campo no Banco de Dados:
- **Tabela:** `members`
- **Campo:** `user_type` (TEXT)
- **Default:** `'member'`
- **NOT NULL:** Sim (sempre deve ter um valor)
- **Check Constraint:** `user_type IN ('member', 'institution_admin', 'admin', 'super_admin')`

### Hierarquia de Permissões (do maior para o menor):
```
1. super_admin    (Acesso total, incluindo configs críticas)
   ↓
2. admin          (Acesso administrativo completo, exceto configs críticas)
   ↓
3. institution_admin (Administrador de uma instituição específica)
   ↓
4. member         (Usuário padrão, acesso básico)
```

---

## 🔍 2. REGRAS DE DETECÇÃO - IMPORTAÇÃO CSV

### 🎯 HIERARQUIA DE PRIORIDADES (ordem de verificação):

#### **PRIORIDADE 1: Super Admin**
**Condição:** Campo `Member Groups` contém "super_admin" ou "super admin" (case insensitive)

**Lógica:**
```typescript
const memberGroups = record.memberGroups
  ? record.memberGroups.split(',').map(g => g.trim().toLowerCase())
  : []

if (memberGroups.includes('super_admin') || memberGroups.includes('super admin')) {
  userType = 'super_admin'
}
```

**Exemplo CSV:**
```
UserId: 12345
Member Groups: "Public,Super Admin,Members"
Primary Contact's User ID: 10000
→ RESULTADO: super_admin ✅
```

**⚠️ IMPORTANTE:**
- Super Admin tem precedência sobre TODOS os outros tipos
- Mesmo que seja Primary Contact, se tem "super_admin" em Member Groups → é super_admin

---

#### **PRIORIDADE 2: System Admin**
**Condição:** Campo `Member Groups` contém "admin" (mas NÃO "super_admin", case insensitive)

**Lógica:**
```typescript
else if (memberGroups.includes('admin')) {
  userType = 'admin'
}
```

**Exemplo CSV:**
```
UserId: 12346
Member Groups: "Public,Admin,Members"
Primary Contact's User ID: 10000
→ RESULTADO: admin ✅
```

**⚠️ IMPORTANTE:**
- Admin tem precedência sobre institution_admin e member
- Mesmo que seja Primary Contact, se tem "admin" → é admin (não super_admin)

---

#### **PRIORIDADE 3: Institution Admin**
**Condição:** Campo `UserId` é IGUAL ao campo `Primary Contact's User ID` (comparação numérica)

**Lógica:**
```typescript
else if (record.primaryContactUserId &&
         parseInt(record.userId) === parseInt(record.primaryContactUserId)) {
  userType = 'institution_admin'
}
```

**Exemplo CSV:**
```
UserId: 10000
Member Groups: "Public,Member Colleges,Members"
Primary Contact's User ID: 10000
→ RESULTADO: institution_admin ✅ (UserId == Primary Contact)
```

**vs**

```
UserId: 10001
Member Groups: "Public,Member Colleges,Members"
Primary Contact's User ID: 10000
→ RESULTADO: member ❌ (UserId != Primary Contact)
```

**⚠️ IMPORTANTE:**
- Institution Admin é detectado por comparação de IDs
- Apenas o Primary Contact da instituição recebe este tipo
- Deve haver exatamente 1 institution_admin por instituição
- Se Primary Contact mudar no futuro, user_type deve ser atualizado

---

#### **PRIORIDADE 4: Member (Default)**
**Condição:** Nenhuma das condições acima satisfeita

**Lógica:**
```typescript
else {
  userType = 'member' // Default fallback
}
```

**Exemplo CSV:**
```
UserId: 10001
Member Groups: "Public,Members"
Primary Contact's User ID: 10000
→ RESULTADO: member ✅ (nenhum critério especial)
```

---

## 📊 3. REGRAS DE VALIDAÇÃO (obrigatórias)

### ✅ Validação 1: Member Groups Parsing
```typescript
// SEMPRE fazer parsing seguro
const memberGroups = record.memberGroups
  ? record.memberGroups.split(',').map(g => g.trim().toLowerCase())
  : [] // Array vazio se campo vazio/null

// NUNCA assumir que campo existe
if (!record.memberGroups) {
  console.warn(`⚠️ Member Groups vazio para ${record.memberEmail}`)
}
```

### ✅ Validação 2: Primary Contact Comparison
```typescript
// SEMPRE converter para número antes de comparar
const userId = parseInt(record.userId)
const primaryContactId = parseInt(record.primaryContactUserId)

// Validar que ambos são números válidos
if (isNaN(userId) || isNaN(primaryContactId)) {
  console.warn(`⚠️ Invalid ID for ${record.memberEmail}`)
  // Continuar com outros critérios
}

// Comparar numericamente (não como string!)
if (userId === primaryContactId) {
  // É Primary Contact
}
```

**❌ ERRO COMUM:**
```typescript
// ERRADO - comparação de strings pode falhar
if (record.userId === record.primaryContactUserId) // ❌

// CORRETO - comparação numérica
if (parseInt(record.userId) === parseInt(record.primaryContactUserId)) // ✅
```

### ✅ Validação 3: Campo Obrigatório
```typescript
// SEMPRE garantir que user_type não seja null/undefined
const finalUserType = userType || 'member' // Fallback para 'member'

// No INSERT do banco
await supabase
  .from('members')
  .insert({
    ...memberData,
    user_type: finalUserType // NUNCA null
  })
```

### ✅ Validação 4: Logging Obrigatório
```typescript
// SEMPRE logar detecção para debug
if (userType === 'super_admin') {
  console.log(`✅ Super Admin detected: ${record.memberEmail}`)
} else if (userType === 'admin') {
  console.log(`✅ System Admin detected: ${record.memberEmail}`)
} else if (userType === 'institution_admin') {
  console.log(`✅ Institution Admin detected: ${record.memberEmail} (UserId: ${record.userId})`)
} else {
  console.log(`ℹ️ Member created: ${record.memberEmail}`)
}
```

---

## 🖊️ 4. REGRAS PARA FORMULÁRIO MANUAL

### Criação/Edição Manual de Membros:

**Quem pode atribuir cada tipo:**

| Quem está logado | Pode atribuir |
|------------------|---------------|
| **super_admin** | ✅ Todos os 4 tipos (member, institution_admin, admin, super_admin) |
| **admin** | ✅ member, institution_admin, admin (❌ NÃO pode criar outro super_admin) |
| **institution_admin** | ✅ Apenas member (❌ NÃO pode criar admins) |
| **member** | ❌ Não tem acesso ao formulário |

**Interface do Formulário:**
```typescript
// Dropdown de User Type deve mostrar apenas tipos permitidos
const allowedTypes = {
  super_admin: ['member', 'institution_admin', 'admin', 'super_admin'],
  admin: ['member', 'institution_admin', 'admin'],
  institution_admin: ['member']
}

// Filtrar options baseado em quem está logado
<select name="user_type">
  {allowedTypes[currentUserType].map(type => (
    <option value={type}>{formatUserType(type)}</option>
  ))}
</select>
```

**Validação no Backend:**
```typescript
// SEMPRE validar no backend que usuário tem permissão
const canAssign = (currentUserType: string, targetType: string): boolean => {
  if (currentUserType === 'super_admin') return true
  if (currentUserType === 'admin' && targetType !== 'super_admin') return true
  if (currentUserType === 'institution_admin' && targetType === 'member') return true
  return false
}

if (!canAssign(session.user.user_type, formData.user_type)) {
  throw new Error('Permission denied: Cannot assign this user type')
}
```

---

## 🔐 5. REGRAS PARA RLS (Row Level Security)

### Função is_admin():
```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $
DECLARE
    user_type_value TEXT;
BEGIN
    -- Source of Truth: members.user_type field
    SELECT m.user_type INTO user_type_value
    FROM public.members m
    WHERE m.user_id = auth.uid()
    LIMIT 1;

    -- Admin or Super Admin
    RETURN user_type_value IN ('admin', 'super_admin');
END;
$;
```

### Função is_institution_admin():
```sql
CREATE OR REPLACE FUNCTION public.is_institution_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $
DECLARE
    user_type_value TEXT;
BEGIN
    SELECT m.user_type INTO user_type_value
    FROM public.members m
    WHERE m.user_id = auth.uid()
    LIMIT 1;

    -- Any type of admin
    RETURN user_type_value IN ('institution_admin', 'admin', 'super_admin');
END;
$;
```

### Políticas de Acesso:

**Tabela: members**
```sql
-- SELECT: Membros veem apenas sua instituição
CREATE POLICY "members_select" ON members
FOR SELECT
USING (
  auth.uid() = user_id OR -- Próprio registro
  is_admin() OR -- Admins veem tudo
  (is_institution_admin() AND institution_id = (
    SELECT institution_id FROM members WHERE user_id = auth.uid()
  )) -- Institution admin vê sua instituição
);

-- UPDATE: Apenas admins ou próprio usuário (campos limitados)
CREATE POLICY "members_update" ON members
FOR UPDATE
USING (
  is_admin() OR -- Admins podem editar todos
  auth.uid() = user_id -- Usuário edita apenas próprio perfil
);

-- INSERT: Apenas admins
CREATE POLICY "members_insert" ON members
FOR INSERT
WITH CHECK (is_admin() OR is_institution_admin());

-- DELETE: Apenas super_admin
CREATE POLICY "members_delete" ON members
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM members
    WHERE user_id = auth.uid()
    AND user_type = 'super_admin'
  )
);
```

---

## ⚠️ 6. CASOS ESPECIAIS E EDGE CASES

### Edge Case 1: Primary Contact muda
**Cenário:** Instituição muda o Primary Contact de Pessoa A para Pessoa B

**Comportamento Esperado:**
1. ❌ **NÃO deve ser automático** via importação
2. ✅ **Deve ser manual** via formulário de edição
3. ✅ Admin/Super Admin acessa form de Pessoa A → muda user_type para 'member'
4. ✅ Admin/Super Admin acessa form de Pessoa B → muda user_type para 'institution_admin'

**⚠️ IMPORTANTE:**
- Re-importação CSV NÃO deve sobrescrever user_types existentes sem confirmação
- Deve haver warning se Primary Contact mudou no CSV

---

### Edge Case 2: Usuário tem múltiplos grupos no Member Groups
**Cenário:** `Member Groups: "Public,Admin,Super Admin,Members"`

**Comportamento Esperado:**
```typescript
// Hierarquia: super_admin > admin > institution_admin > member
// SEMPRE escolher o tipo mais alto

if (memberGroups.includes('super_admin') || memberGroups.includes('super admin')) {
  userType = 'super_admin' // ✅ Precedência máxima
}
// Mesmo que tenha 'admin' também, super_admin prevalece
```

---

### Edge Case 3: Primary Contact's User ID está vazio/null
**Cenário:** Campo `Primary Contact's User ID` vazio no CSV

**Comportamento Esperado:**
```typescript
if (!record.primaryContactUserId) {
  // ⚠️ Não pode ser institution_admin
  console.warn(`⚠️ Missing Primary Contact ID for institution`)
  // Continua para próximo critério (member)
}
```

**Solução:**
- ❌ NÃO criar institution_admin automaticamente
- ✅ Criar como 'member' e logar warning
- ✅ Admin deve manualmente atribuir institution_admin via formulário

---

### Edge Case 4: Instituição sem Primary Contact definido
**Cenário:** Instituição tem membros mas nenhum tem `UserId == Primary Contact`

**Comportamento Esperado:**
1. ⚠️ Todos membros são criados como 'member'
2. ✅ Sistema loga warning: "Institution X has no Primary Contact"
3. ✅ Admin deve manualmente atribuir institution_admin

**Validação Recomendada:**
```typescript
// Após importação, verificar instituições sem admin
const institutionsWithoutAdmin = await supabase
  .from('institutions')
  .select('id, name')
  .not('id', 'in',
    supabase.from('members')
      .select('institution_id')
      .eq('user_type', 'institution_admin')
  )

if (institutionsWithoutAdmin.length > 0) {
  console.warn(`⚠️ ${institutionsWithoutAdmin.length} institutions without admin`)
}
```

---

### Edge Case 5: Usuário pertence a múltiplas instituições
**Cenário:** CSV tem mesmo UserId com diferentes institution_id

**Comportamento Esperado:**
```typescript
// ❌ ERRO - Sistema não suporta múltiplas instituições por usuário
// Regra: 1 usuário = 1 instituição (ou nenhuma)

if (existingMember) {
  if (existingMember.institution_id !== record.institutionId) {
    throw new Error(`User ${record.memberEmail} already exists with different institution`)
  }
}
```

**Solução:**
- ❌ NÃO permitir import
- ✅ Logar erro e pular registro
- ✅ Admin deve resolver manualmente

---

### Edge Case 6: Super Admin sem instituição
**Cenário:** Super Admin não pertence a nenhuma instituição

**Comportamento Esperado:**
```typescript
// ✅ PERMITIDO - Super Admins podem não ter instituição
if (userType === 'super_admin') {
  // institution_id pode ser NULL
  institutionId = record.institutionId || null
}
```

**Exemplo:**
- dev@platty.tech → super_admin, institution_id = NULL ✅

---

## 📋 7. TESTES DE VALIDAÇÃO (checklist)

### ✅ Teste 1: Detecção de Super Admin
**Input CSV:**
```
UserId: 1, Member Groups: "Super Admin", Primary Contact: 1
```
**Expected:** user_type = 'super_admin' ✅

---

### ✅ Teste 2: Detecção de Admin
**Input CSV:**
```
UserId: 2, Member Groups: "Admin", Primary Contact: 1
```
**Expected:** user_type = 'admin' ✅

---

### ✅ Teste 3: Detecção de Institution Admin
**Input CSV:**
```
UserId: 100, Member Groups: "Members", Primary Contact: 100
```
**Expected:** user_type = 'institution_admin' ✅

---

### ✅ Teste 4: Detecção de Member
**Input CSV:**
```
UserId: 101, Member Groups: "Members", Primary Contact: 100
```
**Expected:** user_type = 'member' ✅

---

### ✅ Teste 5: Hierarquia - Super Admin prevalece
**Input CSV:**
```
UserId: 1, Member Groups: "Super Admin,Admin", Primary Contact: 1
```
**Expected:** user_type = 'super_admin' ✅ (não 'admin')

---

### ✅ Teste 6: Hierarquia - Admin prevalece sobre Institution Admin
**Input CSV:**
```
UserId: 10, Member Groups: "Admin", Primary Contact: 10
```
**Expected:** user_type = 'admin' ✅ (não 'institution_admin')

---

### ✅ Teste 7: Case Insensitive
**Input CSV:**
```
UserId: 1, Member Groups: "SUPER ADMIN,Members", Primary Contact: 2
```
**Expected:** user_type = 'super_admin' ✅

---

### ✅ Teste 8: Campo vazio
**Input CSV:**
```
UserId: 200, Member Groups: "", Primary Contact: 100
```
**Expected:** user_type = 'member' ✅ (fallback)

---

### ✅ Teste 9: Primary Contact NULL
**Input CSV:**
```
UserId: 300, Member Groups: "Members", Primary Contact: NULL
```
**Expected:** user_type = 'member' ✅

---

### ✅ Teste 10: Comparação numérica (string vs int)
**Input CSV:**
```
UserId: "100" (string), Member Groups: "", Primary Contact: 100 (int)
```
**Expected:** user_type = 'institution_admin' ✅ (parseInt corrige)

---

## 🚨 8. REGRAS DE SEGURANÇA CRÍTICAS

### ⚠️ NUNCA PERMITIR:
1. ❌ Usuário comum (member) criar/editar admins
2. ❌ Institution admin criar outros institution admins
3. ❌ Admin criar super_admins
4. ❌ Sobrescrever user_type sem logging
5. ❌ DELETE de admins sem confirmação dupla
6. ❌ Múltiplos super_admins sem aprovação

### ✅ SEMPRE VALIDAR:
1. ✅ Permissões no backend (nunca confiar no frontend)
2. ✅ Logar TODAS as mudanças de user_type (audit trail)
3. ✅ Confirmar antes de deletar admins
4. ✅ Validar que instituição tem pelo menos 1 institution_admin
5. ✅ Notificar quando Primary Contact muda

---

## 📚 9. MIGRATION CHECKLIST

### ✅ Database Schema:
- [ ] Campo `members.user_type` existe
- [ ] Tipo correto: TEXT NOT NULL DEFAULT 'member'
- [ ] Check constraint: IN ('member', 'institution_admin', 'admin', 'super_admin')
- [ ] Index em user_type para performance
- [ ] Função `is_admin()` correta
- [ ] Função `is_institution_admin()` correta
- [ ] RLS policies atualizadas

### ✅ Código Frontend:
- [ ] CompleteImportPageFixed.tsx com lógica correta
- [ ] MemberForm com validação de permissões
- [ ] MembersListEnhanced com filtro de user_type
- [ ] Dashboard com permissões corretas
- [ ] Logging em todas as operações

### ✅ Código Backend:
- [ ] API endpoints validam permissões
- [ ] Audit trail para mudanças de user_type
- [ ] Validação de regras de negócio
- [ ] Error handling robusto

---

## 🎯 10. CONCLUSÃO

### Source of Truth Estabelecido:
✅ **Campo único:** `members.user_type`
✅ **4 tipos apenas:** member, institution_admin, admin, super_admin
✅ **Hierarquia clara:** super_admin > admin > institution_admin > member
✅ **Detecção automática:** Via Member Groups e Primary Contact ID
✅ **Validação obrigatória:** Logging, parsing seguro, comparação numérica
✅ **Segurança:** Validação de permissões em todas as operações

### Próximo Passo:
**FASE 4: IMPLEMENTAÇÃO CORRETIVA**
- Portar lógica correta para arquivo ativo
- Adicionar validações e logging
- Testar com CSV sample
- Executar correção completa

---

**✅ FASE 3 COMPLETA**
**Este documento é agora a fonte oficial da verdade para o sistema de User Types**

# CSV Import - User Type Automatic Detection

**Data:** 03 de Novembro de 2025
**Status:** ✅ Atualizado para sistema simplificado de User Types

---

## 🎯 Resumo

O sistema de importação CSV possui **detecção automática inteligente** de User Type baseada nos dados do CSV do sistema legado. Não é necessário adicionar campos novos no CSV!

---

## 📊 Campos do CSV Utilizados

### Campos Principais para Detecção:
1. **`Member Groups`** - Grupos do membro no sistema antigo
   - Exemplos: `"admin"`, `"Board Members"`, `"Affiliates"`, `"super_admin"`
   - Usado para detectar administradores do sistema

2. **`User ID`** - ID do usuário
3. **`Primary Contact User ID`** - ID do contato principal da instituição
   - Se `User ID == Primary Contact User ID` → É admin da instituição

### Outros Campos (não afetam User Type):
- `Member Board Member Role` - Armazenado mas não afeta permissions
- `Membership Type` - Tipo de membership (separado de User Type)

---

## 🔄 Lógica de Mapeamento Automático

### Hierarquia de Detecção (prioridade do maior para o menor):

```
┌─────────────────────────────────────────────────────────────┐
│  1️⃣ SUPER ADMIN                                             │
│  Condição: "super_admin" ou "super admin" em Member Groups  │
│  Resultado: user_type = 'super_admin'                       │
└─────────────────────────────────────────────────────────────┘
                            ↓ Se não
┌─────────────────────────────────────────────────────────────┐
│  2️⃣ SYSTEM ADMIN                                            │
│  Condição: "admin" em Member Groups                         │
│  Resultado: user_type = 'admin'                             │
└─────────────────────────────────────────────────────────────┘
                            ↓ Se não
┌─────────────────────────────────────────────────────────────┐
│  3️⃣ INSTITUTION ADMIN                                       │
│  Condição: User ID == Primary Contact User ID               │
│  Resultado: user_type = 'institution_admin'                 │
└─────────────────────────────────────────────────────────────┘
                            ↓ Se não
┌─────────────────────────────────────────────────────────────┐
│  4️⃣ REGULAR MEMBER (Padrão)                                 │
│  Condição: Todos os outros casos                            │
│  Inclui: Board Members, Affiliates, Consultants, etc.       │
│  Resultado: user_type = 'member'                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 Exemplos Práticos

### Exemplo 1: Super Admin
```csv
User ID,Member Groups,Primary Contact User ID
12345,"super_admin, Board Members",67890
```
**Resultado:** `user_type = 'super_admin'`
**Log:** `✅ Super Admin detected: user@example.com`

---

### Exemplo 2: System Admin
```csv
User ID,Member Groups,Primary Contact User ID
23456,"admin, Affiliates",67890
```
**Resultado:** `user_type = 'admin'`
**Log:** `✅ System Admin detected: user@example.com`

---

### Exemplo 3: Institution Admin (Primary Contact)
```csv
User ID,Member Groups,Primary Contact User ID
34567,"Board Members",34567
```
**Resultado:** `user_type = 'institution_admin'` (pois User ID == Primary Contact User ID)
**Log:** `✅ Institution Admin detected: user@example.com`

---

### Exemplo 4: Regular Member (Board Member)
```csv
User ID,Member Groups,Primary Contact User ID
45678,"Board Members",67890
```
**Resultado:** `user_type = 'member'` (não é primary contact)
**Log:** `ℹ️ Member with groups [Board Members]: user@example.com → user_type: member`

---

### Exemplo 5: Regular Member (Affiliate)
```csv
User ID,Member Groups,Primary Contact User ID
56789,"Affiliates",67890
```
**Resultado:** `user_type = 'member'`
**Log:** `ℹ️ Member with groups [Affiliates]: user@example.com → user_type: member`

---

### Exemplo 6: Regular Member (sem grupos)
```csv
User ID,Member Groups,Primary Contact User ID
67890,"",67890
```
**Resultado:** `user_type = 'member'` (default)
**Log:** (sem log, member padrão)

---

## 🎨 User Types no Novo Sistema

### Tipos Disponíveis:

| user_type | Nome Display | Descrição | Permissões |
|-----------|--------------|-----------|------------|
| `member` | Member (Regular User) | Usuário padrão | Acesso básico de membro |
| `institution_admin` | Institution Admin | Admin de instituição | Gerencia membros da instituição |
| `admin` | System Admin | Admin do sistema | Gerencia todo o sistema (exceto configs) |
| `super_admin` | Super Admin | Super Admin | Acesso total incluindo configurações |

---

## ⚙️ Código Implementado

**Arquivo:** `eau-members/src/features/admin/pages/CompleteImportPage.tsx`
**Linhas:** 708-741

```typescript
/**
 * Determine user_type based on Member Groups hierarchy
 *
 * ✅ SIMPLIFIED USER TYPE SYSTEM (Nov 2025)
 * Only 4 types: member, institution_admin, admin, super_admin
 *
 * Priority (highest to lowest):
 * 1. "super_admin" in Member Groups → 'super_admin'
 * 2. "admin" in Member Groups → 'admin'
 * 3. Primary Contact → 'institution_admin'
 * 4. All others (Board Members, Affiliates, etc.) → 'member'
 */
let userType = 'member' // Default

// Parse Member Groups
const memberGroups = record.memberGroups
  ? record.memberGroups.split(',').map(g => g.trim().toLowerCase())
  : []

// Check hierarchy from highest to lowest
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
  // All other types (Board Members, Affiliates, etc.) are regular members
  userType = 'member'
  if (memberGroups.length > 0) {
    console.log(`ℹ️ Member with groups [${record.memberGroups}]: ${record.memberEmail} → user_type: member`)
  }
}
```

---

## 🔍 Como Validar Durante Importação

### Console Logs Durante Import:

Ao executar a importação, o console mostrará:

```
✅ Super Admin detected: admin@example.com
✅ System Admin detected: systemadmin@example.com
✅ Institution Admin detected: institutiuonadmin@example.com
ℹ️ Member with groups [Board Members]: boardmember@example.com → user_type: member
ℹ️ Member with groups [Affiliates]: affiliate@example.com → user_type: member
```

Esses logs ajudam a verificar se a detecção está funcionando corretamente!

---

## ❓ FAQ

### Q1: Preciso adicionar uma coluna "User Type" no CSV?
**A:** Não! O sistema detecta automaticamente baseado em "Member Groups" e "Primary Contact User ID".

---

### Q2: E se um Board Member precisar virar Admin?
**A:** Adicione "admin" no campo "Member Groups" do CSV:
```csv
Member Groups
"admin, Board Members"
```

---

### Q3: Como marco alguém como Super Admin no CSV?
**A:** Adicione "super_admin" ou "super admin" no campo "Member Groups":
```csv
Member Groups
"super_admin"
```

---

### Q4: O que acontece com Affiliates e Board Members?
**A:** Agora são importados como `user_type = 'member'` (usuário regular). As informações de grupo ainda são salvas no campo `groups` para referência.

---

### Q5: Posso ter um Primary Contact que NÃO seja Institution Admin?
**A:** Não. Se `User ID == Primary Contact User ID`, o sistema automaticamente define `user_type = 'institution_admin'`.

---

## ✅ Conclusão

O sistema está **100% preparado** para importar o CSV do sistema legado sem modificações!

Todos os User Types são detectados automaticamente baseados nos dados existentes:
- ✅ Super Admins detectados via "Member Groups"
- ✅ System Admins detectados via "Member Groups"
- ✅ Institution Admins detectados via "Primary Contact"
- ✅ Regular Members (padrão para todos os outros)

**Nenhuma modificação no CSV é necessária!** 🎉

---

**Última Atualização:** 03/11/2025
**Versão do Sistema:** 1.1.0

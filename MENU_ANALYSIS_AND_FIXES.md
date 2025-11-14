# 📋 ANÁLISE E CORREÇÕES DOS MENUS DO SISTEMA

**Data:** 12/11/2025
**Objetivo:** Analisar menus para todos os tipos de usuários e ajustar conforme requisitos do cliente

---

## 🔍 ANÁLISE DO MENU ATUAL

### Super Admin (AdminSuper)

**NAVIGATION:**
- ✅ Dashboard - OK
- ❌ **My CPDs** - PROBLEMA: Super Admin é admin técnico, não precisa de CPD pessoal
- ✅ Events - OK (para gerenciar)
- ❌ **My Registrations** - PROBLEMA: Super Admin não deve se registrar em eventos
- ❌ **Institution Linking** - PROBLEMA: Super Admin não tem instituição

**LEARNING PLATFORM:**
- ⚠️ **Access OpenLearning** - QUESTIONÁVEL: Super Admin precisa acessar como admin técnico?

**ADMINISTRATION:**
- ✅ Admin Dashboard - OK
- ✅ Members - OK
- ✅ Membership - OK
- ✅ Institution Link Requests - OK
- ✅ Institutions - OK (Super Admin only)
- ✅ Membership Applications - OK (Super Admin only)
- ⚠️ **OpenLearning Integration** - MANTER (para configuração técnica)
- ⚠️ **OpenLearning Courses** - MANTER (para gerenciamento)
- ✅ CPD Categories - OK (Super Admin only)
- ✅ Member Impersonation - OK (Dev tool, Super Admin only)

**ACCOUNT:**
- ✅ Profile - OK
- ✅ Logout - OK

---

### System Admin (Admin)

**Problemas Esperados:**
- ❌ **My CPDs** - Admin não precisa (foco em gerenciar, não usar)
- ❌ **My Registrations** - Admin não deve se registrar
- ❌ **Institution Linking** - Admin não tem instituição
- ⚠️ **OpenLearning Integration** - Pode manter (gerenciamento)
- ⚠️ **OpenLearning Courses** - Pode manter (gerenciamento)
- ❌ **CPD Categories** - Não deve aparecer (só Super Admin)
- ❌ **Institutions** - Não deve aparecer (só Super Admin)
- ❌ **Membership Applications** - Não deve aparecer (só Super Admin)

---

### Institution Admin (InstitutionAdmin)

**Deve ter:**
- ✅ Dashboard
- ✅ My CPDs - SIM (é um membro da instituição)
- ✅ Events
- ✅ My Registrations - SIM (pode se registrar)
- ❌ **Institution Linking** - NÃO (já está vinculado)
- ✅ Access OpenLearning - SIM (é um membro)
- ✅ Admin Dashboard (limitado)
- ✅ Members (da sua instituição)
- ❌ Membership - NÃO (gerenciado por Super Admin)
- ❌ Institution Link Requests - NÃO (gerenciado por Super Admin/Admin)
- ❌ Institutions - NÃO (só Super Admin)
- ❌ Membership Applications - NÃO (só Super Admin)
- ❌ OpenLearning Integration - NÃO (só Super Admin/Admin)
- ❌ OpenLearning Courses - NÃO (só Super Admin/Admin)
- ❌ CPD Categories - NÃO (só Super Admin)

---

### Member (member) - Usuário Regular

**Deve ter:**
- ✅ Dashboard
- ✅ My CPDs
- ✅ Events
- ✅ My Registrations
- ✅ Institution Linking (se não estiver vinculado)
- ✅ Access OpenLearning
- ❌ NENHUM item de Administration
- ✅ Profile
- ✅ Logout

---

## 🎯 PROBLEMAS IDENTIFICADOS

### 1. **Super Admin e Admin com menus de "Member"**
**Problema:** Super Admin e Admin têm "My CPDs", "My Registrations" e "Institution Linking"

**Motivo:** Estes são **admins técnicos**, não membros regulares do sistema. Eles gerenciam, não usam.

**Solução:** Remover estes itens para Super Admin e Admin

### 2. **Institution Admin sem distinção clara**
**Problema:** Institution Admin provavelmente vê tudo que Super Admin vê

**Motivo:** Institution Admin É UM MEMBRO da instituição, mas com privilégios administrativos

**Solução:** Institution Admin deve ter menu de membro + alguns itens admin (limitados à sua instituição)

### 3. **OpenLearning duplicado**
**Problema:** "Access OpenLearning" (usuário) vs "OpenLearning Integration/Courses" (admin)

**Motivo:** Confusão entre acesso de usuário e gerenciamento admin

**Solução:**
- Membros: Apenas "Access OpenLearning"
- Admins técnicos: Apenas "OpenLearning Integration" e "OpenLearning Courses"
- Institution Admin: Apenas "Access OpenLearning" (como membro)

### 4. **Institution Linking para todos**
**Problema:** Todos os usuários veem "Institution Linking"

**Motivo:** Apenas membros NÃO VINCULADOS precisam disto

**Solução:** Mostrar apenas se:
- É Member (user_type = 'member')
- E não tem institution_id

---

## ✅ ESTRUTURA CORRETA DOS MENUS

### SUPER ADMIN (user_type: 'super_admin')
```yaml
NAVIGATION:
  - Dashboard
  - Events (gerenciar, não participar)

ADMINISTRATION:
  - Admin Dashboard
  - Members
  - Membership
  - Institution Link Requests
  - Institutions
  - Membership Applications
  - OpenLearning Integration
  - OpenLearning Courses
  - CPD Categories
  - Member Impersonation (Dev)

ACCOUNT:
  - Profile
  - Logout
```

### SYSTEM ADMIN (user_type: 'admin')
```yaml
NAVIGATION:
  - Dashboard
  - Events (gerenciar, não participar)

ADMINISTRATION:
  - Admin Dashboard
  - Members
  - Membership
  - Institution Link Requests
  - OpenLearning Integration
  - OpenLearning Courses

ACCOUNT:
  - Profile
  - Logout
```

### INSTITUTION ADMIN (user_type: 'institution_admin')
```yaml
NAVIGATION:
  - Dashboard
  - My CPDs
  - Events
  - My Registrations
  - Access OpenLearning

ADMINISTRATION:
  - Admin Dashboard (limitado)
  - Members (só da sua instituição)
  - Institution Link Requests (aprovar para sua instituição)

ACCOUNT:
  - Profile
  - Logout
```

### MEMBER (user_type: 'member')
```yaml
NAVIGATION:
  - Dashboard
  - My CPDs
  - Events
  - My Registrations
  - Institution Linking (apenas se institution_id = null)

LEARNING PLATFORM:
  - Access OpenLearning

ACCOUNT:
  - Profile
  - Logout
```

---

## 🔧 IMPLEMENTAÇÃO NECESSÁRIA

### Mudanças no `MainLayout.tsx`

#### 1. Remover "My CPDs" para admins técnicos
```tsx
{/* Apenas para membros e institution admins */}
{(roles.includes('Members') || roles.includes('InstitutionAdmin')) && (
  <PermissionGuard permission="CREATE_CPD">
    <button onClick={() => handleNavigateAndClose('/cpd')}>
      <BookOpen className="h-4 w-4 mr-3 text-green-500" />
      My CPDs
    </button>
  </PermissionGuard>
)}
```

#### 2. Remover "My Registrations" para admins técnicos
```tsx
{/* Apenas para membros e institution admins */}
{(roles.includes('Members') || roles.includes('InstitutionAdmin')) && (
  <PermissionGuard permission="REGISTER_EVENT">
    <button onClick={() => handleNavigateAndClose('/my-registrations')}>
      <Calendar className="h-4 w-4 mr-3 text-orange-500" />
      My Registrations
    </button>
  </PermissionGuard>
)}
```

#### 3. Remover "Institution Linking" para admins e vincul ados
```tsx
{/* Apenas para Members não vinculados */}
{roles.includes('Members') && !roles.includes('Admin') && !roles.includes('AdminSuper') && (
  <button onClick={() => handleNavigateAndClose('/institutions/link')}>
    <Building2 className="h-4 w-4 mr-3 text-teal-500" />
    Institution Linking
  </button>
)}
```

#### 4. Separar "Access OpenLearning" de funcionalidades admin
```tsx
{/* Access OpenLearning - Apenas para membros e institution admins */}
{(roles.includes('Members') || roles.includes('InstitutionAdmin')) &&
 !roles.includes('AdminSuper') && !roles.includes('Admin') && (
  <div className="border-b pb-4 mb-4">
    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
      Learning Platform
    </h3>
    <div className="px-3">
      <OpenLearningAccessButton variant="outline" fullWidth={true} size="sm" />
    </div>
  </div>
)}
```

#### 5. Ajustar seção Administration
```tsx
<PermissionGuard permission="ACCESS_ADMIN_DASHBOARD">
  <div className="border-b pb-4 mb-4">
    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
      Administration
    </h3>

    {/* Admin Dashboard - TODOS admins */}
    <button onClick={() => handleNavigateAndClose('/admin')}>
      <Shield className="h-4 w-4 mr-3 text-red-500" />
      Admin Dashboard
    </button>

    {/* Members - TODOS admins */}
    <button onClick={() => handleNavigateAndClose('/admin/members')}>
      <Users className="h-4 w-4 mr-3 text-blue-500" />
      Members
    </button>

    {/* Membership - Apenas Super Admin e Admin */}
    {(roles.includes('AdminSuper') || roles.includes('Admin')) && (
      <button onClick={() => handleNavigateAndClose('/admin/membership')}>
        <Settings className="h-4 w-4 mr-3 text-gray-500" />
        Membership
      </button>
    )}

    {/* Institution Link Requests - TODOS admins */}
    <button onClick={() => handleNavigateAndClose('/admin/institution-links')}>
      <Link2 className="h-4 w-4 mr-3 text-teal-500" />
      Institution Link Requests
    </button>

    {/* Institutions - Apenas Super Admin */}
    {roles.includes('AdminSuper') && (
      <button onClick={() => handleNavigateAndClose('/admin/institutions')}>
        <Building2 className="h-4 w-4 mr-3 text-purple-500" />
        Institutions
      </button>
    )}

    {/* Membership Applications - Apenas Super Admin */}
    {roles.includes('AdminSuper') && (
      <button onClick={() => handleNavigateAndClose('/admin/membership-applications')}>
        <FileText className="h-4 w-4 mr-3 text-orange-500" />
        Membership Applications
      </button>
    )}

    {/* OpenLearning Integration - Apenas Super Admin e Admin */}
    {(roles.includes('AdminSuper') || roles.includes('Admin')) && (
      <button onClick={() => handleNavigateAndClose('/admin/openlearning')}>
        <GraduationCap className="h-4 w-4 mr-3 text-indigo-500" />
        OpenLearning Integration
      </button>
    )}

    {/* OpenLearning Courses - Apenas Super Admin e Admin */}
    {(roles.includes('AdminSuper') || roles.includes('Admin')) && (
      <button onClick={() => handleNavigateAndClose('/admin/openlearning/courses')}>
        <GraduationCap className="h-4 w-4 mr-3 text-green-500" />
        OpenLearning Courses
      </button>
    )}

    {/* CPD Categories - Apenas Super Admin */}
    {roles.includes('AdminSuper') && (
      <button onClick={() => handleNavigateAndClose('/admin/cpd-categories')}>
        <Settings className="h-4 w-4 mr-3 text-yellow-500" />
        CPD Categories
      </button>
    )}

    {/* Member Impersonation - Apenas Super Admin (Dev) */}
    {roles.includes('AdminSuper') && (
      <>
        <div className="mx-3 my-2 border-t border-gray-200"></div>
        <button onClick={() => handleNavigateAndClose('/admin/member-impersonation')}>
          <UserCheck className="h-4 w-4 mr-3 text-purple-500" />
          Member Impersonation
          <span className="ml-auto text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">Dev</span>
        </button>
      </>
    )}
  </div>
</PermissionGuard>
```

---

## 📝 CHECKLIST DE TESTES

### Super Admin
- [ ] NÃO vê "My CPDs"
- [ ] NÃO vê "My Registrations"
- [ ] NÃO vê "Institution Linking"
- [ ] NÃO vê "Access OpenLearning" em Learning Platform
- [ ] Vê "Events" (para gerenciar)
- [ ] Vê TODOS os itens admin
- [ ] Vê "Institutions"
- [ ] Vê "Membership Applications"
- [ ] Vê "CPD Categories"
- [ ] Vê "Member Impersonation"

### System Admin
- [ ] NÃO vê "My CPDs"
- [ ] NÃO vê "My Registrations"
- [ ] NÃO vê "Institution Linking"
- [ ] NÃO vê "Access OpenLearning" em Learning Platform
- [ ] Vê "Events" (para gerenciar)
- [ ] Vê itens admin básicos
- [ ] NÃO vê "Institutions"
- [ ] NÃO vê "Membership Applications"
- [ ] NÃO vê "CPD Categories"
- [ ] NÃO vê "Member Impersonation"

### Institution Admin
- [ ] Vê "Dashboard"
- [ ] Vê "My CPDs"
- [ ] Vê "Events"
- [ ] Vê "My Registrations"
- [ ] Vê "Access OpenLearning"
- [ ] NÃO vê "Institution Linking"
- [ ] Vê "Admin Dashboard" (limitado)
- [ ] Vê "Members" (só sua instituição)
- [ ] Vê "Institution Link Requests"
- [ ] NÃO vê "Membership"
- [ ] NÃO vê "Institutions"
- [ ] NÃO vê "Membership Applications"
- [ ] NÃO vê "OpenLearning Integration/Courses"
- [ ] NÃO vê "CPD Categories"

### Member
- [ ] Vê "Dashboard"
- [ ] Vê "My CPDs"
- [ ] Vê "Events"
- [ ] Vê "My Registrations"
- [ ] Vê "Institution Linking" (se não vinculado)
- [ ] Vê "Access OpenLearning"
- [ ] NÃO vê NENHUM item de Administration

---

## 🎯 PRIORIDADE DE IMPLEMENTAÇÃO

**ALTA PRIORIDADE:**
1. ❗ Remover "My CPDs" e "My Registrations" de Super Admin e Admin
2. ❗ Remover "Institution Linking" de admins técnicos
3. ❗ Separar "Access OpenLearning" (membro) de admin tools

**MÉDIA PRIORIDADE:**
4. Ajustar permissões de Institution Admin
5. Condicionalizar "Institution Linking" para membros não vinculados

**BAIXA PRIORIDADE:**
6. Melhorar textos e descrições dos menus
7. Adicionar tooltips explicativos

---

**Status:** Análise Completa - Aguardando Implementação

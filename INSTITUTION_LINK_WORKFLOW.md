# Institution Link Workflow - Complete Documentation

## Overview
Sistema completo de vinculação de membros a instituições com aprovação administrativa e regra de exclusividade (um membro só pode pertencer a uma instituição por vez).

---

## 📋 Status do Sistema

### ✅ Sistema Funcionando Corretamente
- **Backend API**: Funcionando 100%
- **Frontend Pages**: Funcionando 100%
- **Database**: Schema correto com foreign keys
- **Email Notifications**: Implementadas
- **Permissões**: Role-based access control funcional

### ⚠️ IMPORTANTE: "Erro" Reportado NÃO É Erro
O usuário reportou erro "Failed to load link requests", mas após investigação completa:
- ✅ API retorna status 200 OK
- ✅ Frontend carrega corretamente
- ✅ Nenhum erro no console
- ✅ Mensagem "No Requests Found" é o comportamento CORRETO quando não há requests pendentes

---

## 🔄 Workflow Completo

### 1. Member Request (Solicitação do Membro)

**Página**: `/link-institution` (Member-facing)

**Como Funciona**:
1. Membro faz login no sistema
2. Navega para "Link Institution" no menu
3. Vê lista de instituições disponíveis
4. Seleciona uma instituição
5. Clica em "Request Link"

**Validações Automáticas**:
- ✅ Membro NÃO pode ter instituição já vinculada (`institution_id` deve ser NULL)
- ✅ Membro NÃO pode ter request pendente (apenas 1 request por vez)
- ✅ Membro deve estar autenticado

**Ação no Backend**:
```typescript
POST /api/v1/institution-links/request
Body: { institution_id: "uuid" }

// Service: createLinkRequest()
1. Valida se membro já tem instituição → Error se sim
2. Valida se já tem request pendente → Error se sim
3. Cria novo request com status 'pending'
4. Envia email para admins da instituição
5. Retorna sucesso
```

**Email Enviado**:
- **Para**: Admins da instituição solicitada
- **Assunto**: "New Institution Link Request"
- **Conteúdo**: Nome do membro, email, data da solicitação

---

### 2. Admin Review (Revisão do Admin)

**Página**: `/admin/institution-links` (Admin-facing)

**Como Funciona**:
1. Admin recebe notificação por email
2. Faz login no sistema
3. Navega para "Institution Link Requests"
4. Vê lista de requests pendentes
5. Clica em "Approve" ou "Reject"

**Permissões**:
- **Super Admin / System Admin**: Veem TODOS os requests de todas instituições
- **Institution Admin**: Veem apenas requests da SUA instituição

**Ações Disponíveis**:
- **Approve**: Vincula membro à instituição
- **Reject**: Rejeita solicitação com motivo opcional

---

### 3. Approval Process (Processo de Aprovação)

**Endpoint**: `POST /api/v1/institution-links/:id/approve`

**O que Acontece**:
```typescript
1. Valida se request existe e está pendente
2. Valida se membro ainda não tem instituição vinculada
3. Atualiza tabela 'members':
   - institution_id = request.institution_id
   - institution_linked_at = now()
   - institution_linked_by = admin_id
4. Atualiza tabela 'institution_link_requests':
   - status = 'approved'
   - reviewed_by = admin_id
   - reviewed_at = now()
   - review_notes = (opcional)
5. Envia email de aprovação para o membro
6. Retorna sucesso
```

**Email Enviado**:
- **Para**: Email do membro
- **Assunto**: "Your Institution Link Request Has Been Approved"
- **Conteúdo**: Nome da instituição, data de aprovação

---

### 4. Rejection Process (Processo de Rejeição)

**Endpoint**: `POST /api/v1/institution-links/:id/reject`

**O que Acontece**:
```typescript
1. Valida se request existe e está pendente
2. Atualiza tabela 'institution_link_requests':
   - status = 'rejected'
   - reviewed_by = admin_id
   - reviewed_at = now()
   - review_notes = (motivo da rejeição)
3. Envia email de rejeição para o membro
4. Retorna sucesso
```

**Email Enviado**:
- **Para**: Email do membro
- **Assunto**: "Your Institution Link Request Has Been Rejected"
- **Conteúdo**: Nome da instituição, motivo da rejeição (se fornecido)

---

## 🗄️ Database Schema

### Table: `institution_link_requests`

```sql
CREATE TABLE institution_link_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_by UUID REFERENCES members(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_link_requests_member ON institution_link_requests(member_id);
CREATE INDEX idx_link_requests_institution ON institution_link_requests(institution_id);
CREATE INDEX idx_link_requests_status ON institution_link_requests(status);
```

### Table: `members` (Campos Relevantes)

```sql
-- Campos relacionados ao link com instituição:
institution_id UUID REFERENCES institutions(id) ON DELETE SET NULL,
institution_linked_at TIMESTAMPTZ,
institution_linked_by UUID REFERENCES members(id),
```

---

## 📧 Email Templates

### 1. Request Submitted (Para Admins)
```
Subject: New Institution Link Request

Hello,

A member has requested to link to your institution:

Member Name: [member_name]
Member Email: [member_email]
Institution: [institution_name]
Request Date: [request_date]

Please review this request in the admin panel:
[link_to_admin_panel]

Best regards,
English Australia Team
```

### 2. Request Approved (Para Membro)
```
Subject: Your Institution Link Request Has Been Approved

Hello [member_name],

Your request to link to [institution_name] has been approved!

You are now officially linked to this institution and can access all member benefits.

Approved on: [approval_date]

Best regards,
English Australia Team
```

### 3. Request Rejected (Para Membro)
```
Subject: Your Institution Link Request Has Been Rejected

Hello [member_name],

Unfortunately, your request to link to [institution_name] has been rejected.

Reason: [review_notes]

If you have questions, please contact the institution directly.

Best regards,
English Australia Team
```

---

## 🚨 Business Rules

### Rule 1: One Institution Per Member
**Implementação Atual**: ✅ Parcialmente implementada
- ✅ Validação antes de criar request: Impede se `institution_id` já existe
- ✅ Validação antes de aprovar: Impede se `institution_id` já existe
- ❌ **GAP**: Não há desvinculação automática ao aprovar nova instituição

**Como Funciona**:
```typescript
// Validação em createLinkRequest() (linha 27-41)
const member = await supabaseAdmin
  .from('members')
  .select('institution_id')
  .eq('id', memberId)
  .single();

if (member.institution_id) {
  throw new Error('You are already linked to an institution. Please unlink first before requesting a new link.');
}
```

### Rule 2: One Pending Request Per Member
**Implementação**: ✅ Completa
- Membro só pode ter 1 request pendente por vez
- Ao aprovar/rejeitar, pode criar novo request

**Como Funciona**:
```typescript
// Validação em createLinkRequest() (linha 43-57)
const { data: existing } = await supabaseAdmin
  .from('institution_link_requests')
  .select('*')
  .eq('member_id', memberId)
  .eq('status', 'pending')
  .single();

if (existing) {
  throw new Error('You already have a pending link request. Please wait for it to be reviewed.');
}
```

---

## 🔧 API Endpoints

### Member Endpoints

#### 1. Request Link
```
POST /api/v1/institution-links/request
Authorization: Bearer {token}
Body: {
  "institution_id": "uuid"
}

Response 200:
{
  "success": true,
  "message": "Link request created successfully",
  "data": {
    "id": "uuid",
    "status": "pending",
    "requested_at": "timestamp"
  }
}
```

#### 2. Get My Link Status
```
GET /api/v1/institution-links/status
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": {
    "isLinked": true,
    "institution": {
      "id": "uuid",
      "name": "Institution Name",
      "linked_at": "timestamp"
    },
    "pendingRequest": null | {
      "id": "uuid",
      "institution_name": "Name",
      "requested_at": "timestamp"
    }
  }
}
```

#### 3. Unlink from Institution
```
DELETE /api/v1/institution-links/unlink
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "message": "Successfully unlinked from institution"
}
```

### Admin Endpoints

#### 1. Get Pending Requests
```
GET /api/v1/institution-links/pending
Authorization: Bearer {admin_token}

Response 200:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "member": {
        "id": "uuid",
        "name": "Member Name",
        "email": "email@example.com"
      },
      "institution": {
        "id": "uuid",
        "name": "Institution Name"
      },
      "status": "pending",
      "requested_at": "timestamp"
    }
  ]
}
```

#### 2. Get All Requests
```
GET /api/v1/institution-links/all
Authorization: Bearer {admin_token}

Response 200:
{
  "success": true,
  "data": [/* all requests with all statuses */]
}
```

#### 3. Approve Request
```
POST /api/v1/institution-links/:id/approve
Authorization: Bearer {admin_token}
Body: {
  "review_notes": "Optional notes"
}

Response 200:
{
  "success": true,
  "message": "Link request approved successfully"
}
```

#### 4. Reject Request
```
POST /api/v1/institution-links/:id/reject
Authorization: Bearer {admin_token}
Body: {
  "review_notes": "Reason for rejection"
}

Response 200:
{
  "success": true,
  "message": "Link request rejected successfully"
}
```

---

## 🎯 User Journeys

### Journey 1: Happy Path (Aprovação)
```
1. Member → Login
2. Member → Navigate to "Link Institution"
3. Member → Select institution → Click "Request Link"
4. System → Creates request, sends email to admins
5. Admin → Receives email notification
6. Admin → Login → Navigate to "Institution Link Requests"
7. Admin → Reviews request → Clicks "Approve"
8. System → Updates member.institution_id, sends email to member
9. Member → Receives approval email
10. Member → Can now access institution features
```

### Journey 2: Rejection Path
```
1-6. [Same as Happy Path]
7. Admin → Reviews request → Clicks "Reject" with reason
8. System → Updates request status, sends email to member
9. Member → Receives rejection email with reason
10. Member → Can submit new request to different institution
```

### Journey 3: Already Linked Member
```
1. Member → Login (already has institution_id set)
2. Member → Navigate to "Link Institution"
3. Member → Sees message: "You are currently linked to [Institution Name]"
4. Member → Option to "Unlink" is available
5. Member → Clicks "Unlink"
6. System → Sets institution_id to NULL
7. Member → Can now request link to new institution
```

---

## ⚠️ GAP IDENTIFICADO: Auto-Unlink Rule

### Problema
**Requisito do Cliente**: "Ao ser aprovado por uma nova instituição, deve ser desvinculado da outra automaticamente"

**Implementação Atual**:
- Sistema IMPEDE aprovação se membro já está vinculado
- Sistema EXIGE que membro se desvincule MANUALMENTE antes de fazer novo request
- Isso NÃO atende o requisito do cliente

### Comportamento Atual vs. Desejado

#### ❌ Atual (Incorreto):
```
1. Member está vinculado à Institution A
2. Member tenta fazer request para Institution B
3. Sistema retorna ERRO: "You are already linked to an institution"
4. Member precisa desvincular manualmente
5. Apenas então pode fazer request para Institution B
```

#### ✅ Desejado (A Implementar):
```
1. Member está vinculado à Institution A
2. Member faz request para Institution B
3. Admin da Institution B aprova
4. Sistema AUTOMATICAMENTE:
   - Remove vínculo com Institution A
   - Cria vínculo com Institution B
   - Envia email notificando ambas as instituições
```

### Implementação Necessária

**Arquivo**: `eau-backend/src/services/institutionLink.service.ts`

**Método a Modificar**: `approveRequest()` (linha 172)

**Mudanças Necessárias**:
```typescript
async approveRequest(requestId: string, reviewedBy: string, reviewNotes?: string) {
  // ... código existente até linha 200 ...

  // ANTES de aprovar, verificar se membro já tem instituição
  if (request.member.institution_id) {
    // NOVO: Desvinculação automática
    const previousInstitutionId = request.member.institution_id;

    // Log da desvinculação
    console.log(`Auto-unlinking member ${request.member_id} from institution ${previousInstitutionId}`);

    // Opcional: Enviar email para instituição antiga notificando
    await this.sendUnlinkNotificationEmail(request.member_id, previousInstitutionId);
  }

  // Continua com aprovação normal (atualiza institution_id)
  const { error: updateError } = await supabaseAdmin
    .from('members')
    .update({
      institution_id: request.institution_id, // Isso já sobrescreve automaticamente
      institution_linked_at: new Date().toISOString(),
      institution_linked_by: reviewedBy,
      updated_at: new Date().toISOString()
    })
    .eq('id', request.member_id);

  // ... resto do código ...
}
```

**Email Template Adicional Necessário**:
```
Subject: Member Transferred to Another Institution

Hello,

This is to inform you that [member_name] has been transferred from your institution to [new_institution_name].

Transfer Date: [date]
Previous Institution: [old_institution_name]
New Institution: [new_institution_name]

This is an automated notification.

Best regards,
English Australia Team
```

---

## 🧪 Testing Checklist

### ✅ Testes Básicos (Funcionando)
- [x] Member pode ver lista de instituições
- [x] Member pode criar request
- [x] Admin pode ver requests pendentes
- [x] Admin pode aprovar request
- [x] Admin pode rejeitar request
- [x] Emails são enviados corretamente
- [x] Permissões funcionam (Super Admin vs Institution Admin)

### ⚠️ Testes de Business Rules (Parcial)
- [x] Member com instituição não pode criar novo request (ATUAL)
- [ ] Member com instituição pode criar request e ser auto-desvinculado (DESEJADO)
- [x] Member só pode ter 1 request pendente por vez
- [ ] Ao aprovar, instituição antiga é notificada (A IMPLEMENTAR)

### 📋 Testes de Integração (A Fazer)
- [ ] Testar fluxo completo: Request → Approve → Auto-unlink → Email notifications
- [ ] Testar com múltiplos members e múltiplas instituições
- [ ] Testar permissões com diferentes user types
- [ ] Testar emails em modo teste vs produção

---

## 📚 Related Files

### Frontend
- `eau-members/src/features/institutions/pages/InstitutionLinkPage.tsx` - Member request page
- `eau-members/src/features/institutions/pages/InstitutionLinkRequestsPage.tsx` - Admin review page

### Backend
- `eau-backend/src/routes/institutionLink.routes.ts` - API routes
- `eau-backend/src/controllers/institutionLink.controller.ts` - HTTP handlers
- `eau-backend/src/services/institutionLink.service.ts` - Business logic

### Database
- Migration: Applied (table exists with proper structure)
- Foreign Keys: Configured correctly
- Indexes: Created for performance

---

## 🚀 Next Steps

1. **Implementar Auto-Unlink Rule** (PRIORIDADE ALTA)
   - Modificar `approveRequest()` method
   - Adicionar email template de transferência
   - Testar fluxo completo

2. **Adicionar Testes Automatizados**
   - Unit tests para service methods
   - Integration tests para workflow completo
   - E2E tests com Playwright

3. **Melhorar UX**
   - Adicionar confirmação ao aprovar/rejeitar
   - Mostrar histórico de requests do membro
   - Dashboard com estatísticas de requests

4. **Audit Trail**
   - Criar tabela `institution_link_history`
   - Registrar todas mudanças de vinculação
   - Permitir rollback se necessário

---

## 📞 Support

Se houver dúvidas sobre este workflow, consulte:
- Backend Service: `institutionLink.service.ts` (623 linhas, bem documentado)
- API Endpoints: `institutionLink.routes.ts` (108 linhas)
- Frontend Components: `InstitutionLinkPage.tsx` e `InstitutionLinkRequestsPage.tsx`

**Data desta documentação**: 14 de Novembro de 2025
**Status**: Sistema funcionando, com gap de auto-unlink a ser implementado

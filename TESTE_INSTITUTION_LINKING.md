# Teste Institution Linking - Correções Aplicadas

## 🔧 Correções Implementadas

### 1. Backend: `getMemberLinkStatus()` - Refatorado
**Arquivo**: `eau-backend/src/services/institutionLink.service.ts` (linha 538-608)

**Problema**: Query Supabase com join retornando objeto `institution` em formato inconsistente

**Solução**: Separado em duas queries sequenciais:
```typescript
// Query 1: Buscar dados do membro
const { data: member } = await supabaseAdmin
  .from('members')
  .select('id, institution_id, institution_linked_at, institution_linked_by')
  .eq('id', memberId)
  .single();

// Query 2: Se tem institution_id, buscar instituição separadamente
if (member.institution_id) {
  const { data: inst } = await supabaseAdmin
    .from('institutions')
    .select('id, name, email')
    .eq('id', member.institution_id)
    .single();
}
```

### 2. Backend: `list()` institutions - Adicionado parâmetro `forLinking`
**Arquivo**: `eau-backend/src/controllers/institutions.controller.ts` (linha 24-33)

**Problema**: Membros só viam SUA PRÓPRIA instituição, impedindo de ver outras para fazer request

**Solução**: Parâmetro opcional `forLinking=true` para mostrar todas instituições ativas:
```typescript
if (forLinking === 'true') {
  // Modo linking: mostrar todas instituições ativas
  query = query.eq('membership_status', 'active');
} else {
  // Modo normal: aplicar filtro de segurança
  if (req.user?.userType !== USER_TYPES.SUPER_ADMIN && req.user?.institutionId) {
    query = query.eq('id', req.user.institutionId);
  }
}
```

### 3. Frontend: Adicionar `forLinking=true` na chamada
**Arquivo**: `eau-members/src/features/institutions/pages/InstitutionLinkPage.tsx` (linha 64)

**Mudança**:
```typescript
// ANTES:
const institutionsResponse = await fetch(`${API_BASE_URL}/institutions`, {...})

// DEPOIS:
const institutionsResponse = await fetch(`${API_BASE_URL}/institutions?forLinking=true`, {...})
```

---

## 🧪 Como Testar

### Passo 1: Acessar com Impersonation
1. Fazer login como Super Admin (dev@platty.tech)
2. Ir para: Admin → Member Impersonation (`/admin/member-impersonation`)
3. Buscar por email: `huailing.zuo@monashcollege.edu.au`
4. Clicar em "Impersonate" para assumir identidade do membro

### Passo 2: Navegar para Institution Linking
1. Com impersonation ativo, ir para: `/link-institution`
2. Aguardar página carregar completamente

### Passo 3: Verificar Resultados Esperados

#### ✅ Card "Current Institution Link" deve mostrar:
```
Linked to Monash College
You are currently linked to this institution
[Data de quando foi vinculado - se disponível]
[Botão "Unlink from Institution"]
```

#### ✅ Card "Request Institution Link" deve mostrar:
```
Select Institution: [Dropdown com TODAS as instituições ativas]
- Academy of English
- Ability English
- Access Language Centre
- ...
- Monash College (será listado também!)
- ...
[Botão "Request Link" - habilitado]
```

**Importante**: O select NÃO deve estar vazio!

---

## 🔍 Debug: Se ainda não funcionar

### 1. Verificar Console do Navegador
Abrir DevTools (F12) e verificar:
- Tab Console: Procurar por erros JavaScript
- Tab Network: Verificar chamadas para:
  - `GET /api/v1/institution-links/status`
  - `GET /api/v1/institutions?forLinking=true`

### 2. Verificar Response da API `/institution-links/status`

**Response Esperado**:
```json
{
  "success": true,
  "data": {
    "currentInstitution": {
      "id": "c39387fb-2187-4d71-a6b8-6bc14ae04e38",
      "name": "Monash College",
      "linkedAt": null
    },
    "pendingRequest": null,
    "history": []
  }
}
```

**Se retornar `currentInstitution: null`**: O problema persiste no backend.

### 3. Verificar Response da API `/institutions?forLinking=true`

**Response Esperado**:
```json
{
  "success": true,
  "data": {
    "institutions": [
      {"id": "...", "name": "Academy of English", ...},
      {"id": "...", "name": "Monash College", ...},
      // ... muitas outras instituições
    ],
    "pagination": {...}
  }
}
```

**Se retornar `institutions: []`**: O problema está no filtro de instituições.

---

## 🐛 Troubleshooting

### Problema 1: Card ainda mostra "Not Linked"
**Causa possível**: Backend não foi reiniciado ou mudanças não foram aplicadas

**Solução**:
1. Verificar se backend está rodando na porta 3001
2. Verificar logs do backend para confirmar que foi reiniciado
3. Testar endpoint diretamente: `curl http://localhost:3001/api/v1/institution-links/status`

### Problema 2: Select de instituições vazio
**Causa possível**: Parâmetro `forLinking=true` não está sendo enviado

**Solução**:
1. Verificar Network tab se a URL contém `?forLinking=true`
2. Limpar cache do navegador (Ctrl+Shift+R)
3. Verificar se o arquivo frontend foi salvo corretamente

### Problema 3: Erro 500 ao carregar
**Causa possível**: Erro no backend durante query

**Solução**:
1. Verificar logs do backend para stack trace
2. Verificar se tabelas `members` e `institutions` existem
3. Verificar se foreign key `institution_id` está correto

---

## 📝 Validação Final

Após as correções, a página deve funcionar assim:

### Cenário 1: Membro JÁ vinculado a uma instituição
- ✅ Mostra "Linked to [Nome da Instituição]"
- ✅ Mostra botão "Unlink from Institution"
- ✅ Select mostra TODAS instituições (incluindo a atual)
- ✅ Pode solicitar vínculo com OUTRA instituição (desvinculação automática)

### Cenário 2: Membro NÃO vinculado
- ✅ Mostra "Not Linked"
- ✅ Select mostra TODAS instituições ativas
- ✅ Pode solicitar vínculo com qualquer instituição

---

## 🔄 Status das Mudanças

- ✅ Backend reiniciado com correções (porta 3001)
- ✅ Frontend compilado (Vite hot reload deve pegar mudanças)
- ✅ Queries SQL testadas e validadas
- ⏳ Teste E2E pendente (aguardando validação manual)

---

## 💡 Próximos Passos se Funcionar

Depois de validar que está funcionando:

1. **Testar fluxo completo de request**:
   - Fazer request para outra instituição
   - Verificar se admin recebe notificação
   - Aprovar request
   - Verificar desvinculação automática da instituição anterior

2. **Testar auto-unlink**:
   - Membro vinculado à Institution A
   - Request para Institution B
   - Admin aprova
   - Verificar se foi desvinculado de A e vinculado a B
   - Verificar email de notificação para admins de A

---

Data: 14 de Novembro de 2025
Status: Aguardando teste manual do usuário

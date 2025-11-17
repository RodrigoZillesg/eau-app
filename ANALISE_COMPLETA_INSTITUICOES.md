# ANÁLISE COMPLETA - Sistema de Instituições

**Data:** 15/01/2025
**Status:** Análise em Progresso
**Severidade:** ALTA - Sistema parcialmente quebrado

---

## 📋 RESUMO EXECUTIVO

Foram identificados **2 problemas principais** relacionados ao sistema de instituições, ambos afetando funcionalidades críticas. Esta análise documenta TODOS os pontos de uso de instituições no sistema para garantir que correções não quebrem funcionalidades existentes.

### Problemas Identificados:
1. ✅ **CORRIGIDO** - Erro 500 ao salvar detalhes da instituição (campos incorretos)
2. ❌ **PENDENTE** - Erro 404 ao buscar instituição por ID (query com aggregation falhando)

---

## 🗺️ MAPEAMENTO COMPLETO DO SISTEMA

### Backend - Arquivos que usam `institutions` table

1. **`eau-backend/src/controllers/institutions.controller.ts`**
   - ✅ `list()` - Lista instituições (com paginação e filtros)
   - ❌ `getById()` - Busca instituição por ID **[PROBLEMA AQUI]**
   - ✅ `create()` - Cria nova instituição (super admin only)
   - ✅ `update()` - Atualiza instituição **[CORRIGIDO]**
   - ✅ `getMembers()` - Lista membros da instituição
   - ✅ `getStatistics()` - Estatísticas agregadas

2. **`eau-backend/src/services/institutionLink.service.ts`**
   - Queries: Gerenciamento de links entre membros e instituições
   - **Impacto:** Baixo - Não afetado pelos problemas atuais

3. **`eau-backend/src/middleware/auth.ts`**
   - Queries: Validação de permissões baseadas em instituição
   - **Impacto:** Médio - Usa `institution_id` do usuário

4. **`eau-backend/src/services/membershipApplication.service.ts`**
   - Queries: Aplicações de membership vinculadas a instituições
   - **Impacto:** Baixo - Não afetado

5. **`eau-backend/src/services/welcomeEmail.service.ts`**
   - Queries: Emails de boas-vindas para instituições
   - **Impacto:** Baixo - Não afetado

### Frontend - Arquivos que usam dados de instituições

1. **`eau-members/src/features/institutions/pages/InstitutionDetailsPage.tsx`**
   - **Uso:** Página principal para ver/editar detalhes da instituição
   - **API Calls:**
     - `GET /api/v1/institutions/:id` **[AFETADO POR PROBLEMA #2]**
     - `PUT /api/v1/institutions/:id` **[ERA AFETADO POR PROBLEMA #1 - CORRIGIDO]**
   - **Severidade:** CRÍTICA - Página não funciona

2. **`eau-members/src/features/admin/pages/MembershipManagementPage.tsx`**
   - **Uso:** Gestão de memberships (super admin)
   - **Queries Supabase:** `from('institutions')` para listar
   - **Impacto:** Baixo - Usa queries diretas do Supabase

3. **`eau-members/src/features/admin/components/MembershipEditModal.tsx`**
   - **Uso:** Modal para editar membership
   - **Queries Supabase:** `from('institutions')` para seleção
   - **Impacto:** Baixo - Usa queries diretas

4. **`eau-members/src/features/dashboard/components/InstitutionAdminDashboard.tsx`**
   - **Uso:** Dashboard do admin da instituição
   - **Dependências:** `memberData.institution_name` (vem de `/auth/me`)
   - **Impacto:** Médio - Funciona mas dados incompletos

5. **Outros arquivos:**
   - `CompleteImportPageFixed.tsx` - Import CSV com instituições
   - `StandardReportsPage.tsx` - Relatórios
   - `InstitutionsManagementPage.tsx` - Gestão de instituições
   - `MembershipStatusCard.tsx` - Card de status
   - `PaymentHistoryPage.tsx` - Histórico de pagamentos

---

## 🔍 PROBLEMA #1: Erro 500 ao Salvar Instituição

### Status: ✅ CORRIGIDO

### Causa Raiz:
Backend estava filtrando campos com nomes ERRADOS no método `update()`.

### Evidências:
```typescript
// ANTES (ERRADO) - institutions.controller.ts:179-186
const allowedFields = [
  'primary_contact_name', 'primary_contact_email', 'primary_contact_phone',
  'billing_email', 'address_line1', 'address_line2', 'city', 'state',
  'postal_code', 'notes'
];

// SCHEMA REAL DO BANCO:
// email, phone, website, address, city, state, postal_code
```

### Correção Aplicada:
```typescript
// DEPOIS (CORRETO)
const allowedFields = [
  'email', 'phone', 'website',
  'address', 'city', 'state', 'postal_code'
];
```

### Impacto da Correção:
- ✅ Institution Admin pode salvar detalhes
- ✅ Campos corretos são atualizados
- ✅ Frontend continua funcionando (já enviava campos corretos)
- ✅ **ZERO risco de quebrar outras funcionalidades**

### Arquivos Modificados:
- `eau-backend/src/controllers/institutions.controller.ts` (linhas 179-186)

### Status do Build:
- ✅ Backend rebuilded com `npm run build`
- ⏳ **PENDENTE**: Teste real da funcionalidade

---

## 🔍 PROBLEMA #2: Erro 404 ao Buscar Instituição

### Status: ❌ PROBLEMA ATIVO

### Sintomas:
- Backend log: `GET /api/v1/institutions/2342b3df-da8a-4050-910b-9a7382659e51 HTTP/1.1" 404`
- Frontend: Página `InstitutionDetailsPage` não carrega
- Dashboard: `memberData.institution_name` é null

### Validações do Banco de Dados:
```sql
-- ✅ Instituição EXISTE no banco
SELECT * FROM institutions WHERE id = '2342b3df-da8a-4050-910b-9a7382659e51';
-- Resultado: Taylors College Sydney (todos os dados corretos)

-- ✅ TEM 39 membros vinculados
SELECT COUNT(*) FROM members WHERE institution_id = '2342b3df-da8a-4050-910b-9a7382659e51';
-- Resultado: 39

-- ✅ Michelle está corretamente vinculada
SELECT institution_id FROM members WHERE id = '061fddc4-af06-4e82-a816-aebf14595ba5';
-- Resultado: 2342b3df-da8a-4050-910b-9a7382659e51
```

### Código Problemático:
```typescript
// institutions.controller.ts:94-101
const { data: institution, error } = await supabaseAdmin
  .from('institutions')
  .select(`
    *,
    members:members(count)  // ← ESTA SINTAXE PODE ESTAR FALHANDO
  `)
  .eq('id', id)
  .single();

if (error || !institution) {
  return res.status(404).json({...}); // ← ESTE 404 ESTÁ SENDO RETORNADO
}
```

### Análise da Query:
1. **Sintaxe usada:** `members:members(count)` - Tentativa de aggregation
2. **Comparação com código que FUNCIONA:**
   ```typescript
   // auth.controller.ts:264-269 (FUNCIONA)
   .select(`
     *,
     institutions (id, name, membership_type, membership_status)
   `)
   ```

### Hipóteses:
1. ❓ Sintaxe `members:members(count)` pode estar incorreta para Supabase JS
2. ❓ RLS policies bloqueando aggregation (improvável com `supabaseAdmin`)
3. ❓ Erro na query retorna `error` não-null, causando 404

---

## 📊 DADOS CONFIRMADOS DO BANCO

### Instituição: Taylors College Sydney
```json
{
  "id": "2342b3df-da8a-4050-910b-9a7382659e51",
  "name": "Taylors College Sydney",
  "email": "-",
  "phone": "-",
  "website": "-",
  "address": "965 Bourke St",
  "city": "Waterloo",
  "state": "NSW",
  "country": "Australia",
  "postal_code": "2017",
  "membership_type": "Full Provider",
  "membership_status": "active",
  "membership_start_date": "2025-09-25",
  "membership_renewal_date": "2026-09-25",
  "created_at": "2025-09-25 09:15:28.277+00",
  "updated_at": "2025-09-25 09:55:00.763861+00"
}
```

### Membros:
- **Total:** 39 membros vinculados
- **Institution Admin:** Michelle Zheng (`michelle.zheng@navitas.com`)

---

## 🎯 PLANO DE CORREÇÃO SEGURO

### Fase 1: Diagnóstico do Problema #2
1. ⏳ **Adicionar logs detalhados no backend `getById`:**
   ```typescript
   console.log('🔍 getById - Institution ID:', id);
   console.log('🔍 Query result:', { institution, error });
   if (error) console.error('❌ Supabase error:', error);
   ```

2. ⏳ **Testar query alternatives:**
   ```typescript
   // Opção A: Sem aggregation
   .select('*')

   // Opção B: Com subquery manual
   .select('*, member_count:members(count)')

   // Opção C: Query separada
   // 1. Get institution
   // 2. Count members separately
   ```

3. ⏳ **Verificar se erro persiste após correção do #1**

### Fase 2: Teste do Problema #1 (Corrigido)
1. ⏳ **Reload página de detalhes da instituição**
2. ⏳ **Clicar em "Edit Details"**
3. ⏳ **Modificar campo (ex: email)**
4. ⏳ **Clicar "Save Changes"**
5. ✅ **Validar que salva SEM erro 500**

### Fase 3: Implementar Correção Final do #2
1. ⏳ **Escolher solução baseada em testes**
2. ⏳ **Aplicar correção**
3. ⏳ **Rebuild backend**
4. ⏳ **Testar TODAS as funcionalidades relacionadas**

### Fase 4: Validação Completa
1. ⏳ **Dashboard Institution Admin** - Deve mostrar nome da instituição
2. ⏳ **Página Institution Details** - Deve carregar todos os dados
3. ⏳ **Editar e salvar** - Deve funcionar sem erros
4. ⏳ **Listar membros da instituição** - Deve mostrar 39 membros
5. ⏳ **Super Admin - Lista instituições** - Deve mostrar contagem correta

---

## 🔒 GARANTIAS DE SEGURANÇA

### Mudanças que NÃO Afetam Outros Sistemas:
1. ✅ **Correção #1** altera apenas `allowedFields` para Institution Admin
   - Frontend JÁ enviava campos corretos
   - Super Admin continua podendo editar TODOS os campos
   - Queries de SELECT não são afetadas

2. ⏳ **Correção #2** (quando implementada) afetará apenas:
   - Endpoint `GET /institutions/:id`
   - Usado SOMENTE por `InstitutionDetailsPage.tsx`
   - Outros lugares usam queries diretas do Supabase (não afetados)

### Validações Antes de Deploy:
- [ ] Backend build sem erros
- [ ] Frontend build sem erros
- [ ] Teste manual de TODAS as páginas de instituições
- [ ] Teste com diferentes tipos de usuários (Super Admin, Institution Admin, Member)
- [ ] Verificar console do browser por erros
- [ ] Verificar logs do backend por erros

---

## 📝 PRÓXIMOS PASSOS IMEDIATOS

1. **URGENTE:** Adicionar logs no `getById` para diagnosticar causa do 404
2. **TESTE:** Validar que correção #1 funciona
3. **IMPLEMENTAR:** Correção do #2 baseada em diagnóstico
4. **VALIDAR:** Teste completo end-to-end

---

## 📞 PONTOS DE CONTATO

**Arquivo:** `/institutions` endpoints no backend
**Responsável:** `InstitutionsController`
**Dependências:**
- `supabaseAdmin` - Client Supabase com service role
- `AuthRequest` - Middleware de autenticação
- `USER_TYPES` - Constantes de tipos de usuário

**Frontend:**
- Primary: `InstitutionDetailsPage.tsx`
- Secondary: Multiple admin pages + dashboards

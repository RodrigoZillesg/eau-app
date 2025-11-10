# Project Memory

## 🎯 COMANDO ESPECIAL "CONTINUAR"
**⚠️ IMPORTANTE: Quando o usuário escrever "continuar" (entre aspas ou não), fazer o seguinte:**
1. **ABRIR E LER:** `PLANO_DESENVOLVIMENTO_EAU.md`
2. **IDENTIFICAR:** Próximo sprint/tarefa pendente no roadmap
3. **EXECUTAR:** Implementar a próxima tarefa marcada como [ ]
4. **ATUALIZAR:** Marcar tarefa como ✅ quando concluída
5. **DOCUMENTAR:** Atualizar o documento com progresso e mudanças

**Documento Principal de Desenvolvimento:** `PLANO_DESENVOLVIMENTO_EAU.md`
- Este documento contém TODO o roadmap e status do projeto
- SEMPRE consultar antes de começar qualquer trabalho
- SEMPRE atualizar após completar tarefas
- Contém análise completa de gaps e próximos passos

## Important Project Guidelines

### 🚨🚨🚨 REGRA #1: TESTAR ANTES DE MARCAR COMO CONCLUÍDO 🚨🚨🚨
**⚠️ CRITICAL - LEIA ISTO ANTES DE QUALQUER TAREFA:**

#### WORKFLOW OBRIGATÓRIO PARA TODA IMPLEMENTAÇÃO:
```
1. Implementar código
2. ❌ NÃO MARCAR COMO CONCLUÍDO AINDA!
3. 🧪 TESTAR VIA PLAYWRIGHT (obrigatório!)
4. ✅ Se passou todos testes → Marcar como concluído
5. ❌ Se falhou algum teste → Corrigir e voltar ao passo 3
```

#### 🚨 ANTES DE DIZER "TAREFA CONCLUÍDA":
- [ ] Testei via Playwright MCP tools?
- [ ] Validei o fluxo completo do usuário?
- [ ] Verifiquei que não tem erros no console?
- [ ] Testei cenários de erro (validações)?

**SE QUALQUER RESPOSTA FOR "NÃO" → A TAREFA NÃO ESTÁ CONCLUÍDA!**

#### 📋 COMO TESTAR (PASSO A PASSO):
1. **Navegar**: `mcp__playwright__browser_navigate({ url: "http://localhost:5180/..." })`
2. **Snapshot**: `mcp__playwright__browser_snapshot()` - Ver estado da página
3. **Clicar**: `mcp__playwright__browser_click({ element: "...", ref: "..." })`
4. **Digitar**: `mcp__playwright__browser_type({ element: "...", ref: "...", text: "..." })`
5. **Validar**: `mcp__playwright__browser_snapshot()` - Confirmar resultado esperado

#### ❌ EXEMPLOS DE FALHA (NÃO FAÇA ISSO):
- "Implementei o código, tarefa concluída" ← ERRADO! Não testou!
- "O código está correto, deve funcionar" ← ERRADO! Não validou!
- "Já fiz antes, confio que funciona" ← ERRADO! Sempre teste!

#### ✅ EXEMPLO CORRETO:
```
1. Implementei checkbox "Members Only"
2. Testei via Playwright:
   - Navegou para criar evento ✅
   - Checkbox aparece ✅
   - Marcar checkbox e salvar ✅
   - Evento salvo com members_only=true ✅
3. AGORA SIM: Tarefa concluída!
```

**🔥 SE VOCÊ MARCAR COMO CONCLUÍDO SEM TESTAR, VOCÊ FALHOU! 🔥**

**Detalhes completos em**: Seção "🧪 TESTING METHODOLOGY - PLAYWRIGHT" abaixo

---

### 🚨🚨🚨 REGRA #2: SEMPRE RODAR BACKEND E FRONTEND JUNTOS 🚨🚨🚨
**⚠️ CRITICAL - NOSSO SISTEMA DEPENDE DE DOIS SERVIDORES:**

#### WORKFLOW OBRIGATÓRIO PARA TESTES:
```
1. ✅ Iniciar BACKEND (porta 3001): cd eau-backend && npm start
2. ✅ Iniciar FRONTEND (porta 5180): cd eau-members && npm run dev
3. ✅ Aguardar ambos estarem prontos
4. 🧪 APENAS ENTÃO começar os testes via Playwright
```

#### 🚨 NUNCA FAÇA ISSO:
- ❌ Testar só com frontend rodando
- ❌ Dizer "precisa do backend rodando" DEPOIS de testar pela metade
- ❌ Marcar como concluído sem testar com backend
- ❌ Assumir que "o resto funciona" sem testar

#### ✅ SEMPRE FAÇA ISSO:
1. **ANTES de começar qualquer teste**: Verificar se AMBOS servidores estão rodando
2. **Se não estiverem**: Iniciar AMBOS antes de testar
3. **Testar o fluxo COMPLETO**: Frontend → Backend → Banco → Email → Frontend
4. **Validar TUDO**: Não deixe nenhuma parte "para testar depois"

**🔥 REGRA DE OURO: Teste incompleto = Teste inútil. Não serve de nada! 🔥**

---

### 🚨🚨🚨 REGRA #3: SISTEMA DE EMAIL DE TESTE (CRÍTICO!) 🚨🚨🚨
**⚠️ CRITICAL - NUNCA ENVIAR EMAIL PARA USUÁRIO REAL EM MODO TESTE:**

#### CONFIGURAÇÃO SMTP:
- Existe uma página de configuração SMTP onde o admin configura:
  - ✅ Servidor SMTP (host, porta, usuário, senha)
  - ✅ **Modo de teste**: ON/OFF
  - ✅ **Email de teste**: Para onde enviar quando modo teste está ativo

#### 🚨 REGRA ABSOLUTA:
```
SE modo_teste == TRUE:
  ✅ TODOS os emails vão para email_de_teste
  ❌ NENHUM email vai para email real do membro

SE modo_teste == FALSE:
  ✅ Emails vão para email real do membro
```

#### WORKFLOW OBRIGATÓRIO ANTES DE ENVIAR EMAIL:
1. **CONSULTAR configurações SMTP do banco**
2. **VERIFICAR se modo_teste está ativo**
3. **SE ATIVO**: Substituir destinatário por email_de_teste
4. **APENAS ENTÃO**: Enviar email

#### ❌ NUNCA FAÇA ISSO:
- Enviar email direto para `member.email` sem verificar configuração
- Assumir que modo teste está desativado
- Implementar envio de email sem consultar tabela de configurações SMTP

#### ✅ SEMPRE FAÇA ISSO:
1. **Ler configuração SMTP** do banco antes de enviar
2. **Verificar flag de modo teste**
3. **Respeitar o email de teste** configurado
4. **Logar no console** para qual email foi enviado (teste ou real)

**🔥 ISTO É MUITÍSSIMO IMPORTANTE - Nunca quebrar esta regra! 🔥**

---

### Language Convention
- **Communication**: All conversation with the user should be in Portuguese (PT-BR)
- **Code and Application**: All code, UI text, error messages, and application content must be in English

### UI DESIGN SYSTEM
**⚠️ CRITICAL: SEMPRE CONSULTE O DESIGN SYSTEM ANTES DE CRIAR QUALQUER COMPONENTE**
- **📖 LEIA PRIMEIRO**: `UI_DESIGN_SYSTEM.md`
- **🎨 MANTENHA CONSISTÊNCIA**: Use apenas os padrões documentados
- **📐 LARGURA PADRÃO**: Todas as páginas devem usar `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- **🚫 NÃO INVENTE**: Não crie novos estilos sem atualizar o Design System

**Regras de UI:**
1. **SEMPRE** use o container padrão `max-w-7xl` para páginas
2. **NUNCA** crie novos componentes sem consultar o Design System
3. **SEMPRE** mantenha a mesma largura do Header em todas as páginas
4. **USE** apenas as cores e espaçamentos definidos
5. **TESTE** responsividade em todos os breakpoints

### DEPLOYMENT TO EASYPANEL
**⚠️ CRITICAL: SEMPRE CONSULTE A DOCUMENTAÇÃO DE DEPLOY ANTES DE FAZER DEPLOY**
- **📖 LEIA PRIMEIRO**: `EASYPANEL_DEPLOYMENT_COMPLETE_GUIDE.md`
- **🚨 NÃO FAÇA DEPLOY** sem consultar o guia completo
- **❌ EVITE ERROS**: O guia contém todas as lições aprendidas e soluções

**Regras de Deploy:**
1. **SEMPRE** faça build local antes (`npm run build`)
2. **NUNCA** compile TypeScript no Docker do EasyPanel
3. **SEMPRE** commite as pastas `dist` antes do push
4. **USE** os Dockerfiles simplificados do guia
5. **LEMBRE-SE** que EasyPanel usa contexto root

**Comando Rápido de Deploy:**
```bash
# Build e deploy completo
cd eau-backend && npm run build && cd ../eau-members && npm run build && cd ..
git add -A && git commit -m "Production build" && git push
# Depois vá para EasyPanel e clique em Deploy
```

### Development Server Management
**CRITICAL: Port Management Rules**
- **Frontend port: 5180** - Vite dev server
- **Backend port: 3001** - Node.js/Express API
- **⚠️ NEVER use `taskkill /F /IM node.exe`** - This kills Claude Code itself!

**🚨 CRITICAL RULE: NEVER KILL ALL NODE PROCESSES**
```bash
# ❌ WRONG - Kills Claude Code!
taskkill /F /IM node.exe

# ✅ RIGHT - Kill specific port only
netstat -ano | findstr :3001
taskkill /F /PID [specific_pid]
```

**Frontend Server (Port 5180) - Correct Restart:**
1. Find process: `netstat -ano | findstr :5180`
2. Kill specific PID: `taskkill /F /PID [process_id]`
3. Wait 2 seconds: `sleep 2`
4. Start server: `cd eau-members && npm run dev`

**Backend Server (Port 3001) - Correct Restart:**
1. Find process: `netstat -ano | findstr :3001`
2. Kill specific PID: `taskkill /F /PID [process_id]`
3. Wait 2 seconds: `sleep 2`
4. Start server: `cd eau-backend && npm start`

**Combined Safe Restart (Both Servers):**
```bash
# Find and kill frontend
for /f "tokens=5" %a in ('netstat -ano ^| findstr :5180') do taskkill /F /PID %a 2>nul

# Find and kill backend
for /f "tokens=5" %a in ('netstat -ano ^| findstr :3001') do taskkill /F /PID %a 2>nul

# Wait and restart both
sleep 2 && cd eau-members && start /B npm run dev && cd ../eau-backend && npm start
```

**Alternative: Check if port is free first:**
```bash
# Check if port 3001 is in use
netstat -ano | findstr :3001
# If empty output = port is free, safe to start
# If has output = port is in use, kill specific PID first
```

### 🧪 TESTING METHODOLOGY - PLAYWRIGHT (OBRIGATÓRIO)
**⚠️ CRITICAL: SEMPRE usar Playwright para testes E2E antes de marcar tarefa como concluída**

#### MCP Playwright Tools Disponíveis:
- `mcp__playwright__browser_navigate` - Navegar para URL
- `mcp__playwright__browser_click` - Clicar em elementos
- `mcp__playwright__browser_type` - Digitar em campos
- `mcp__playwright__browser_snapshot` - Capturar estado da página
- `mcp__playwright__browser_take_screenshot` - Screenshot para debug
- `mcp__playwright__browser_console_messages` - Ver erros de console

#### Quando Usar Playwright:
✅ **SEMPRE antes de:**
- Marcar tarefa como concluída
- Fazer commit de código significativo
- Deploy para produção
- Considerar feature "pronta"

#### Workflow de Teste Obrigatório:
1. **Implementar funcionalidade**
2. **Escrever cenário de teste** (passo a passo do que usuário faria)
3. **Executar teste via Playwright MCP**
4. **Validar resultado esperado**
5. **Corrigir bugs encontrados**
6. **Re-testar até passar 100%**
7. **Apenas então:** commit + deploy

#### Exemplo de Teste CPD:
```typescript
// 1. Navegar para página CPD
mcp__playwright__browser_navigate({ url: "http://localhost:5180/cpd" })

// 2. Capturar snapshot
mcp__playwright__browser_snapshot()

// 3. Clicar em "Add Activity"
mcp__playwright__browser_click({ element: "Add Activity button", ref: "..." })

// 4. Preencher formulário
mcp__playwright__browser_type({ element: "Title field", ref: "...", text: "Test Activity" })

// 5. Submit
mcp__playwright__browser_click({ element: "Submit button", ref: "..." })

// 6. Validar sucesso
mcp__playwright__browser_snapshot() // Verificar se apareceu na lista
```

#### Áreas Críticas para Testar:
- ✅ Login/Logout
- ✅ CRUD operations (Create, Read, Update, Delete)
- ✅ Validações de formulário
- ✅ Permissões (admin vs member)
- ✅ Integrações (OpenLearning SSO, Emails)

#### 🚨 REGRA DE OURO:
**Se não testou com Playwright, NÃO está pronto. Ponto final.**

---

### 🔢 VERSION CONTROL - CACHE BUSTING (OBRIGATÓRIO)
**⚠️ CRITICAL: SEMPRE incrementar versão após mudanças para evitar problemas de cache**

#### Quando Incrementar Versão:
✅ **SEMPRE após:**
- Qualquer mudança em componentes React
- Mudanças em services (frontend ou backend)
- Mudanças em rotas ou API endpoints
- Mudanças no backend que afetam frontend
- Correções de bugs visíveis ao usuário
- ANTES de testar mudanças (para garantir cache limpo)

#### Como Incrementar Versão:

**Frontend:**
```bash
# Abrir arquivo
code eau-members/package.json

# Incrementar versão
# Mudança pequena: 1.0.0 → 1.0.1
# Mudança média: 1.0.1 → 1.1.0
# Mudança grande: 1.1.0 → 2.0.0
```

**Backend:**
```bash
# Abrir arquivo
code eau-backend/package.json

# Seguir mesmo padrão
```

#### Workflow Completo:
1. **Fazer mudança no código**
2. **Incrementar versão** em package.json
3. **Build:** `npm run build`
4. **Testar em modo incógnito** (cache limpo)
5. **Validar que versão nova aparece**
6. **Commit tudo junto** (código + versão)

#### Exibir Versão no Sistema:
- ✅ Footer do sistema deve mostrar versão atual
- ✅ Console deve logar versão no startup
- ✅ Facilita debug ("qual versão está rodando?")

#### 🚨 REGRA DE OURO:
**Mudou código? Mude versão. Simples assim.**

---

### Cache Management and Version Control
**CRITICAL: Always ensure the user sees the latest version of the application**

#### Known Issue: Loading Screen Stuck
- **Problem**: Application gets stuck on loading screen due to stale localStorage/sessionStorage data
- **Cause**: Cached authentication tokens from previous sessions become invalid or corrupted
- **Solution**: Clear browser cache and localStorage

#### Implemented Solutions:
1. **Automatic Cache Clearing in Development**
   - App.tsx automatically clears expired sessions on startup
   - Error boundaries clear cache on critical errors
   
2. **Manual Cache Clearing**
   - **Keyboard Shortcut**: `Ctrl+Shift+R` - Clears all cache and reloads
   - **Utility Functions**: Available in `src/utils/clearCache.ts`
   - **Error Boundary**: Shows "Clear Cache and Reload" button on errors

3. **Vite Configuration**
   - Cache-busting headers configured in `vite.config.ts`
   - No-cache headers for development server
   - Hash-based filenames for production builds

#### Developer Instructions:
- **If loading screen is stuck**:
  1. Try `Ctrl+Shift+R` to clear cache
  2. Or open DevTools > Application > Clear Storage
  3. Or use incognito/private browsing mode for testing
  
- **When testing**: Always verify in both:
  - Regular browser window (to catch cache issues)
  - Incognito window (to verify clean state works)

- **Console Messages**: Development mode shows cache-clearing instructions in console

### Server Access (VPS)
**SSH Access - Use whenever server access is needed**
- **IP**: 91.108.104.122
- **SSH Command**: `ssh root@91.108.104.122`
- **Password**: `Y#n9nah@=E@6ws8m!F/q\`
- **EasyPanel URL**: http://91.108.104.122:3000/
- **EasyPanel Login**: dev@platty.tech / F27i486fb3gVyPC

### Supabase Connection Details
**IMPORTANT: NOW USING SUPABASE CLOUD - Migrated 24/01/2025**
- **Cloud URL**: https://ypsvoxelitgceclohxfu.supabase.co
- **Anon Key**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlwc3ZveGVsaXRnY2VjbG9oeGZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MDE3NTUsImV4cCI6MjA3NDI3Nzc1NX0.-NO0-hrp4GajpOK9WnryqIeyEtS9iUiv03qkp9ScL9w
- **Service Role Key**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlwc3ZveGVsaXRnY2VjbG9oeGZ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODcwMTc1NSwiZXhwIjoyMDc0Mjc3NzU1fQ.y_k4b4TlAev9R4TTFqHA08EjdZA-7Ymm5V1zMl-CYhA
- **Project ID**: ypsvoxelitgceclohxfu
- **Region**: Sydney (ap-southeast-2)

### Project Preferences
- No demo mode should be implemented - all features must use real Supabase connection
- Use SweetAlert2 for user notifications via showNotification function
- Follow existing code patterns and conventions in the codebase

## 🔄 MEMBER DUPLICATE DETECTION SYSTEM (FUNDAMENTAL PILLAR)
**⚠️ CRITICAL: Sistema fundamental para manutenção da integridade dos dados**

### Overview
Sistema avançado de detecção e merge de membros duplicados usando algoritmo de Levenshtein distance para comparação de strings.

### Database Structure
**Migration:** `create_duplicates_system_fixed` (30/09/2025)

#### Tables Created:
1. **`member_duplicates`**
   - Stores potential duplicate pairs with similarity scores
   - Tracks review status: pending, merged, not_duplicate, skipped
   - Fields: member1_id, member2_id, similarity_score, match_details (JSONB), status, reviewed_by, review_notes

2. **`member_merge_history`**
   - Audit trail of all merges performed
   - Allows undo within 30 days
   - Stores complete deleted member data as JSONB
   - Fields: kept_member_id, deleted_member_id, deleted_member_data, performed_by, can_undo, undo_deadline

3. **`pending_duplicates_view`**
   - Real-time view of pending duplicates with member details
   - Joins member_duplicates with members and institutions tables
   - Used by frontend for display

### Detection Algorithm
**Service:** `eau-members/src/services/memberDuplicateService.ts`

#### Scoring System (0-100 points):
- **Name Match (40 points)**: Exact name = 40pts, Similar name (Levenshtein) = 0-40pts
- **Company Match (20 points)**: Exact company = 20pts, Similar = 0-20pts
- **Email Match (15 points)**: Exact email = 15pts, Similar domain = 0-15pts
- **Phone Match (10 points)**: Exact phone = 10pts, Similar = 0-10pts
- **Address Match (15 points)**: Same address components = 0-15pts

#### Confidence Levels:
- **High Confidence**: Score ≥ 90
- **Medium Confidence**: Score ≥ 70
- **Low Confidence**: Score ≥ 50

### Key Features

#### 1. Duplicate Detection
- `findDuplicatesForMember(memberId)`: Find duplicates for specific member
- `findAllDuplicates()`: Scan entire database for duplicates
- Configurable similarity threshold (default: 50)

#### 2. Merge Functionality
- `mergeMembers(keepMemberId, deleteMemberId, performedBy)`:
  - Transfers all relationships (CPD activities, event registrations, payments)
  - Stores complete audit trail
  - Allows undo within 30 days
  - Updates all foreign keys automatically

#### 3. Review Actions
- **Merge**: Combine two members into one
- **Not Duplicate**: Mark as false positive (won't show again)
- **Skip**: Ignore for now (will show again)

#### 4. Undo Capability
- `undoMerge(mergeHistoryId, performedBy)`: Restore deleted member
- Only works within 30 days
- Restores all data and relationships
- Cannot undo if merge was manually marked as permanent

### Frontend Implementation
**Page:** `/admin/duplicates` (`eau-members/src/features/admin/pages/MemberDuplicatesPage.tsx`)

#### UI Components:
- **Stats Cards**: Show total, high, medium, low confidence duplicates
- **Scan Button**: Trigger full database scan
- **Filter Controls**: Search by name/email, filter by score threshold
- **Duplicate Cards**: Show side-by-side comparison with action buttons

#### User Workflow:
1. Navigate to `/admin/duplicates`
2. Click "Scan for Duplicates" to find potential duplicates
3. Review each duplicate pair:
   - See similarity score and match reasons
   - Compare member details side-by-side
4. Take action:
   - **Merge**: Choose which member to keep, merge automatically
   - **Not Duplicate**: Mark as false positive
   - **Skip**: Review later

### Testing Checklist
✅ **Database Setup**
- Tables created: member_duplicates, member_merge_history
- View created: pending_duplicates_view
- Indexes created for performance
- RLS policies enabled

✅ **Detection**
- Scan all members successfully
- Similarity scores calculated correctly
- Duplicates stored in database
- Frontend displays duplicate list

✅ **UI/UX**
- Page loads without errors
- Stats cards show correct counts
- Duplicate cards show proper information
- Action buttons work correctly

⚠️ **Merge (Pending Full Test)**
- Transfer CPD activities
- Transfer event registrations
- Transfer payment history
- Audit trail created
- Undo functionality works

### Access Requirements
- **Permission Required**: Super Admin or Admin role
- **Route**: `/admin/duplicates`
- **Protected**: Yes, requires authentication

### Maintenance Notes
- Run duplicate scan periodically (e.g., after bulk imports)
- Review pending duplicates regularly to maintain data quality
- Check merge history for any issues
- Clean up old merge history (>30 days) periodically

### Related Files
- Service: `eau-members/src/services/memberDuplicateService.ts` (641 lines)
- Page: `eau-members/src/features/admin/pages/MemberDuplicatesPage.tsx`
- Migration: Applied via `create_duplicates_system_fixed` (30/09/2025)
- Database: Tables in Supabase Cloud (ypsvoxelitgceclohxfu)

## WYSIWYG Editor Pattern (Quill.js)

### Problem Solved
The default Quill.js implementation had issues with bullet points appearing as numbered lists due to CSS counter-reset and the way Quill handles list markers. The browser's `::marker` pseudo-element was conflicting with Quill's `.ql-ui` elements, causing double bullets or incorrect numbering.

### Solution Components

#### 1. For Editor (Edit Mode)
**Use Component:** `QuillBulletFix` (`src/components/ui/QuillBulletFix.tsx`)

**Key Features:**
- Uses native browser `list-style-type` for both bullets and numbered lists
- Hides Quill's `.ql-ui` elements that duplicate markers
- Custom List class that ensures bullets use `<ul>` tags
- Proper image upload integration with Supabase

**CSS Strategy:**
```css
/* Show native markers */
.ql-editor ul { list-style-type: disc !important; }
.ql-editor ol { list-style-type: decimal !important; }

/* Hide Quill's duplicate markers */
.ql-editor li > .ql-ui { display: none !important; }
```

#### 2. For Display (Read Mode)
**Use Component:** `QuillContentUltraFixed` (`src/components/ui/QuillContentUltraFixed.tsx`)

**Key Features:**
- Renders Quill HTML content with proper list styling
- Uses same CSS strategy as editor for consistency
- Handles all Quill formatting (headings, lists, quotes, etc.)

### Implementation Pattern for New WYSIWYG Fields

#### Step 1: Import the correct component
```typescript
// For edit forms
import { QuillBulletFix } from '../components/ui/QuillBulletFix';

// For display/read-only
import { QuillContentUltraFixed } from '../components/ui/QuillContentUltraFixed';
```

#### Step 2: Use in edit forms
```typescript
<QuillBulletFix
  content={formData.description}
  onChange={(content) => setFormData({ ...formData, description: content })}
  placeholder="Enter description..."
  height="300px"
/>
```

#### Step 3: Use for display
```typescript
<QuillContentUltraFixed content={event.description} />
```

### Important Notes
- **DO NOT** use the original `QuillEditor` or `QuillEditorSimple` components - they have the bullet issue
- **DO NOT** try to convert `<li>` to `<div>` - use native list elements with proper CSS
- **ALWAYS** hide `.ql-ui` elements in both editor and display to avoid duplicate markers
- The solution relies on native browser `::marker` for bullets and numbers
- Works for nested lists and maintains Quill's data attributes

### Files Involved in Solution
- `src/components/ui/QuillBulletFix.tsx` - Editor component with fixes
- `src/components/ui/QuillContentUltraFixed.tsx` - Display component with fixes
- `src/styles/quill-fixed.css` - Modified Quill CSS (if using CSS approach)

### Testing Checklist
When implementing WYSIWYG in new areas:
1. ✅ Bullets appear as • not numbers
2. ✅ Ordered lists appear as 1, 2, 3
3. ✅ No duplicate markers (only one bullet/number per item)
4. ✅ Nested lists work correctly
5. ✅ Image upload works (if enabled)
6. ✅ Content saves and loads correctly


### Backend API Configuration
**IMPORTANTE: Backend Node.js/TypeScript implementado para arquitetura completa**

#### Backend Details
- **Localização**: `eau-backend/` directory
- **Port**: 3001 (produção e desenvolvimento)  
- **Base URL**: http://localhost:3001 (dev) | https://your-domain.com (prod)
- **Health Check**: `/health`
- **API Prefix**: `/api/v1`

#### Principais Endpoints
- **Auth**: `/api/v1/auth/*` - Login, refresh, logout
- **Institutions**: `/api/v1/institutions/*` - CRUD instituições
- **Members**: `/api/v1/members/*` - Gestão de membros
- **CPD**: `/api/v1/cpd/*` - Sistema CPD completo
- **Invitations**: `/api/v1/invitations/*` - Sistema de convites

#### Backend Features Implementadas
- ✅ **Autenticação JWT** com refresh tokens
- ✅ **Sistema hierárquico** de permissões (Super Admin → Institution Admin → Staff)
- ✅ **CRUD completo** para instituições e membros  
- ✅ **Sistema CPD** com auto-aprovação e tracking anual
- ✅ **Convites seguros** com tokens temporários
- ✅ **Exportação CSV** para admins
- ✅ **Rate limiting** e segurança
- ✅ **Dockerfile** ready para EasyPanel
- ✅ **Logging** estruturado
- ✅ **Error handling** padronizado

#### Deploy Instructions
1. **EasyPanel**: Use o Dockerfile incluído (`eau-backend/Dockerfile`)
2. **Environment Variables**: Configurar no EasyPanel conforme `.env.example`
3. **GitHub Integration**: Push para main branch ativa auto-deploy
4. **Health Monitoring**: Endpoint `/health` para status checks

#### Desenvolvimento
- **Start Backend**: `cd eau-backend && npm run dev` 
- **Build**: `npm run build`
- **TypeScript**: Configuração em `tsconfig.json`
- **Tests**: Estrutura preparada para Jest

### Production URLs (DEPLOYMENT SUCCESSFUL!)
- **Frontend (Official Domain)**: https://eauapp.platty.tech/
- **Backend API**: https://eau-app-servico-eau-backend.lkobs5.easypanel.host/
- **Admin Login Page**: https://eauapp.platty.tech/login

### Credentials & Access
- **Admin Login**: dev@platty.tech / wSZ72i-M7X[bV)Hdu%Qi0V03hf8f%6
- **Supabase Admin**: supabase / this_password_is_insecure_and_should_be_updated
- **Frontend (Dev)**: Port 5180 (http://localhost:5180)
- **Backend (Dev)**: Port 3001 (http://localhost:3001)

### OpenLearning Integration
**IMPORTANT: OAuth/SSO Integration with OpenLearning Platform**

#### OpenLearning Credentials
- **Platform URL**: https://www.openlearning.com/
- **Login Email**: dev@platty.tech
- **Password**: 7E8GC{:M*e\
- **Account Settings URL**: https://www.openlearning.com/accounts/account-settings/
- **Institution Admin URL**: https://www.openlearning.com/institution/admin/?institution=english-australia
- **API Key**: 681bbb338d4d83608d1d6114.c9323f76014106f3a8f6531f958b541a80f3ce39afc3d33244a09b27c6d075bd
- **Institution ID**: english-australia
- **API Base URL**: https://api.openlearning.com/v2.2
- **Legacy Client ID**: 1000.EJ1GYWGUO2JSYY38D545AOHEVIGQGS (não usado - usa API Key)
- **Legacy Client Secret**: 1f5c48aec5e199565b870f9d87a932ef99f5bf9e00 (não usado - usa API Key)
- **API Documentation**: https://api.openlearning.com/docs
- **Help Documentation**: https://help.openlearning.com/category/apis

#### ✅ SSO IMPLEMENTADO E VALIDADO (19/01/2025)
**Status: FUNCIONANDO 100% - Testado e validado com sucesso**
- **Documento de Validação**: `OPENLEARNING_SSO_VALIDATED.md`
- **Provisionamento Automático**: Usuários são provisionados automaticamente no primeiro SSO
- **Login sem senha**: SSO permite login direto sem necessidade de senha
- **Segurança**: Links são de uso único (one-time use) por segurança

#### Implementação SSO Funcional
1. **Backend Service**: `eau-backend/src/services/openlearningCorrect.service.ts`
   - Provisionamento via API v2.2
   - Geração de launch data LTI com parâmetros OAuth
   - Parsing correto de respostas aninhadas (data.data.id)

2. **API Endpoint**: `POST /api/v1/openlearning/sso/launch`
   - Auto-provisiona usuários não existentes
   - Gera SSO launch data para cada acesso
   - Retorna parâmetros LTI para submit via form POST

3. **Frontend Component**: `OpenLearningAccessButton.tsx`
   - Botão no menu do sistema
   - Cria form POST com parâmetros LTI
   - Abre OpenLearning em nova aba com auto-login

#### Como Funciona o SSO
1. Usuário clica no botão "Access OpenLearning" no menu
2. Sistema verifica se usuário já foi provisionado
3. Se não, provisiona automaticamente via API
4. Gera novo SSO token (uso único)
5. Submete form POST com parâmetros LTI
6. OpenLearning autentica e loga o usuário automaticamente

#### Comportamento Esperado
- **Primeiro acesso**: Funciona perfeitamente
- **Acessos subsequentes**: Requer novo token (mensagem "link has been used before" é normal)
- **Solução**: Sistema sempre gera novo token a cada clique

#### Integration Requirements
1. ✅ **User Provisioning**: IMPLEMENTADO - Create OpenLearning accounts automatically for EAU members
2. ✅ **SSO Implementation**: IMPLEMENTADO - Enable single sign-on between EAU and OpenLearning
3. **CPD Sync**: Import course completions from OpenLearning as CPD activities (próximo passo)

#### API Endpoints
- **User Provisioning**: `POST /institutions/{institution_id}/managed-users/`
- **SSO Launch**: `POST /institutions/{institution_id}/managed-users/{user_id}/sign-on/`
- **Course Completions**: TBD (needs further investigation)

#### Implementation Notes
- OpenLearning supports LTI, SAML, and custom API SSO methods
- Managed users can be provisioned without sending welcome emails
- Launch links can be generated for specific classes/courses
- Store OpenLearning user IDs for each EAU member

### Database Schema Documentation - ALWAYS CONSULT FIRST!
**📊 CRITICAL: ALWAYS READ `DATABASE_SCHEMA.md` BEFORE CREATING ANY SQL**

#### MANDATORY RULES:
1. **BEFORE creating ANY SQL**: ALWAYS read `DATABASE_SCHEMA.md` first
2. **AFTER any ALTER TABLE or CREATE TABLE**: IMMEDIATELY update `DATABASE_SCHEMA.md`
3. **NEVER ASSUME** column names - verify in documentation
4. **When in doubt**: Run `extract-database-schema.sql` to get current structure

### 🚨 SQL DEVELOPMENT BEST PRACTICES - NEVER FORGET!
**CRITICAL: Professional SQL Development Process - ALWAYS FOLLOW**

#### ⚠️ BEFORE EXECUTING ANY SQL:
1. **ANALYZE IMPACT FIRST**
   - Check what tables are affected
   - Search codebase for dependencies using Grep
   - Verify frontend/backend compatibility
   - Document all potential breaking changes

2. **USE SAFE SQL PATTERNS**
   ```sql
   -- ALWAYS use transactions for safety
   BEGIN;
   -- your changes here
   ROLLBACK; -- or COMMIT if safe

   -- ALWAYS check before inserting
   DO $$
   BEGIN
     IF NOT EXISTS (SELECT 1 FROM table WHERE condition) THEN
       -- safe insert
     END IF;
   END $$;

   -- ALWAYS use ON CONFLICT for safety
   INSERT ... ON CONFLICT DO NOTHING;
   ```

3. **VERIFY TABLE STRUCTURE**
   ```sql
   -- ALWAYS check columns exist before using them
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name = 'your_table';
   ```

4. **DOCUMENT DEPENDENCIES**
   - List all files that depend on this table
   - Note expected column names in frontend/backend
   - Create rollback scripts

5. **TEST IN STAGES**
   - First: SELECT to verify data
   - Second: Test with ROLLBACK
   - Third: Execute with COMMIT only when safe

#### ❌ COMMON MISTAKES THAT BREAK THE SYSTEM:
- Using wrong column names (e.g., `member_id` vs `user_id` in cpd_activities)
- Not checking if frontend expects different fields
- Assuming columns exist without verification
- Not using ON CONFLICT clauses
- Forgetting to check existing data dependencies

#### ✅ PROFESSIONAL WORKFLOW:
1. Read DATABASE_SCHEMA.md
2. Analyze impact with Grep tool
3. Create safe SQL with checks
4. Test with ROLLBACK first
5. Document changes
6. Update DATABASE_SCHEMA.md after changes

#### Key Files:
- **Database Schema Doc:** `DATABASE_SCHEMA.md` - Contains EXACT table structures
- **Extract Script:** `extract-database-schema.sql` - Run to get latest schema
- **Update Process:**
  1. Make database changes
  2. Run extract script
  3. Update DATABASE_SCHEMA.md
  4. Commit both SQL and documentation

#### Common Mistakes to Avoid:
- ❌ events table does NOT have: `event_type`, `format`, `registration_deadline`, `max_participants`, `location`, `online_link`
- ✅ events table DOES have: `location_type`, `capacity`, `registration_end_date`, `venue_name`, `virtual_link`
- ❌ Don't assume fields exist - CHECK FIRST
- ✅ Use exact column names from DATABASE_SCHEMA.md

### Database Access - MÉTODO OFICIAL MCP SUPABASE ✅
**🎯 CRÍTICO: SEMPRE usar MCP Supabase para todas as operações de banco de dados**

#### ✅ MÉTODO OFICIAL (SEMPRE USAR):
**MCP Supabase Tools (mcp__supabase-novo__)**

**Tools Disponíveis:**
```typescript
// Listar todas as tabelas
mcp__supabase-novo__list_tables({ schemas: ['public'] })

// Executar SQL (SELECT, INSERT, UPDATE, DELETE)
mcp__supabase-novo__execute_sql({ query: "SELECT * FROM members LIMIT 10" })

// Criar migration (DDL: CREATE TABLE, ALTER TABLE, etc.)
mcp__supabase-novo__apply_migration({
  name: "add_cpd_categories",
  query: "CREATE TABLE cpd_categories (...)"
})

// Listar migrations aplicadas
mcp__supabase-novo__list_migrations()

// Buscar documentação Supabase
mcp__supabase-novo__search_docs({
  graphql_query: "{ searchDocs(query: \"RLS policies\") { nodes { title href } } }"
})
```

#### 🔧 PROCEDIMENTO PADRÃO:
1. **Verificar schema atual:** `mcp__supabase-novo__list_tables`
2. **Executar operação:** `mcp__supabase-novo__execute_sql` ou `apply_migration`
3. **Validar resultado:** Verificar resposta do tool
4. **Atualizar documentação:** DATABASE_SCHEMA.md

#### 🎯 EXEMPLOS DE USO:

**Criar nova tabela (Migration):**
```typescript
mcp__supabase-novo__apply_migration({
  name: "create_cpd_categories",
  query: `
    CREATE TABLE IF NOT EXISTS cpd_categories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL UNIQUE,
      points_per_hour INTEGER NOT NULL CHECK (points_per_hour IN (1, 2, 3)),
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `
})
```

**Consultar dados:**
```typescript
mcp__supabase-novo__execute_sql({
  query: "SELECT id, name, email FROM members WHERE user_type = 'super_admin'"
})
```

**Atualizar dados:**
```typescript
mcp__supabase-novo__execute_sql({
  query: "UPDATE members SET user_type = 'admin' WHERE email = 'user@example.com'"
})
```

#### ⚠️ IMPORTANTE: DATABASE_SCHEMA.md é DOCUMENTAÇÃO
- **Fonte da Verdade:** Banco de dados real via MCP
- **DATABASE_SCHEMA.md:** Documentação de referência (pode estar desatualizado)
- **Workflow:** Sempre validar com `list_tables` antes de assumir schema

#### ❌ MÉTODOS ANTIGOS (NÃO USAR MAIS):
1. ~~Scripts Node.js com createClient~~ (usar MCP em vez disso)
2. ~~Supabase Studio manual~~ (usar MCP apply_migration)
3. ~~Pedir execução manual ao usuário~~ (usar MCP execute_sql)

#### 🚨 REGRA DE OURO:
**SEMPRE use MCP Supabase para operações de banco. É rastreável, seguro e padronizado.**

#### 🛡️ FALLBACK STRATEGIES IMPLEMENTADAS:
**Quando tabelas não existem, implementar fallbacks no código em vez de criar tabelas:**
- ✅ **Exemplo**: `roleService.ts` com fallback para `user_type` quando `member_roles` não existe
- ✅ **Estratégia**: Detectar `user_type = 'super_admin'` e retornar roles adequadas
- ✅ **Resultado**: Sistema funciona sem depender de tabelas específicas

### Development Guidelines
- Ao executar uma tarefa, sempre consulte @agents\index.md para definir o melhor agente
- **SQL Execution**: SEMPRE use scripts Node.js com createClient + service key
- **Frontend + Backend**: Mantenha ambos rodando simultaneamente para testes completos

### 📋 DESENVOLVIMENTO CONTÍNUO
**Comando "continuar":** Quando o usuário digitar "continuar", consultar `PLANO_DESENVOLVIMENTO_EAU.md` e executar a próxima tarefa pendente.

**Status Atual do Desenvolvimento:**
- **Documento Principal:** `PLANO_DESENVOLVIMENTO_EAU.md`
- **Última Atualização:** 10/01/2025
- **Próximo Sprint:** 1.1 - Certificados automáticos com CPD
- **Sistema:** 80% completo
- **Prioridades:**
  1. 🔴 Certificados automáticos → CPD
  2. 🔴 Dashboard membership status
  3. 🟡 Sistema de inscrição pública

### 🧪 SISTEMA DE TESTES COMPLETO - CRITICAL!
**⚠️ IMPORTANTE: Sistema de testes sistemáticos para garantir integridade do sistema**

#### Documentos de Teste Master
1. **SISTEMA_TESTES_COMPLETO.md** - Documento master com todos os testes do sistema
   - 10 áreas principais de teste
   - 100+ casos de teste individuais
   - Queries SQL de validação
   - Pré-requisitos e validações esperadas
   - Guia de troubleshooting

2. **PLANO_TESTE_EVENTOS_COMPLETO.md** - Testes detalhados do sistema de eventos
   - 8 cenários principais de teste
   - Instruções passo a passo
   - Validações de email, CPD e certificados

#### Comandos de Teste Disponíveis
**IMPORTANTE: O usuário pode pedir testes usando os seguintes comandos:**

1. **"Faça o teste completo do sistema"**
   - Executa TODOS os testes do SISTEMA_TESTES_COMPLETO.md
   - Duração estimada: 4-6 horas
   - Valida todos os pilares do sistema

2. **"Faça o teste do sistema CPD"** (ou qualquer área específica)
   - Executa apenas testes da área solicitada
   - Áreas disponíveis: Authentication, CPD, Events, Members, Institutions, Permissions, Email, Import, OpenLearning, Quick Check

3. **"Faça o teste rápido do sistema"**
   - Executa smoke test (15-20 minutos)
   - Valida funcionalidades críticas

4. **"Faça o teste do sistema de eventos"**
   - Executa PLANO_TESTE_EVENTOS_COMPLETO.md
   - Duração estimada: 2-3 horas

#### Quando Executar Testes
✅ **SEMPRE executar testes após:**
- Mudanças significativas no código
- Adicionar novas funcionalidades
- Correções de bugs críticos
- Refatoração de serviços principais
- Mudanças no schema do banco de dados
- Deploy para produção

#### Processo de Manutenção do Documento de Testes
**CRITICAL: SEMPRE atualizar SISTEMA_TESTES_COMPLETO.md quando:**

1. **Adicionar nova funcionalidade:**
   - Criar nova seção no documento se necessário
   - Adicionar casos de teste para a funcionalidade
   - Incluir queries SQL de validação
   - Documentar comportamento esperado
   - Atualizar template de novo teste

2. **Modificar funcionalidade existente:**
   - Atualizar casos de teste afetados
   - Revisar queries SQL de validação
   - Atualizar comportamentos esperados
   - Adicionar novos cenários de edge cases

3. **Corrigir bug crítico:**
   - Adicionar caso de teste que reproduz o bug
   - Documentar comportamento correto
   - Incluir na seção de troubleshooting

#### Estrutura do Teste no Documento
Cada teste deve seguir o formato:
```markdown
### TESTE X.Y: Nome do Teste

**Área:** Nome da área (CPD, Events, etc.)
**Duração Estimada:** X minutos
**Pré-requisitos:** Lista de requisitos

**Passo a passo:**
1. Ação específica
2. Validação esperada
3. Próxima ação

**Validação SQL:**
```sql
-- Query para validar resultado
```

**Resultado Esperado:**
- ✅ Comportamento correto 1
- ✅ Comportamento correto 2

**Troubleshooting:**
- ❌ Se erro X, verificar Y
```

#### Relatórios de Teste
**Após executar testes, SEMPRE:**
1. Documentar resultados em formato markdown
2. Incluir timestamp e duração
3. Listar todos os testes executados (✅ ou ❌)
4. Documentar bugs encontrados com screenshots
5. Criar issues para bugs críticos
6. Atualizar STATUS no documento principal

#### Integração com Desenvolvimento
**WORKFLOW OBRIGATÓRIO:**
```
1. Fazer mudança no código
2. Executar testes relevantes
3. Validar todos os testes passaram
4. Atualizar documento de testes se necessário
5. Commitar código + atualização de testes
6. Deploy apenas se testes passarem
```

#### Quick Reference - Áreas de Teste
1. **Authentication** - Login, logout, sessions, permissions
2. **CPD System** - Activities, points, progress, reports
3. **Events** - Creation, registration, emails, reminders, CPD/certificates
4. **Members** - CRUD, roles, profiles, status
5. **Institutions** - Management, membership types, fees
6. **Permissions** - Super Admin, Institution Admin, Staff, Member
7. **Email System** - SMTP config, templates, sending, tracking
8. **Import System** - CSV import, validation, error handling
9. **OpenLearning** - SSO, provisioning, integration
10. **Quick Check** - Smoke test crítico (15-20 min)

#### Métricas de Qualidade
**TARGETS:**
- ✅ 100% dos testes críticos passando
- ✅ Menos de 5% de falhas em testes não-críticos
- ✅ Zero bugs críticos em produção
- ✅ Documento de testes sempre atualizado

### 🔍 LEGACY SYSTEM ANALYSIS - English Australia Admin Portal

**⚠️ CRITICAL: Credenciais de acesso ao sistema antigo para análise e migração**

#### Legacy System Access
- **URL**: https://www.englishaustralia.com.au/administration/
- **Email**: rodrigo.zillesg@platty.tech
- **Senha**: Salmo119:97
- **Acesso concedido**: Admin completo para análise e migração de dados

## 📊 ANÁLISE COMPLETA DO SISTEMA ANTIGO vs NOVO

### 🎯 FUNCIONALIDADES DO SISTEMA ANTIGO (Legacy)

#### 1. **MEMBERSHIP MANAGEMENT**
**✅ Sistema Atual:** Funcionalidades completas identificadas no sistema antigo:
- **Members Section**: Lista de 6.576 membros com filtros avançados
- **Memberships Section**: 129 memberships institucionais ativas
- **Tipos de Membership**:
  - Member College - Full (Standard) 
  - Member College - Associate (Standard)
  - Professional Affiliate Program (Standard)
  - Professional Affiliate Institution (Standard)
  - Corporate Affiliate (Standard)
  - Board Director (Standard)
  - Consultant (Standard)
  - International Institution (Standard)
  - Partner Agent (Standard)

**🔄 Status no Sistema Novo**: ✅ **IMPLEMENTADO E MELHORADO**
- ✅ Página de membership management funcional
- ✅ Sistema de taxas configurável baseado no site oficial
- ✅ Calculadora de taxas automática com GST
- ✅ Integração com sistema de importação CSV

#### 2. **EVENTS MANAGEMENT**
**✅ Sistema Atual:** Sistema robusto de eventos identificado:
- **397 eventos registrados** no sistema
- **Categorias**: English Australia Events, Webinars, Sector events, SIG Events, Home Page Events
- **Status**: Active, Expired, Upcoming, Not Public
- **Funcionalidades**: Registrations tracking, Places management
- **Relatórios**: Event reports, registration reports
- **Integrações**: GoToWebinar, Email systems

**🔄 Status no Sistema Novo**: ✅ **IMPLEMENTADO COMPLETO**
- ✅ Sistema de eventos funcional com todas as funcionalidades
- ✅ Registro de eventos, gestão de participantes
- ✅ Sistema de lembretes automáticos por email
- ✅ Integração com CPD (eventos geram pontos CPD)
- ✅ Dashboard administrativo completo

#### 3. **CPD TRACKING SYSTEM**
**✅ Sistema Atual:** Sistema identificado mas não totalmente explorado
- CPD Tracker presente no menu lateral
- Integração com members e events

**🔄 Status no Sistema Novo**: ✅ **IMPLEMENTADO AVANÇADO**
- ✅ Sistema CPD completo com tracking anual
- ✅ Auto-aprovação para eventos EA
- ✅ Manual review para atividades externas
- ✅ Dashboard com progresso visual
- ✅ Relatórios administrativos

#### 4. **REPORTING SYSTEM**
**✅ Sistema Atual:** Sistema extenso de relatórios:
- Report Builder
- Membership reports
- Event reports
- Email logs
- Import/Export tools

**🔄 Status no Sistema Novo**: ⚠️ **PARCIALMENTE IMPLEMENTADO**
- ✅ Relatórios básicos de memberships e eventos
- ⚠️ **GAP**: Report Builder customizável não implementado
- ⚠️ **GAP**: Email logs não implementados
- ✅ Export/Import de dados CSV implementado

#### 5. **PEOPLE MANAGEMENT**
**✅ Sistema Atual:** Sistema simples identificado
- Basic people directory

**🔄 Status no Sistema Novo**: ✅ **IMPLEMENTADO MELHORADO**
- ✅ Gestão completa de membros e instituições
- ✅ Sistema de convites e roles
- ✅ Profile management

#### 6. **MARKETING TOOLS**
**✅ Sistema Atual:** Seção marketing presente
- Não explorado em detalhes nesta análise

**🔄 Status no Sistema Novo**: ❌ **NÃO IMPLEMENTADO**
- **GAP IDENTIFICADO**: Marketing tools não implementadas

#### 7. **COMMERCE SYSTEM**
**✅ Sistema Atual:** Sistema de comércio/pagamentos presente
- Não explorado em detalhes nesta análise

**🔄 Status no Sistema Novo**: ❌ **NÃO IMPLEMENTADO**
- **GAP IDENTIFICADO**: Sistema de pagamentos não implementado

#### 8. **WEBSITE CMS**
**✅ Sistema Atual:** Sistema de gestão de conteúdo web presente
- Não explorado em detalhes nesta análise

**🔄 Status no Sistema Novo**: ❌ **NÃO IMPLEMENTADO**
- **GAP IDENTIFICADO**: CMS não implementado

### 🎯 GAPS PRINCIPAIS IDENTIFICADOS

#### 🔴 **GAPS CRÍTICOS (Funcionalidades essenciais ausentes)**
1. **Report Builder Customizável**
   - Sistema antigo tem report builder avançado
   - Sistema novo tem apenas relatórios fixos

2. **Sistema de Commerce/Pagamentos**
   - Sistema antigo gerencia pagamentos de memberships
   - Sistema novo não tem integração de pagamentos

3. **Email Logging e Tracking**
   - Sistema antigo rastreia todos os emails enviados
   - Sistema novo envia emails mas não registra histórico

#### 🟡 **GAPS MÉDIOS (Melhorias desejáveis)**
1. **Marketing Tools**
   - Sistema antigo tem ferramentas de marketing
   - Sistema novo foca apenas em gestão de membros

2. **Website CMS Integration**
   - Sistema antigo gerencia conteúdo web
   - Sistema novo é standalone

3. **Advanced Search and Filtering**
   - Sistema antigo tem filtros muito avançados
   - Sistema novo tem filtros básicos

#### 🟢 **FUNCIONALIDADES SUPERIORES NO SISTEMA NOVO**
1. **Interface Moderna e Responsiva**
   - Sistema novo: Modern React UI, mobile-friendly
   - Sistema antigo: Interface desktop antiga

2. **Sistema de Importação Avançado**
   - Sistema novo: Import com pause/resume, persistência
   - Sistema antigo: Import básico

3. **Real-time Notifications**
   - Sistema novo: Notificações em tempo real
   - Sistema antigo: Sistema básico

4. **Security e Authentication**
   - Sistema novo: JWT, roles avançados, MFA ready
   - Sistema antigo: Sistema de auth básico

### 📋 RECOMENDAÇÕES DE IMPLEMENTAÇÃO

#### 🎯 **PRIORIDADE ALTA (Implementar primeiro)**
1. **Report Builder System**
   - Implementar report builder customizável
   - Templates para relatórios comuns
   - Export em múltiplos formatos

2. **Email Logging System**
   - Registrar histórico de todos emails enviados
   - Interface para consultar logs
   - Tracking de opens/clicks

3. **Payment Integration**
   - Integração com gateway de pagamento
   - Gestão de invoices e payments
   - Auto-renewal de memberships

#### 🎯 **PRIORIDADE MÉDIA (Implementar depois)**
1. **Marketing Tools**
   - Newsletter management
   - Campaign tracking
   - Member communication tools

2. **Advanced Filtering**
   - Filtros avançados estilo sistema antigo
   - Saved searches
   - Bulk operations melhoradas

#### 🎯 **PRIORIDADE BAIXA (Considerar futuramente)**
1. **CMS Integration**
   - Gestão de conteúdo web
   - Integration com website público

2. **Advanced Commerce Features**
   - E-commerce completo
   - Product management
   - Shopping cart

### 🎉 **RESUMO EXECUTIVO**

**✅ O QUE TEMOS BEM IMPLEMENTADO:**
- ✅ Membership management completo e superior
- ✅ Events system completo e moderno  
- ✅ CPD tracking avançado
- ✅ Import/Export system superior
- ✅ Modern UI/UX
- ✅ Security avançada

**⚠️ O QUE PRECISA SER IMPLEMENTADO:**
- 🔴 Report Builder customizável
- 🔴 Sistema de pagamentos
- 🔴 Email logging
- 🟡 Marketing tools
- 🟡 Advanced search/filtering

**🎯 PRÓXIMOS PASSOS RECOMENDADOS:**
1. Implementar Report Builder system
2. Adicionar Email logging e tracking
3. Integrar sistema de pagamentos
4. Expandir ferramentas de marketing
5. Melhorar sistema de filtros avançados

O sistema novo está **80% completo** em relação às funcionalidades core do sistema antigo, com muitas melhorias significativas em UX, performance e security.

### 🎨 Skeleton Loading Pattern (OBRIGATÓRIO)
**CRITICAL: SEMPRE usar skeleton loading em vez de texto "Loading..." ou spinners**

#### Componentes Disponíveis
- **SkeletonLoader**: Componente base para diferentes tipos de skeleton
- **StatsCardSkeleton**: Para cards de estatísticas
- **MembershipTableSkeleton**: Para tabelas de dados  
- **DistributionCardSkeleton**: Para cards de distribuição

#### Quando Usar
- ✅ **Carregamento de dados assíncronos**: APIs, queries, operações demoradas
- ✅ **Cards de estatísticas**: Sempre mostrar skeleton antes dos dados
- ✅ **Tabelas**: Usar MembershipTableSkeleton com número apropriado de linhas
- ✅ **Listas**: Skeleton para cada item esperado
- ❌ **NÃO usar**: Texto simples "Loading...", spinners básicos, texto estático

#### Implementação Padrão
```typescript
// Estado de loading separado para diferentes seções
const [loading, setLoading] = useState(true)
const [statsLoading, setStatsLoading] = useState(true)

// Render condicional com skeleton
{statsLoading ? (
  <StatsCardSkeleton />
) : (
  <ActualComponent />
)}
```

#### Performance + Skeleton
- **Separar estados de loading** para different seções da página
- **Queries paralelas** com Promise.all() para melhor performance
- **Processamento local** em vez de múltiplas queries quando possível
- **Skeleton proporcional** ao conteúdo real esperado
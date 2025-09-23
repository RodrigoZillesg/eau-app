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
- **ALWAYS use port 5180** - This is our standard development port
- **NEVER let Vite use alternative ports** (5181, 5182, etc.)
- **If port 5180 is in use, it means our server is already running**
- **⚠️ NEVER use `taskkill /F /IM node.exe`** - This kills Claude itself!

**Correct Server Restart Sequence:**
1. **Use the safe restart script**: `powershell .\scripts\restart-server.ps1`
2. This script will:
   - Find ONLY processes using port 5180
   - Kill ONLY those specific processes
   - Wait for port release
   - Start the dev server

**Alternative manual method (if script fails):**
1. Find process on port 5180: `netstat -ano | findstr :5180`
2. Kill specific PID: `taskkill /F /PID [process_id]`
3. Wait 2 seconds
4. Start server: `cd eau-members && npm run dev`

**WRONG approach:**
- Using `taskkill /F /IM node.exe` (kills ALL Node processes including Claude!)
- Letting Vite increment ports (5181, 5182, 5183...)
- This leaves multiple servers running and wastes resources

**RIGHT approach:**
- Use the restart script: `powershell .\scripts\restart-server.ps1`
- Kill ONLY processes on port 5180
- One server, one port, always

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
**IMPORTANT: ALWAYS USE ONLINE SUPABASE - NEVER LOCAL**
- **Online URL**: https://english-australia-eau-supabase.lkobs5.easypanel.host
- **Anon Key**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE
- **Service Role Key**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q
- **JWT Secret**: your-super-secret-jwt-token-with-at-least-32-characters-long

### Project Preferences
- No demo mode should be implemented - all features must use real Supabase connection
- Use SweetAlert2 for user notifications via showNotification function
- Follow existing code patterns and conventions in the codebase

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
- **Admin Login**: rrzillesg@gmail.com / Salmo119:97
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

### Database Access - CRITICAL INFORMATION
**⚠️ IMPORTANTE: MÉTODO DEFINITIVO PARA EXECUÇÃO DE SQL**

#### ❌ MÉTODOS QUE NÃO FUNCIONAM (NÃO PERDER TEMPO):
1. **Playwright + Supabase Studio**: O editor SQL não carrega após login
2. **MCP Supabase**: Não funciona com Supabase autohospedado
3. **MCP PostgreSQL**: Banco não está exposto na porta correta
4. **Scripts no Backend**: Tentativas múltiplas sem sucesso

#### ✅ ÚNICO MÉTODO FUNCIONAL:
**SEMPRE forneça o SQL para o usuário executar manualmente no Supabase Studio**

**Procedimento Padrão:**
1. Claude gera o SQL completo
2. Usuário copia e executa no Supabase Studio
3. Usuário confirma a execução
4. Claude continua com próximos passos

**NUNCA TENTE:**
- Acessar o banco diretamente
- Usar Playwright para Supabase Studio
- Configurar novas conexões de banco
- Perder tempo com métodos já testados

### Development Guidelines
- Ao executar uma tarefa, sempre consulte @agents\index.md para definir o melhor agente
- **SQL Execution**: SEMPRE forneça SQL para execução manual pelo usuário
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
# Project Memory

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
- **Institution Admin URL**: https://www.openlearning.com/institution/admin/?institution=english-australia
- **Client ID**: 1000.EJ1GYWGUO2JSYY38D545AOHEVIGQGS
- **Client Secret**: 1f5c48aec5e199565b870f9d87a932ef99f5bf9e00
- **API Documentation**: https://api.openlearning.com/docs
- **Help Documentation**: https://help.openlearning.com/category/apis

#### Integration Requirements
1. **User Provisioning**: Create OpenLearning accounts automatically for EAU members
2. **SSO Implementation**: Enable single sign-on between EAU and OpenLearning
3. **CPD Sync**: Import course completions from OpenLearning as CPD activities

#### API Endpoints
- **User Provisioning**: `POST /institutions/{institution_id}/managed-users/`
- **SSO Launch**: `POST /institutions/{institution_id}/managed-users/{user_id}/sign-on/`
- **Course Completions**: TBD (needs further investigation)

#### Implementation Notes
- OpenLearning supports LTI, SAML, and custom API SSO methods
- Managed users can be provisioned without sending welcome emails
- Launch links can be generated for specific classes/courses
- Store OpenLearning user IDs for each EAU member

### Development Guidelines
- Ao executar uma tarefa, sempre consulte @agents\index.md para definir o melhor agente
- Use Playwright para acessar Supabase e executar comandos SQL necessários
- **Frontend + Backend**: Mantenha ambos rodando simultaneamente para testes completos
# 🏗️ ARQUITETURA DO SISTEMA EAU - DOCUMENTAÇÃO COMPLETA

**Data de Criação:** 31 de Outubro de 2025
**Última Atualização:** 31 de Outubro de 2025
**Sistema:** English Australia Unified (EAU) Management System

---

## 📋 ÍNDICE

1. [Visão Geral do Sistema](#visão-geral-do-sistema)
2. [Arquitetura Técnica](#arquitetura-técnica)
3. [Database Schema e Relacionamentos](#database-schema-e-relacionamentos)
4. [Fluxos de Dados Principais](#fluxos-de-dados-principais)
5. [Módulos e Funcionalidades](#módulos-e-funcionalidades)
6. [Integrações Externas](#integrações-externas)
7. [Deploy e Infraestrutura](#deploy-e-infraestrutura)

---

## 🎯 VISÃO GERAL DO SISTEMA

### Propósito
Sistema unificado de gerenciamento para English Australia, incluindo:
- Gestão de membros e instituições
- Sistema de eventos com registro e certificados
- Tracking de CPD (Continuing Professional Development)
- Integração com OpenLearning para cursos online
- Aplicação de membership institucional
- Relatórios e dashboards administrativos

### Stack Tecnológico

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- TailwindCSS (styling)
- Zustand (state management)
- React Router (routing)
- React Query (data fetching)
- SweetAlert2 (notifications)

**Backend:**
- Node.js + Express
- TypeScript
- JWT Authentication
- Node-cron (scheduling)
- Nodemailer (email)
- jsPDF (certificate generation)

**Database:**
- Supabase PostgreSQL
- Row Level Security (RLS)
- Real-time subscriptions

**Deploy:**
- EasyPanel (Docker)
- Frontend: https://eauapp.platty.tech/
- Backend: https://eau-app-servico-eau-backend.lkobs5.easypanel.host/

---

## 🏛️ ARQUITETURA TÉCNICA

### Estrutura de Diretórios

```
EAU-React/
│
├── eau-backend/                 # Backend Node.js + Express
│   ├── src/
│   │   ├── controllers/        # Controllers (14 módulos)
│   │   │   ├── auth.controller.ts
│   │   │   ├── cpd.controller.ts
│   │   │   ├── email.controller.ts
│   │   │   ├── events.controller.ts
│   │   │   └── ...
│   │   │
│   │   ├── routes/             # API Routes
│   │   │   ├── index.ts        # Main router
│   │   │   ├── auth.routes.ts
│   │   │   ├── cpd.routes.ts
│   │   │   ├── openlearning.routes.ts
│   │   │   ├── admin/          # Admin routes
│   │   │   │   ├── membershipApplications.routes.ts
│   │   │   │   └── emailLogs.routes.ts
│   │   │   └── ...
│   │   │
│   │   ├── services/           # Business Logic (17 services)
│   │   │   ├── email.service.ts
│   │   │   ├── reminder.service.ts
│   │   │   ├── membershipApplication.service.ts
│   │   │   ├── openlearningCorrect.service.ts  # OpenLearning API
│   │   │   ├── openlearningSSO.service.ts      # SSO implementation
│   │   │   ├── openlearningSyncScheduler.service.ts
│   │   │   ├── reportScheduler.service.ts
│   │   │   └── ...
│   │   │
│   │   ├── middleware/         # Middlewares
│   │   │   ├── auth.ts         # JWT validation
│   │   │   └── ...
│   │   │
│   │   ├── templates/          # Email templates HTML
│   │   │   ├── event-confirmation.html
│   │   │   ├── reminder-*.html
│   │   │   └── ...
│   │   │
│   │   ├── utils/
│   │   │   └── retryHelper.ts  # Retry logic with backoff
│   │   │
│   │   └── index.ts            # Entry point + schedulers init
│   │
│   ├── dist/                   # Build output (compilado do TypeScript)
│   ├── Dockerfile              # Docker config para deploy
│   ├── package.json
│   └── tsconfig.json
│
├── eau-members/                # Frontend React + TypeScript
│   ├── src/
│   │   ├── components/        # Componentes reutilizáveis
│   │   │   ├── layout/        # MainLayout, Header, Footer
│   │   │   ├── shared/        # RoleBasedRoute, ImpersonationBanner
│   │   │   ├── ui/            # UI components (QuillEditor, etc)
│   │   │   ├── filters/       # AdvancedFilters
│   │   │   ├── bulk/          # BulkOperations
│   │   │   ├── openlearning/  # OpenLearning components
│   │   │   └── ...
│   │   │
│   │   ├── features/          # Features modulares
│   │   │   ├── admin/         # Admin pages e components
│   │   │   │   ├── pages/
│   │   │   │   │   ├── AdminDashboard.tsx
│   │   │   │   │   ├── MembersPage.tsx
│   │   │   │   │   ├── MembershipManagementPage.tsx
│   │   │   │   │   ├── InstitutionsManagementPage.tsx
│   │   │   │   │   ├── AdminEventsPage.tsx
│   │   │   │   │   ├── OpenLearningIntegrationPage.tsx
│   │   │   │   │   ├── OpenLearningSyncPage.tsx
│   │   │   │   │   ├── MembershipApplicationsPage.tsx
│   │   │   │   │   ├── ReportBuilderPage.tsx
│   │   │   │   │   ├── StandardReportsPage.tsx
│   │   │   │   │   ├── ScheduledReportsPage.tsx
│   │   │   │   │   ├── EmailLogsPage.tsx
│   │   │   │   │   └── ...
│   │   │   │   └── components/
│   │   │   │
│   │   │   ├── auth/          # Authentication
│   │   │   │   ├── pages/
│   │   │   │   │   └── LoginPage.tsx
│   │   │   │   └── components/
│   │   │   │       └── LoginForm.tsx
│   │   │   │
│   │   │   ├── cpd/           # CPD System
│   │   │   │   ├── pages/
│   │   │   │   │   ├── CPDPage.tsx
│   │   │   │   │   ├── CPDReviewPage.tsx
│   │   │   │   │   └── CPDManagementPage.tsx
│   │   │   │   └── cpdService.ts
│   │   │   │
│   │   │   ├── events/        # Events System
│   │   │   │   ├── pages/
│   │   │   │   │   ├── EventsListPage.tsx
│   │   │   │   │   ├── EventDetailsPage.tsx
│   │   │   │   │   └── MyRegistrationsPage.tsx
│   │   │   │   └── ...
│   │   │   │
│   │   │   ├── dashboard/     # Dashboards
│   │   │   │   ├── pages/
│   │   │   │   │   └── DashboardPage.tsx
│   │   │   │   └── components/
│   │   │   │       ├── AdminDashboard.tsx
│   │   │   │       ├── MemberDashboard.tsx
│   │   │   │       └── MembershipStatusCard.tsx
│   │   │   │
│   │   │   └── membership/    # Membership features
│   │   │       └── pages/
│   │   │           ├── JoinPage.tsx (public)
│   │   │           └── PaymentHistoryPage.tsx
│   │   │
│   │   ├── services/          # Frontend services (14 services)
│   │   │   ├── eventService.ts
│   │   │   ├── eventRegistrationService.ts
│   │   │   ├── memberService.ts
│   │   │   ├── institutionService.ts
│   │   │   ├── openlearningService.ts
│   │   │   ├── roleService.ts
│   │   │   ├── emailService.ts
│   │   │   ├── reportExportService.ts
│   │   │   ├── scheduledReportService.ts
│   │   │   ├── memberDuplicateService.ts
│   │   │   ├── certificatePdfService.ts
│   │   │   └── ...
│   │   │
│   │   ├── stores/            # State management
│   │   │   └── authStore.ts   # Zustand auth store
│   │   │
│   │   ├── routes/            # Routing
│   │   │   ├── AppRoutes.tsx  # Main routes (66 routes)
│   │   │   └── LazyRoutes.tsx # Lazy loaded routes
│   │   │
│   │   ├── hooks/             # Custom hooks
│   │   │   ├── usePermissions.ts
│   │   │   ├── useAuthHealthCheck.ts
│   │   │   ├── useRoleMonitor.ts
│   │   │   ├── useBulkOperations.ts
│   │   │   └── ...
│   │   │
│   │   ├── utils/             # Utilities
│   │   │   ├── debounce.ts
│   │   │   ├── performanceMonitor.ts
│   │   │   └── ...
│   │   │
│   │   ├── lib/               # Library configs
│   │   │   └── supabase/
│   │   │       ├── client.ts
│   │   │       ├── adminClient.ts
│   │   │       ├── auth.ts
│   │   │       └── members.ts
│   │   │
│   │   ├── types/             # TypeScript types
│   │   │   ├── supabase.ts
│   │   │   ├── permissions.ts
│   │   │   └── ...
│   │   │
│   │   ├── App.tsx            # Root component
│   │   └── main.tsx           # Entry point
│   │
│   ├── dist/                  # Build output (Vite)
│   ├── public/                # Static assets
│   ├── Dockerfile             # Docker config
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── docs/                      # Documentação técnica
│   ├── EVENTS_SYSTEM_PT.md
│   └── EVENTS_SYSTEM_EN.md
│
├── agents/                    # Documentação de agentes Claude
│   ├── index.md
│   ├── auth-agent.md
│   ├── database-agent.md
│   ├── events-agent.md
│   └── ...
│
├── scripts/                   # Scripts úteis
│   ├── restart-server.ps1
│   └── backup-database.ps1
│
├── CLAUDE.md                  # Instruções do projeto
├── DATABASE_SCHEMA.md         # Schema completo do banco
├── PLANO_DESENVOLVIMENTO_EAU.md  # Roadmap principal
├── UI_DESIGN_SYSTEM.md        # Design system
├── SISTEMA_TESTES_COMPLETO.md # Suite de testes
├── EASYPANEL_DEPLOYMENT_COMPLETE_GUIDE.md
└── package.json               # Root package.json (workspaces)
```

---

## 🗄️ DATABASE SCHEMA E RELACIONAMENTOS

### Tabelas Principais (14 tabelas core)

#### 1. **auth.users** (Supabase Auth)
- Gerenciado pelo Supabase
- Armazena credenciais e JWT tokens
- 5575 usuários ativos

#### 2. **members** (Membros do sistema)
```sql
members
├── id (UUID, PK)
├── email (VARCHAR, NOT NULL)
├── first_name, last_name
├── institution_id (FK → institutions)
├── user_id (FK → auth.users)  -- Todos os membros têm login
├── user_type (super_admin, admin, staff, member)
├── openlearning_user_id       -- Para SSO
├── openlearning_provisioned_at
└── created_at, updated_at
```

#### 3. **institutions** (Instituições)
```sql
institutions
├── id (UUID, PK)
├── name, code
├── membership_type
├── membership_status
├── membership_fee_amount
├── membership_fee_gst
├── membership_fee_total
├── membership_renewal_date
└── created_at, updated_at
```

#### 4. **events** (Eventos)
```sql
events
├── id (UUID, PK)
├── title, slug, description
├── start_date, end_date
├── location_type (physical, virtual, hybrid)
├── capacity
├── cpd_points
├── cpd_category
├── status (published, draft, cancelled)
└── created_at, updated_at
```

#### 5. **event_registrations** (Registros de eventos)
```sql
event_registrations
├── id (UUID, PK)
├── event_id (FK → events)
├── user_id (FK → auth.users)
├── attended (BOOLEAN)
├── checked_in (BOOLEAN)
├── certificate_issued (BOOLEAN)
├── cpd_activity_created (BOOLEAN)
├── cpd_activity_id (FK → cpd_activities)
└── created_at, updated_at
```

#### 6. **cpd_activities** (Atividades CPD)
```sql
cpd_activities
├── id (UUID, PK)
├── user_id (FK → auth.users)
├── activity_type
├── activity_title
├── activity_date
├── cpd_points
├── event_id (FK → events)  -- Se foi de um evento
├── status (pending, approved, rejected)
└── created_at, updated_at
```

#### 7. **event_certificates** (Certificados)
```sql
event_certificates
├── id (UUID, PK)
├── registration_id (FK → event_registrations)
├── event_id (FK → events)
├── user_id (FK → auth.users)
├── certificate_number (UNIQUE)
├── pdf_url
└── created_at, updated_at
```

#### 8. **member_roles** (Sistema de permissões)
```sql
member_roles
├── id (UUID, PK)
├── member_id (FK → members)
├── role (super_admin, institution_admin, staff, member)
├── institution_id (FK → institutions)  -- Para scoping
└── created_at, updated_at
```

#### 9. **membership_applications** (Aplicações de membership)
```sql
membership_applications
├── id (UUID, PK)
├── institution_name
├── contact_person_email
├── membership_type
├── application_data (JSONB)
├── status (pending, approved, rejected)
└── created_at, updated_at
```

#### 10. **membership_fees** (Estrutura de taxas)
```sql
membership_fees
├── id (UUID, PK)
├── membership_type (UNIQUE)
├── base_fee_cents
├── gst_rate (0.10 = 10%)
└── created_at, updated_at
```

#### 11. **openlearning_sync_logs** (Logs de sincronização)
```sql
openlearning_sync_logs
├── id (UUID, PK)
├── sync_type (scheduled, manual, webhook)
├── members_processed
├── cpd_activities_created
├── status (running, completed, failed)
└── created_at, completed_at
```

#### 12. **email_logs** (Logs de emails)
```sql
email_logs
├── id (UUID, PK)
├── user_id (FK → auth.users)
├── recipient_email
├── email_type (welcome, reminder, notification)
├── status (sent, failed, bounced)
└── sent_at, created_at
```

#### 13. **saved_reports** (Relatórios salvos)
```sql
saved_reports
├── id (UUID, PK)
├── name
├── config (JSONB)  -- Query, filters, etc
├── created_by (FK → auth.users)
└── created_at, updated_at
```

#### 14. **scheduled_reports** (Relatórios agendados)
```sql
scheduled_reports
├── id (UUID, PK)
├── report_id (FK → saved_reports)
├── frequency (daily, weekly, monthly)
├── schedule_config (JSONB)
├── recipients (TEXT[])
├── next_run_at
└── created_at, updated_at
```

### Mapa de Relacionamentos

```mermaid
graph TD
    AU[auth.users] -->|user_id| M[members]
    M -->|institution_id| I[institutions]
    AU -->|user_id| ER[event_registrations]
    E[events] -->|event_id| ER
    ER -->|registration_id| EC[event_certificates]
    ER -->|cpd_activity_id| CPD[cpd_activities]
    E -->|event_id| CPD
    AU -->|user_id| CPD
    M -->|member_id| MR[member_roles]
    I -->|institution_id| MR
    SR[saved_reports] -->|report_id| SCHED[scheduled_reports]
    M -->|openlearning_user_id| OL[OpenLearning API]
```

---

## 🔄 FLUXOS DE DADOS PRINCIPAIS

### 1. Fluxo de Registro e Participação em Evento

```
1. Membro acessa /events
2. Seleciona evento e clica "Register"
3. Frontend: eventRegistrationService.registerForEvent()
4. Backend: Cria registro em event_registrations
5. Backend: Envia email de confirmação
6. Email: reminder.service.ts agenda lembretes (7d, 3d, 1d, 30min)
7. Evento acontece
8. Admin marca presença ou auto-check-in online
9. Scheduler (a cada hora): CertificateProcessor
   - Busca eventos finalizados
   - Para cada participante com attended=true:
     a. Gera certificado PDF (certificatePdfService)
     b. Upload para Supabase Storage
     c. Cria registro em event_certificates
     d. Cria CPD activity automaticamente
     e. Atualiza event_registrations (certificate_issued=true)
10. Membro vê CPD points no dashboard
```

### 2. Fluxo de Autenticação e Permissões

```
1. Usuário acessa /login
2. Insere email e senha
3. LoginForm → Supabase Auth
4. Supabase retorna JWT token
5. Frontend salva em localStorage
6. authStore.setUser() atualiza estado
7. roleService.fetchRoles() busca permissões
   - Verifica member_roles table
   - Fallback: usa members.user_type
8. Carrega permissões no authStore
9. RoleBasedRoute valida acesso a cada página
10. Se sem permissão → /unauthorized
```

### 3. Fluxo de OpenLearning SSO

```
1. Membro clica "Access OpenLearning" no menu
2. Frontend: openlearningService.launchSSO()
3. Backend: openlearningCorrect.service.ts
   a. Verifica se usuário está provisionado
   b. Se não: provisiona via API POST /managed-users
   c. Gera SSO token (one-time use)
   d. Cria launch data com parâmetros LTI
4. Frontend recebe launch data
5. OpenLearningAccessButton cria form POST
6. Submit form para OpenLearning
7. OpenLearning valida e loga usuário automaticamente
8. Usuário acessa cursos diretamente
```

### 4. Fluxo de Sincronização OpenLearning

```
1. Scheduler (node-cron): 2:00 AM + a cada 6h
   OU
   Admin clica "Sync Now" no dashboard
   OU
   Webhook recebe evento do OpenLearning

2. openlearningSyncScheduler.service.ts inicia sync
3. Para cada membro provisionado:
   a. Busca cursos completados via API
   b. Verifica se já foi importado
   c. Se novo:
      - Cria CPD activity (1 ponto)
      - Marca curso como sincronizado
      - Salva em openlearning_courses
4. Registra log em openlearning_sync_logs
5. Dashboard atualiza estatísticas
```

### 5. Fluxo de Aplicação de Membership

```
1. Visitante acessa /join (página pública)
2. Preenche formulário multi-step:
   - Step 1: Institution Details
   - Step 2: Address
   - Step 3: Contact Person
   - Step 4: Membership & Motivation
3. Frontend calcula taxa em tempo real
   - API: POST /public/calculate-fee
   - Exibe: Base Fee + GST = Total
4. Submit: POST /public/membership-application
5. Backend: Salva em membership_applications
6. Backend: Envia email de confirmação
7. Admin recebe notificação
8. Admin acessa /admin/applications
9. Admin revisa e aprova/rejeita
10. Se aprovado:
    - Cria institution
    - Cria member com admin role
    - Envia email de boas-vindas com link de reset senha
```

### 6. Fluxo de Geração de Relatórios

```
1. Admin acessa /admin/reports
2. Seleciona template OU cria custom report
3. Query Builder:
   - Seleciona campos de múltiplas tabelas
   - Aplica filtros
   - Define ordenação
4. Preview dos dados em tabela
5. Clica "Export"
6. reportExportService gera arquivo:
   - PDF: jsPDF com layout profissional
   - Excel: XLSX com múltiplas abas
   - CSV: UTF-8 com BOM
   - JSON: Estruturado com metadados
7. Download automático do arquivo
```

### 7. Fluxo de Email Reminders

```
1. Evento criado com start_date
2. Backend calcula datas de reminder:
   - 7 dias antes
   - 3 dias antes
   - 1 dia antes
   - 30 minutos antes
3. Scheduler (a cada hora): reminder.service.ts
4. Para cada reminder pendente:
   a. Busca registrados no evento
   b. Carrega template HTML
   c. Substitui variáveis (nome, evento, data)
   d. Envia via SMTP (nodemailer)
   e. Registra em email_logs
   f. Marca reminder como enviado
5. Admin vê logs em /admin/email-logs
```

---

## 📦 MÓDULOS E FUNCIONALIDADES

### Módulo de Autenticação
- **Login/Logout** - JWT via Supabase
- **Password Reset** - Token seguro de 72h
- **Welcome Emails** - Auto-envio para novos membros
- **Role-Based Access** - 4 níveis: Super Admin, Institution Admin, Staff, Member

### Módulo de Membros
- **CRUD de Membros** - Criar, editar, visualizar, deletar
- **Import CSV** - Sistema avançado com pause/resume
- **Member Duplicates** - Detecção com Levenshtein distance
- **Impersonation** - Super Admin pode impersonar membros
- **Bulk Operations** - Seleção múltipla e ações em massa

### Módulo de Instituições
- **CRUD de Instituições** - Gestão completa
- **Membership Management** - Tipos, taxas, renovações
- **Fee Calculator** - Cálculo automático com GST
- **Membership Applications** - Sistema de aplicação pública
- **Approval Workflow** - Aprovação/rejeição com emails

### Módulo de Eventos
- **CRUD de Eventos** - Criar, editar, publicar, cancelar
- **Event Registration** - Registro de participantes
- **Capacity Management** - Controle de vagas
- **Event Reminders** - Sistema automático (7d, 3d, 1d, 30min)
- **Attendance Tracking** - Check-in manual ou automático
- **Certificate Generation** - PDF profissional automático
- **CPD Auto-creation** - Pontos CPD criados automaticamente

### Módulo CPD
- **Activity Submission** - Membros submetem atividades
- **Auto-approval** - Eventos EA aprovados automaticamente
- **Manual Review** - Admins aprovam atividades externas
- **Annual Tracking** - Progress bar com meta de 20 pontos/ano
- **Categories** - Professional Development, Research, etc
- **Evidence Upload** - Supabase Storage para comprovantes

### Módulo OpenLearning
- **User Provisioning** - Auto-provisão via API
- **SSO** - Single Sign-On com LTI
- **Course Catalog** - Exibição de 60 cursos disponíveis
- **Auto Sync** - Sincronização automática de conclusões
- **Webhook Integration** - Notificações em tempo real
- **CPD Integration** - Cursos geram CPD automaticamente

### Módulo de Relatórios
- **Report Builder** - Query builder visual
- **Templates** - 5 templates predefinidos
- **Export** - PDF, Excel, CSV, JSON
- **Standard Reports** - 4 relatórios padrão (Membership, Financial, Events, CPD)
- **Scheduled Reports** - Agendamento com cron
- **Email Delivery** - Envio automático de relatórios

### Módulo de Email
- **SMTP Configuration** - Interface admin para configurar
- **Email Templates** - Templates HTML profissionais
- **Email Tracking** - Open rate, click rate
- **Email Logs** - Histórico completo de envios
- **Bulk Sending** - Rate limiting automático
- **Test Mode** - Redirecionamento para test_email

### Módulo Administrativo
- **Admin Dashboard** - Visão geral do sistema
- **Statistics Cards** - Métricas principais
- **Bulk Management** - Operações em massa
- **Duplicate Detection** - Sistema de merge
- **System Settings** - Configurações globais

---

## 🔌 INTEGRAÇÕES EXTERNAS

### 1. Supabase
- **Autenticação** - JWT, refresh tokens, RLS
- **Database** - PostgreSQL com 14 tabelas
- **Storage** - Bucket para certificados e evidências
- **Real-time** - Subscriptions para notificações

**Endpoints:**
```
URL: https://ypsvoxelitgceclohxfu.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Service Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. OpenLearning API
- **Version:** v2.2
- **Authentication:** API Key
- **Endpoints Usados:**
  - `GET /courses` - Listar cursos
  - `POST /institutions/{id}/managed-users` - Provisionar usuário
  - `POST /institutions/{id}/managed-users/{user_id}/sign-on` - SSO
- **Capacidades:**
  - Provisionamento de usuários
  - SSO com LTI
  - Listagem de cursos
  - **NÃO suporta:** Import de certificados/conclusões

**Credenciais:**
```
API Key: 681bbb338d4d83608d1d6114.c9323f76014106f3a8f6531f958b541a80f3ce39...
Institution ID: english-australia
API Base URL: https://api.openlearning.com/v2.2
```

### 3. SMTP (Email)
- **Provider:** Configurável (Brevo, Gmail, etc)
- **Port:** 587 (TLS)
- **Features:**
  - Template HTML com variáveis
  - Rate limiting
  - Tracking de opens/clicks
  - Test mode

**Configuração:**
Armazenada em tabela `smtp_settings` no Supabase

### 4. Secure Pay (Planejado - não implementado)
- **Status:** Estrutura preparada
- **Aguardando:** Credenciais da API
- **Uso futuro:** Pagamento de membership fees

---

## 🚀 DEPLOY E INFRAESTRUTURA

### Ambientes

**Desenvolvimento:**
- Frontend: http://localhost:5180
- Backend: http://localhost:3001
- Database: Supabase Cloud

**Produção:**
- Frontend: https://eauapp.platty.tech/
- Backend: https://eau-app-servico-eau-backend.lkobs5.easypanel.host/
- Database: Supabase Cloud (Sydney)
- Deploy: EasyPanel (Docker)

### Build Process

**Frontend:**
```bash
cd eau-members
npm run build
# Output: dist/ folder com assets otimizados
```

**Backend:**
```bash
cd eau-backend
npm run build
# Output: dist/ folder com JS compilado do TypeScript
```

### Docker Configuration

**Frontend Dockerfile:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 5180
CMD ["npm", "run", "preview"]
```

**Backend Dockerfile:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["node", "dist/index.js"]
```

### Deploy via EasyPanel

1. **Push to GitHub** - Push código para main branch
2. **EasyPanel Auto-Deploy** - Detecta push e inicia deploy
3. **Docker Build** - Build das imagens
4. **Container Start** - Inicia containers
5. **Health Check** - Verifica `/health` endpoint

**Critical:** SEMPRE fazer build local antes do push:
```bash
cd eau-backend && npm run build
cd eau-members && npm run build
git add -A
git commit -m "Production build"
git push
```

### Environment Variables

**Frontend (.env):**
```env
VITE_SUPABASE_URL=https://ypsvoxelitgceclohxfu.supabase.co
VITE_SUPABASE_ANON_KEY=...
VITE_API_URL=https://eau-app-servico-eau-backend.lkobs5.easypanel.host
```

**Backend (.env):**
```env
SUPABASE_URL=https://ypsvoxelitgceclohxfu.supabase.co
SUPABASE_SERVICE_KEY=...
OPENLEARNING_API_KEY=...
OPENLEARNING_INSTITUTION_ID=english-australia
PORT=3001
```

### Schedulers Automáticos

**Backend schedulers (node-cron):**
1. **Certificate Processor** - A cada hora
   - Processa eventos finalizados nas últimas 24h
   - Gera certificados e CPD automaticamente

2. **OpenLearning Sync** - 2:00 AM + a cada 6h
   - Sincroniza conclusões de cursos
   - Cria CPD activities

3. **Report Scheduler** - A cada hora
   - Executa relatórios agendados
   - Envia emails com relatórios

4. **Reminder Scheduler** - A cada hora
   - Processa reminders pendentes
   - Envia emails de lembrete

---

## 📊 MÉTRICAS E PERFORMANCE

### Database Stats (Atual)
- **Membros:** 5575
- **Instituições:** 129 ativas
- **Eventos:** 397 registrados
- **Usuários com login:** 5575 (100%)
- **OpenLearning provisionados:** 97

### Performance Optimizations
- **Code Splitting** - Lazy loading de rotas admin
- **Virtual Scrolling** - Listas grandes renderizam apenas visível
- **Skeleton Loading** - Feedback visual durante carregamento
- **Debouncing** - Inputs otimizados
- **Memoization** - Componentes memoizados com React.memo
- **Query Optimization** - Promise.all() para queries paralelas

### Build Sizes (Estimado)
- **Frontend Bundle:** ~500KB gzipped
- **Backend Bundle:** ~200KB compilado
- **Vendors:** ~800KB (React, libraries)

---

## 🔒 SEGURANÇA

### Autenticação
- **JWT Tokens** - Refresh a cada 1 hora
- **Supabase RLS** - Row Level Security em todas tabelas
- **Password Reset** - Tokens de uso único com 72h validade
- **Session Management** - Auto-logout após inatividade

### Autorização
- **Role-Based Access Control** - 4 níveis de permissão
- **RoleBasedRoute** - Proteção de rotas no frontend
- **Middleware Auth** - Validação de JWT no backend
- **Institution Scoping** - Admins veem apenas sua instituição

### Data Protection
- **Environment Variables** - Credenciais nunca em código
- **HTTPS** - Todas conexões criptografadas
- **Input Validation** - Backend valida todos inputs
- **SQL Injection Protection** - Prepared statements via Supabase

---

## 🧪 TESTING

### Test Suite Completo
- **Documento:** `SISTEMA_TESTES_COMPLETO.md`
- **10 Áreas de Teste:**
  1. Authentication
  2. CPD System
  3. Events
  4. Members
  5. Institutions
  6. Permissions
  7. Email
  8. Import
  9. OpenLearning
  10. Quick Check (smoke test)

### Smoke Test (15-20 minutos)
```
✅ Login com dev@platty.tech
✅ Dashboard carrega
✅ Lista de membros exibe dados
✅ Criar evento de teste
✅ Registrar em evento
✅ Enviar email de teste
✅ OpenLearning SSO funciona
✅ Logout
```

---

## 📝 DOCUMENTAÇÃO ADICIONAL

### Documentos Principais
1. **CLAUDE.md** - Instruções do projeto
2. **DATABASE_SCHEMA.md** - Schema completo
3. **PLANO_DESENVOLVIMENTO_EAU.md** - Roadmap
4. **UI_DESIGN_SYSTEM.md** - Design system
5. **EASYPANEL_DEPLOYMENT_COMPLETE_GUIDE.md** - Deploy
6. **SISTEMA_TESTES_COMPLETO.md** - Testes
7. **OPENLEARNING_SSO_VALIDATED.md** - Validação SSO
8. **ARQUITETURA_SISTEMA_EAU.md** (este documento)

### Para Desenvolvedores
- Ler CLAUDE.md antes de começar
- Consultar DATABASE_SCHEMA.md ao fazer SQL
- Seguir UI_DESIGN_SYSTEM.md ao criar componentes
- Executar testes antes de deploy

---

**Documento mantido por:** Claude Code
**Última Atualização:** 31 de Outubro de 2025
**Status do Sistema:** 100% Completo e Operacional

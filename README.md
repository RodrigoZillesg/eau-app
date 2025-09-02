# 🎓 English Australia Membership System

Sistema completo de gerenciamento de membros para o English Australia, implementando o modelo B2B institucional com frontend React e backend Node.js.

## 🏗️ Arquitetura

```
eau-app/
├── eau-members/          # Frontend React + Vite
│   ├── src/
│   ├── public/
│   └── package.json
├── eau-backend/          # Backend Node.js + TypeScript
│   ├── src/
│   ├── Dockerfile
│   └── package.json
├── scripts/              # Scripts SQL e utilitários
└── docs/                # Documentação completa
```

## 🚀 Quick Start

### Frontend (React)
```bash
cd eau-members
npm install
npm run dev
# http://localhost:5180
```

### Backend (Node.js)
```bash
cd eau-backend
npm install
npm run dev
# http://localhost:3001
```

## 📋 Funcionalidades

### 🏢 Gestão Institucional
- **4 tipos de membership**: Full Provider, Associate, Corporate, Professional
- **Controle de pagamentos** e renovações automáticas
- **Dashboard administrativo** com estatísticas
- **Sistema de convites** para staff institucional

### 👥 Gestão de Membros
- **Hierarquia de permissões**: Super Admin → Institution Admin → Staff/Teacher
- **Filtros avançados** por tipo, interesse, instituição
- **Exportação CSV** para administradores
- **Interest Groups** para categorização

### 🎓 Sistema CPD (Continuing Professional Development)
- **Auto-aprovação** de atividades (20 pontos/ano)
- **Progress bar** com tracking anual
- **Filtros por ano** e tipo de atividade
- **Dashboard de progresso** individual

### 🔐 Autenticação & Segurança
- **Supabase Auth** integrado
- **JWT tokens** com refresh automático
- **Rate limiting** e proteção CORS
- **Row Level Security (RLS)** no database

## 🛠️ Stack Técnica

### Frontend
- **React 18** + TypeScript
- **Vite** para build e desenvolvimento
- **TailwindCSS** para styling
- **React Router** para navegação
- **Zustand** para state management
- **React Hook Form** para formulários

### Backend
- **Node.js 18** + TypeScript
- **Express.js** para API REST
- **Supabase** como database
- **JWT** para autenticação
- **Docker** para containerização

### Database
- **PostgreSQL** via Supabase
- **Row Level Security** implementado
- **Triggers** automáticos
- **Views** otimizadas

## 🔧 Configuração

### Variáveis de Ambiente

**Frontend (.env):**
```env
VITE_SUPABASE_URL=https://english-australia-eau-supabase.lkobs5.easypanel.host
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Backend (.env):**
```env
NODE_ENV=production
PORT=3001
SUPABASE_URL=https://english-australia-eau-supabase.lkobs5.easypanel.host
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JWT_SECRET=your-production-secret
CORS_ORIGIN=https://your-frontend-domain.com
```

## 🚀 Deploy

### EasyPanel Deploy

1. **Backend API:**
   - Aplicação Docker usando `eau-backend/Dockerfile`
   - Porta: 3001
   - Variáveis: Conforme `.env.example`

2. **Frontend:**
   - Build estático ou aplicação Node.js
   - Porta: 5180 ou 3000
   - Configurar variáveis do Supabase

### GitHub Integration
```bash
# Conectar repositório
git init
git add .
git commit -m "Initial commit - Full stack EAU system"
git branch -M main
git remote add origin https://github.com/USERNAME/eau-app.git
git push -u origin main
```

## 📊 Modelo de Dados

### Principais Tabelas
- **institutions**: Dados das instituições membros
- **members**: Usuários vinculados às instituições
- **cpd_activities**: Atividades de desenvolvimento profissional
- **staff_invitations**: Sistema de convites
- **institution_payments**: Controle financeiro

### Relacionamentos
```sql
institutions (1) → (N) members
institutions (1) → (N) staff_invitations
institutions (1) → (N) institution_payments
members (1) → (N) cpd_activities
```

## 🔐 Permissões

### Super Admin
- ✅ Controle total do sistema
- ✅ CRUD de instituições
- ✅ Visualizar todos os membros
- ✅ Estatísticas globais

### Institution Admin
- ✅ Gerenciar própria instituição
- ✅ Convidar/gerenciar staff
- ✅ Relatórios institucionais
- ✅ Controle de CPD da equipe

### Staff/Teacher
- ✅ Gerenciar próprio perfil
- ✅ Registrar atividades CPD
- ✅ Acessar recursos de aprendizagem

## 📈 Funcionalidades Avançadas

### CPD System
- **Meta anual**: 20 pontos por membro
- **Auto-aprovação**: Atividades aprovadas automaticamente
- **Progress tracking**: Visual com barra de progresso
- **Relatórios**: Por membro, instituição e período

### Institution Management
- **Tipos de taxa**: Base + sites adicionais + student weeks
- **Renovação automática**: Notificações 60 dias antes
- **Grace period**: 30 dias após vencimento
- **Status tracking**: Pending → Active → Renewal → Suspended

### Invitation System
- **Tokens seguros**: Expiração em 7 dias
- **Email integration**: Estrutura preparada
- **Controle de status**: Pending, Accepted, Expired
- **Reenvio**: Admins podem reenviar convites

## 🔍 Monitoramento

### Health Checks
- **Frontend**: `http://localhost:5180`
- **Backend**: `http://localhost:3001/health`
- **Database**: Connection testing automático

### Logs
- **Structured logging** no backend
- **Error boundaries** no frontend
- **User action tracking** para auditoria

## 🤝 Contribuição

1. Fork o repositório
2. Crie feature branch (`git checkout -b feature/NewFeature`)
3. Commit changes (`git commit -m 'Add NewFeature'`)
4. Push to branch (`git push origin feature/NewFeature`)
5. Abra Pull Request

## 📞 Suporte

- **Issues**: GitHub repository
- **Documentation**: Consulte `/docs` e README files
- **Database**: Supabase dashboard disponível

---

**Sistema desenvolvido para implementar completamente o modelo B2B do English Australia, focando em escalabilidade, segurança e experiência do usuário.**
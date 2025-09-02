# 🚀 EAU Backend - English Australia Membership System API

Backend Node.js/TypeScript para o sistema de membership do English Australia, desenvolvido para gerenciar instituições educacionais, membros, CPD e sistema de convites.

## 📋 Funcionalidades Principais

### 🏢 Gestão de Instituições
- **CRUD completo** para instituições membros
- **Tipos de membership**: Full Provider, Associate, Corporate, Professional
- **Status tracking**: Pending, Active, Suspended, Expired, Cancelled
- **Controle de pagamentos** e renovações
- **Estatísticas** e relatórios por instituição

### 👥 Gestão de Membros  
- **Sistema hierárquico** de usuários (Super Admin → Institution Admin → Staff/Teacher)
- **Filtros avançados** por tipo, grupo de interesse, instituição
- **Exportação CSV** para admins
- **Controle de permissões** baseado em papéis

### 🎓 Sistema CPD (Continuing Professional Development)
- **Auto-aprovação** de atividades CPD (conforme solicitado)
- **Meta anual**: 20 pontos por ano
- **Filtros por ano** e status
- **Progress tracking** com dashboard
- **Relatórios mensais** e por tipo de atividade

### 📧 Sistema de Convites
- **Tokens seguros** com expiração
- **Convites por email** (estrutura preparada)
- **Controle de status**: Pending, Accepted, Expired, Cancelled
- **Reenvio** e revogação de convites

### 🔐 Autenticação & Autorização
- **JWT tokens** com refresh token
- **Integração Supabase Auth** nativa
- **Role-based access control** (RBAC)
- **Middleware de autenticação** robusto

## 🛠️ Stack Técnica

- **Node.js** 18+ com TypeScript
- **Express.js** para API REST
- **Supabase** como database e auth
- **JWT** para autenticação stateless
- **Docker** para containerização
- **EasyPanel** ready para deploy

## 📁 Estrutura do Projeto

```
eau-backend/
├── src/
│   ├── config/
│   │   ├── database.ts      # Configuração Supabase
│   │   └── constants.ts     # Constantes do sistema
│   ├── controllers/         # Controllers das rotas
│   │   ├── auth.controller.ts
│   │   ├── institutions.controller.ts
│   │   ├── invitations.controller.ts
│   │   ├── members.controller.ts
│   │   └── cpd.controller.ts
│   ├── middleware/          # Middlewares
│   │   ├── auth.ts          # Autenticação JWT
│   │   └── validation.ts    # Validação de dados
│   ├── routes/              # Definição das rotas
│   │   ├── auth.routes.ts
│   │   ├── institutions.routes.ts
│   │   ├── invitations.routes.ts
│   │   ├── members.routes.ts
│   │   ├── cpd.routes.ts
│   │   └── index.ts
│   ├── types/               # Tipos TypeScript
│   │   └── index.ts
│   ├── utils/               # Utilitários
│   │   ├── jwt.js           # Funções JWT
│   │   ├── crypto.ts        # Funções de criptografia
│   │   └── logger.ts        # Sistema de logs
│   ├── app.ts               # Configuração do Express
│   └── index.ts             # Entry point
├── Dockerfile               # Container para EasyPanel
├── docker-compose.yml       # Para desenvolvimento local
└── package.json
```

## 🚀 Como Executar

### Desenvolvimento Local

1. **Instalar dependências**:
```bash
cd eau-backend
npm install
```

2. **Configurar variáveis de ambiente**:
```bash
cp .env.example .env
# Editar .env com suas credenciais
```

3. **Executar em modo desenvolvimento**:
```bash
npm run dev
```

4. **Verificar saúde da API**:
```bash
curl http://localhost:3001/health
```

### Build para Produção

```bash
npm run build
npm start
```

## 🐳 Deploy no EasyPanel

### 1. Criar Aplicação no EasyPanel

1. Acesse seu painel EasyPanel
2. Crie nova aplicação → **Docker**
3. Configure:
   - **Nome**: `eau-backend`
   - **Porta**: `3001`
   - **Dockerfile**: Usar o Dockerfile incluído

### 2. Configurar Variáveis de Ambiente

No EasyPanel, adicione estas variáveis:

```env
NODE_ENV=production
PORT=3001
SUPABASE_URL=https://english-australia-eau-supabase.lkobs5.easypanel.host
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JWT_SECRET=your-production-jwt-secret
JWT_REFRESH_SECRET=your-production-refresh-secret
CORS_ORIGIN=https://your-frontend-domain.com
```

### 3. Deploy Automático via GitHub

```bash
# 1. Fazer push do código
git add .
git commit -m "Backend ready for EasyPanel"
git push origin main

# 2. No EasyPanel, conectar ao repositório GitHub
# 3. Configurar auto-deploy na branch main
```

## 📚 Documentação da API

### 🔐 Autenticação

#### POST `/api/v1/auth/login`
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "admin@example.com",
      "fullName": "Admin User",
      "userType": "super_admin"
    },
    "tokens": {
      "accessToken": "jwt_token",
      "refreshToken": "refresh_token"
    }
  }
}
```

### 🏢 Instituições

#### GET `/api/v1/institutions`
Lista instituições com filtros:
- `?status=active` - Filtrar por status
- `?membershipType=full_provider` - Filtrar por tipo
- `?page=1&limit=10` - Paginação

#### POST `/api/v1/institutions` (Super Admin apenas)
```json
{
  "name": "Sydney English College",
  "membership_type": "full_provider",
  "primary_contact_email": "admin@sec.edu.au",
  "cricos_code": "01234A"
}
```

### 👥 Membros

#### GET `/api/v1/members`
Lista membros com filtros:
- `?search=john` - Busca por nome/email
- `?membershipType=active` - Filtrar por tipo
- `?institutionId=uuid` - Filtrar por instituição

#### GET `/api/v1/members/export`
Exporta membros em CSV (Admin apenas)

### 🎓 CPD

#### GET `/api/v1/cpd`
Lista atividades CPD:
- `?year=2024` - Filtrar por ano
- `?status=approved` - Filtrar por status
- `?memberId=uuid` - Filtrar por membro

#### POST `/api/v1/cpd`
```json
{
  "activityDate": "2024-01-15",
  "activityType": "Webinar",
  "description": "Teaching Methodology Workshop",
  "points": 2,
  "evidenceUrl": "https://example.com/certificate.pdf"
}
```

#### GET `/api/v1/cpd/progress`
Retorna progresso CPD:
- `?year=2024` - Ano específico
- `?memberId=uuid` - Para outro membro (Admin apenas)

### 📧 Convites

#### POST `/api/v1/invitations`
```json
{
  "email": "new.user@institution.edu.au",
  "firstName": "John",
  "lastName": "Doe",
  "userType": "staff",
  "institutionId": "uuid"
}
```

#### POST `/api/v1/invitations/accept` (Rota pública)
```json
{
  "token": "invitation_token",
  "password": "newpassword123",
  "fullName": "John Doe"
}
```

## 🔒 Níveis de Permissão

### Super Admin (`super_admin`)
- ✅ **Tudo**: Controle total do sistema
- ✅ **Instituições**: CRUD completo
- ✅ **Membros**: Visualizar e editar todos
- ✅ **Estatísticas**: Globais e por instituição

### Institution Admin (`institution_admin`)  
- ✅ **Sua instituição**: Visualizar e editar dados
- ✅ **Seus membros**: Gerenciar staff da instituição
- ✅ **Convites**: Criar e gerenciar convites
- ✅ **Relatórios**: Da própria instituição

### Staff/Teacher (`staff`, `teacher`)
- ✅ **Próprio perfil**: Visualizar e editar
- ✅ **CPD próprio**: Criar e gerenciar atividades
- ✅ **Eventos**: Ver e se inscrever

## 🔧 Configurações de Segurança

### Rate Limiting
- **100 requests** por IP a cada 15 minutos
- **Customizável** via variáveis de ambiente

### CORS
- Configurado para o frontend específico
- **Produção**: Apenas domínios autorizados
- **Desenvolvimento**: `http://localhost:5180`

### Headers de Segurança
- **Helmet.js** para headers HTTP seguros
- **Content Security Policy** configurada
- **HTTPS** obrigatório em produção

## 📊 Monitoramento & Logs

### Health Check
```bash
GET /health
```

### Logs Estruturados
- **Morgan** para logs de request
- **Timestamp** em todas as operações
- **User ID** tracking em operações autenticadas

### Métricas Disponíveis
- Total de instituições por status
- Membros por tipo e instituição  
- Progresso CPD por membro/instituição
- Taxa de convites aceitos

## 🚨 Tratamento de Erros

### Códigos de Status Padronizados
- **200**: Sucesso
- **201**: Criado
- **400**: Bad Request (dados inválidos)
- **401**: Não autenticado
- **403**: Sem permissão  
- **404**: Não encontrado
- **429**: Rate limit excedido
- **500**: Erro interno

### Formato de Erro
```json
{
  "success": false,
  "error": "Detailed error message",
  "details": ["validation", "errors", "if any"]
}
```

## 🔄 CI/CD com GitHub Actions

### Deploy Automático
```yaml
# .github/workflows/deploy.yml
name: Deploy to EasyPanel
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to EasyPanel
        run: |
          # EasyPanel webhook deployment
```

### Qualidade de Código
- **TypeScript** checking
- **ESLint** para padrões
- **Testes** unitários (estrutura preparada)

## 📈 Roadmap Futuro

### Funcionalidades Planejadas
- [ ] **Email service** integrado (SendGrid/AWS SES)
- [ ] **MailChimp** integration para newsletters
- [ ] **Webhook** system para integrações
- [ ] **Audit log** para ações críticas
- [ ] **GraphQL** endpoint opcional
- [ ] **Real-time** notifications (WebSocket)

### Melhorias Técnicas
- [ ] **Redis** para cache e sessions
- [ ] **Queue system** para tasks pesadas
- [ ] **Database migrations** automáticas
- [ ] **Swagger/OpenAPI** documentation
- [ ] **Jest** test suite completa

## 🤝 Como Contribuir

1. **Fork** o repositório
2. **Create** feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** mudanças (`git commit -m 'Add some AmazingFeature'`)
4. **Push** para branch (`git push origin feature/AmazingFeature`)
5. **Open** Pull Request

## 📞 Suporte

Para dúvidas ou problemas:
1. **Issues** no GitHub
2. **Email**: contato através do sistema
3. **Documentação**: Consulte este README primeiro

---

**🎯 Backend desenvolvido para suportar completamente o modelo B2B do English Australia, com foco em escalabilidade, segurança e facilidade de manutenção.**
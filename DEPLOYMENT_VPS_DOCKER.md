# EAU Production Deployment Guide - VPS Hostinger + Docker

**⚠️ CRITICAL: Este é o guia oficial de deployment. Não existe mais EasyPanel!**

## 📋 Arquitetura Atual

### Servidor
- **Provider**: VPS Hostinger
- **IP**: 91.108.104.122
- **OS**: Linux (Ubuntu/Debian)
- **Acesso SSH**: `ssh root@91.108.104.122`
- **Senha**: `Y#n9nah@=E@6ws8m!F/q\``

### Containers Docker
1. **Frontend** (`eau-frontend-prod`)
   - Porta: 8080
   - Imagem: `eau-app-eau-frontend:latest`
   - Nginx serving static files

2. **Backend** (`eau-backend-prod`)
   - Porta: 3002
   - Imagem: `eau-backend:latest`
   - Node.js/Express API

### Domínios
- **Frontend**: https://appeau.platty.tech (porta 80/443)
- **Backend API**: https://appeau.platty.tech/api (proxy)
- **Cloudflare**: Gerencia SSL e DNS

### Nginx Reverse Proxy
- Config: `/etc/nginx/sites-available/appeau.platty.tech`
- `/api/*` → Backend (localhost:3002)
- `/*` → Frontend (localhost:8080)

## 🚀 Processo de Deployment Completo

### Pré-requisitos
1. ✅ Código testado localmente
2. ✅ Build bem-sucedido (frontend e backend)
3. ✅ Testes passando
4. ✅ Git commit realizado

### Step-by-Step Deployment

#### 1. Build Local (Obrigatório)

**Frontend:**
```bash
cd eau-members
npm run build
# Verifica se dist/ foi gerado
ls -la dist/
```

**Backend:**
```bash
cd eau-backend
npm run build
# Verifica se dist/ foi gerado
ls -la dist/
```

#### 2. Commit e Push

```bash
git add -A
git commit -m "feat: Descrição da mudança"
git push origin main
```

#### 3. Deploy para Servidor

**Conectar via SSH:**
```bash
ssh root@91.108.104.122
```

**Ir para diretório do projeto:**
```bash
cd /home/eau-production/eau-app
```

**Pull do código:**
```bash
git pull origin main
```

#### 4. Upload das Pastas Dist (Local → Servidor)

**Frontend:**
```bash
# Local machine (Git Bash)
cd eau-members
tar -czf dist.tar.gz dist
scp dist.tar.gz root@91.108.104.122:/tmp/

# No servidor
ssh root@91.108.104.122
cd /home/eau-production/eau-app/eau-members
rm -rf dist
tar -xzf /tmp/dist.tar.gz
rm /tmp/dist.tar.gz
```

**Backend:**
```bash
# Local machine (Git Bash)
cd eau-backend
tar -czf dist.tar.gz dist
scp dist.tar.gz root@91.108.104.122:/tmp/

# No servidor
ssh root@91.108.104.122
cd /home/eau-production/eau-app/eau-backend
rm -rf dist
tar -xzf /tmp/dist.tar.gz
rm /tmp/dist.tar.gz
```

#### 5. Rebuild e Restart Containers

**Frontend:**
```bash
docker stop eau-frontend-prod
docker rm eau-frontend-prod
cd /home/eau-production/eau-app/eau-members
docker build -t eau-app-eau-frontend:latest .
docker run -d --name eau-frontend-prod -p 8080:80 eau-app-eau-frontend:latest
```

**Backend:**
```bash
docker stop eau-backend-prod
docker rm eau-backend-prod
cd /home/eau-production/eau-app/eau-backend
docker build -t eau-backend:latest -f Dockerfile.deploy .
docker run -d --name eau-backend-prod -p 3002:3001 \
  -e NODE_ENV=production \
  -e PORT=3001 \
  -e SUPABASE_URL=https://ypsvoxelitgceclohxfu.supabase.co \
  -e SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlwc3ZveGVsaXRnY2VjbG9oeGZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MDE3NTUsImV4cCI6MjA3NDI3Nzc1NX0.-NO0-hrp4GajpOK9WnryqIeyEtS9iUiv03qkp9ScL9w \
  -e SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlwc3ZveGVsaXRnY2VjbG9oeGZ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODcwMTc1NSwiZXhwIjoyMDc0Mjc3NzU1fQ.y_k4b4TlAev9R4TTFqHA08EjdZA-7Ymm5V1zMl-CYhA \
  -e JWT_SECRET=eau-jwt-secret-super-secure-2024-production \
  -e JWT_REFRESH_SECRET=eau-refresh-secret-super-secure-2024-production \
  -e CORS_ORIGIN=https://appeau.platty.tech \
  eau-backend:latest
```

#### 6. Verificar Deployment

```bash
# Check containers
docker ps

# Check logs
docker logs eau-frontend-prod --tail 50
docker logs eau-backend-prod --tail 50

# Test frontend
curl -I http://localhost:8080

# Test backend
curl http://localhost:3002/health
```

#### 7. Test Production Site

```bash
# From local machine
curl -I https://appeau.platty.tech
curl https://appeau.platty.tech/api/v1/health
```

## 🔧 Troubleshooting

### Container não inicia

```bash
# Ver logs detalhados
docker logs eau-backend-prod

# Common issues:
# 1. Porta já em uso
netstat -tlnp | grep 3002
kill <PID>

# 2. .dockerignore bloqueando arquivos
# Solução: Use Dockerfile.deploy que ignora .dockerignore

# 3. Variáveis de ambiente faltando
docker inspect eau-backend-prod | grep -A 20 Env
```

### Mixed Content Error (HTTPS → HTTP)

**Problema**: Frontend em HTTPS tentando acessar backend em HTTP

**Solução**: Sempre usar URLs relativas ou HTTPS no frontend
```bash
# .env.production deve ter:
VITE_BACKEND_URL=https://appeau.platty.tech
# NÃO use: http://91.108.104.122:3002
```

### Build do Backend Falha

**Erro comum**: `dist` folder not found

**Solução**:
1. Build local primeiro: `npm run build`
2. Upload dist.tar.gz via SCP
3. Extract no servidor antes do docker build

### Nginx não roteia corretamente

```bash
# Test nginx config
nginx -t

# Restart nginx
systemctl restart nginx

# Check nginx logs
tail -f /var/log/nginx/error.log
```

## 📂 Estrutura de Arquivos Importante

```
/home/eau-production/eau-app/
├── eau-members/               # Frontend
│   ├── dist/                  # ⚠️ Deve existir antes do build
│   ├── Dockerfile
│   ├── nginx.conf
│   └── .env.production
├── eau-backend/               # Backend
│   ├── dist/                  # ⚠️ Deve existir antes do build
│   ├── Dockerfile.deploy      # Dockerfile simplificado
│   ├── .dockerignore.deploy
│   └── package.json
└── .git/
```

## ⚠️ REGRAS CRÍTICAS

### 1. SEMPRE buildar localmente
```bash
# ❌ ERRADO - Tentar buildar no servidor
ssh root@... "cd eau-members && npm run build"

# ✅ CORRETO - Build local, upload dist
cd eau-members && npm run build
tar -czf dist.tar.gz dist && scp dist.tar.gz root@...:/tmp/
```

### 2. SEMPRE usar Dockerfile.deploy para backend
```bash
# ❌ ERRADO
docker build -t eau-backend:latest -f Dockerfile .

# ✅ CORRETO
docker build -t eau-backend:latest -f Dockerfile.deploy .
```

### 3. SEMPRE passar env vars para backend container
O backend NÃO lê arquivo .env em produção. Todas as variáveis devem ser passadas via `-e` no `docker run`.

### 4. SEMPRE usar URLs corretas no .env.production
```bash
# ✅ CORRETO
VITE_BACKEND_URL=https://appeau.platty.tech

# ❌ ERRADO
VITE_BACKEND_URL=http://91.108.104.122:3002  # Mixed content error!
VITE_BACKEND_URL=http://localhost:3001       # Não funciona em prod!
```

### 5. NUNCA comite pasta dist/
As pastas `dist/` devem estar no `.gitignore`. São geradas no build e enviadas via SCP.

## 🔐 Credenciais de Acesso

### SSH
- **Host**: 91.108.104.122
- **User**: root
- **Senha**: `Y#n9nah@=E@6ws8m!F/q\``

### Supabase (Cloud)
- **URL**: https://ypsvoxelitgceclohxfu.supabase.co
- **Anon Key**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
- **Service Role**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

### Admin do Sistema
- **URL**: https://appeau.platty.tech/login
- **Email**: dev@platty.tech
- **Senha**: wSZ72i-M7X[bV)Hdu%Qi0V03hf8f%6

## 📊 Monitoramento

### System Status (Super Admin Only)
- Acesse: https://appeau.platty.tech/dashboard
- Card "System Status" mostra:
  - Backend status (online/offline)
  - CPU usage
  - Memory usage
  - Disk usage
  - Uptime

### Logs em Tempo Real

```bash
# Frontend logs
docker logs -f eau-frontend-prod

# Backend logs
docker logs -f eau-backend-prod

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Comandos Úteis

```bash
# Ver todos containers
docker ps -a

# Ver uso de recursos
docker stats

# Restart completo
docker restart eau-frontend-prod eau-backend-prod

# Limpar cache Docker (cuidado!)
docker system prune -a
```

## 🎯 Quick Deploy Script (One-Liner)

**⚠️ Use apenas se tudo estiver OK e testado!**

```bash
# Full deploy from local machine
cd eau-members && npm run build && tar -czf dist.tar.gz dist && \
cd ../eau-backend && npm run build && tar -czf dist.tar.gz dist && \
cd .. && scp eau-members/dist.tar.gz root@91.108.104.122:/tmp/frontend-dist.tar.gz && \
scp eau-backend/dist.tar.gz root@91.108.104.122:/tmp/backend-dist.tar.gz && \
ssh root@91.108.104.122 "cd /home/eau-production/eau-app && \
git pull && \
cd eau-members && rm -rf dist && tar -xzf /tmp/frontend-dist.tar.gz && \
cd ../eau-backend && rm -rf dist && tar -xzf /tmp/backend-dist.tar.gz && \
docker stop eau-frontend-prod eau-backend-prod && \
docker rm eau-frontend-prod eau-backend-prod && \
cd /home/eau-production/eau-app/eau-members && docker build -t eau-app-eau-frontend:latest . && \
cd /home/eau-production/eau-app/eau-backend && docker build -t eau-backend:latest -f Dockerfile.deploy . && \
docker run -d --name eau-frontend-prod -p 8080:80 eau-app-eau-frontend:latest && \
docker run -d --name eau-backend-prod -p 3002:3001 \
  -e NODE_ENV=production -e PORT=3001 \
  -e SUPABASE_URL=https://ypsvoxelitgceclohxfu.supabase.co \
  -e SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlwc3ZveGVsaXRnY2VjbG9oeGZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MDE3NTUsImV4cCI6MjA3NDI3Nzc1NX0.-NO0-hrp4GajpOK9WnryqIeyEtS9iUiv03qkp9ScL9w \
  -e SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlwc3ZveGVsaXRnY2VjbG9oeGZ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODcwMTc1NSwiZXhwIjoyMDc0Mjc3NzU1fQ.y_k4b4TlAev9R4TTFqHA08EjdZA-7Ymm5V1zMl-CYhA \
  -e JWT_SECRET=eau-jwt-secret-super-secure-2024-production \
  -e JWT_REFRESH_SECRET=eau-refresh-secret-super-secure-2024-production \
  -e CORS_ORIGIN=https://appeau.platty.tech \
  eau-backend:latest && \
rm /tmp/frontend-dist.tar.gz /tmp/backend-dist.tar.gz && \
docker ps"
```

## 📝 Checklist de Deploy

- [ ] Código testado localmente
- [ ] Build frontend bem-sucedido (`eau-members/dist/` existe)
- [ ] Build backend bem-sucedido (`eau-backend/dist/` existe)
- [ ] Git commit + push realizado
- [ ] Git pull no servidor
- [ ] Upload dist folders via SCP
- [ ] Rebuild frontend container
- [ ] Rebuild backend container
- [ ] Test frontend: `curl -I https://appeau.platty.tech`
- [ ] Test backend: `curl https://appeau.platty.tech/api/v1/health`
- [ ] Test login no navegador
- [ ] Verificar logs dos containers
- [ ] Confirmar System Status card funcionando (Super Admin)

---

**Última atualização**: 19 de Novembro de 2025
**Versão do sistema**: 1.3.0

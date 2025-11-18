# EasyPanel Deployment Complete Guide - EAU App
**Last Updated: 2025-11-18**

## 🎯 Deployment Overview
Este guia documenta o processo completo de deploy do EAU App no EasyPanel, incluindo todas as lições aprendidas e soluções para problemas comuns.

## ⚠️ LIÇÕES CRÍTICAS APRENDIDAS

### 1. **NÃO COMPILE TYPESCRIPT NO DOCKER**
- **Problema**: TypeScript não compila corretamente no container Docker do EasyPanel
- **Solução**: Sempre faça o build localmente e commite a pasta `dist`
- **Comando**: `npm run build && git add dist && git commit -m "Build for production"`

### 2. **EASYPANEL USA CONTEXTO ROOT**
- **Problema**: EasyPanel clona o repositório inteiro na raiz, não nas subpastas
- **Solução**: Dockerfiles devem referenciar caminhos relativos à raiz do repositório
- **Exemplo**: `COPY eau-backend/dist ./dist` em vez de `COPY dist ./dist`

### 3. **ENVIRONMENT VARIABLES DO VITE - CRITICAL!** 🚨
- **Problema**: Variáveis VITE_* precisam estar disponíveis durante o build, não em runtime
- **Solução**: Criar `.env.production` com URLs de produção ANTES de fazer o build
- **Arquivo Obrigatório**: `eau-members/.env.production`
- **Conteúdo Exemplo**:
  ```env
  VITE_SUPABASE_URL=https://english-australia-eau-supabase.lkobs5.easypanel.host
  VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  VITE_API_URL=https://eau-app-servico-eau-backend.lkobs5.easypanel.host
  VITE_BACKEND_URL=https://eau-app-servico-eau-backend.lkobs5.easypanel.host
  ```
- **IMPORTANTE**: Sem isso, o frontend usa fallback `localhost:3001` e não funciona em produção!

### 4. **REMOVA dist/ DO .gitignore** ⚠️ CRÍTICO!
- **Problema**: Por padrão, `dist/` está no `.gitignore`, impedindo deploy no EasyPanel
- **Solução**: Comente ou remova `dist/` do `.gitignore` em `eau-members/.gitignore`
- **Importante**: Use `git add -f eau-members/dist/` se necessário

### 5. **USE .dockerignore NA RAIZ**
- **Problema**: Sem `.dockerignore`, Docker copia todo o projeto incluindo node_modules (gigabytes!)
- **Solução**: Crie `.dockerignore` na raiz do projeto para excluir arquivos desnecessários
- **Impacto**: Build passa de minutos/timeout para segundos

### 6. **GIT NÃO COMMITTA ARQUIVOS GRANDES AUTOMATICAMENTE** 🚨 NOVO!
- **Problema**: Git pode ignorar arquivos .js e .css grandes mesmo sem estarem no .gitignore
- **Sintoma**: Página carrega mas fica em branco ou sem estilos (404 nos assets)
- **Solução**: SEMPRE use `git add -f` para forçar adição dos arquivos de dist
- **Comando Obrigatório**:
  ```bash
  git add -f eau-members/dist/assets/*.js
  git add -f eau-members/dist/assets/*.css
  ```
- **Verificação**: Use `git ls-files eau-members/dist/assets/` para confirmar que TODOS os arquivos estão trackeados

### 7. **DOCKERFILE DEVE USAR PREFIXO eau-backend/ OU eau-members/** 🚨 CRÍTICO!
- **Problema**: Backend retorna erro "Cannot find module '/app/dist/index.js'" no EasyPanel
- **Causa**: Dockerfile usa `COPY . .` que assume contexto local, mas EasyPanel usa contexto root
- **Sintoma**: Container inicia mas não encontra arquivos, status amarelo no EasyPanel
- **Solução**: Todos os comandos COPY devem usar prefixo do diretório:
  ```dockerfile
  # ❌ ERRADO (contexto local)
  COPY package*.json ./
  COPY . .
  COPY dist ./dist

  # ✅ CORRETO (contexto root do EasyPanel)
  COPY eau-backend/package*.json ./
  COPY eau-backend/dist ./dist
  ```
- **Importante**: Isto afeta AMBOS os Dockerfiles (backend E frontend)
- **Verificação**: Se aparecer "MODULE_NOT_FOUND" nos logs, este é o problema!

## 📁 Estrutura de Arquivos Necessária

```
eau-app/
├── .dockerignore           # ⚠️ CRÍTICO! Evita timeout no build
├── eau-backend/
│   ├── dist/               # ⚠️ COMMIT ESSA PASTA
│   │   └── index.js        # Build do TypeScript
│   ├── Dockerfile          # Dockerfile simplificado
│   ├── docker-compose.yml
│   └── package.json
├── eau-members/
│   ├── dist/               # ⚠️ COMMIT ESSA PASTA
│   │   ├── index.html
│   │   └── assets/
│   ├── .gitignore          # ⚠️ REMOVA ou COMENTE dist/
│   ├── nginx.conf
│   ├── Dockerfile          # Dockerfile simplificado
│   └── package.json
```

## 🚀 Passo a Passo Completo

### PASSO 1: Preparar o Build Local (ATUALIZADO 2025-11-18) 🚨

```bash
# 1. CRIAR .env.production com URLs de produção (OBRIGATÓRIO!)
cd eau-members
cat > .env.production << 'EOF'
# Production Environment Variables
VITE_SUPABASE_URL=https://english-australia-eau-supabase.lkobs5.easypanel.host
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE
VITE_API_URL=https://eau-app-servico-eau-backend.lkobs5.easypanel.host
VITE_BACKEND_URL=https://eau-app-servico-eau-backend.lkobs5.easypanel.host
EOF

# 2. Backend Build
cd ../eau-backend
npm install
npm run build
# Verifique se a pasta dist foi criada
ls -la dist/

# 3. Frontend Build (com .env.production)
cd ../eau-members
npm install
npm run build
# Verifique se a pasta dist foi criada com TODOS os assets
ls -la dist/assets/

# 4. IMPORTANTE: Verificar .gitignore
# Edite eau-members/.gitignore e comente a linha: # dist/

# 5. Commit com FORÇA para incluir arquivos grandes
cd ..
# CRÍTICO: Use -f para forçar adição dos arquivos JS e CSS grandes!
git add -f eau-members/dist/assets/*.js
git add -f eau-members/dist/assets/*.css
git add -f eau-members/dist/
git add -f eau-backend/dist/
git add eau-members/.env.production
git add -A

# 6. VERIFICAR que TODOS os arquivos foram adicionados
git ls-files eau-members/dist/assets/
# Deve mostrar 4 arquivos:
# - index.*.css
# - index.*.js
# - vendor.*.css
# - vendor.*.js

# 7. Se algum arquivo estiver faltando, adicione com força:
# git add -f eau-members/dist/assets/[nome-do-arquivo]

# 8. Commit e Push
git commit -m "Production build for EasyPanel deployment"
git push origin main
```

**⚠️ CHECKLIST PRÉ-PUSH:**
- [ ] `.env.production` criado com URLs corretas
- [ ] Backend buildado (`eau-backend/dist/index.js` existe)
- [ ] Frontend buildado (`eau-members/dist/index.html` existe)
- [ ] **TODOS os 4 arquivos em dist/assets/ estão no git** (verificar com `git ls-files`)
- [ ] Se algum arquivo falta, usar `git add -f` para forçar
- [ ] Commit realizado
- [ ] Push para GitHub completado

### PASSO 2: Criar Dockerfiles Simplificados

#### Backend Dockerfile (`eau-backend/Dockerfile`)
```dockerfile
# DOCKERFILE SIMPLIFICADO - SEM BUILD
FROM node:18-alpine

WORKDIR /app

# Copia package.json primeiro
COPY eau-backend/package*.json ./

# Instala apenas dependências de produção
RUN npm ci --omit=dev

# Copia todo o conteúdo do backend (incluindo dist)
COPY eau-backend/ ./

# Cria usuário não-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Define permissões
RUN chown -R nodejs:nodejs /app

# Usa usuário não-root
USER nodejs

# Expõe a porta
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health', (r) => {r.statusCode === 200 ? process.exit(0) : process.exit(1)})"

# Comando para iniciar
CMD ["node", "dist/index.js"]
```

#### Frontend Dockerfile (`eau-members/Dockerfile`)
```dockerfile
# DOCKERFILE SIMPLIFICADO - USA DIST PRÉ-BUILDADO
FROM nginx:alpine

# Remove arquivos padrão do nginx
RUN rm -rf /usr/share/nginx/html/*

# Copia tudo para o container
COPY . .

# Como EasyPanel usa contexto root, dist está em eau-members/dist
RUN if [ -d "eau-members/dist" ]; then \
      cp -r eau-members/dist/* /usr/share/nginx/html/; \
    elif [ -d "dist" ]; then \
      cp -r dist/* /usr/share/nginx/html/; \
    else \
      echo "ERROR: dist folder not found!" && ls -la && exit 1; \
    fi

# Copia nginx.conf (tenta ambos os locais)
RUN if [ -f "eau-members/nginx.conf" ]; then \
      cp eau-members/nginx.conf /etc/nginx/conf.d/default.conf; \
    elif [ -f "nginx.conf" ]; then \
      cp nginx.conf /etc/nginx/conf.d/default.conf; \
    else \
      echo "ERROR: nginx.conf not found!" && ls -la && exit 1; \
    fi

# Expõe porta
EXPOSE 80

# Inicia nginx
CMD ["nginx", "-g", "daemon off;"]
```

### PASSO 3: Configurar docker-compose.yml

#### Backend (`eau-backend/docker-compose.yml`)
```yaml
version: '3.8'
services:
  backend:
    build:
      context: ..
      dockerfile: eau-backend/Dockerfile
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=3001
```

#### Frontend (`eau-members/docker-compose.yml`)
```yaml
version: '3.8'
services:
  frontend:
    build:
      context: ..
      dockerfile: eau-members/Dockerfile
    restart: unless-stopped
```

### PASSO 4: Configurar EasyPanel

#### 4.1 Criar Serviços
1. Acesse: http://91.108.104.122:3000/projects/eau-app
2. Clique em "Service" > "Compose"
3. Crie dois serviços:
   - `servico-eau-backend`
   - `servico-eau-frontend`

#### 4.2 Configurar Git Source

**Para Backend:**
- URL: `https://github.com/RodrigoZillesg/eau-app.git`
- Branch: `main`
- Build Path: `/` (root)
- Docker Compose File: `eau-backend/docker-compose.yml`

**Para Frontend:**
- URL: `https://github.com/RodrigoZillesg/eau-app.git`
- Branch: `main`
- Build Path: `/` (root)
- Docker Compose File: `eau-members/docker-compose.yml`

#### 4.3 Environment Variables

**Backend Variables:**
```env
NODE_ENV=production
PORT=3001
SUPABASE_URL=https://english-australia-eau-supabase.lkobs5.easypanel.host
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JWT_SECRET=your-super-secret-jwt-token-with-at-least-32-characters-long
CORS_ORIGIN=*
```

**Frontend Variables:**
```env
# NÃO PRECISA - JÁ ESTÁ NO BUILD
# As variáveis VITE_* já foram incluídas durante o build local
```

### PASSO 5: Deploy

1. **Deploy Backend primeiro**
   - Navegue para o serviço backend
   - Clique em "Deploy"/"Implantação"
   - Aguarde o build completar
   - Verifique os logs

2. **Deploy Frontend**
   - Navegue para o serviço frontend
   - Clique em "Deploy"/"Implantação"
   - Aguarde o build completar
   - Verifique os logs

## 🔧 Troubleshooting

### Erro: "tsc: not found" ou "Missing script: build"
**Solução**: Você esqueceu de fazer o build local antes do push
```bash
cd eau-backend && npm run build
cd ../eau-members && npm run build
git add -A && git commit -m "Add dist folders"
git push
```

### Erro: "dist folder not found!"
**Solução**: O Dockerfile está procurando no lugar errado
- Verifique se está usando o caminho correto: `eau-backend/dist` ou `eau-members/dist`
- Lembre-se que EasyPanel usa contexto root

### Erro: "Welcome to nginx!" em vez do app
**Solução**: Os arquivos do frontend não foram copiados corretamente
- Verifique se a pasta dist existe
- Verifique o caminho no Dockerfile
- Certifique-se que `rm -rf /usr/share/nginx/html/*` está sendo executado

### Erro: Assets (CSS/JS) retornam 404
**Soluções**:
1. **dist/ está no .gitignore** - Remova ou comente `dist/` em `eau-members/.gitignore`
2. **Arquivos não commitados** - Use `git add -f eau-members/dist/` para forçar
3. **Falta .dockerignore** - Crie `.dockerignore` na raiz para evitar timeout
4. **Build desatualizado** - Refaça: `cd eau-members && npm run build`

### Erro: "DEMO MODE" aparecendo no frontend
**Solução**: As variáveis de ambiente não foram incluídas no build
```bash
cd eau-members
# Configure as variáveis no .env
npm run build
git add dist && git commit -m "Build with production env"
git push
```

## ✅ Checklist de Deploy

- [ ] Build local do backend funcionando (`npm run build`)
- [ ] Build local do frontend funcionando (`npm run build`)
- [ ] **dist/ removido ou comentado do .gitignore** ⚠️
- [ ] **.dockerignore criado na raiz do projeto** ⚠️
- [ ] Pastas `dist` commitadas no Git (use -f se necessário)
- [ ] Dockerfiles usando caminhos corretos (eau-backend/, eau-members/)
- [ ] docker-compose.yml com context: `..`
- [ ] EasyPanel configurado com Build Path: `/`
- [ ] Environment variables configuradas no backend
- [ ] Git push realizado
- [ ] Deploy executado no EasyPanel

## 🎉 URLs de Produção

- **Frontend**: https://eauapp.platty.tech/
- **Backend**: https://eau-app-servico-eau-backend.lkobs5.easypanel.host/
- **Supabase**: https://english-australia-eau-supabase.lkobs5.easypanel.host/

## 📝 Comandos Rápidos (ATUALIZADO 2025-11-18)

```bash
# Build completo e deploy - VERSÃO CORRETA
# 1. Build Backend e Frontend
cd eau-backend && npm run build
cd ../eau-members && npm run build
cd ..

# 2. CRÍTICO: Adicionar arquivos com FORÇA (especialmente JS e CSS grandes)
git add -f eau-members/dist/assets/*.js
git add -f eau-members/dist/assets/*.css
git add -f eau-members/dist/
git add -f eau-backend/dist/
git add -A

# 3. VERIFICAR que todos os assets estão no git
git ls-files eau-members/dist/assets/
# Deve listar 4 arquivos (2 JS + 2 CSS)

# 4. Se algum arquivo faltar, adicionar manualmente:
# git add -f eau-members/dist/assets/[nome-do-arquivo-que-falta]

# 5. Commit e Push
git commit -m "Production build for deployment"
git push origin main

# 6. Vá para EasyPanel e clique em Deploy
# URL: http://91.108.104.122:3000/projects/eau-app
```

**⚠️ ATENÇÃO:** O comando `git add -A` sozinho NÃO é suficiente!
Arquivos JS e CSS grandes podem ser ignorados. SEMPRE use `git add -f` primeiro!

## ⚡ Dicas Importantes

1. **SEMPRE** faça o build local antes do deploy
2. **NUNCA** tente compilar TypeScript dentro do Docker no EasyPanel
3. **SEMPRE** commite as pastas `dist` para produção
4. **USE** Dockerfiles simplificados sem multi-stage build
5. **LEMBRE-SE** que EasyPanel usa contexto root do repositório
6. **VERIFIQUE** os logs imediatamente após o deploy

## 🚨 Contatos de Emergência

- **EasyPanel**: http://91.108.104.122:3000/
- **GitHub**: https://github.com/RodrigoZillesg/eau-app
- **IP do Servidor**: 91.108.104.122

---

**Mantido por**: EAU Development Team
**Última atualização bem-sucedida**: 2025-11-18
**Principais correções desta versão**:
- ✅ Documentado necessidade de `.env.production` com URLs de produção
- ✅ Adicionado `git add -f` obrigatório para arquivos JS e CSS grandes
- ✅ Criado checklist de verificação pré-deploy
- ✅ Documentado problema de Git ignorar arquivos grandes automaticamente
- ✅ Atualizado comandos rápidos com processo correto
- ✅ Deploy validado e funcionando em produção (https://eauapp.platty.tech/)

**Lições Aprendidas no Deploy de 2025-11-18**:
1. Git pode ignorar arquivos grandes (.js, .css) mesmo sem estarem no .gitignore
2. SEMPRE usar `git add -f` para forçar adição de assets
3. SEMPRE verificar com `git ls-files` que todos os 4 arquivos assets foram commitados
4. SEMPRE criar `.env.production` antes do build para injetar URLs corretas
5. Página em branco = faltam arquivos JS/CSS no Git
6. Página sem estilos = falta arquivo CSS no Git
7. **CORS**: Backend deve incluir URL de produção em `allowedOrigins` array
8. **Dockerfile**: Deve usar prefixo `eau-backend/` em todos os COPY commands (contexto root)
9. **MODULE_NOT_FOUND**: Indica que Dockerfile não está copiando arquivos corretamente
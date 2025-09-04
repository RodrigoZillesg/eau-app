# EasyPanel Deployment Complete Guide - EAU App
**Last Updated: 2025-09-03**

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

### 3. **ENVIRONMENT VARIABLES DO VITE**
- **Problema**: Variáveis VITE_* precisam estar disponíveis durante o build
- **Solução**: Para produção, commite o build já pronto com as variáveis corretas

## 📁 Estrutura de Arquivos Necessária

```
eau-app/
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
│   ├── nginx.conf
│   ├── Dockerfile          # Dockerfile simplificado
│   └── package.json
```

## 🚀 Passo a Passo Completo

### PASSO 1: Preparar o Build Local

```bash
# Backend
cd eau-backend
npm install
npm run build
# Verifique se a pasta dist foi criada

# Frontend
cd ../eau-members
npm install
npm run build
# Verifique se a pasta dist foi criada

# Commit as pastas dist
cd ..
git add -A
git commit -m "Build for EasyPanel deployment"
git push origin main
```

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
- [ ] Pastas `dist` commitadas no Git
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

## 📝 Comandos Rápidos

```bash
# Build completo e deploy
cd eau-backend && npm run build && cd ../eau-members && npm run build && cd ..
git add -A
git commit -m "Production build for deployment"
git push origin main
# Vá para EasyPanel e clique em Deploy
```

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
**Última atualização bem-sucedida**: 2025-09-03
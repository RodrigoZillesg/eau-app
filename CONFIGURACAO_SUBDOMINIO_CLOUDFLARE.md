# Configuração de Subdomínio com Cloudflare - appeau.platty.tech

**Data:** 19/11/2025
**Subdomínio:** appeau.platty.tech
**IP Servidor:** 91.108.104.122
**SSL:** Cloudflare (Modo Flexível)

---

## 🎯 OVERVIEW

Você quer que o sistema seja acessível via `appeau.platty.tech` em vez de `eauapp.platty.tech` ou IP direto.

**URLs Atuais:**
- Frontend: http://91.108.104.122:8080 (porta 8080)
- Backend: http://91.108.104.122:3003 (porta 3003 via nginx proxy)

**URLs Desejadas:**
- Frontend: https://appeau.platty.tech
- Backend: https://appeau.platty.tech/api

---

## 📋 PASSO A PASSO COMPLETO

### PASSO 1: Configurar DNS no Cloudflare

#### 1.1 Acessar Cloudflare Dashboard
1. Faça login em: https://dash.cloudflare.com/
2. Selecione o domínio: `platty.tech`
3. Vá para: **DNS** → **Records**

#### 1.2 Criar/Verificar Registro A
Adicione ou verifique o seguinte registro:

| Tipo | Nome | Conteúdo | Proxy Status | TTL |
|------|------|----------|--------------|-----|
| A | appeau | 91.108.104.122 | Proxied (🟠) | Auto |

**⚠️ IMPORTANTE:**
- **Proxy Status** deve estar **ATIVADO** (ícone laranja 🟠)
- Isso permite que Cloudflare gerencie SSL automaticamente
- Se estiver cinza, clique para ativar o proxy

#### 1.3 Aguardar Propagação DNS
- Tempo estimado: 1-5 minutos
- Teste com: `nslookup appeau.platty.tech`

---

### PASSO 2: Configurar Nginx no Servidor

#### 2.1 Conectar ao Servidor
```bash
ssh root@91.108.104.122
```

#### 2.2 Verificar Configuração Atual do Nginx
```bash
cat /etc/nginx/sites-available/default
```

#### 2.3 Criar Nova Configuração para o Subdomínio

**Opção A: Se você usa Docker com EasyPanel (mais provável)**

EasyPanel gerencia automaticamente o Nginx. Você precisa configurar no painel:

1. Acessar EasyPanel: http://91.108.104.122:3000/
2. Login: dev@platty.tech / F27i486fb3gVyPC
3. Ir para projeto: **eau-app**
4. Frontend → **Domains**
5. Adicionar domínio: `appeau.platty.tech`
6. Salvar

**Opção B: Configuração Manual do Nginx (se não usar EasyPanel)**

Criar arquivo de configuração:
```bash
sudo nano /etc/nginx/sites-available/appeau.platty.tech
```

Adicionar o seguinte conteúdo:
```nginx
# Frontend - appeau.platty.tech
server {
    listen 80;
    server_name appeau.platty.tech;

    # Cloudflare SSL Flexible Mode
    # Aceita HTTPS da Cloudflare, serve HTTP localmente

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3003/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Ativar configuração:
```bash
sudo ln -s /etc/nginx/sites-available/appeau.platty.tech /etc/nginx/sites-enabled/
sudo nginx -t  # Testar configuração
sudo systemctl reload nginx  # Recarregar Nginx
```

---

### PASSO 3: Configurar SSL no Cloudflare

#### 3.1 Verificar Modo SSL
1. No Cloudflare Dashboard
2. Vá para: **SSL/TLS** → **Overview**
3. Selecione: **Flexible** (você mencionou que já está configurado)

**Modos SSL Disponíveis:**
- ✅ **Flexible** (Recomendado para sua configuração)
  - Cloudflare → Browser: HTTPS
  - Cloudflare → Servidor: HTTP
  - Perfeito para quando servidor não tem certificado SSL

- **Full** (Requer SSL no servidor)
  - Cloudflare → Browser: HTTPS
  - Cloudflare → Servidor: HTTPS (self-signed OK)

- **Full (Strict)** (Requer SSL válido no servidor)
  - Cloudflare → Browser: HTTPS
  - Cloudflare → Servidor: HTTPS (certificado válido)

#### 3.2 Configurações Adicionais Recomendadas

**Habilitar HTTPS Automático:**
1. Vá para: **SSL/TLS** → **Edge Certificates**
2. Ative: **Always Use HTTPS**
3. Ative: **Automatic HTTPS Rewrites**

---

### PASSO 4: Atualizar Variáveis de Ambiente

#### 4.1 Frontend (.env.production)

**NO SERVIDOR** (após SSH):
```bash
cd /home/eau-production/eau-app/eau-members

# Backup do arquivo atual
cp .env.production .env.production.backup

# Editar
nano .env.production
```

**Alterar para:**
```env
VITE_SUPABASE_URL=https://ypsvoxelitgceclohxfu.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_API_URL=https://appeau.platty.tech/api
VITE_BACKEND_URL=https://appeau.platty.tech
```

#### 4.2 Backend (.env)

Se necessário, verificar se backend aceita o novo domínio:
```bash
cd /home/eau-production/eau-app/eau-backend
nano .env
```

Adicionar/verificar:
```env
ALLOWED_ORIGINS=https://appeau.platty.tech,http://localhost:5180
```

---

### PASSO 5: Rebuild e Deploy

#### 5.1 Rebuild Frontend com Novas Variáveis

**NO SERVIDOR:**
```bash
cd /home/eau-production/eau-app/eau-members

# Rebuild
npm run build

# Rebuild container Docker
cd /home/eau-production/eau-app
docker compose build --no-cache eau-frontend

# Restart container
docker stop eau-frontend-prod
docker rm eau-frontend-prod
docker run -d --name eau-frontend-prod -p 8080:80 eau-app-eau-frontend:latest
```

#### 5.2 Restart Backend (se alterou .env)
```bash
docker restart eau-backend-prod
```

---

### PASSO 6: Validação

#### 6.1 Testar DNS
```bash
# No seu computador local
nslookup appeau.platty.tech

# Deve retornar IPs da Cloudflare (não 91.108.104.122 diretamente)
```

#### 6.2 Testar HTTPS
```bash
curl -I https://appeau.platty.tech

# Deve retornar:
# HTTP/2 200
# server: cloudflare
```

#### 6.3 Testar no Browser
1. Abrir: https://appeau.platty.tech
2. Verificar:
   - ✅ HTTPS ativo (cadeado verde)
   - ✅ Página carrega
   - ✅ Login funciona
   - ✅ Console sem erros

#### 6.4 Testar Backend API
```bash
curl https://appeau.platty.tech/api/v1/health

# Deve retornar JSON com status OK
```

---

## 🔧 TROUBLESHOOTING

### Problema: DNS não resolve

**Sintomas:**
```
nslookup appeau.platty.tech
Server:  UnKnown
Address:  [erro ou timeout]
```

**Soluções:**
1. Verificar registro A no Cloudflare está correto
2. Aguardar propagação (até 5 minutos)
3. Limpar cache DNS local: `ipconfig /flushdns` (Windows)

---

### Problema: ERR_TOO_MANY_REDIRECTS

**Sintomas:**
- Browser mostra erro de muitos redirects
- Não consegue acessar a página

**Causa:** Loop de redirect entre Cloudflare e servidor

**Solução:**
1. No Cloudflare: SSL/TLS → Overview
2. Mudar de "Full" para **"Flexible"**
3. Aguardar 1 minuto
4. Testar novamente

---

### Problema: Mixed Content (HTTP/HTTPS)

**Sintomas:**
- Console mostra: "Mixed Content: The page at 'https://...' was loaded over HTTPS, but requested an insecure resource 'http://...'"

**Solução:**
1. Verificar VITE_BACKEND_URL usa HTTPS:
   ```env
   VITE_BACKEND_URL=https://appeau.platty.tech
   ```
2. Rebuild frontend
3. Restart container

---

### Problema: API retorna 502 Bad Gateway

**Sintomas:**
- Frontend carrega mas API não funciona
- Console mostra erros 502

**Soluções:**
1. Verificar backend está rodando:
   ```bash
   docker ps | grep backend
   curl http://localhost:3003/health
   ```
2. Verificar configuração Nginx:
   ```bash
   sudo nginx -t
   sudo systemctl status nginx
   ```
3. Verificar logs:
   ```bash
   docker logs eau-backend-prod --tail 50
   sudo tail -f /var/log/nginx/error.log
   ```

---

### Problema: CORS Error

**Sintomas:**
- Console mostra: "Access to fetch at '...' from origin '...' has been blocked by CORS policy"

**Solução:**
1. Verificar ALLOWED_ORIGINS no backend .env
2. Adicionar novo domínio:
   ```env
   ALLOWED_ORIGINS=https://appeau.platty.tech,http://localhost:5180
   ```
3. Restart backend:
   ```bash
   docker restart eau-backend-prod
   ```

---

## 📊 CHECKLIST COMPLETO

### Cloudflare
- [ ] Registro A criado: appeau → 91.108.104.122
- [ ] Proxy status: ATIVADO (laranja)
- [ ] SSL Mode: Flexible
- [ ] Always Use HTTPS: ATIVADO
- [ ] Automatic HTTPS Rewrites: ATIVADO

### Servidor (Nginx)
- [ ] Configuração criada para appeau.platty.tech
- [ ] Proxy pass para frontend (porta 8080)
- [ ] Proxy pass para backend API (porta 3003)
- [ ] Nginx testado: `nginx -t`
- [ ] Nginx recarregado: `systemctl reload nginx`

### Frontend
- [ ] .env.production atualizado com novo domínio
- [ ] VITE_BACKEND_URL aponta para https://appeau.platty.tech
- [ ] Rebuild executado: `npm run build`
- [ ] Container recriado sem cache
- [ ] Container rodando: `docker ps`

### Backend
- [ ] ALLOWED_ORIGINS inclui novo domínio
- [ ] Backend aceita requisições do novo domínio
- [ ] Container restartado (se necessário)

### Testes
- [ ] DNS resolve: `nslookup appeau.platty.tech`
- [ ] HTTPS funciona: `curl -I https://appeau.platty.tech`
- [ ] Frontend carrega no browser
- [ ] Login funciona
- [ ] API responde: `curl https://appeau.platty.tech/api/v1/health`
- [ ] Console sem erros CORS

---

## 🚀 COMANDOS RESUMIDOS (COPIAR E COLAR)

**No Servidor:**
```bash
# Conectar
ssh root@91.108.104.122

# Atualizar .env.production
cd /home/eau-production/eau-app/eau-members
cp .env.production .env.production.backup
sed -i 's|http://91.108.104.122:3003|https://appeau.platty.tech|g' .env.production
cat .env.production  # Verificar mudanças

# Rebuild frontend
npm run build

# Rebuild e restart container
cd /home/eau-production/eau-app
docker compose build --no-cache eau-frontend
docker stop eau-frontend-prod && docker rm eau-frontend-prod
docker run -d --name eau-frontend-prod -p 8080:80 eau-app-eau-frontend:latest

# Verificar
docker ps | grep eau-frontend
curl -I https://appeau.platty.tech
```

---

## 📞 SUPORTE

Se encontrar problemas:
1. Verificar logs: `docker logs eau-frontend-prod`
2. Verificar Nginx: `sudo tail -f /var/log/nginx/error.log`
3. Testar localmente: `curl http://localhost:8080`
4. Verificar DNS: `nslookup appeau.platty.tech`

---

**✅ Após seguir todos os passos, o sistema estará acessível via https://appeau.platty.tech com SSL da Cloudflare!**

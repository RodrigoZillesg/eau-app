# Processo de Deploy para Produção - Sistema EAU

**Última Atualização:** 18/11/2025
**Ambiente:** EasyPanel + GitHub
**Servidores:** Frontend (8080) + Backend (3002) + Nginx Proxy (3003)

---

## 🎯 OVERVIEW DO DEPLOY

O sistema EAU utiliza arquitetura de deploy baseada em Docker containers no EasyPanel, com build compilado localmente e versionamento via Git.

### Componentes:
- **Frontend:** React + Vite (porta 8080 interna, 3003 externa via proxy)
- **Backend:** Node.js + Express (porta 3002)
- **Nginx:** Reverse proxy (porta 3003)
- **Database:** Supabase Cloud (gerenciado externamente)

---

## ✅ PRÉ-REQUISITOS

### Ferramentas Necessárias:
- ✅ Node.js 18+ instalado
- ✅ npm instalado
- ✅ Git configurado
- ✅ SSH access ao servidor: `root@91.108.104.122`
- ✅ Acesso ao GitHub repo: `RodrigoZillesg/eau-app`

### Verificação de Ambiente:
```bash
node --version  # Deve ser v18+
npm --version   # Deve ser 9+
git --version   # Qualquer versão recente
ssh root@91.108.104.122 "echo 'SSH OK'"  # Deve retornar "SSH OK"
```

---

## 📋 PROCESSO COMPLETO DE DEPLOY

### ETAPA 1: Validação Pré-Deploy (CRÍTICO!)

**Antes de fazer QUALQUER mudança de código, execute esta validação:**

```bash
# 1. Verificar se NÃO há URLs hardcoded
cd eau-members
grep -r "localhost:3001" src/components/ src/services/ src/features/

# ✅ DEVE RETORNAR VAZIO (nenhum resultado)
# ❌ SE RETORNAR ALGO: Corrigir ANTES de prosseguir!
```

**Se encontrar URLs hardcoded:**
```typescript
// ❌ ERRADO:
const response = await fetch('http://localhost:3001/api/v1/endpoint', ...);

// ✅ CORRETO:
const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
const response = await fetch(`${backendUrl}/api/v1/endpoint`, ...);
```

### ETAPA 2: Build Local do Frontend

**Por quê build local?**
- EasyPanel tem recursos limitados (RAM/CPU)
- Build TypeScript é pesado e pode falhar no servidor
- Build local é mais rápido e confiável

**Passos:**

```bash
# 1. Limpar build anterior
cd eau-members
rm -rf dist/

# 2. Instalar dependências (se necessário)
npm install

# 3. Build para produção
npm run build

# 4. Verificar build gerado
ls -lh dist/
ls -lh dist/assets/

# ✅ Deve ver:
# - index.html
# - assets/index.HASH.js (tamanho ~800KB)
# - assets/vendor.HASH.js
# - assets/index.HASH.css
```

**Verificar hash do bundle:**
```bash
# Anotar o nome do arquivo principal
ls dist/assets/index.*.js

# Exemplo: index.BO-9OLU_.js
```

### ETAPA 3: Atualizar index.html com Novo Hash

**Por quê fazer isso?**
- Vite gera hash único para cada build
- index.html precisa referenciar o bundle correto
- Cache busting automático

**Verificar:**
```bash
cat dist/index.html | grep "index.*js"

# ✅ DEVE MOSTRAR:
# <script type="module" crossorigin src="/assets/index.BO-9OLU_.js"></script>
```

**Se o hash estiver errado:**
```bash
# Verificar qual hash foi gerado
ls dist/assets/index.*.js

# Editar dist/index.html manualmente e corrigir
```

### ETAPA 4: Commit e Push

```bash
# 1. Verificar status
git status

# 2. Adicionar TODAS as mudanças (incluindo dist/)
git add -A

# 3. Commit com mensagem descritiva
git commit -m "fix: Update frontend with dynamic backend URL

- Replaced all hardcoded localhost:3001 with VITE_BACKEND_URL
- Rebuilt frontend with new bundle hash
- Updated index.html to reference new bundle
- Fixes OpenLearning SSO in production"

# 4. Push para GitHub
git push origin main
```

**Se git push falhar (erro 503/500):**
```bash
# GitHub pode estar temporariamente indisponível
# Aguardar 1-2 minutos e tentar novamente

git push origin main --force  # Use com CUIDADO!
```

### ETAPA 5: Deploy no Servidor

**Opção A: Via SSH (Recomendado)**

```bash
# Conectar ao servidor
ssh root@91.108.104.122

# Navegar para diretório do projeto
cd /home/eau-production/eau-app

# Stash mudanças locais (se houver)
git stash

# Pull latest changes
git pull origin main

# Rebuild container do frontend SEM cache
docker compose build --no-cache eau-frontend

# Parar container antigo
docker stop eau-frontend-prod
docker rm eau-frontend-prod

# Iniciar novo container
docker run -d --name eau-frontend-prod -p 8080:80 eau-app-eau-frontend:latest

# Verificar se está rodando
docker ps | grep eau-frontend-prod

# Sair do servidor
exit
```

**Opção B: Via EasyPanel UI**

1. Acessar: http://91.108.104.122:3000/
2. Login: dev@platty.tech / F27i486fb3gVyPC
3. Selecionar projeto: eau-app
4. Clicar em: Frontend → Deploy → Rebuild
5. Aguardar build completar (~2-3 minutos)
6. Verificar logs: Frontend → Logs

### ETAPA 6: Validação Pós-Deploy

**Teste 1: Verificar Frontend Carregou**
```bash
# Testar URL de produção
curl -I http://91.108.104.122:8080/

# ✅ DEVE RETORNAR:
# HTTP/1.1 200 OK
```

**Teste 2: Verificar Bundle Correto**
```bash
# Conectar ao servidor
ssh root@91.108.104.122

# Verificar bundle dentro do container
docker exec eau-frontend-prod cat /usr/share/nginx/html/index.html | grep 'script type'

# ✅ DEVE MOSTRAR o NOVO hash:
# <script type="module" crossorigin src="/assets/index.BO-9OLU_.js"></script>
```

**Teste 3: Testar no Browser**

1. Abrir: http://91.108.104.122:8080/
2. F12 → Console → Verificar SEM erros
3. F12 → Network → Ver bundle carregado (index.BO-9OLU_.js)
4. Fazer login
5. Tentar funcionalidade crítica (ex: OpenLearning SSO)

**Teste 4: Verificar Variáveis de Ambiente**

```bash
# No browser console (F12):
console.log(import.meta.env.VITE_BACKEND_URL)

# ✅ DEVE MOSTRAR:
# "http://91.108.104.122:3003"
```

---

## 🔧 TROUBLESHOOTING

### Problema: Build Falha Localmente

**Sintomas:**
```
Error: TypeScript compilation failed
Cannot find module 'X'
```

**Solução:**
```bash
# 1. Limpar cache
rm -rf node_modules/
rm package-lock.json

# 2. Reinstalar dependências
npm install

# 3. Tentar build novamente
npm run build
```

### Problema: Git Push Falha (503/500)

**Sintomas:**
```
fatal: unable to access 'https://github.com/...': The requested URL returned error: 503
```

**Soluções:**

**Opção 1: Aguardar e Tentar Novamente**
```bash
# Aguardar 2 minutos
sleep 120

# Tentar novamente
git push origin main
```

**Opção 2: Usar SCP para Copiar Arquivos**
```bash
# Copiar index.html
scp eau-members/dist/index.html root@91.108.104.122:/home/eau-production/eau-app/eau-members/dist/

# Copiar bundle principal
scp eau-members/dist/assets/index.BO-9OLU_.js root@91.108.104.122:/home/eau-production/eau-app/eau-members/dist/assets/

# Depois rebuild o container
```

### Problema: Container Serve Bundle Antigo

**Sintomas:**
- Browser carrega bundle com hash antigo
- Mudanças de código não aparecem

**Causa:**
- Docker container foi buildado com arquivos antigos
- Container não pegou arquivos novos do host

**Solução:**
```bash
ssh root@91.108.104.122

cd /home/eau-production/eau-app

# 1. Rebuild SEM CACHE (crítico!)
docker compose build --no-cache eau-frontend

# 2. Parar e remover container antigo
docker stop eau-frontend-prod
docker rm eau-frontend-prod

# 3. Iniciar novo container
docker run -d --name eau-frontend-prod -p 8080:80 eau-app-eau-frontend:latest

# 4. Verificar bundle dentro do container
docker exec eau-frontend-prod cat /usr/share/nginx/html/index.html | grep 'script type'
```

### Problema: Funcionalidade Quebrou Após Deploy

**Sintomas:**
- Sistema carrega mas funcionalidade específica não funciona
- Console mostra erros 404/500

**Diagnóstico:**

```bash
# 1. Verificar logs do backend
ssh root@91.108.104.122 "docker logs eau-backend-prod --tail 100"

# 2. Verificar console do browser (F12)
# Procurar por erros de:
# - Connection refused → Backend URL errada
# - 404 Not Found → Endpoint mudou
# - 401 Unauthorized → Problema de auth
# - 400 Bad Request → Dados inválidos
```

**Soluções por Tipo de Erro:**

**Erro: `ERR_CONNECTION_REFUSED @ localhost:3001`**
```
Causa: URL hardcoded não foi corrigida
Solução: Voltar para ETAPA 1 e corrigir
```

**Erro: `404 Not Found @ /api/v1/endpoint`**
```
Causa: Endpoint não existe no backend ou path mudou
Solução: Verificar rotas do backend e frontend
```

**Erro: `401 Unauthorized`**
```
Causa: Token inválido ou middleware de auth com problema
Solução:
1. Fazer logout
2. Limpar localStorage (F12 → Application → Clear Storage)
3. Fazer login novamente
```

---

## 📊 CHECKLIST COMPLETO DE DEPLOY

### Antes do Deploy:
- [ ] Verificar URLs hardcoded (grep)
- [ ] Todas mudanças commitadas localmente
- [ ] Build local funcionando
- [ ] Testes locais passando

### Durante o Deploy:
- [ ] Build frontend: `npm run build`
- [ ] Verificar hash do bundle
- [ ] Verificar index.html referencia hash correto
- [ ] Git commit com mensagem descritiva
- [ ] Git push para GitHub
- [ ] Pull no servidor
- [ ] Rebuild container SEM cache
- [ ] Restart container

### Após o Deploy:
- [ ] Frontend carrega (HTTP 200)
- [ ] Bundle correto sendo servido
- [ ] Console sem erros
- [ ] Login funciona
- [ ] Funcionalidades críticas funcionam:
  - [ ] Dashboard carrega
  - [ ] OpenLearning SSO funciona
  - [ ] CPD listing funciona
  - [ ] Events listing funciona

---

## ⏱️ TEMPO ESTIMADO

**Deploy Completo (sem problemas):** 10-15 minutos

Breakdown:
- Validação pré-deploy: 2 min
- Build local: 2 min
- Commit e push: 2 min
- Deploy no servidor: 3 min
- Validação pós-deploy: 3 min
- Testes funcionais: 5 min

**Deploy com Problemas:** 30-60 minutos
- Inclui troubleshooting
- Rebuild múltiplo
- Testes extensivos

---

## 🚨 REGRAS DE OURO

1. **NUNCA pule a validação pré-deploy**
   - URLs hardcoded quebram produção SEMPRE

2. **SEMPRE faça build local**
   - Não confie em build no servidor
   - EasyPanel pode falhar silenciosamente

3. **SEMPRE use --no-cache no rebuild**
   - Docker cache pode servir arquivos antigos
   - Cache busting é crítico

4. **SEMPRE teste após deploy**
   - Não assuma que funcionou
   - Teste funcionalidades críticas

5. **SEMPRE documente problemas**
   - Adicione ao troubleshooting guide
   - Ajuda próximo deploy

---

## 📞 CONTATOS DE EMERGÊNCIA

**Servidor:**
- IP: 91.108.104.122
- SSH: root@91.108.104.122
- Password: Y#n9nah@=E@6ws8m!F/q\

**EasyPanel:**
- URL: http://91.108.104.122:3000/
- Login: dev@platty.tech
- Password: F27i486fb3gVyPC

**GitHub:**
- Repo: github.com/RodrigoZillesg/eau-app
- Branch: main

**Supabase:**
- Cloud URL: https://ypsvoxelitgceclohxfu.supabase.co
- Dashboard: app.supabase.com

---

## 📝 CHANGELOG

**18/11/2025 - v1.0**
- Documentado processo completo de deploy
- Adicionado troubleshooting extensivo
- Incluído checklist completo
- Testado e validado em produção
- Deploy bem-sucedido com OpenLearning SSO funcionando

---

**✅ Este guia foi testado e validado em produção em 18/11/2025**

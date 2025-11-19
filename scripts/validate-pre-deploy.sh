#!/bin/bash

# Script de Validação Pré-Deploy
# Sistema EAU - English Australia Members Platform
# Data: 18/11/2025

set -e  # Exit on error

echo "================================================"
echo "🔍 VALIDAÇÃO PRÉ-DEPLOY - Sistema EAU"
echo "================================================"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Função para erro
error() {
    echo -e "${RED}❌ ERRO: $1${NC}"
    ERRORS=$((ERRORS + 1))
}

# Função para warning
warning() {
    echo -e "${YELLOW}⚠️  WARNING: $1${NC}"
    WARNINGS=$((WARNINGS + 1))
}

# Função para sucesso
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

echo "📋 ETAPA 1: Verificar URLs Hardcoded"
echo "-------------------------------------------"

# Verificar frontend
cd eau-members

HARDCODED_URLS=$(grep -r "localhost:3001" src/ 2>/dev/null || true)

if [ -n "$HARDCODED_URLS" ]; then
    error "URLs hardcoded encontradas no frontend!"
    echo "$HARDCODED_URLS"
    echo ""
    echo "Corrija substituindo por:"
    echo "const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';"
    echo ""
else
    success "Nenhuma URL hardcoded encontrada no frontend"
fi

cd ..

echo ""
echo "📋 ETAPA 2: Verificar Variáveis de Ambiente"
echo "-------------------------------------------"

# Verificar .env.production existe
if [ ! -f "eau-members/.env.production" ]; then
    error ".env.production não encontrado!"
else
    success ".env.production existe"

    # Verificar variáveis críticas
    if grep -q "VITE_BACKEND_URL=" eau-members/.env.production; then
        BACKEND_URL=$(grep "VITE_BACKEND_URL=" eau-members/.env.production | cut -d '=' -f2)
        success "VITE_BACKEND_URL configurada: $BACKEND_URL"
    else
        error "VITE_BACKEND_URL não encontrada em .env.production"
    fi

    if grep -q "VITE_SUPABASE_URL=" eau-members/.env.production; then
        success "VITE_SUPABASE_URL configurada"
    else
        error "VITE_SUPABASE_URL não encontrada em .env.production"
    fi
fi

echo ""
echo "📋 ETAPA 3: Verificar Build Local"
echo "-------------------------------------------"

# Verificar se dist/ existe
if [ -d "eau-members/dist" ]; then
    success "Pasta dist/ existe"

    # Verificar se index.html existe
    if [ -f "eau-members/dist/index.html" ]; then
        success "index.html existe"

        # Verificar se index.html referencia bundle correto
        BUNDLE_REFS=$(grep -o 'src="/assets/index\.[^"]*\.js"' eau-members/dist/index.html || true)
        if [ -n "$BUNDLE_REFS" ]; then
            success "index.html referencia bundle: $BUNDLE_REFS"

            # Extrair nome do arquivo
            BUNDLE_NAME=$(echo $BUNDLE_REFS | grep -o 'index\.[^"]*\.js')

            # Verificar se arquivo existe
            if [ -f "eau-members/dist/assets/$BUNDLE_NAME" ]; then
                BUNDLE_SIZE=$(du -h "eau-members/dist/assets/$BUNDLE_NAME" | cut -f1)
                success "Bundle existe ($BUNDLE_SIZE)"
            else
                error "Bundle referenciado não existe: $BUNDLE_NAME"
            fi
        else
            error "index.html não referencia nenhum bundle!"
        fi
    else
        error "index.html não encontrado em dist/"
    fi
else
    warning "Pasta dist/ não existe - você precisa fazer build primeiro!"
    echo "Execute: cd eau-members && npm run build"
fi

echo ""
echo "📋 ETAPA 4: Verificar Git Status"
echo "-------------------------------------------"

# Verificar se há mudanças não commitadas
if ! git diff-index --quiet HEAD -- 2>/dev/null; then
    warning "Há mudanças não commitadas"
    git status --short
    echo ""
    echo "Commite suas mudanças antes de fazer deploy:"
    echo "git add -A && git commit -m 'sua mensagem'"
else
    success "Não há mudanças pendentes"
fi

# Verificar se está na branch main
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    warning "Você não está na branch main (atual: $CURRENT_BRANCH)"
    echo "Mude para main: git checkout main"
else
    success "Branch atual: main"
fi

echo ""
echo "📋 ETAPA 5: Verificar Dependências"
echo "-------------------------------------------"

# Verificar Node.js version
NODE_VERSION=$(node --version)
success "Node.js: $NODE_VERSION"

# Verificar npm version
NPM_VERSION=$(npm --version)
success "npm: $NPM_VERSION"

# Verificar se node_modules existe
if [ -d "eau-members/node_modules" ]; then
    success "node_modules instalado (frontend)"
else
    warning "node_modules não encontrado - rode npm install"
fi

if [ -d "eau-backend/node_modules" ]; then
    success "node_modules instalado (backend)"
else
    warning "node_modules não encontrado no backend"
fi

echo ""
echo "📋 ETAPA 6: Verificar Conectividade Servidor"
echo "-------------------------------------------"

# Testar SSH
if ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no root@91.108.104.122 "echo 'SSH OK'" > /dev/null 2>&1; then
    success "Conexão SSH com servidor OK"
else
    warning "Não foi possível conectar ao servidor via SSH"
    echo "Verifique: ssh root@91.108.104.122"
fi

# Testar URL de produção
if curl -s -o /dev/null -w "%{http_code}" http://91.108.104.122:8080/ | grep -q "200"; then
    success "Frontend em produção respondendo (HTTP 200)"
else
    warning "Frontend em produção não está respondendo"
fi

if curl -s -o /dev/null -w "%{http_code}" http://91.108.104.122:3003/health | grep -q "200"; then
    success "Backend em produção respondendo (HTTP 200)"
else
    warning "Backend em produção não está respondendo"
fi

echo ""
echo "================================================"
echo "📊 RESUMO DA VALIDAÇÃO"
echo "================================================"

if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}❌ ERROS ENCONTRADOS: $ERRORS${NC}"
    echo ""
    echo "🚨 NÃO FAÇA DEPLOY! Corrija os erros primeiro."
    echo ""
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠️  WARNINGS: $WARNINGS${NC}"
    echo ""
    echo "⚠️  Há warnings - revise antes de fazer deploy."
    echo ""
    exit 0
else
    echo -e "${GREEN}✅ TUDO OK! Pronto para deploy.${NC}"
    echo ""
    echo "Próximos passos:"
    echo "1. Build: cd eau-members && npm run build"
    echo "2. Commit: git add -A && git commit -m 'descrição'"
    echo "3. Push: git push origin main"
    echo "4. Deploy: ssh root@91.108.104.122"
    echo ""
    exit 0
fi

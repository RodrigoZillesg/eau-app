#!/bin/bash
echo "=== DEPLOY FRONTEND COMPLETO ==="
echo ""
echo "1. Parando containers..."
cd /etc/easypanel/projects/eau-app/eau-frontend/code
docker compose down

echo ""
echo "2. Limpando cache Docker..."
docker system prune -f

echo ""
echo "3. Atualizando código..."
git fetch origin
git reset --hard origin/main

echo ""
echo "4. Verificando client.ts..."
grep -n "supabase" eau-members/src/lib/supabase/client.ts | head -5

echo ""
echo "5. Reconstruindo frontend sem cache..."
docker compose build --no-cache eau-frontend

echo ""
echo "6. Iniciando frontend..."
docker compose up -d

echo ""
echo "7. Aguardando 20 segundos..."
sleep 20

echo ""
echo "8. Status final:"
docker compose ps

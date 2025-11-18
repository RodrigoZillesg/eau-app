#!/bin/bash
# Complete Deployment Script
# This script deploys both backend and frontend to production server
# Uses SSH key authentication (no password needed)

set -e  # Exit on any error

echo "========================================"
echo "🚀 EAU Complete Deployment Script"
echo "========================================"
echo ""

# Configuration
SERVER="root@91.108.104.122"
DEPLOY_DIR="/home/eau-production/eau-app"

echo "📦 Step 1: Building backend locally..."
cd eau-backend
npm run build
cd ..
echo "✅ Backend built successfully!"
echo ""

echo "📦 Step 2: Building frontend locally..."
cd eau-members
npm run build
cd ..
echo "✅ Frontend built successfully!"
echo ""

echo "📤 Step 3: Committing and pushing to GitHub..."
git add -f eau-backend/dist/
git add -f eau-members/dist/assets/*.js
git add -f eau-members/dist/assets/*.css
git add -f eau-members/dist/
git add eau-members/.env.production
git add -A
git commit -m "Production build: $(date '+%Y-%m-%d %H:%M:%S')" || echo "No changes to commit"
git push origin main
echo "✅ Pushed to GitHub!"
echo ""

echo "🔄 Step 4: Pulling changes on server..."
ssh -i ~/.ssh/id_rsa "$SERVER" "cd $DEPLOY_DIR && git pull origin main"
echo "✅ Changes pulled on server!"
echo ""

echo "🐳 Step 5: Rebuilding backend Docker image..."
ssh -i ~/.ssh/id_rsa "$SERVER" "cd $DEPLOY_DIR/eau-backend && docker build -f Dockerfile.simple -t eau-backend:latest ."
echo "✅ Backend image rebuilt!"
echo ""

echo "🐳 Step 6: Rebuilding frontend Docker image..."
ssh -i ~/.ssh/id_rsa "$SERVER" "cd $DEPLOY_DIR && docker build -f eau-members/Dockerfile -t eau-frontend:latest ."
echo "✅ Frontend image rebuilt!"
echo ""

echo "🔄 Step 7: Restarting backend container..."
ssh -i ~/.ssh/id_rsa "$SERVER" "bash $DEPLOY_DIR/start-backend.sh"
echo "✅ Backend restarted!"
echo ""

echo "🔄 Step 8: Restarting frontend container..."
ssh -i ~/.ssh/id_rsa "$SERVER" "docker stop eau-frontend-prod && docker rm eau-frontend-prod && docker run -d --name eau-frontend-prod --restart unless-stopped -p 8080:80 eau-frontend:latest"
echo "✅ Frontend restarted!"
echo ""

echo "🧪 Step 9: Testing deployment..."
echo "Backend health check:"
ssh -i ~/.ssh/id_rsa "$SERVER" "curl -s http://localhost:3002/health"
echo ""
echo ""
echo "Frontend status:"
ssh -i ~/.ssh/id_rsa "$SERVER" "curl -s -o /dev/null -w '%{http_code}' http://localhost:8080"
echo ""
echo ""

echo "========================================"
echo "✅ Deployment completed successfully!"
echo "========================================"
echo ""
echo "🌐 URLs:"
echo "   Frontend: http://91.108.104.122:8080"
echo "   Backend:  http://91.108.104.122:3002"
echo ""
echo "📊 Check status:"
echo "   docker ps | grep eau"
echo ""

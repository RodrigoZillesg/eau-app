#!/bin/bash
# Start EAU Backend on port 3002

echo "Starting EAU Backend..."

# Stop and remove old container if exists
docker stop eau-backend-prod 2>/dev/null || true
docker rm eau-backend-prod 2>/dev/null || true

# Start new container
docker run -d \
  --name eau-backend-prod \
  --restart unless-stopped \
  -p 3002:3001 \
  -e NODE_ENV=production \
  -e PORT=3001 \
  -e SUPABASE_URL=https://english-australia-eau-supabase.lkobs5.easypanel.host \
  -e "SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE" \
  -e "SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q" \
  eau-backend:latest

echo "Waiting 5 seconds for backend to start..."
sleep 5

echo ""
echo "=== Testing Backend Health ==="
curl http://localhost:3002/health
echo ""

echo ""
echo "=== Container Status ==="
docker ps | grep eau-backend

echo ""
echo "=== Recent Logs ==="
docker logs eau-backend-prod --tail 20

echo ""
echo "✅ Backend started on port 3002!"
echo "   Test: curl http://localhost:3002/health"
echo "   Logs: docker logs -f eau-backend-prod"

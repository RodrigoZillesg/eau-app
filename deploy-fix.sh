#!/bin/bash

echo "🔄 Deploying fix for demo mode warning..."

# Update code on server
echo "📦 Pulling latest code..."
git pull origin main

# Build and deploy frontend with corrected Supabase client
echo "🏗️ Rebuilding frontend..."
cd eau-members
docker build --build-arg VITE_SUPABASE_URL=https://english-australia-eau-supabase.lkobs5.easypanel.host \
             --build-arg VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE \
             --build-arg VITE_API_URL=http://91.108.104.122:3001 \
             --no-cache \
             -t eau-frontend .
cd ..

echo "🚀 Starting services..."
docker-compose down
docker-compose up -d

echo "✅ Deployment completed! Checking status..."
docker-compose ps

echo "🔍 Checking frontend logs..."
docker-compose logs eau-frontend | tail -10
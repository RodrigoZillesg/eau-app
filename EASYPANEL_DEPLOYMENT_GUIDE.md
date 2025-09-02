# EasyPanel Deployment Guide

## 🚀 Quick Deploy Commands

```bash
# 1. Commit and push changes
git add -A
git commit -m "Your commit message"
git push origin main

# 2. Deploy will trigger automatically in EasyPanel
```

## 📋 Prerequisites

1. **EasyPanel Access**
   - URL: http://91.108.104.122:3000/
   - Credentials: Stored securely

2. **GitHub Repository**
   - Repository: https://github.com/RodrigoZillesg/eau-app
   - Branch: main

## 🔧 Initial Setup (One-time Configuration)

### 1. Create Services in EasyPanel

1. Navigate to project: http://91.108.104.122:3000/projects/eau-app
2. Click "Service" button to create new service
3. Choose "Compose" template
4. Name your services (e.g., `eau-backend`, `eau-frontend`)

### 2. Configure Git Source for Each Service

#### Backend Service (eau-backend)
1. Navigate to: http://91.108.104.122:3000/projects/eau-app/compose/eau-backend/source
2. Click "Git" tab
3. Fill in:
   - Repository URL: `https://github.com/RodrigoZillesg/eau-app.git`
   - Branch: `main`
   - Build Path: `eau-backend/`
   - Docker Compose File: `docker-compose.yml`
4. Click "Save"

#### Frontend Service (eau-frontend)
1. Navigate to: http://91.108.104.122:3000/projects/eau-app/compose/eau-frontend/source
2. Click "Git" tab
3. Fill in:
   - Repository URL: `https://github.com/RodrigoZillesg/eau-app.git`
   - Branch: `main`
   - Build Path: `eau-members/`
   - Docker Compose File: `docker-compose.yml`
4. Click "Save"

### 3. Configure Environment Variables

#### Backend Environment Variables
Navigate to: http://91.108.104.122:3000/projects/eau-app/compose/eau-backend/environment

```env
NODE_ENV=production
PORT=3001
SUPABASE_URL=https://english-australia-eau-supabase.lkobs5.easypanel.host
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q
JWT_SECRET=your-super-secret-jwt-token-with-at-least-32-characters-long
CORS_ORIGIN=*
```

#### Frontend Environment Variables
Navigate to: http://91.108.104.122:3000/projects/eau-app/compose/eau-frontend/environment

```env
VITE_SUPABASE_URL=https://english-australia-eau-supabase.lkobs5.easypanel.host
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE
VITE_API_URL=http://91.108.104.122:[BACKEND_PORT]
```

## 📁 Required Files Structure

```
eau-app/
├── eau-backend/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       └── index.ts
└── eau-members/
    ├── Dockerfile
    ├── docker-compose.yml
    ├── nginx.conf
    ├── package.json
    └── src/
```

## 🐳 Docker Configuration Files

### Backend Dockerfile (eau-backend/Dockerfile)
```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /app
USER nodejs
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health', (r) => {r.statusCode === 200 ? process.exit(0) : process.exit(1)})"
CMD ["node", "dist/index.js"]
```

### Frontend Dockerfile (eau-members/Dockerfile)
```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 🔄 Deployment Process

### Manual Deploy
1. Navigate to service overview
2. Click "Deploy" button
3. Monitor deployment status in "Deployments" tab

### Check Deployment Status
- Backend: http://91.108.104.122:3000/projects/eau-app/compose/eau-backend/deployments
- Frontend: http://91.108.104.122:3000/projects/eau-app/compose/eau-frontend/deployments

### View Logs
1. Navigate to service overview
2. Logs section shows real-time container logs
3. Check for errors during build or runtime

## 🔗 Important URLs

### Service Management
- Backend Overview: http://91.108.104.122:3000/projects/eau-app/compose/eau-backend
- Backend Source: http://91.108.104.122:3000/projects/eau-app/compose/eau-backend/source
- Backend Deployments: http://91.108.104.122:3000/projects/eau-app/compose/eau-backend/deployments
- Backend Environment: http://91.108.104.122:3000/projects/eau-app/compose/eau-backend/environment
- Backend Domains: http://91.108.104.122:3000/projects/eau-app/compose/eau-backend/domains

- Frontend Overview: http://91.108.104.122:3000/projects/eau-app/compose/eau-frontend
- Frontend Source: http://91.108.104.122:3000/projects/eau-app/compose/eau-frontend/source
- Frontend Deployments: http://91.108.104.122:3000/projects/eau-app/compose/eau-frontend/deployments
- Frontend Environment: http://91.108.104.122:3000/projects/eau-app/compose/eau-frontend/environment
- Frontend Domains: http://91.108.104.122:3000/projects/eau-app/compose/eau-frontend/domains

## ⚠️ Common Issues and Solutions

### Issue: "No source provided" error
**Solution:** Configure Git source with repository URL, branch, build path, and docker-compose file

### Issue: TypeScript compilation fails
**Solution:** Ensure Dockerfile includes TypeScript build step and copies tsconfig.json

### Issue: Container doesn't start
**Solution:** Check logs for missing environment variables or port conflicts

### Issue: Frontend can't connect to backend
**Solution:** Verify VITE_API_URL in frontend environment variables points to correct backend URL

## 📝 Checklist for New Deployments

- [ ] Git repository configured correctly
- [ ] Branch set to `main`
- [ ] Build path points to correct directory
- [ ] Docker Compose file path is correct
- [ ] All environment variables are set
- [ ] Dockerfile includes build steps for TypeScript (backend)
- [ ] nginx.conf is present (frontend)
- [ ] Health check endpoints implemented
- [ ] Ports don't conflict with other services

## 🚨 Emergency Procedures

### Rollback Deployment
1. Navigate to Deployments tab
2. Find last working deployment
3. Click "Redeploy" on that version

### Clear Build Cache
1. Stop service
2. Remove containers
3. Rebuild from scratch

### Check Service Health
```bash
# Backend health check
curl http://91.108.104.122:[BACKEND_PORT]/health

# Frontend check
curl http://91.108.104.122:[FRONTEND_PORT]/
```

## 📊 Monitoring

- CPU Usage: Monitor in service overview
- Memory Usage: Check for memory leaks
- Network I/O: Track request patterns
- Logs: Regular review for errors

## 🔐 Security Notes

- Never commit secrets to repository
- Use environment variables for sensitive data
- Regularly update dependencies
- Monitor for security alerts in GitHub

---

Last Updated: 2025-09-02
Maintained by: EAU Development Team
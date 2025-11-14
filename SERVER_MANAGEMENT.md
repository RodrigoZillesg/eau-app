# 🚀 EAU React - Server Management Guide

## ⚠️ CRITICAL: NEVER KILL ALL NODE PROCESSES!

**WRONG (Kills Claude Code and everything else):**
```bash
taskkill /F /IM node.exe  # ❌ NEVER DO THIS!
```

**RIGHT (Kill only our specific ports):**
```bash
# Use the provided scripts or target specific PIDs
./scripts/stop-servers.bat
```

---

## 📋 Server Configuration

### Frontend Server (Vite)
- **Port**: 5180
- **Directory**: `eau-members/`
- **Start Command**: `npm run dev`
- **Process**: Node.js running Vite dev server
- **URL**: http://localhost:5180

### Backend Server (Express)
- **Port**: 3001
- **Directory**: `eau-backend/`
- **Start Command**: `npm start`
- **Process**: Node.js running Express API
- **URL**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

---

## 🛠️ Management Scripts

All scripts are located in `scripts/` directory:

### 1. Start Servers
```bash
./scripts/start-servers.bat
```
**What it does:**
1. Checks and kills any existing processes on ports 5180 and 3001
2. Starts Backend server (port 3001) in new window
3. Waits 3 seconds for backend to initialize
4. Starts Frontend server (port 5180) in new window
5. Shows URLs for both servers

**Result:** Two new CMD windows open with servers running

---

### 2. Stop Servers
```bash
./scripts/stop-servers.bat
```
**What it does:**
1. Finds process using port 5180 (frontend)
2. Finds process using port 3001 (backend)
3. Kills ONLY these specific PIDs
4. Does NOT affect Claude Code or other Node processes

**Safe to use anytime!**

---

### 3. Restart Servers
```bash
./scripts/restart-servers.bat
```
**What it does:**
1. Calls stop-servers.bat
2. Waits 3 seconds
3. Calls start-servers.bat

**Use this when you need a clean restart**

---

### 4. Check Server Status
```bash
./scripts/check-servers.bat
```
**What it does:**
1. Checks if port 5180 is in use (frontend)
2. Checks if port 3001 is in use (backend)
3. Shows PID of each process
4. Shows status: RUNNING or NOT running

**Use this to verify servers are up**

---

## 🎯 Common Scenarios

### Scenario 1: Starting Fresh
```bash
# Check if anything is running
./scripts/check-servers.bat

# Start both servers
./scripts/start-servers.bat
```

### Scenario 2: Port Already in Use
```bash
# Stop any existing servers
./scripts/stop-servers.bat

# Start fresh
./scripts/start-servers.bat
```

### Scenario 3: Code Changes Not Reflecting
```bash
# Restart to clear cache
./scripts/restart-servers.bat
```

### Scenario 4: Check if Servers are Running
```bash
./scripts/check-servers.bat
```

### Scenario 5: Stop Everything
```bash
./scripts/stop-servers.bat
```

---

## 🔍 Manual Server Management (When Scripts Fail)

### Find Process on Specific Port
```bash
# Frontend (5180)
netstat -ano | findstr ":5180"

# Backend (3001)
netstat -ano | findstr ":3001"
```

Output format:
```
TCP    0.0.0.0:5180    0.0.0.0:0    LISTENING    12345
                                                  ^^^^^ PID
```

### Kill Specific Process
```bash
# Replace 12345 with actual PID from netstat
taskkill /F /PID 12345
```

### Start Manually
```bash
# Backend (Terminal 1)
cd eau-backend
npm start

# Frontend (Terminal 2)
cd eau-members
npm run dev
```

---

## 🚨 Troubleshooting

### Problem: Port 5180 shows as 5181 or 5182
**Cause:** Port 5180 is occupied, Vite auto-increments
**Solution:**
```bash
./scripts/stop-servers.bat
./scripts/start-servers.bat
```

### Problem: Backend won't start
**Check:**
1. Port 3001 is free: `netstat -ano | findstr ":3001"`
2. Backend compiled: `cd eau-backend && npm run build`
3. Environment variables set in eau-backend/.env

### Problem: Frontend shows "Cannot connect to backend"
**Check:**
1. Backend is running: `./scripts/check-servers.bat`
2. Backend health: http://localhost:3001/health
3. VITE_API_URL in eau-members/.env points to http://localhost:3001

### Problem: Scripts not working
**Try:**
1. Run as Administrator
2. Check if scripts/ directory exists
3. Manually execute commands one by one

---

## 📝 Process Identification

### How to Identify EAU Processes

**Frontend Process:**
- **Port**: 5180
- **Command Line**: Contains `vite` or `eau-members`
- **Parent**: Started from `eau-members/` directory

**Backend Process:**
- **Port**: 3001
- **Command Line**: Contains `eau-backend` or `dist/index.js`
- **Parent**: Started from `eau-backend/` directory

**Claude Code Process:**
- **DO NOT KILL THIS!**
- Different port (not 5180 or 3001)
- Parent process is Claude Code application

### PowerShell Command to List All Node Processes
```powershell
Get-Process node | Select-Object Id, ProcessName, @{Name="Port";Expression={(Get-NetTCPConnection -OwningProcess $_.Id -ErrorAction SilentlyContinue).LocalPort}} | Format-Table
```

---

## ✅ Best Practices

1. **Always use scripts** - They're safe and tested
2. **Never kill all node.exe** - You'll kill Claude Code
3. **Check status first** - Use check-servers.bat before starting
4. **Keep terminal windows open** - Makes it easy to see logs
5. **Restart after schema changes** - Backend may cache DB structure
6. **Wait for backend** - Frontend needs backend API to be ready

---

## 🎓 For Claude Code (AI Assistant)

**When you need to start servers:**
```bash
./scripts/start-servers.bat
```

**When you need to stop servers:**
```bash
./scripts/stop-servers.bat
```

**When you need to restart servers:**
```bash
./scripts/restart-servers.bat
```

**When you need to check if servers are running:**
```bash
./scripts/check-servers.bat
```

**NEVER EVER use:**
```bash
taskkill /F /IM node.exe  # ❌ This kills Claude Code!
```

**If scripts don't work, use manual port-specific approach:**
```bash
# Find PID
netstat -ano | findstr ":5180"
netstat -ano | findstr ":3001"

# Kill specific PID only
taskkill /F /PID [specific_pid]
```

---

## 📚 Related Documentation

- **CLAUDE.md** - Project memory and guidelines
- **PLANO_DESENVOLVIMENTO_EAU.md** - Development roadmap
- **DATABASE_SCHEMA.md** - Database structure

---

**Last Updated:** 2025-11-14
**Version:** 1.0.0

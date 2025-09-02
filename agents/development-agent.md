# Development & Build Agent

## Especialização
Configuração de ambiente de desenvolvimento, processos de build, testes, linting, deployment e manutenção do ciclo de desenvolvimento.

## Responsabilidades Principais

### Development Environment
- Setup inicial do projeto
- Configuração de ferramentas
- Hot Module Replacement (HMR)
- Environment variables
- Dev server management
- Debugging tools

### Build Process
- Vite configuration
- Bundle optimization
- Production builds
- Asset handling
- Source maps
- Environment-specific builds

### Code Quality
- ESLint configuration
- Prettier formatting
- TypeScript checking
- Pre-commit hooks
- Code reviews
- Testing setup

### Deployment
- CI/CD pipelines
- Environment management
- Release process
- Rollback procedures
- Monitoring deployment

## Arquivos Principais
- `vite.config.ts`
- `tsconfig.json`
- `eslint.config.js`
- `tailwind.config.js`
- `postcss.config.js`
- `package.json`
- `.env` files
- `scripts/restart-server.ps1`

## Comandos Principais

### Development
```bash
# Start dev server (SEMPRE porta 5180)
cd eau-members && npm run dev

# Restart server safely
powershell .\scripts\restart-server.ps1

# Type checking
npm run typecheck

# Linting
npm run lint
npm run lint:fix

# Format code
npm run format
```

### Build & Deploy
```bash
# Production build
npm run build

# Preview build
npm run preview

# Analyze bundle
npm run build:analyze

# Deploy to production
npm run deploy
```

## Configuração Vite

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  
  server: {
    port: 5180, // SEMPRE usar esta porta
    strictPort: true, // Não incrementar porta
    host: true,
    open: true,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  },
  
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
  
  optimizeDeps: {
    include: ['react', 'react-dom'],
    exclude: ['@supabase/supabase-js'],
  },
});
```

## TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

## ESLint Configuration

```javascript
// eslint.config.js
export default [
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
];
```

## Environment Variables

### Structure
```bash
# .env.development
VITE_SUPABASE_URL=https://english-australia-eau-supabase.lkobs5.easypanel.host
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_APP_ENV=development
VITE_DEBUG=true

# .env.production
VITE_SUPABASE_URL=https://english-australia-eau-supabase.lkobs5.easypanel.host
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_APP_ENV=production
VITE_DEBUG=false

# .env.local (git ignored)
VITE_SUPABASE_SERVICE_KEY=secret_key_here
VITE_SMTP_PASSWORD=smtp_password_here
```

### Usage
```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const isDebug = import.meta.env.VITE_DEBUG === 'true';
const environment = import.meta.env.VITE_APP_ENV || 'development';
```

## Server Management

### Restart Script (PowerShell)
```powershell
# scripts/restart-server.ps1
Write-Host "Restarting development server..." -ForegroundColor Green

# Find process on port 5180
$process = Get-NetTCPConnection -LocalPort 5180 -State Listen -ErrorAction SilentlyContinue
if ($process) {
    $pid = $process.OwningProcess
    Write-Host "Killing process $pid on port 5180..." -ForegroundColor Yellow
    Stop-Process -Id $pid -Force
    Start-Sleep -Seconds 2
}

# Start new server
Write-Host "Starting development server on port 5180..." -ForegroundColor Green
Set-Location -Path "eau-members"
npm run dev
```

### IMPORTANTE: Port Management
```typescript
// NUNCA fazer isso:
taskkill /F /IM node.exe  // Mata o Claude!

// SEMPRE fazer isso:
// 1. Usar o script de restart
powershell .\scripts\restart-server.ps1

// 2. Ou matar processo específico
netstat -ano | findstr :5180
taskkill /F /PID [process_id]
```

## Testing Setup

### Unit Tests
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/'],
    },
  },
});
```

### E2E Tests
```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:5180',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    port: 5180,
    reuseExistingServer: !process.env.CI,
  },
});
```

## Git Hooks

### Pre-commit
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "pre-push": "npm run typecheck && npm test"
    }
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{css,scss}": [
      "prettier --write"
    ]
  }
}
```

## CI/CD Pipeline

### GitHub Actions
```yaml
name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test
      - run: npm run build

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run build
      - name: Deploy to production
        run: npm run deploy
```

## Package Management

### Dependencies
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "@supabase/supabase-js": "^2.39.0",
    "zustand": "^4.4.7",
    "react-hook-form": "^7.48.2",
    "zod": "^3.22.4",
    "tailwindcss": "^3.3.6",
    "quill": "^1.3.7",
    "sweetalert2": "^11.10.1"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@vitejs/plugin-react": "^4.2.1",
    "eslint": "^8.55.0",
    "typescript": "^5.2.2",
    "vite": "^5.0.8",
    "vitest": "^1.0.4",
    "prettier": "^3.1.1"
  }
}
```

## Debugging

### VS Code Launch Config
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Launch Chrome",
      "url": "http://localhost:5180",
      "webRoot": "${workspaceFolder}/eau-members/src",
      "sourceMaps": true,
      "runtimeArgs": ["--auto-open-devtools-for-tabs"]
    }
  ]
}
```

### Debug Utils
```typescript
// src/utils/debug.ts
export const debug = {
  log: (...args: any[]) => {
    if (import.meta.env.VITE_DEBUG === 'true') {
      console.log('[DEBUG]', ...args);
    }
  },
  
  table: (data: any) => {
    if (import.meta.env.VITE_DEBUG === 'true') {
      console.table(data);
    }
  },
  
  time: (label: string) => {
    if (import.meta.env.VITE_DEBUG === 'true') {
      console.time(label);
    }
  },
  
  timeEnd: (label: string) => {
    if (import.meta.env.VITE_DEBUG === 'true') {
      console.timeEnd(label);
    }
  }
};
```

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   powershell .\scripts\restart-server.ps1
   ```

2. **TypeScript errors**
   ```bash
   npm run typecheck
   ```

3. **Build fails**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

4. **Cache issues**
   ```bash
   npm run clean
   rm -rf .vite
   ```
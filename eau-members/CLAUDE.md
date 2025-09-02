# Project Memory

## Important Project Guidelines

### Language Convention
- **Communication**: All conversation with the user should be in Portuguese (PT-BR)
- **Code and Application**: All code, UI text, error messages, and application content must be in English

### Development Server Management
**CRITICAL: Port Management Rules**
- **ALWAYS use port 5180** - This is our standard development port
- **NEVER let Vite use alternative ports** (5181, 5182, etc.)
- **If port 5180 is in use, it means our server is already running**
- **Always kill ALL Node processes before starting the server**

**Correct Server Restart Sequence:**
1. `taskkill /F /IM node.exe` - Kill ALL Node processes
2. Wait 2 seconds for ports to be released
3. `cd eau-members && npm run dev` - Start on port 5180
4. If port is still in use, repeat step 1

**WRONG approach:**
- Letting Vite increment ports (5181, 5182, 5183...)
- This leaves multiple servers running and wastes resources

**RIGHT approach:**
- Always ensure port 5180 is free before starting
- One server, one port, always

### Cache Management and Version Control
**CRITICAL: Always ensure the user sees the latest version of the application**

#### Known Issue: Loading Screen Stuck
- **Problem**: Application gets stuck on loading screen due to stale localStorage/sessionStorage data
- **Cause**: Cached authentication tokens from previous sessions become invalid or corrupted
- **Solution**: Clear browser cache and localStorage

#### Implemented Solutions:
1. **Automatic Cache Clearing in Development**
   - App.tsx automatically clears expired sessions on startup
   - Error boundaries clear cache on critical errors
   
2. **Manual Cache Clearing**
   - **Keyboard Shortcut**: `Ctrl+Shift+R` - Clears all cache and reloads
   - **Utility Functions**: Available in `src/utils/clearCache.ts`
   - **Error Boundary**: Shows "Clear Cache and Reload" button on errors

3. **Vite Configuration**
   - Cache-busting headers configured in `vite.config.ts`
   - No-cache headers for development server
   - Hash-based filenames for production builds

#### Developer Instructions:
- **If loading screen is stuck**:
  1. Wait 3 seconds - auto-redirect to login will happen
  2. If ErrorBoundary appears, click "Clear All Data & Go to Login" 
  3. Manual option: `Ctrl+Shift+R` to clear cache
  4. Or open DevTools > Application > Clear Storage
  5. Or use incognito/private browsing mode for testing
  
- **When testing**: Always verify in both:
  - Regular browser window (to catch cache issues)
  - Incognito window (to verify clean state works)
  - Test page reloads (F5) to ensure auth recovery works

- **Auto-Recovery Features**:
  - 3-second timeout with auto-redirect to login
  - 10-second health check with user notification
  - Corrupted token detection and cleanup
  - Multiple recovery buttons in ErrorBoundary

- **Console Messages**: Development mode shows cache-clearing instructions in console

### Supabase Connection Details
**IMPORTANT: ALWAYS USE ONLINE SUPABASE - NEVER LOCAL**
- **Online URL**: https://english-australia-eau-supabase.lkobs5.easypanel.host
- **Anon Key**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE
- **Service Role Key**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q
- **JWT Secret**: your-super-secret-jwt-token-with-at-least-32-characters-long

### Supabase Studio Access
- **Studio URL**: https://english-australia-eau-supabase.lkobs5.easypanel.host/
- **Username**: supabase
- **Password**: this_password_is_insecure_and_should_be_updated

### Email System Configuration
**CRITICAL: SMTP is fully configured and functional**
- **Email server runs on port 3001** (email-server directory)
- **SMTP settings are configured** via `/admin/smtp-settings` page and stored in Supabase
- **Email server automatically fetches SMTP config** from database when `useStoredConfig: true`
- **ALL email features use the configured SMTP** - No more configuration errors
- **Templates are professional** with EAU branding and responsive design
- **Dashboard available** at http://localhost:3001 for monitoring sent emails

#### Email System Architecture:
1. **SMTP Configuration**: Stored in `smtp_settings` table in Supabase
2. **Email Server**: Automatically fetches config from database for every email
3. **EmailService**: Uses `useStoredConfig: true` to ensure database config is used
4. **No Local Config Required**: Server always uses latest database configuration
5. **Error Prevention**: Built-in fallbacks and clear error messages

#### Email Features Implemented:
1. **Event registration confirmation** - Automatic on signup
2. **Configurable reminders** - 7 days, 3 days, 1 day, 30 min, live notifications
3. **CPD points notification** - When points are awarded
4. **Admin interface** - Configure reminder timings at `/admin/event-reminders`
5. **Professional templates** - Branded HTML emails with variables
6. **Test functionality** - Send test emails for each reminder type
7. **Auto-scroll** - Form automatically scrolls when editing reminders

#### IMPORTANT: Email Development Rules
- **ALWAYS use `useStoredConfig: true`** in email API calls
- **NEVER hardcode SMTP credentials** in any script
- **Server automatically fetches** latest config from database
- **All email features work** without additional configuration

### Project Preferences
- No demo mode should be implemented - all features must use real Supabase connection
- Use SweetAlert2 for user notifications via showNotification function
- **Use configured SMTP server** for all email functionality
- Follow existing code patterns and conventions in the codebase


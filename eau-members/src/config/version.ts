// Version configuration
// Format: MAJOR.MINOR.PATCH-BUILD
// Update this file whenever making changes to the codebase

export const APP_VERSION = {
  major: 1,
  minor: 3,
  patch: 0,
  build: '20250904-0933', // Format: YYYYMMDD-HHMM
  environment: import.meta.env.MODE,
  
  // Get formatted version string
  get full(): string {
    return `${this.major}.${this.minor}.${this.patch}-${this.build}`
  },
  
  get simple(): string {
    return `v${this.major}.${this.minor}.${this.patch}`
  },
  
  get withEnv(): string {
    const env = this.environment === 'production' ? 'PROD' : 'DEV'
    return `${this.simple} (${env})`
  },
  
  // Last update info
  lastUpdate: '2025-09-04 09:33',
  changes: 'Added version system, fixed CPD certificates view/download'
}

// Log version on app start
if (typeof window !== 'undefined') {
  console.log(
    `%c🚀 EAU Members Portal %c${APP_VERSION.full} %c${APP_VERSION.environment}`,
    'color: #4F46E5; font-weight: bold; font-size: 14px;',
    'color: #10B981; font-weight: bold; font-size: 14px;',
    'color: #6B7280; font-size: 12px;'
  )
  console.log(`Last update: ${APP_VERSION.lastUpdate}`)
  console.log(`Changes: ${APP_VERSION.changes}`)
}
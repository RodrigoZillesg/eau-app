import React from 'react'

// VERSION: Update this with every change!
const APP_VERSION = '1.0.3-fix.rate.limit.2025.01.29-11:21'
const LAST_UPDATE = 'Fixed rate limit issue - prevent 429 errors with throttled session refresh'

export const VersionDisplay: React.FC = () => {
  const isDev = import.meta.env.DEV

  if (!isDev) return null

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg z-50 text-xs">
      <div className="font-mono">v{APP_VERSION}</div>
      <div className="text-gray-400 mt-1">{LAST_UPDATE}</div>
      <div className="text-yellow-400 mt-1">
        {new Date().toLocaleTimeString('pt-BR')}
      </div>
    </div>
  )
}

// Export version for console logging
export const logVersion = () => {
  console.log(`
╔════════════════════════════════════════════════════╗
║ EAU System Version: ${APP_VERSION}
║ Last Update: ${LAST_UPDATE}
║ Time: ${new Date().toLocaleString('pt-BR')}
╚════════════════════════════════════════════════════╝
  `)
}
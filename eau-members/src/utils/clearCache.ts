/**
 * Utility functions for clearing cache and storage
 */

export const clearAllCache = () => {
  // Clear localStorage
  const keysToKeep: string[] = [] // Add any keys you want to preserve
  const allKeys = Object.keys(localStorage)
  
  allKeys.forEach(key => {
    if (!keysToKeep.includes(key)) {
      localStorage.removeItem(key)
    }
  })
  
  // Clear sessionStorage
  sessionStorage.clear()
  
  // Clear all cookies for localhost
  document.cookie.split(";").forEach((c) => {
    document.cookie = c
      .replace(/^ +/, "")
      .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
  })
  
  console.log('Cache cleared successfully')
}

export const clearSupabaseCache = () => {
  // Clear only Supabase related items
  const supabaseKeys = Object.keys(localStorage).filter(key => 
    key.includes('supabase') || 
    key.includes('sb-') ||
    key.includes('auth')
  )
  
  supabaseKeys.forEach(key => {
    localStorage.removeItem(key)
  })
  
  console.log('Supabase cache cleared')
}

// Add keyboard shortcut for development
if (import.meta.env.DEV) {
  window.addEventListener('keydown', (e) => {
    // Ctrl+Shift+R to clear cache and reload
    if (e.ctrlKey && e.shiftKey && e.key === 'R') {
      e.preventDefault()
      clearAllCache()
      window.location.reload()
    }
  })
}
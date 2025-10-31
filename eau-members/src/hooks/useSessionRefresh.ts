import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase/client'
import { useAuthStore } from '../stores/authStore'
import { fetchUserRoles } from '../services/roleService'

// Global variable to track last refresh time to prevent rate limiting
let lastRefreshTime = 0
const MIN_REFRESH_INTERVAL = 60000 // Minimum 1 minute between refreshes

/**
 * Hook to manage automatic session refresh during long-running operations
 * Prevents "Access Denied" errors during imports that take more than 1 hour
 */
export const useSessionRefresh = (isActive: boolean = false, intervalMinutes: number = 30) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const hasInitialRefresh = useRef(false)
  const { user, setRoles, setRolesLoaded } = useAuthStore()

  useEffect(() => {
    if (!isActive || !user) {
      // Clear existing interval when not active
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
        hasInitialRefresh.current = false
        console.log('🔄 Session refresh stopped')
      }
      return
    }

    console.log(`🔄 Starting session refresh every ${intervalMinutes} minutes during operation`)

    // Only refresh immediately if we haven't done so recently
    if (!hasInitialRefresh.current) {
      const now = Date.now()
      if (now - lastRefreshTime >= MIN_REFRESH_INTERVAL) {
        refreshSession()
        hasInitialRefresh.current = true
      } else {
        console.log('⏳ Skipping immediate refresh - too soon since last refresh')
      }
    }

    // Set up periodic refresh
    intervalRef.current = setInterval(async () => {
      console.log('🔄 Performing scheduled session refresh...')
      await refreshSession()
    }, intervalMinutes * 60 * 1000) // Convert minutes to milliseconds

    // Cleanup on unmount or when becoming inactive
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
        console.log('🔄 Session refresh cleanup')
      }
    }
  }, [isActive, user, intervalMinutes])

  const refreshSession = async () => {
    try {
      // Check if we're not refreshing too frequently
      const now = Date.now()
      if (now - lastRefreshTime < MIN_REFRESH_INTERVAL) {
        console.log('⏳ Refresh throttled - too frequent requests')
        return true // Return true to prevent error handling
      }

      lastRefreshTime = now

      // Refresh the JWT token
      const { data, error } = await supabase.auth.refreshSession()

      if (error) {
        console.error('❌ Session refresh failed:', error.message)

        // If refresh fails, try to get the current session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
        if (sessionError || !sessionData.session) {
          console.error('❌ Session is invalid, user needs to re-authenticate')
          return false
        }
      } else if (data.session && user) {
        console.log('✅ Session refreshed successfully')

        // CRITICAL: Also refresh user roles to prevent "Access Denied"
        try {
          console.log('🔄 Refreshing user roles to prevent role degradation...')
          const roles = await fetchUserRoles(user.id)
          console.log('✅ Roles refreshed:', roles)

          // Update the store with fresh roles
          setRoles(roles)
          setRolesLoaded(true)

        } catch (roleError) {
          console.error('❌ Failed to refresh roles:', roleError)
          // Don't fail the entire refresh if roles fail
        }

        return true
      }
    } catch (error) {
      console.error('❌ Unexpected error during session refresh:', error)
    }

    return false
  }

  // Return manual refresh function for explicit calls
  return {
    refreshSession,
    isRefreshActive: isActive
  }
}
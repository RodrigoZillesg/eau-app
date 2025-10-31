import { useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'
import { fetchUserRoles } from '../services/roleService'

/**
 * Hook to monitor auth health and ensure proper role loading
 */
export const useAuthHealthCheck = () => {
  const { isLoading, user, roles } = useAuthStore()

  useEffect(() => {
    let healthCheckTimeout: NodeJS.Timeout

    // Only intervene if loading for more than 15 seconds
    if (isLoading) {
      healthCheckTimeout = setTimeout(async () => {
        console.error('Auth health check - extremely long loading time')

        const store = useAuthStore.getState()

        // If still loading and we have a user, try to fetch roles again
        if (store.isLoading && store.user) {
          console.warn('Attempting to re-fetch roles after timeout')

          try {
            const fetchedRoles = await fetchUserRoles(store.user.id)
            console.log('Re-fetched roles:', fetchedRoles)

            store.setRoles(fetchedRoles)
            store.setIsLoading(false)
            store.setRolesLoaded(true)
          } catch (error) {
            console.error('Failed to re-fetch roles:', error)
            // Force stop loading even if fetch fails
            store.setIsLoading(false)
            store.setRolesLoaded(true)
          }
        } else {
          // Force stop loading if no user
          store.setIsLoading(false)
          store.setRolesLoaded(true)
        }
      }, 15000) // 15 seconds max
    }

    return () => {
      if (healthCheckTimeout) {
        clearTimeout(healthCheckTimeout)
      }
    }
  }, [isLoading])

  // Monitor for role degradation
  useEffect(() => {
    if (user && roles.length > 0) {
      // Check if user email is a super admin but doesn't have AdminSuper role
      const userEmail = user.email
      if (userEmail === 'dev@platty.tech' && !roles.includes('AdminSuper' as any)) {
        console.error('🔴 ROLE DEGRADATION DETECTED! Super admin lost AdminSuper role')
        console.log('Current roles:', roles)
        console.log('User ID:', user.id)

        // Attempt to re-fetch correct roles
        fetchUserRoles(user.id).then(correctRoles => {
          console.log('Re-fetched correct roles:', correctRoles)
          if (correctRoles.includes('AdminSuper' as any)) {
            useAuthStore.getState().setRoles(correctRoles)
            console.log('✅ Roles corrected')
          }
        })
      }
    }
  }, [user, roles])
}
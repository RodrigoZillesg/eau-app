import { useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'

/**
 * Hook to monitor auth health - VERY conservative approach
 */
export const useAuthHealthCheck = () => {
  const { isLoading } = useAuthStore()

  useEffect(() => {
    let healthCheckTimeout: NodeJS.Timeout

    // Only intervene if loading for more than 30 seconds (extreme cases)
    if (isLoading) {
      healthCheckTimeout = setTimeout(() => {
        console.error('Auth health check - extremely long loading time')
        
        // Force stop loading if it's still going
        const store = useAuthStore.getState()
        if (store.isLoading) {
          console.warn('Force stopping loading after timeout')
          store.setIsLoading(false)
          store.setRolesLoaded(true)
        }
      }, 5000) // 5 seconds max
    }

    return () => {
      if (healthCheckTimeout) {
        clearTimeout(healthCheckTimeout)
      }
    }
  }, [isLoading])
}
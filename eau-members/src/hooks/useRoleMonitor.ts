import { useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'
import { fetchUserRoles } from '../services/roleService'

/**
 * Hook to monitor for role degradation and automatically recover roles
 * Prevents "Access Denied" errors by detecting when roles are lost and re-fetching them
 */
export const useRoleMonitor = () => {
  const { user, roles, setRoles, setRolesLoaded } = useAuthStore()

  useEffect(() => {
    if (!user || !user.email) return

    const monitorInterval = setInterval(async () => {
      // Check for specific role degradation patterns
      const isKnownAdmin = user.email === 'dev@platty.tech'
      const hasAdminRoles = roles.some(role => role.includes('Admin'))

      // If we know this should be an admin but roles are missing
      if (isKnownAdmin && !hasAdminRoles) {
        console.warn('🔴 ROLE DEGRADATION DETECTED! Admin user lost admin roles')
        console.log('Current roles:', roles)
        console.log('Expected: AdminSuper, Admin, Members')

        try {
          console.log('🔄 Attempting to recover roles...')
          const recoveredRoles = await fetchUserRoles(user.id)
          console.log('🔄 Recovered roles:', recoveredRoles)

          if (recoveredRoles.length > 0 && recoveredRoles.some(r => r.includes('Admin'))) {
            setRoles(recoveredRoles)
            setRolesLoaded(true)
            console.log('✅ Roles successfully recovered!')
          } else {
            console.warn('⚠️ Role recovery failed - no admin roles found in database')
          }
        } catch (error) {
          console.error('❌ Failed to recover roles:', error)
        }
      }

      // Also check if roles are completely empty when user is logged in
      if (roles.length === 0 && user) {
        console.warn('🔴 NO ROLES DETECTED for authenticated user')
        try {
          console.log('🔄 Re-fetching roles for user:', user.id)
          const fetchedRoles = await fetchUserRoles(user.id)
          if (fetchedRoles.length > 0) {
            setRoles(fetchedRoles)
            setRolesLoaded(true)
            console.log('✅ Empty roles recovered:', fetchedRoles)
          }
        } catch (error) {
          console.error('❌ Failed to fetch roles for empty role recovery:', error)
        }
      }
    }, 30000) // Check every 30 seconds

    console.log('🔍 Role monitor started - checking every 30 seconds')

    return () => {
      clearInterval(monitorInterval)
      console.log('🔍 Role monitor stopped')
    }
  }, [user, roles, setRoles, setRolesLoaded])
}
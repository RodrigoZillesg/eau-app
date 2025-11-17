import { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from './routes/AppRoutes'
import { useAuthStore } from './stores/authStore'
import { auth } from './lib/supabase/auth'
import { ErrorBoundary } from './components/ErrorBoundary'
import { fetchUserRoles } from './services/roleService'
import { fetchMemberData } from './services/memberDataService'
import { logVersion } from './components/VersionDisplay'

function App() {
  const { setUser, setIsLoading, setRoles, setMemberData } = useAuthStore()

  // REMOVED: useAuthHealthCheck and useRoleMonitor - they were causing timeouts
  // Once logged in, user keeps roles until logout - no re-checking needed

  useEffect(() => {
    // Log version on app start
    logVersion()

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await auth.getSession()

        if (session?.user) {
          setUser(session.user)

          // Fetch member data and roles in parallel
          try {
            const [roles, memberData] = await Promise.all([
              fetchUserRoles(session.user.id),
              fetchMemberData(session.user.id)
            ])

            console.log('✅ User roles from database:', roles)
            console.log('✅ Member data from database:', memberData)

            setRoles(roles)
            setMemberData(memberData)
            // Mark roles as loaded
            useAuthStore.getState().setRolesLoaded(true)
          } catch (error) {
            console.error('❌ Error fetching user data:', error)
            setRoles(['Members']) // Default fallback
            setMemberData(null)
            useAuthStore.getState().setRolesLoaded(true)
          }
        } else {
          setUser(null)
          setMemberData(null)
          setRoles([])
          useAuthStore.getState().setRolesLoaded(false)
        }
      } catch (error) {
        console.error('Auth error:', error)
        setUser(null)
        setMemberData(null)
        setRoles([])
        useAuthStore.getState().setRolesLoaded(false)
      } finally {
        // ALWAYS complete after roles are set
        setIsLoading(false)
      }
    }

    initializeAuth()

    // Initialize storage buckets (disabled for now due to permission issues)
    // StorageService.initializeBuckets()

    // Listen for auth changes - SIMPLIFIED to avoid unnecessary role fetching
    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
      // Only log significant events
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        console.log('🔄 Auth event:', event)
      }

      // Update user in store
      setUser(session?.user ?? null)

      // Only fetch roles and member data on actual sign in or initial load
      if (session?.user && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        console.log('🔄 Fetching user data for:', session.user.id)
        const [roles, memberData] = await Promise.all([
          fetchUserRoles(session.user.id),
          fetchMemberData(session.user.id)
        ])
        console.log('✅ Roles set:', roles)
        console.log('✅ Member data set:', memberData)
        setRoles(roles)
        setMemberData(memberData)
        useAuthStore.getState().setRolesLoaded(true)
      } else if (!session?.user) {
        // Only clear data if user is actually signed out
        setRoles([])
        setMemberData(null)
        useAuthStore.getState().setRolesLoaded(false)
      }
      // OTHERWISE: Keep existing roles (don't re-fetch on TOKEN_REFRESHED or focus events)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, []) // Remove dependencies to prevent re-runs

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
import { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from './routes/AppRoutes'
import { useAuthStore } from './stores/authStore'
import { auth } from './lib/supabase/auth'
import { ErrorBoundary } from './components/ErrorBoundary'
import { useAuthHealthCheck } from './hooks/useAuthHealthCheck'

function App() {
  const { setUser, setIsLoading, setRoles } = useAuthStore()
  
  // Monitor auth health and auto-recover
  useAuthHealthCheck()

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await auth.getSession()
        
        if (session?.user) {
          setUser(session.user)
          
          // Admin gets immediate roles
          if (session.user.email === 'rrzillesg@gmail.com') {
            setRoles(['AdminSuper', 'Admin', 'Members'])
          } else {
            // Everyone else gets default immediately
            setRoles(['Members'])
          }
        } else {
          setUser(null)
          setRoles([])
        }
      } catch (error) {
        console.error('Auth error:', error)
        setUser(null)
        setRoles([])
      } finally {
        // ALWAYS complete quickly
        setIsLoading(false)
      }
    }

    initializeAuth()
    
    // Initialize storage buckets (disabled for now due to permission issues)
    // StorageService.initializeBuckets()

    // Listen for auth changes
    const { data: { subscription } } = auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        // Admin gets immediate roles
        if (session.user.email === 'rrzillesg@gmail.com') {
          setRoles(['AdminSuper', 'Admin', 'Members'])
        } else {
          // Everyone else gets default immediately
          setRoles(['Members'])
        }
      } else {
        setRoles([])
      }
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
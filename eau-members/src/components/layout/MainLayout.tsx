import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/Button'
import { useAuthStore } from '../../stores/authStore'
import { supabase } from '../../lib/supabase/client'
import { PermissionGuard } from '../shared/PermissionGuard'
import { User } from 'lucide-react'

interface MainLayoutProps {
  children: React.ReactNode
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const navigate = useNavigate()
  const { user, roles, reset } = useAuthStore()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await supabase.auth.signOut()
      reset()
      navigate('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Brand */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center focus:outline-none"
              >
                <img 
                  src="/logo-500.png" 
                  alt="English Australia" 
                  className="h-12 w-auto"
                />
              </button>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-6">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
              >
                Dashboard
              </button>

              <PermissionGuard permission="CREATE_CPD">
                <button
                  onClick={() => navigate('/cpd')}
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                >
                  My CPDs
                </button>
              </PermissionGuard>

              <PermissionGuard permission="REGISTER_EVENT">
                <button
                  onClick={() => navigate('/events')}
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                >
                  Events
                </button>
              </PermissionGuard>
              
              <PermissionGuard permission="REGISTER_EVENT">
                <button
                  onClick={() => navigate('/my-registrations')}
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                >
                  My Registrations
                </button>
              </PermissionGuard>

              <PermissionGuard permission="ACCESS_ADMIN_DASHBOARD">
                <button
                  onClick={() => navigate('/admin')}
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                >
                  Admin
                </button>
              </PermissionGuard>

              <PermissionGuard permission="ACCESS_ADMIN_DASHBOARD">
                <button
                  onClick={() => navigate('/admin/membership')}
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                >
                  Membership
                </button>
              </PermissionGuard>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <div className="hidden md:block text-sm text-gray-700">
                <p className="font-medium">{user?.user_metadata?.full_name || user?.email}</p>
                <p className="text-xs text-gray-500">{roles.join(', ') || 'No roles'}</p>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/profile')}
                className="flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                Perfil
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? 'Signing out...' : 'Sign out'}
              </Button>
            </div>
          </div>
        </div>

      </nav>

      {/* Main Content */}
      <main>
        {children}
      </main>
    </div>
  )
}
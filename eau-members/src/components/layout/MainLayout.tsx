import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/Button'
import { useAuthStore } from '../../stores/authStore'
import { supabase } from '../../lib/supabase/client'
import { PermissionGuard } from '../shared/PermissionGuard'
import { 
  User, 
  GraduationCap, 
  Menu, 
  X, 
  Home, 
  BookOpen, 
  Calendar, 
  Users, 
  Settings, 
  LogOut,
  Shield,
  Building2
} from 'lucide-react'
import { RoleSwitcher } from '../dev/RoleSwitcher'
import { APP_VERSION } from '../../config/version'
import { ImpersonationBanner } from '../shared/ImpersonationBanner'
import { impersonationService } from '../../services/impersonationService'

interface MainLayoutProps {
  children: React.ReactNode
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const navigate = useNavigate()
  const { user, roles, reset, getEffectiveRoles, simulatedRole } = useAuthStore()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  // Get effective roles (considering simulation)
  const effectiveRoles = getEffectiveRoles()

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

  // Check if impersonating to adjust layout
  const isImpersonating = impersonationService.isImpersonating()
  const impersonationInfo = impersonationService.getDisplayInfo()
  
  // Get display user and roles (considering impersonation)
  const displayUser = isImpersonating 
    ? { email: impersonationInfo.targetEmail }
    : user
  const displayRoles = getEffectiveRoles()
  
  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  // Close mobile menu when navigating
  const handleNavigateAndClose = (path: string) => {
    navigate(path)
    setIsMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Impersonation Banner */}
      <ImpersonationBanner />
      
      {/* Top Navigation */}
      <nav className={`bg-white shadow-sm border-b sticky z-50 ${isImpersonating ? 'top-16' : 'top-0'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Brand */}
            <div className="flex items-center">
              <button
                onClick={() => handleNavigateAndClose('/dashboard')}
                className="flex items-center focus:outline-none"
              >
                <img 
                  src="/logo-500.png" 
                  alt="English Australia" 
                  className="h-12 w-auto"
                />
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center space-x-4">
              {/* User Info */}
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span>{displayUser?.email}</span>
              </div>
              
              {/* Hamburger Menu Button */}
              <button
                onClick={toggleMobileMenu}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile/Desktop Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className={`absolute left-0 right-0 bg-white shadow-lg border-b z-40 animate-in slide-in-from-top duration-200 ${isImpersonating ? 'top-16' : 'top-16'}`}>
            <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
              
              {/* Main Navigation */}
              <div className="border-b pb-4 mb-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Navigation
                </h3>
                
                <button
                  onClick={() => handleNavigateAndClose('/dashboard')}
                  className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <Home className="h-4 w-4 mr-3 text-blue-500" />
                  Dashboard
                </button>

                <PermissionGuard permission="CREATE_CPD">
                  <button
                    onClick={() => handleNavigateAndClose('/cpd')}
                    className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <BookOpen className="h-4 w-4 mr-3 text-green-500" />
                    My CPDs
                  </button>
                </PermissionGuard>

                <PermissionGuard permission="REGISTER_EVENT">
                  <button
                    onClick={() => handleNavigateAndClose('/events')}
                    className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <Calendar className="h-4 w-4 mr-3 text-purple-500" />
                    Events
                  </button>
                </PermissionGuard>

                <PermissionGuard permission="REGISTER_EVENT">
                  <button
                    onClick={() => handleNavigateAndClose('/my-registrations')}
                    className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <Calendar className="h-4 w-4 mr-3 text-orange-500" />
                    My Registrations
                  </button>
                </PermissionGuard>
              </div>

              {/* External Integration */}
              <div className="border-b pb-4 mb-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Learning Platform
                </h3>
                
                <button
                  onClick={() => {
                    import('../../services/openlearningService').then(({ openLearningService }) => {
                      openLearningService.launchSSO(undefined, true).catch(console.error);
                    });
                  }}
                  className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <GraduationCap className="h-4 w-4 mr-3 text-indigo-500" />
                  OpenLearning
                </button>
              </div>

              {/* Admin Section */}
              <PermissionGuard permission="ACCESS_ADMIN_DASHBOARD">
                <div className="border-b pb-4 mb-4">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Administration
                  </h3>
                  
                  <button
                    onClick={() => handleNavigateAndClose('/admin')}
                    className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <Shield className="h-4 w-4 mr-3 text-red-500" />
                    Admin Dashboard
                  </button>

                  <button
                    onClick={() => handleNavigateAndClose('/admin/members')}
                    className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <Users className="h-4 w-4 mr-3 text-blue-500" />
                    Members
                  </button>

                  <button
                    onClick={() => handleNavigateAndClose('/admin/membership')}
                    className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <Settings className="h-4 w-4 mr-3 text-gray-500" />
                    Membership
                  </button>

                  <button
                    onClick={() => handleNavigateAndClose('/admin/institutions')}
                    className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <Building2 className="h-4 w-4 mr-3 text-purple-500" />
                    Institutions
                  </button>

                  <button
                    onClick={() => handleNavigateAndClose('/admin/openlearning')}
                    className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <GraduationCap className="h-4 w-4 mr-3 text-indigo-500" />
                    OpenLearning Integration
                  </button>
                </div>
              </PermissionGuard>

              {/* User Actions */}
              <div className="pt-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Account
                </h3>
                
                <button
                  onClick={() => handleNavigateAndClose('/profile')}
                  className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <User className="h-4 w-4 mr-3 text-gray-500" />
                  Profile
                </button>

                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </button>
              </div>

              {/* Mobile User Info */}
              <div className="sm:hidden pt-4 mt-4 border-t">
                <div className="flex items-center space-x-2 text-sm text-gray-600 px-3">
                  <User className="h-4 w-4" />
                  <span>{displayUser?.email}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
            <div className="text-sm text-gray-500">
              © {new Date().getFullYear()} English Australia. All rights reserved.
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-xs text-gray-400">{APP_VERSION.simple}</span>
              
              {/* Development Role Switcher - Hidden during impersonation */}
              {process.env.NODE_ENV === 'development' && !impersonationService.isImpersonating() && (
                <RoleSwitcher />
              )}
              
              {simulatedRole && !impersonationService.isImpersonating() && (
                <div className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                  Simulating: {simulatedRole}
                </div>
              )}
            </div>
          </div>
        </div>
      </footer>

      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  )
}
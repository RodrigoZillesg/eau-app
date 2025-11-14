import React, { useState, useEffect } from 'react'
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
  Building2,
  FileText,
  UserCheck,
  Link2,
  Award
} from 'lucide-react'
import { APP_VERSION } from '../../config/version'
import { ImpersonationBanner } from '../shared/ImpersonationBanner'
import { impersonationService } from '../../services/impersonationService'
import { ApplicationNotificationBadge, ApplicationNotificationDropdown } from '../notifications/ApplicationNotificationBadge'
import { showNotification } from '../../lib/notifications'

interface MainLayoutProps {
  children: React.ReactNode
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const navigate = useNavigate()
  const { user, roles, reset, getEffectiveRoles } = useAuthStore()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false)
  const [isOpenLearningLoading, setIsOpenLearningLoading] = useState(false)
  const [canInstitutionsCreateEvents, setCanInstitutionsCreateEvents] = useState<boolean | null>(null) // null = loading, true/false = loaded

  // Get effective roles (considering simulation)
  const effectiveRoles = getEffectiveRoles()

  // Load event management settings
  useEffect(() => {
    const loadEventSettings = async () => {
      try {
        const { data: settingsRow, error } = await supabase
          .from('system_settings')
          .select('setting_value')
          .eq('setting_key', 'event_management')
          .single()

        console.log('🔍 Settings query result:', { settingsRow, error })

        const eventSettings = settingsRow?.setting_value as any
        const canCreate = eventSettings?.institutions_can_create_events ?? true
        console.log('🔧 Event settings loaded:', { canCreate, eventSettings, roles })
        setCanInstitutionsCreateEvents(canCreate)
      } catch (error) {
        console.error('Error loading event settings:', error)
        // Default to true if error
        setCanInstitutionsCreateEvents(true)
      }
    }

    loadEventSettings()
  }, [roles])

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

  const handleOpenLearningAccess = async () => {
    if (!user?.id) {
      showNotification('error', 'Please log in to access OpenLearning')
      return
    }

    setIsOpenLearningLoading(true)
    setIsMobileMenuOpen(false) // Close menu when clicking

    try {
      // Get auth token for backend API
      const { data: session } = await supabase.auth.getSession()
      if (!session?.session?.access_token) {
        showNotification('error', 'Authentication required')
        return
      }

      // Get member ID from user ID
      const { data: member } = await supabase
        .from('members')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!member) {
        throw new Error('Member profile not found')
      }

      // Generate SSO link from backend
      const ssoResponse = await fetch('http://localhost:3001/api/v1/openlearning/sso/launch', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          memberId: member.id
        })
      })

      if (!ssoResponse.ok) {
        const error = await ssoResponse.json()
        throw new Error(error.error || 'Failed to generate SSO link')
      }

      const result = await ssoResponse.json()

      if (result.success && result.launchData) {
        const launchData = result.launchData

        // Create a form and submit it (LTI requires POST)
        const form = document.createElement('form')
        form.method = launchData.method || 'POST'
        form.action = launchData.url
        form.target = '_blank'

        // Add all LTI/OAuth parameters as hidden fields
        if (launchData.params) {
          Object.entries(launchData.params).forEach(([key, value]) => {
            const input = document.createElement('input')
            input.type = 'hidden'
            input.name = key
            input.value = String(value)
            form.appendChild(input)
          })
        }

        // Append form to body and submit
        document.body.appendChild(form)
        form.submit()

        // Clean up
        setTimeout(() => {
          document.body.removeChild(form)
        }, 100)

        showNotification('success', 'Opening OpenLearning...')
      } else {
        throw new Error(result.error || 'No SSO data received')
      }

    } catch (error: any) {
      console.error('Error accessing OpenLearning:', error)
      showNotification('error', error.message || 'Failed to access OpenLearning')
    } finally {
      setIsOpenLearningLoading(false)
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
              
              {/* Notification Bell - Only for admins */}
              <PermissionGuard permission="ACCESS_ADMIN_DASHBOARD">
                <div className="relative">
                  <ApplicationNotificationBadge 
                    onClick={() => setIsNotificationDropdownOpen(!isNotificationDropdownOpen)}
                  />
                  <ApplicationNotificationDropdown
                    isOpen={isNotificationDropdownOpen}
                    onClose={() => setIsNotificationDropdownOpen(false)}
                    onViewApplications={() => {
                      navigate('/admin/membership-applications');
                      setIsNotificationDropdownOpen(false);
                    }}
                  />
                </div>
              </PermissionGuard>
              
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

                {/* My CPDs - Only for Members and Institution Admins (not technical admins) */}
                {(roles.includes('Members') || roles.includes('InstitutionAdmin')) &&
                 !roles.includes('AdminSuper') && !roles.includes('Admin') && (
                  <PermissionGuard permission="CREATE_CPD">
                    <button
                      onClick={() => handleNavigateAndClose('/cpd')}
                      className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      <BookOpen className="h-4 w-4 mr-3 text-green-500" />
                      My CPDs
                    </button>
                  </PermissionGuard>
                )}

                <PermissionGuard permission="REGISTER_EVENT">
                  <button
                    onClick={() => handleNavigateAndClose('/events')}
                    className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <Calendar className="h-4 w-4 mr-3 text-purple-500" />
                    Events
                  </button>
                </PermissionGuard>

                {/* My Registrations - Only for Members and Institution Admins (not technical admins) */}
                {(roles.includes('Members') || roles.includes('InstitutionAdmin')) &&
                 !roles.includes('AdminSuper') && !roles.includes('Admin') && (
                  <PermissionGuard permission="REGISTER_EVENT">
                    <button
                      onClick={() => handleNavigateAndClose('/my-registrations')}
                      className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      <Calendar className="h-4 w-4 mr-3 text-orange-500" />
                      My Registrations
                    </button>
                  </PermissionGuard>
                )}

                {/* Institution Linking - Only for Members (not admins) */}
                {roles.includes('Members') && !roles.includes('Admin') &&
                 !roles.includes('AdminSuper') && !roles.includes('InstitutionAdmin') && (
                  <button
                    onClick={() => handleNavigateAndClose('/institutions/link')}
                    className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <Building2 className="h-4 w-4 mr-3 text-teal-500" />
                    Institution Linking
                  </button>
                )}
              </div>

              {/* External Integration - Only for Members and Institution Admins (not technical admins) */}
              {(roles.includes('Members') || roles.includes('InstitutionAdmin')) &&
               !roles.includes('AdminSuper') && !roles.includes('Admin') && (
                <div className="border-b pb-4 mb-4">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Learning Platform
                  </h3>

                  <button
                    onClick={handleOpenLearningAccess}
                    disabled={isOpenLearningLoading}
                    className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
                  >
                    {isOpenLearningLoading ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-gray-700 border-t-transparent rounded-full mr-3"></div>
                        Connecting...
                      </>
                    ) : (
                      <>
                        <GraduationCap className="h-4 w-4 mr-3 text-indigo-500" />
                        Access OpenLearning
                      </>
                    )}
                  </button>
                </div>
              )}

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

                  {/* Manage Events - Show to SuperAdmin/Admin always, Institution Admin only if setting enabled */}
                  {canInstitutionsCreateEvents !== null && (
                    (roles.includes('AdminSuper') || roles.includes('Admin') ||
                      (roles.includes('InstitutionAdmin') && canInstitutionsCreateEvents === true)) && (
                      <button
                        onClick={() => handleNavigateAndClose('/admin/events')}
                        className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                      >
                        <Calendar className="h-4 w-4 mr-3 text-purple-500" />
                        Manage Events
                      </button>
                    )
                  )}

                  <button
                    onClick={() => handleNavigateAndClose('/admin/members')}
                    className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <Users className="h-4 w-4 mr-3 text-blue-500" />
                    Members
                  </button>

                  {/* Membership - Only Super Admin and Admin (not Institution Admin) */}
                  {(roles.includes('AdminSuper') || roles.includes('Admin')) && (
                    <button
                      onClick={() => handleNavigateAndClose('/admin/membership')}
                      className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      <Settings className="h-4 w-4 mr-3 text-gray-500" />
                      Membership
                    </button>
                  )}

                  <button
                    onClick={() => handleNavigateAndClose('/admin/institution-links')}
                    className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <Link2 className="h-4 w-4 mr-3 text-teal-500" />
                    Institution Link Requests
                  </button>

                  {/* Only for Super Admin - Institution Management */}
                  {roles.includes('AdminSuper') && (
                    <button
                      onClick={() => handleNavigateAndClose('/admin/institutions')}
                      className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      <Building2 className="h-4 w-4 mr-3 text-purple-500" />
                      Institutions
                    </button>
                  )}

                  {/* Only for Super Admin - Membership Applications */}
                  {roles.includes('AdminSuper') && (
                    <button
                      onClick={() => handleNavigateAndClose('/admin/membership-applications')}
                      className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      <FileText className="h-4 w-4 mr-3 text-orange-500" />
                      Membership Applications
                    </button>
                  )}

                  {/* Only for Super Admin and Admin - OpenLearning Courses Management */}
                  {(roles.includes('AdminSuper') || roles.includes('Admin')) && (
                    <button
                      onClick={() => handleNavigateAndClose('/admin/openlearning/courses')}
                      className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      <GraduationCap className="h-4 w-4 mr-3 text-green-500" />
                      OpenLearning Courses
                    </button>
                  )}

                  {/* Only for Super Admin - CPD Categories Management */}
                  {roles.includes('AdminSuper') && (
                    <button
                      onClick={() => handleNavigateAndClose('/admin/cpd-categories')}
                      className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      <Settings className="h-4 w-4 mr-3 text-yellow-500" />
                      CPD Categories
                    </button>
                  )}

                  {/* Only for Admin and Super Admin - Event Certificates Batch */}
                  {(roles.includes('Admin') || roles.includes('AdminSuper')) && (
                    <button
                      onClick={() => handleNavigateAndClose('/admin/certificates')}
                      className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      <Award className="h-4 w-4 mr-3 text-blue-500" />
                      Event Certificates
                    </button>
                  )}

                  {/* Only for Super Admin */}
                  {roles.includes('AdminSuper') && (
                    <>
                      <div className="mx-3 my-2 border-t border-gray-200"></div>
                      <button
                        onClick={() => handleNavigateAndClose('/admin/member-impersonation')}
                        className="flex items-center w-full px-3 py-2 text-sm text-purple-700 hover:bg-purple-50 rounded-md transition-colors"
                      >
                        <UserCheck className="h-4 w-4 mr-3 text-purple-500" />
                        Member Impersonation
                        <span className="ml-auto text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">Dev</span>
                      </button>
                    </>
                  )}
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
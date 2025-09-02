import React from 'react'
import { Navigate } from 'react-router-dom'
import { usePermissions } from '../../hooks/usePermissions'
import { useAuthStore } from '../../stores/authStore'
import type { UserRole, Permission } from '../../types/permissions'

interface RoleBasedRouteProps {
  children: React.ReactNode
  permission?: Permission
  roles?: UserRole[]
  requireAll?: boolean
  redirectTo?: string
}

export const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({
  children,
  permission,
  roles,
  requireAll = false,
  redirectTo = '/unauthorized',
}) => {
  const { hasPermission, hasAnyRole, hasAllRoles } = usePermissions()
  const { rolesLoaded, isLoading } = useAuthStore()

  // If still loading or roles not loaded, show loading
  if (isLoading || !rolesLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying permissions...</p>
        </div>
      </div>
    )
  }

  const hasAccess = (() => {
    if (permission) {
      return hasPermission(permission)
    }
    
    if (roles) {
      return requireAll ? hasAllRoles(roles) : hasAnyRole(roles)
    }
    
    return true
  })()

  if (!hasAccess) {
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}
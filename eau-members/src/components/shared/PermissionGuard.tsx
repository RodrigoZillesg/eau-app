import React from 'react'
import { usePermissions } from '../../hooks/usePermissions'
import type { UserRole, Permission } from '../../types/permissions'

interface PermissionGuardProps {
  children: React.ReactNode
  permission?: Permission
  roles?: UserRole[]
  requireAll?: boolean
  fallback?: React.ReactNode
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  permission,
  roles,
  requireAll = false,
  fallback = null,
}) => {
  const { hasPermission, hasAnyRole, hasAllRoles } = usePermissions()

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
    return <>{fallback}</>
  }

  return <>{children}</>
}
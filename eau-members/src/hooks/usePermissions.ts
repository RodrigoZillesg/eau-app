import { useAuthStore } from '../stores/authStore'
import type { UserRole, Permission } from '../types/permissions'
import { PERMISSIONS } from '../types/permissions'

export function usePermissions() {
  const { roles, hasRole } = useAuthStore()

  const hasPermission = (permission: Permission): boolean => {
    const allowedRoles = PERMISSIONS[permission]
    const hasAccess = allowedRoles.some(role => hasRole(role as UserRole))
    
    console.log('Verificando permissão:', permission)
    console.log('Roles necessárias:', allowedRoles)
    console.log('Roles do usuário:', roles)
    console.log('Tem acesso:', hasAccess)
    
    return hasAccess
  }

  const hasAnyRole = (requiredRoles: UserRole[]): boolean => {
    return requiredRoles.some(role => hasRole(role))
  }

  const hasAllRoles = (requiredRoles: UserRole[]): boolean => {
    return requiredRoles.every(role => hasRole(role))
  }

  const isAdmin = (): boolean => {
    return hasRole('Admin') || hasRole('AdminSuper')
  }

  const isSuper = (): boolean => {
    return hasRole('AdminSuper')
  }

  const isMember = (): boolean => {
    return hasRole('Members') || hasRole('MemberColleges')
  }

  return {
    roles,
    hasPermission,
    hasAnyRole,
    hasAllRoles,
    isAdmin,
    isSuper,
    isMember,
  }
}
import { useAuthStore } from '../stores/authStore'
import type { UserRole, Permission } from '../types/permissions'
import { PERMISSIONS } from '../types/permissions'
import { useEffect, useRef } from 'react'

// Persistent role cache to prevent loss on window focus
const ROLE_CACHE_KEY = 'eau_cached_roles'

export function usePermissions() {
  const { roles, hasRole, user } = useAuthStore()
  const cachedRolesRef = useRef<UserRole[]>([])

  // Cache roles whenever they change (but only valid roles)
  useEffect(() => {
    if (roles && roles.length > 0 && user) {
      cachedRolesRef.current = roles
      // Also persist to sessionStorage as backup
      sessionStorage.setItem(ROLE_CACHE_KEY, JSON.stringify({
        userId: user.id,
        roles: roles,
        timestamp: Date.now()
      }))
      console.log('📦 Roles cached:', roles)
    }
  }, [roles, user])

  // Get effective roles with fallback to cache
  const getEffectiveRoles = (): UserRole[] => {
    // If we have valid roles in store, use them
    if (roles && roles.length > 0) {
      return roles
    }

    // Try memory cache first
    if (cachedRolesRef.current.length > 0) {
      console.log('🔄 Using cached roles from memory:', cachedRolesRef.current)
      return cachedRolesRef.current
    }

    // Try sessionStorage as last resort
    try {
      const cached = sessionStorage.getItem(ROLE_CACHE_KEY)
      if (cached && user) {
        const parsedCache = JSON.parse(cached)
        if (parsedCache.userId === user.id && parsedCache.roles?.length > 0) {
          // NO EXPIRATION - roles persist until logout
          console.log('🔄 Using cached roles from sessionStorage:', parsedCache.roles)
          cachedRolesRef.current = parsedCache.roles
          return parsedCache.roles
        }
      }
    } catch (e) {
      console.error('Failed to read role cache:', e)
    }

    return roles || []
  }

  const hasPermission = (permission: Permission): boolean => {
    const allowedRoles = PERMISSIONS[permission]
    const effectiveRoles = getEffectiveRoles()
    const hasAccess = allowedRoles.some(role =>
      effectiveRoles.includes(role as UserRole) || hasRole(role as UserRole)
    )

    console.log('Verificando permissão:', permission)
    console.log('Roles necessárias:', allowedRoles)
    console.log('Roles efetivas:', effectiveRoles)
    console.log('Tem acesso:', hasAccess)

    return hasAccess
  }

  const hasAnyRole = (requiredRoles: UserRole[]): boolean => {
    const effectiveRoles = getEffectiveRoles()
    const result = requiredRoles.some(role =>
      effectiveRoles.includes(role) || hasRole(role)
    )
    console.log('✅ hasAnyRole check:', {
      requiredRoles,
      effectiveRoles,
      result
    })
    return result
  }

  const hasAllRoles = (requiredRoles: UserRole[]): boolean => {
    const effectiveRoles = getEffectiveRoles()
    return requiredRoles.every(role =>
      effectiveRoles.includes(role) || hasRole(role)
    )
  }

  const isAdmin = (): boolean => {
    const effectiveRoles = getEffectiveRoles()
    return effectiveRoles.includes('Admin') || effectiveRoles.includes('AdminSuper') ||
           hasRole('Admin') || hasRole('AdminSuper')
  }

  const isInstitutionAdmin = (): boolean => {
    const effectiveRoles = getEffectiveRoles()
    return effectiveRoles.includes('InstitutionAdmin') || hasRole('InstitutionAdmin')
  }

  const isSuper = (): boolean => {
    const effectiveRoles = getEffectiveRoles()
    return effectiveRoles.includes('AdminSuper') || hasRole('AdminSuper')
  }

  const isMember = (): boolean => {
    const effectiveRoles = getEffectiveRoles()
    return effectiveRoles.includes('Members') || effectiveRoles.includes('MemberColleges') ||
           hasRole('Members') || hasRole('MemberColleges')
  }

  return {
    roles: getEffectiveRoles(), // Return effective roles instead of raw roles
    hasPermission,
    hasAnyRole,
    hasAllRoles,
    isAdmin,
    isInstitutionAdmin,
    isSuper,
    isMember,
  }
}
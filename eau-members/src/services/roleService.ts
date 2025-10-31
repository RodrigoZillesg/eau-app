import { supabase } from '../lib/supabase/client'
import type { UserRole } from '../types/permissions'

// Cache key for localStorage
const ROLES_CACHE_KEY = 'eau_user_roles_cache'

// Critical emails that should ALWAYS be super admin
const SUPER_ADMIN_EMAILS = ['dev@platty.tech', 'super.admin@test.com']

/**
 * Maps database user_type values to application UserRole types
 * Hierarchy: SuperAdmin > Admin > InstitutionAdmin > BoardMembers > Affiliates > Members
 *
 * Based on Member Groups from CSV import:
 * 1. SuperAdmin (Developer) - Hardcoded for dev@platty.tech
 * 2. Admin - Users with "admin" in Member Groups (System administrators)
 * 3. InstitutionAdmin - Primary Contacts of institutions
 * 4. BoardMembers - Users with "Board Members" in Member Groups
 * 5. Affiliates - Users with "Affiliates" or "Consultants & Agents" in Member Groups
 * 6. Members - All other users
 */
const roleMapping: Record<string, UserRole> = {
  // Database user_type values -> App roles
  'super_admin': 'AdminSuper',           // Developer - full access (hardcoded)
  'admin': 'Admin',                      // System administrators - from Member Groups
  'institution_admin': 'InstitutionAdmin', // Primary Contacts of institutions
  'board_member': 'BoardMembers',        // Board members - from Member Groups
  'affiliate': 'Affiliates',             // Affiliates/Consultants - from Member Groups
  'staff': 'Members',                    // Legacy - treat as regular member
  'member': 'Members',                   // Regular members

  // Legacy mappings for backward compatibility
  'Institution Admin': 'InstitutionAdmin',
}

/**
 * Helper function to get cached roles
 */
function getCachedRoles(userId: string): UserRole[] | null {
  try {
    const cached = localStorage.getItem(`${ROLES_CACHE_KEY}_${userId}`)
    if (cached) {
      const { roles, timestamp } = JSON.parse(cached)
      // Cache valid for 5 minutes
      if (Date.now() - timestamp < 5 * 60 * 1000) {
        console.log('📦 Using cached roles:', roles)
        return roles
      }
    }
  } catch (e) {
    console.error('Error reading cache:', e)
  }
  return null
}

/**
 * Helper function to save roles to cache
 */
function cacheRoles(userId: string, roles: UserRole[]) {
  try {
    localStorage.setItem(
      `${ROLES_CACHE_KEY}_${userId}`,
      JSON.stringify({
        roles,
        timestamp: Date.now()
      })
    )
    console.log('💾 Roles cached:', roles)
  } catch (e) {
    console.error('Error caching roles:', e)
  }
}

/**
 * Query with timeout helper
 */
async function queryWithTimeout<T>(promise: Promise<T>, timeoutMs: number = 3000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Query timeout')), timeoutMs)
    )
  ])
}

/**
 * Fetches user roles from the database based on their member ID
 */
export async function fetchUserRoles(userId: string): Promise<UserRole[]> {
  console.log('🔍 START fetchUserRoles for userId:', userId)

  // Check memory cache first
  const cachedRoles = getCachedRoles(userId)
  if (cachedRoles && cachedRoles.length > 0) {
    console.log('✅ Using memory cached roles immediately:', cachedRoles)
    return cachedRoles
  }

  // Check sessionStorage cache as backup
  try {
    const sessionCache = sessionStorage.getItem('eau_cached_roles')
    if (sessionCache) {
      const parsed = JSON.parse(sessionCache)
      if (parsed.userId === userId && parsed.roles?.length > 0) {
        console.log('✅ Using sessionStorage cached roles immediately:', parsed.roles)
        // Also update memory cache
        cacheRoles(userId, parsed.roles)
        return parsed.roles
      }
    }
  } catch (e) {
    // Ignore sessionStorage errors
  }

  try {
    // First get the member ID and user_type from the user ID with timeout
    const memberQuery = supabase
      .from('members')
      .select('id, email, user_type')
      .eq('user_id', userId)
      .single()

    const { data: member, error: memberError } = await queryWithTimeout(memberQuery, 10000) // Increased to 10 seconds

    console.log('🔍 Member found:', member)
    console.log('🔍 Member error:', memberError)

    if (!member) {
      console.log('⚠️ No member record found for user:', userId)
      // If no member record, return basic Members role
      return ['Members']
    }

    // CRITICAL FALLBACK: Hardcoded super admins ALWAYS get full permissions
    if (SUPER_ADMIN_EMAILS.includes(member.email)) {
      console.log('🔴 CRITICAL: Hardcoded super admin detected:', member.email);
      const roles: UserRole[] = ['AdminSuper', 'Admin', 'Members'];
      cacheRoles(userId, roles);
      return roles;
    }

    // FALLBACK: If user_type is super_admin, return super admin roles immediately
    if (member.user_type === 'super_admin') {
      console.log('🎯 FALLBACK: Using user_type=super_admin, returning AdminSuper roles');
      const roles: UserRole[] = ['AdminSuper', 'Admin', 'Members'];
      cacheRoles(userId, roles);
      return roles;
    }

    // Get all roles for this member with timeout
    const rolesQuery = supabase
      .from('member_roles')
      .select('role')
      .eq('member_id', member.id)

    const { data: memberRoles, error } = await queryWithTimeout(rolesQuery, 3000)

    console.log('🔍 Member roles from DB:', memberRoles)
    console.log('🔍 Member roles error:', error)

    if (error) {
      console.error('Error fetching member roles:', error)

      // FALLBACK FORTALECIDO: SEMPRE usar user_type se member_roles falhar
      console.log('🎯 FALLBACK FORTALECIDO: member_roles error, using user_type:', member.user_type);
      const fallbackRole = roleMapping[member.user_type] || 'Members';
      const roles: UserRole[] = Array.isArray(fallbackRole) ? fallbackRole : [fallbackRole];

      // Para super_admin, garantir roles completas
      if (member.user_type === 'super_admin') {
        const superRoles: UserRole[] = ['AdminSuper', 'Admin', 'Members'];
        cacheRoles(userId, superRoles);
        return superRoles;
      }

      // Ensure admin users also have Members role
      if (roles.includes('AdminSuper') || roles.includes('Admin')) {
        if (!roles.includes('Members')) {
          roles.push('Members');
        }
      }

      cacheRoles(userId, roles);
      return roles;
    }

    if (!memberRoles || memberRoles.length === 0) {
      // FALLBACK: If no roles in table, use user_type
      console.log('🎯 FALLBACK: No roles in member_roles, using user_type:', member.user_type);
      const fallbackRole = roleMapping[member.user_type] || 'Members';
      const roles: UserRole[] = Array.isArray(fallbackRole) ? fallbackRole : [fallbackRole];

      // Ensure admin users also have Members role
      if (roles.includes('AdminSuper') || roles.includes('Admin')) {
        if (!roles.includes('Members')) {
          roles.push('Members');
        }
      }

      return roles;
    }

    // Map database roles to app roles
    const appRoles = memberRoles
      .map(r => {
        const mapped = roleMapping[r.role]
        console.log(`🔍 Mapping role: ${r.role} -> ${mapped}`)
        return mapped
      })
      .filter(Boolean) // Remove undefined values

    // Remove duplicates and ensure at least Members role
    const uniqueRoles = [...new Set(appRoles)] as UserRole[]
    console.log('🔍 Final unique roles:', uniqueRoles)

    // If admin level users, also add Members role for access to member features
    if (uniqueRoles.includes('AdminSuper') || uniqueRoles.includes('Admin') || uniqueRoles.includes('InstitutionAdmin')) {
      if (!uniqueRoles.includes('Members')) {
        uniqueRoles.push('Members')
      }
    }

    const finalRoles = uniqueRoles.length > 0 ? uniqueRoles : ['Members']
    console.log('✅ COMPLETED fetchUserRoles, returning:', finalRoles)

    // Cache the successful result
    cacheRoles(userId, finalRoles)

    return finalRoles
  } catch (error: any) {
    console.error('❌ ERROR in fetchUserRoles:', error)

    // CRITICAL: On timeout or any error, use cached roles or sessionStorage first
    if (error.message === 'Query timeout' || error.code === 'PGRST116') {
      console.warn('⚠️ Query failed, checking for cached roles...')

      // Try sessionStorage cache FIRST (most reliable)
      try {
        const sessionCache = sessionStorage.getItem('eau_cached_roles')
        if (sessionCache) {
          const parsed = JSON.parse(sessionCache)
          if (parsed.userId === userId && parsed.roles?.length > 0) {
            console.log('✅ Using sessionStorage cached roles:', parsed.roles)
            return parsed.roles
          }
        }
      } catch (e) {
        console.error('Failed to read sessionStorage cache:', e)
      }

      // Try memory cache
      const memoryCache = getCachedRoles(userId)
      if (memoryCache && memoryCache.length > 0) {
        console.log('✅ Using memory cached roles:', memoryCache)
        return memoryCache
      }

      // Only as LAST resort, try to get from localStorage auth data
      try {
        const authData = localStorage.getItem('sb-ypsvoxelitgceclohxfu-auth-token')
        if (authData) {
          const parsed = JSON.parse(authData)
          const email = parsed?.user?.email

          // Hardcoded fallback for known test users
          if (email === 'institution.admin@test.com') {
            const roles: UserRole[] = ['InstitutionAdmin', 'Members']
            cacheRoles(userId, roles)
            console.log('🎯 Using fallback roles for Institution Admin:', roles)
            return roles
          }
          if (email === 'super.admin@test.com') {
            const roles: UserRole[] = ['AdminSuper', 'Members']
            cacheRoles(userId, roles)
            console.log('🎯 Using fallback roles for Super Admin:', roles)
            return roles
          }
          if (email === 'dev@platty.tech') {
            const roles: UserRole[] = ['AdminSuper', 'Admin', 'Members']
            cacheRoles(userId, roles)
            console.log('🎯 Using fallback roles for dev@platty.tech (Super Admin):', roles)
            return roles
          }
        }
      } catch (e) {
        console.error('Error getting fallback:', e)
      }
    }

    // Default fallback
    return ['Members']
  }
}

/**
 * Fetches user roles by email (for login)
 */
export async function fetchUserRolesByEmail(email: string): Promise<UserRole[]> {
  try {
    // Get member by email with timeout, including user_type for fallback
    const memberQuery = supabase
      .from('members')
      .select('id, user_type')
      .eq('email', email)
      .single()

    const { data: member } = await queryWithTimeout(memberQuery, 3000)

    if (!member) {
      return ['Members']
    }

    // CRITICAL FALLBACK: Hardcoded super admins ALWAYS get full permissions
    if (SUPER_ADMIN_EMAILS.includes(email)) {
      console.log('🔴 CRITICAL BY EMAIL: Hardcoded super admin detected:', email);
      return ['AdminSuper', 'Admin', 'Members'];
    }

    // FALLBACK: If user_type is super_admin, return super admin roles immediately
    if (member.user_type === 'super_admin') {
      console.log('🎯 FALLBACK BY EMAIL: Using user_type=super_admin for', email);
      return ['AdminSuper', 'Admin', 'Members'];
    }

    // Get all roles for this member with timeout
    const rolesQuery = supabase
      .from('member_roles')
      .select('role')
      .eq('member_id', member.id)

    const { data: memberRoles, error } = await queryWithTimeout(rolesQuery, 3000)

    if (error) {
      console.error('Error fetching member roles by email:', error)

      // FALLBACK FORTALECIDO BY EMAIL: SEMPRE usar user_type se member_roles falhar
      console.log('🎯 FALLBACK FORTALECIDO BY EMAIL: member_roles error, using user_type:', member.user_type);
      const fallbackRole = roleMapping[member.user_type] || 'Members';
      const roles: UserRole[] = Array.isArray(fallbackRole) ? fallbackRole : [fallbackRole];

      // Para super_admin, garantir roles completas
      if (member.user_type === 'super_admin') {
        return ['AdminSuper', 'Admin', 'Members'];
      }

      // Ensure admin users also have Members role
      if (roles.includes('AdminSuper') || roles.includes('Admin')) {
        if (!roles.includes('Members')) {
          roles.push('Members');
        }
      }

      return roles;
    }

    if (!memberRoles || memberRoles.length === 0) {
      // FALLBACK: If no roles in table, use user_type
      console.log('🎯 FALLBACK BY EMAIL: No roles in member_roles, using user_type:', member.user_type);
      const fallbackRole = roleMapping[member.user_type] || 'Members';
      const roles: UserRole[] = Array.isArray(fallbackRole) ? fallbackRole : [fallbackRole];

      // Ensure admin users also have Members role
      if (roles.includes('AdminSuper') || roles.includes('Admin')) {
        if (!roles.includes('Members')) {
          roles.push('Members');
        }
      }

      return roles;
    }

    // Map database roles to app roles
    const appRoles = memberRoles
      .map(r => roleMapping[r.role])
      .filter(Boolean)

    // Remove duplicates and ensure at least Members role
    const uniqueRoles = [...new Set(appRoles)] as UserRole[]

    // If admin level users, also add Members role
    if (uniqueRoles.includes('AdminSuper') || uniqueRoles.includes('Admin') || uniqueRoles.includes('InstitutionAdmin')) {
      if (!uniqueRoles.includes('Members')) {
        uniqueRoles.push('Members')
      }
    }

    return uniqueRoles.length > 0 ? uniqueRoles : ['Members']
  } catch (error: any) {
    console.error('Error in fetchUserRolesByEmail:', error)

    // Fallback for timeout
    if (error.message === 'Query timeout') {
      // Known test users fallback
      if (email === 'institution.admin@test.com') {
        return ['InstitutionAdmin', 'Members']
      }
      if (email === 'super.admin@test.com') {
        return ['AdminSuper', 'Members']
      }
      if (email === 'dev@platty.tech') {
        return ['AdminSuper', 'Admin', 'Members']
      }
    }

    return ['Members']
  }
}
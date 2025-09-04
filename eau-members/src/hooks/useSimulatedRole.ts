import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export function useSimulatedRole() {
  const { user } = useAuth()
  const [simulatedRole, setSimulatedRole] = useState<string | null>(null)
  
  useEffect(() => {
    // Only in development mode
    if (import.meta.env.PROD) return
    
    // Load simulated role from localStorage
    const saved = localStorage.getItem('simulatedRole')
    if (saved) {
      setSimulatedRole(saved)
    }
  }, [])
  
  // Return the effective role (simulated or actual)
  const effectiveRole = simulatedRole || user?.role || 'member'
  
  // Helper function to check permissions based on effective role
  const hasPermission = (permission: string): boolean => {
    switch (effectiveRole) {
      case 'super_admin':
        return true // Super admin has all permissions
      
      case 'admin':
        // Institution admin permissions
        return [
          'view_dashboard',
          'manage_institution',
          'manage_members',
          'manage_events',
          'view_reports',
          'export_data',
          'manage_cpd',
          'send_invites'
        ].includes(permission)
      
      case 'staff':
        // Staff permissions
        return [
          'view_dashboard',
          'view_members',
          'manage_events',
          'view_reports',
          'manage_cpd'
        ].includes(permission)
      
      case 'member':
        // Regular member permissions
        return [
          'view_profile',
          'edit_profile',
          'view_events',
          'register_events',
          'view_cpd',
          'submit_cpd'
        ].includes(permission)
      
      default:
        return false
    }
  }
  
  // Helper to check if user can access admin features
  const isAdmin = () => {
    return ['super_admin', 'admin', 'staff'].includes(effectiveRole)
  }
  
  // Helper to check if user is super admin
  const isSuperAdmin = () => {
    return effectiveRole === 'super_admin'
  }
  
  // Helper to check if user is institution admin
  const isInstitutionAdmin = () => {
    return effectiveRole === 'admin'
  }
  
  return {
    effectiveRole,
    simulatedRole,
    actualRole: user?.role || 'member',
    hasPermission,
    isAdmin,
    isSuperAdmin,
    isInstitutionAdmin,
    isSimulating: !!simulatedRole
  }
}
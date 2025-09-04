import React, { useState, useEffect } from 'react'
import { ChevronDown, User, Shield, Building, Users, Eye, X } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'

interface RoleOption {
  value: string
  label: string
  icon: React.ReactNode
  description: string
  color: string
}

const roleOptions: RoleOption[] = [
  {
    value: 'AdminSuper',
    label: 'Super Admin',
    icon: <Shield className="w-4 h-4" />,
    description: 'Full system access',
    color: 'bg-purple-100 text-purple-700 border-purple-300'
  },
  {
    value: 'Admin',
    label: 'Institution Admin',
    icon: <Building className="w-4 h-4" />,
    description: 'Manage institution & events',
    color: 'bg-blue-100 text-blue-700 border-blue-300'
  },
  {
    value: 'Members',
    label: 'Member',
    icon: <User className="w-4 h-4" />,
    description: 'Regular member access',
    color: 'bg-green-100 text-green-700 border-green-300'
  },
  {
    value: 'MemberColleges',
    label: 'College Member',
    icon: <Users className="w-4 h-4" />,
    description: 'College member access',
    color: 'bg-indigo-100 text-indigo-700 border-indigo-300'
  },
  {
    value: 'Public',
    label: 'Public',
    icon: <Users className="w-4 h-4" />,
    description: 'Public access only',
    color: 'bg-gray-100 text-gray-700 border-gray-300'
  }
]

export function RoleSwitcher() {
  const { user, roles, simulatedRole, setSimulatedRole, getEffectiveRoles, rolesLoaded } = useAuthStore()
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  
  // Only show in development mode
  if (import.meta.env.PROD) return null
  
  // Don't show if user is not authenticated or roles not loaded
  if (!user || !rolesLoaded) return null
  
  // Get actual role from roles array
  const actualRole = roles.length > 0 ? roles[0] : 'Members'
  const effectiveRoles = getEffectiveRoles()
  const currentRole = effectiveRoles.length > 0 ? effectiveRoles[0] : 'Members'
  const currentRoleData = roleOptions.find(r => r.value === currentRole) || roleOptions[2]
  
  const handleRoleSwitch = (role: string) => {
    if (role === actualRole) {
      // Reset to actual role
      setSimulatedRole(null)
    } else {
      // Set simulated role (need to cast to UserRole type)
      setSimulatedRole(role as any)
    }
    setIsOpen(false)
    // Reload the page to apply new permissions
    window.location.reload()
  }
  
  // Load simulated role from localStorage only after roles are loaded
  useEffect(() => {
    const { rolesLoaded } = useAuthStore.getState()
    if (rolesLoaded && user) {
      const saved = localStorage.getItem('simulatedRole')
      if (saved && saved !== actualRole) {
        setSimulatedRole(saved as any)
      }
    }
  }, [user, actualRole])
  
  // Minimized view
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className={`rounded-full p-3 shadow-lg border-2 ${currentRoleData.color} hover:scale-110 transition-transform`}
          title="Role Switcher"
        >
          <Eye className="w-5 h-5" />
        </button>
      </div>
    )
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="relative">
        {/* Current Role Display */}
        <Card className={`shadow-lg border-2 ${simulatedRole ? 'border-orange-400' : 'border-gray-300'}`}>
          <div className="p-3">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase">
                {simulatedRole ? '🎭 Viewing As' : 'Current Role'}
              </span>
              <button
                onClick={() => setIsMinimized(true)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Role Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors ${currentRoleData.color}`}
            >
              <div className="flex items-center gap-2">
                {currentRoleData.icon}
                <div className="text-left">
                  <div className="font-semibold">{currentRoleData.label}</div>
                  <div className="text-xs opacity-75">{currentRoleData.description}</div>
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Actual Role Indicator */}
            {simulatedRole && (
              <div className="mt-2 pt-2 border-t">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Actual role:</span>
                  <span className="font-semibold text-gray-700">
                    {roleOptions.find(r => r.value === actualRole)?.label}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-1 text-xs"
                  onClick={() => handleRoleSwitch(actualRole)}
                >
                  Reset to actual role
                </Button>
              </div>
            )}
          </div>
        </Card>
        
        {/* Role Options Dropdown */}
        {isOpen && (
          <Card className="absolute bottom-full mb-2 right-0 w-64 shadow-xl border-2">
            <div className="p-2">
              <div className="text-xs font-semibold text-gray-500 uppercase px-2 py-1">
                Switch Role View
              </div>
              {roleOptions.map((role) => (
                <button
                  key={role.value}
                  onClick={() => handleRoleSwitch(role.value)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors ${
                    role.value === currentRole ? 'bg-gray-50' : ''
                  }`}
                >
                  <div className={`p-1 rounded ${role.color}`}>
                    {role.icon}
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-medium text-sm">{role.label}</div>
                    <div className="text-xs text-gray-500">{role.description}</div>
                  </div>
                  {role.value === actualRole && (
                    <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                      Actual
                    </span>
                  )}
                  {role.value === simulatedRole && (
                    <span className="text-xs bg-orange-200 text-orange-700 px-2 py-1 rounded">
                      Viewing
                    </span>
                  )}
                </button>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
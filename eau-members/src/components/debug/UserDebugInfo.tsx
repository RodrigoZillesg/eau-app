import React from 'react'
import { useAuthStore } from '../../stores/authStore'
import { usePermissions } from '../../hooks/usePermissions'

export const UserDebugInfo: React.FC = () => {
  const { user, roles } = useAuthStore()
  const { hasPermission } = usePermissions()

  if (!user) return null

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded text-xs max-w-sm">
      <h4 className="font-bold mb-2">Debug Info</h4>
      <div className="space-y-1">
        <div><strong>Email:</strong> {user.email}</div>
        <div><strong>User ID:</strong> {user.id}</div>
        <div><strong>Roles:</strong> {JSON.stringify(roles)}</div>
        <div><strong>Tem ACCESS_MEMBER_DASHBOARD:</strong> {hasPermission('ACCESS_MEMBER_DASHBOARD') ? '✅' : '❌'}</div>
        <div><strong>Tem ACCESS_ADMIN_DASHBOARD:</strong> {hasPermission('ACCESS_ADMIN_DASHBOARD') ? '✅' : '❌'}</div>
      </div>
    </div>
  )
}
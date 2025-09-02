import React from 'react'
import { usePermissions } from '../../../hooks/usePermissions'
import { MemberDashboard } from '../components/MemberDashboard'
import { AdminDashboard } from '../components/AdminDashboard'
import { useAuthStore } from '../../../stores/authStore'

export const DashboardPage: React.FC = () => {
  const { isAdmin } = usePermissions()
  const { user, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Please log in to access your dashboard.</p>
        </div>
      </div>
    )
  }

  // Show admin dashboard if user has admin permissions
  if (isAdmin()) {
    return <AdminDashboard />
  }

  // Default to member dashboard
  return <MemberDashboard />
}
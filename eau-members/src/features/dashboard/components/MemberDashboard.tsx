import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { useAuthStore } from '../../../stores/authStore'
import { PermissionGuard } from '../../../components/shared/PermissionGuard'

export const MemberDashboard: React.FC = () => {
  const { user, roles } = useAuthStore()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {user?.user_metadata?.full_name || user?.email}
              </h1>
              <p className="text-gray-600">
                Roles: {roles.join(', ') || 'No roles assigned'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* CPD Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📚 CPD Summary
              </CardTitle>
              <CardDescription>
                Your Continuing Professional Development progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Points:</span>
                  <span className="text-2xl font-bold text-primary-600">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Activities:</span>
                  <span className="text-lg font-semibold">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">This Year:</span>
                  <span className="text-lg font-semibold">0</span>
                </div>
                <PermissionGuard permission="CREATE_CPD">
                  <Button 
                    className="w-full mt-4"
                    onClick={() => navigate('/cpd')}
                  >
                    Add New CPD Activity
                  </Button>
                </PermissionGuard>
              </div>
            </CardContent>
          </Card>

          {/* Events Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📅 Upcoming Events
              </CardTitle>
              <CardDescription>
                Professional development events and workshops
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center py-8 text-gray-500">
                  <p>No upcoming events</p>
                </div>
                <PermissionGuard permission="REGISTER_EVENT">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate('/events')}
                  >
                    Browse Events
                  </Button>
                </PermissionGuard>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                ⚡ Quick Actions
              </CardTitle>
              <CardDescription>
                Common tasks and shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <PermissionGuard permission="CREATE_CPD">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => navigate('/cpd')}
                  >
                    📝 Log CPD Activity
                  </Button>
                </PermissionGuard>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/profile')}
                >
                  👤 My Profile
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/cpd')}
                >
                  📋 Export Certificate
                </Button>
                
                <PermissionGuard roles={['Admin', 'AdminSuper']}>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => navigate('/admin')}
                  >
                    ⚙️ Admin Panel
                  </Button>
                </PermissionGuard>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity Card */}
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🕒 Recent Activity
              </CardTitle>
              <CardDescription>
                Your latest CPD activities and events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-lg font-medium mb-2">No activities yet</h3>
                <p className="text-sm mb-4">Start logging your professional development activities to see them here.</p>
                <PermissionGuard permission="CREATE_CPD">
                  <Button onClick={() => navigate('/cpd')}>Add Your First Activity</Button>
                </PermissionGuard>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
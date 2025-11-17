import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Users, Calendar, FileText } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { PendingLinkRequestsCard } from './PendingLinkRequestsCard'
import { useAuthStore } from '../../../stores/authStore'
import { OpenLearningCourseCatalog } from '../../../components/OpenLearningCourseCatalog'

export const InstitutionAdminDashboard: React.FC = () => {
  const { memberData } = useAuthStore()
  const navigate = useNavigate()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Institution Admin Dashboard</h1>
        <p className="mt-2 text-gray-600">
          {memberData?.first_name && memberData?.last_name && (
            <span className="font-medium">{memberData.first_name} {memberData.last_name}</span>
          )}
          {memberData?.institution_name && (
            <span> • {memberData.institution_name}</span>
          )}
          {!memberData?.first_name && !memberData?.institution_name && (
            'Manage your institution\'s members and link requests'
          )}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Members
            </CardTitle>
            <CardDescription>Manage your institution's members</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => navigate('/admin/members')}
              className="w-full"
              variant="outline"
            >
              View Members
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-green-600" />
              Events
            </CardTitle>
            <CardDescription>Manage events for your members</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => navigate('/events')}
              className="w-full"
              variant="outline"
            >
              View Events
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              CPD Activities
            </CardTitle>
            <CardDescription>Review CPD submissions</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => navigate('/admin/cpd-activities')}
              className="w-full"
              variant="outline"
            >
              Review CPD
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Pending Link Requests - Full Width */}
      <div className="mb-8">
        <PendingLinkRequestsCard />
      </div>

      {/* Institution Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-gray-600" />
            Your Institution
          </CardTitle>
          <CardDescription>Institution management</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Button
              onClick={() => navigate('/admin/institution')}
              className="w-full"
              variant="outline"
            >
              Manage Institution Details
            </Button>
            <Button
              onClick={() => navigate('/admin/institution-links')}
              className="w-full"
              variant="outline"
            >
              View All Link Requests
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* OpenLearning Course Catalog Section */}
      <div className="mt-8">
        <OpenLearningCourseCatalog />
      </div>
    </div>
  )
}

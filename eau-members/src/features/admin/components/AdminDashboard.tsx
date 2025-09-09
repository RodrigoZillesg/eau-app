import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { MemberStats } from './MemberStats'
import { useAuthStore } from '../../../stores/authStore'
import { Users, Calendar, BookOpen, Settings, UserCheck, FileText, Upload, Database, Trash2, GraduationCap } from 'lucide-react'

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const isSuperAdmin = user?.user_metadata?.role === 'AdminSuper'

  const adminCards = [
    {
      title: 'Manage Members',
      description: 'View, create and edit members',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      onClick: () => navigate('/admin/members')
    },
    {
      title: 'CPDs',
      description: 'Approve and manage CPD activities',
      icon: BookOpen,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      onClick: () => navigate('/admin/cpds')
    },
    {
      title: 'Approvals',
      description: 'Pending approval items',
      icon: UserCheck,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      onClick: () => navigate('/admin/approvals')
    },
    {
      title: 'Reports',
      description: 'View reports and statistics',
      icon: FileText,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      onClick: () => navigate('/admin/reports')
    },
    {
      title: 'Import Activities',
      description: 'Import CPD activities from CSV',
      icon: Upload,
      color: 'text-teal-600',
      bgColor: 'bg-teal-100',
      onClick: () => navigate('/admin/import-activities')
    },
    {
      title: 'Import System',
      description: 'Import members, companies & memberships',
      icon: Database,
      color: 'text-rose-600',
      bgColor: 'bg-rose-100',
      onClick: () => navigate('/admin/import-system')
    },
    {
      title: 'OpenLearning',
      description: 'Manage OpenLearning integration',
      icon: GraduationCap,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      onClick: () => navigate('/admin/openlearning')
    },
    {
      title: 'Bulk Management',
      description: 'Mass delete and manage members',
      icon: Trash2,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      onClick: () => navigate('/admin/bulk-management'),
      requireSuperAdmin: true
    },
    {
      title: 'Settings',
      description: 'System settings',
      icon: Settings,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      onClick: () => navigate('/admin/settings')
    }
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Administrative Panel</h1>
        <p className="mt-2 text-gray-600">Manage members, events and system settings</p>
      </div>

      {/* Estatísticas dos Membros */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Member Statistics</h2>
        <MemberStats />
      </div>

      {/* Menu de Administração */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Administrative Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminCards
            .filter(card => !card.requireSuperAdmin || isSuperAdmin)
            .map((card) => {
            const IconComponent = card.icon
            return (
              <Card 
                key={card.title} 
                className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={card.onClick}
              >
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-lg ${card.bgColor}`}>
                    <IconComponent className={`h-6 w-6 ${card.color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{card.title}</h3>
                    <p className="text-sm text-gray-600 mb-4">{card.description}</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        card.onClick()
                      }}
                    >
                      Access
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Ações Rápidas */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button 
            className="h-16 text-left justify-start"
            onClick={() => navigate('/admin/members')}
          >
            <Users className="mr-3 h-5 w-5" />
            <div>
              <div className="font-medium">New Member</div>
              <div className="text-xs opacity-75">Register member</div>
            </div>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-16 text-left justify-start"
            onClick={() => navigate('/admin/events')}
          >
            <Calendar className="mr-3 h-5 w-5" />
            <div>
              <div className="font-medium">New Event</div>
              <div className="text-xs opacity-75">Create event</div>
            </div>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-16 text-left justify-start"
            onClick={() => navigate('/admin/cpds')}
          >
            <BookOpen className="mr-3 h-5 w-5" />
            <div>
              <div className="font-medium">Approve CPDs</div>
              <div className="text-xs opacity-75">Review pending</div>
            </div>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-16 text-left justify-start"
            onClick={() => navigate('/admin/reports')}
          >
            <FileText className="mr-3 h-5 w-5" />
            <div>
              <div className="font-medium">View Reports</div>
              <div className="text-xs opacity-75">Analytics and metrics</div>
            </div>
          </Button>
        </div>
      </div>
    </div>
  )
}
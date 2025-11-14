import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { MemberStats } from './MemberStats'
import { useAuthStore } from '../../../stores/authStore'
import { useApplicationNotifications } from '../../../hooks/useApplicationNotifications'
import { OpenLearningAccessButton } from '../../../components/openlearning/OpenLearningAccessButton'
import { getUserInstitution } from '../../../services/institutionService'
import { supabase } from '../../../lib/supabase/client'
import { Users, Calendar, Settings, UserCheck, FileText, Upload, Database, Trash2, Award, Mail, FileCheck, Bell, BarChart3 } from 'lucide-react'

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate()
  const { user, roles } = useAuthStore()
  const isSuperAdmin = roles.includes('AdminSuper')
  const isAdmin = roles.includes('Admin')
  const isInstitutionAdmin = roles.includes('InstitutionAdmin')
  const [institutionName, setInstitutionName] = useState<string | null>(null)
  const [cpdSettings, setCpdSettings] = useState<{ auto_approval_enabled: boolean } | null>(null)

  // TEMPORARILY DISABLED - Backend not running
  // Enable real-time notifications for new applications
  const { newApplicationsCount, resetNotificationCount } = useApplicationNotifications({
    enabled: false, // DISABLED until backend is running
    pollInterval: 30000 // Check every 30 seconds
  })

  useEffect(() => {
    const loadData = async () => {
      const institution = await getUserInstitution()
      setInstitutionName(institution.institutionName)

      // Load CPD settings
      try {
        const { data } = await supabase
          .from('cpd_settings')
          .select('setting_value')
          .eq('setting_key', 'auto_approve_events')
          .single()
        setCpdSettings(data)
      } catch (error) {
        console.error('Error loading CPD settings:', error)
      }
    }
    loadData()
  }, [])

  const adminCards: Array<{
    title: string
    description: string
    icon: any
    color: string
    bgColor: string
    onClick: () => void
    requireSuperAdmin?: boolean // Only SuperAdmin (developer)
    requireAdmin?: boolean      // Admin+ (system owner + developer)
    requireInstitutionAdmin?: boolean // InstitutionAdmin+ (all admin levels)
    hidden?: boolean
    badge?: number
  }> = [
    {
      title: 'Manage Members',
      description: 'View, create and edit members',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      onClick: () => navigate('/admin/members'),
      requireInstitutionAdmin: true // All admin levels can manage members (scoped)
    },
    {
      title: 'Standard Reports',
      description: 'Pre-configured business reports and analytics',
      icon: BarChart3,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      onClick: () => navigate('/admin/standard-reports'),
      requireInstitutionAdmin: true // All admin levels can view reports (scoped)
    },
    {
      title: 'Import Activities',
      description: 'Import CPD activities from CSV',
      icon: Upload,
      color: 'text-teal-600',
      bgColor: 'bg-teal-100',
      onClick: () => navigate('/admin/import-activities'),
      requireAdmin: true // Admin+ can import activities
    },
    {
      title: 'Import System',
      description: 'Import members, companies & memberships',
      icon: Database,
      color: 'text-rose-600',
      bgColor: 'bg-rose-100',
      onClick: () => navigate('/admin/import-system'),
      requireSuperAdmin: true
    },
    {
      title: 'Certificates & CPD',
      description: 'Batch process certificates and CPD points',
      icon: Award,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      onClick: () => navigate('/admin/certificates'),
      requireAdmin: true // Admin+ can manage certificates
    },
    {
      title: 'Welcome Emails',
      description: 'Send welcome emails to new members',
      icon: Mail,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-100',
      onClick: () => navigate('/admin/welcome-emails'),
      requireAdmin: true // Admin+ can send welcome emails
    },
    {
      title: 'Email Logs',
      description: 'View and track all system emails',
      icon: Mail,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      onClick: () => navigate('/admin/email-logs'),
      requireAdmin: true // Admin+ can view email logs
    },
    {
      title: 'Membership Applications',
      description: 'Review and approve new membership applications',
      icon: FileCheck,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
      onClick: () => {
        resetNotificationCount()
        navigate('/admin/applications')
      },
      badge: newApplicationsCount,
      requireAdmin: true // Admin+ can manage applications
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
      title: 'Member Impersonation',
      description: 'Login as any member for testing',
      icon: UserCheck,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      onClick: () => navigate('/admin/member-impersonation'),
      requireSuperAdmin: true // Technical impersonation - SuperAdmin only
    },
    {
      title: 'Settings',
      description: 'System settings',
      icon: Settings,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      onClick: () => navigate('/admin/settings'),
      requireSuperAdmin: true
    }
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Administrative Panel</h1>
        <p className="mt-2 text-gray-600">
          {institutionName && institutionName !== 'All Institutions'
            ? `Managing ${institutionName}`
            : 'Manage members, events and system settings'}
        </p>
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
            .filter(card => {
              if (card.hidden) return false
              if (card.requireSuperAdmin && !isSuperAdmin) return false
              if (card.requireAdmin && !isSuperAdmin && !isAdmin) return false
              if (card.requireInstitutionAdmin && !isSuperAdmin && !isAdmin && !isInstitutionAdmin) return false
              return true
            })
            .map((card) => {
            const IconComponent = card.icon
            return (
              <Card
                key={card.title}
                className="p-6 hover:shadow-lg transition-shadow cursor-pointer relative"
                onClick={card.onClick}
              >
                {/* Notification Badge */}
                {card.badge && card.badge > 0 && (
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold animate-pulse">
                    {card.badge}
                  </div>
                )}
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-lg ${card.bgColor}`}>
                    <IconComponent className={`h-6 w-6 ${card.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">{card.title}</h3>
                      {card.badge && card.badge > 0 && (
                        <Bell className="h-4 w-4 text-red-500 animate-bounce" />
                      )}
                    </div>
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
            onClick={() => navigate('/admin/standard-reports')}
          >
            <BarChart3 className="mr-3 h-5 w-5" />
            <div>
              <div className="font-medium">Standard Reports</div>
              <div className="text-xs opacity-75">Business insights</div>
            </div>
          </Button>
        </div>
      </div>
    </div>
  )
}
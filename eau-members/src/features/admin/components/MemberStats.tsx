import React, { useState, useEffect } from 'react'
import { Card } from '../../../components/ui/Card'
import { MembersService } from '../../../lib/supabase/members'
import { Users, UserCheck, UserPlus, UserX } from 'lucide-react'

interface Stats {
  total: number
  active: number
  newThisMonth: number
  inactive: number
}

export const MemberStats: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    total: 0,
    active: 0,
    newThisMonth: 0,
    inactive: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await MembersService.getMemberStats()
        setStats(data)
      } catch (error) {
        console.error('Error loading statistics:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  const statCards = [
    {
      title: 'Total Members',
      value: stats.total,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Active Members',
      value: stats.active,
      icon: UserCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'New This Month',
      value: stats.newThisMonth,
      icon: UserPlus,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Inactive Members',
      value: stats.inactive,
      icon: UserX,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    }
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat) => {
        const IconComponent = stat.icon
        return (
          <Card key={stat.title} className="p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <IconComponent className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
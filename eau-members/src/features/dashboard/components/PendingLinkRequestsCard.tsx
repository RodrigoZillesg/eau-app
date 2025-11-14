import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, Users, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { supabase } from '../../../lib/supabase/client'

const API_BASE_URL = 'http://localhost:3001/api/v1'

export const PendingLinkRequestsCard: React.FC = () => {
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadPendingCount()
  }, [])

  const loadPendingCount = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const response = await fetch(`${API_BASE_URL}/institution-links/pending`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (data?.success) {
        setPendingCount(data.data?.length || 0)
      }
    } catch (error) {
      console.error('Error loading pending link requests:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-600" />
            Pending Link Requests
          </CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className={pendingCount > 0 ? 'border-yellow-300 bg-yellow-50' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-yellow-600" />
          Pending Link Requests
        </CardTitle>
        <CardDescription>
          {pendingCount > 0
            ? `${pendingCount} member${pendingCount === 1 ? '' : 's'} waiting for approval`
            : 'No pending requests'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {pendingCount > 0 && (
            <div className="flex items-start gap-3 p-4 bg-white border border-yellow-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Action Required
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {pendingCount} member{pendingCount === 1 ? '' : 's'} {pendingCount === 1 ? 'is' : 'are'} waiting to be linked to your institution.
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate('/admin/institution-links')}
              className="flex-1"
              variant={pendingCount > 0 ? 'default' : 'outline'}
            >
              <Users className="w-4 h-4 mr-2" />
              {pendingCount > 0 ? 'Review Requests' : 'View All Requests'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

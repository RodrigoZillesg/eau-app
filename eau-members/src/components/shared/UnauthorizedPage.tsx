import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card'
import { supabase } from '../../lib/supabase/client'
import { useAuthStore } from '../../stores/authStore'

export const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate()
  const { reset } = useAuthStore()

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      reset()
      navigate('/login')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      // Forçar logout mesmo se der erro
      reset()
      navigate('/login')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 text-6xl">🚫</div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Access Denied
          </CardTitle>
          <CardDescription>
            You don't have permission to access this page. Please contact your administrator if you believe this is an error.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600">
            <p>Required permissions not found in your account.</p>
            <p className="mt-2">Your current roles may not include access to this resource.</p>
          </div>
          
          <div className="flex flex-col gap-3 pt-4">
            <Button
              onClick={handleLogout}
              className="w-full"
            >
              Logout and Try Again
            </Button>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => navigate(-1)}
                className="flex-1"
              >
                Go Back
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard')}
                className="flex-1"
              >
                Dashboard
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
import React from 'react'
import { AuthLayout } from '../../../components/layout/AuthLayout'
import { LoginForm } from '../components/LoginForm'

export const LoginPage: React.FC = () => {
  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  )
}
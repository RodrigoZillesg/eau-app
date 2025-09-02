import React from 'react'
import { AuthLayout } from '../../../components/layout/AuthLayout'
import { ForgotPasswordForm } from '../components/ForgotPasswordForm'

export const ForgotPasswordPage: React.FC = () => {
  return (
    <AuthLayout>
      <ForgotPasswordForm />
    </AuthLayout>
  )
}
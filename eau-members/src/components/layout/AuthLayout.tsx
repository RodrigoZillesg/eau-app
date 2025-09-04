import React from 'react'
import { APP_VERSION } from '../../config/version'

interface AuthLayoutProps {
  children: React.ReactNode
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-white flex">
      {/* Left side - White background with form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <img 
              src="/logo-500.png" 
              alt="English Australia" 
              className="mx-auto h-16 w-auto mb-4"
            />
            {/* Version info */}
            <div className="text-xs text-gray-500">
              {APP_VERSION.withEnv}
            </div>
          </div>
          
          {/* Form container */}
          {children}
        </div>
      </div>
      
      {/* Right side - Blue background with rainbow at bottom */}
      <div className="hidden lg:flex w-1/2 bg-[#1E3A8A] relative flex-col">
        {/* Content area - empty for now */}
        <div className="flex-1"></div>
        
        {/* Rainbow gradient at the bottom */}
        <div className="h-2 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500"></div>
      </div>
    </div>
  )
}
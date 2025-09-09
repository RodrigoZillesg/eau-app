import React, { useState } from 'react';
import { openLearningService } from '../services/openlearningService';
import { showNotification } from '../utils/notifications';

interface OpenLearningSSOButtonProps {
  classId?: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  newWindow?: boolean;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  children?: React.ReactNode;
}

export const OpenLearningSSOButton: React.FC<OpenLearningSSOButtonProps> = ({
  classId,
  className = '',
  variant = 'primary',
  size = 'md',
  newWindow = true,
  onSuccess,
  onError,
  children
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSSOLaunch = async () => {
    setIsLoading(true);
    try {
      await openLearningService.launchSSO(classId, newWindow);
      showNotification('success', 'Redirecting to OpenLearning...');
      onSuccess?.();
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to launch OpenLearning';
      showNotification('error', errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonClasses = () => {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg'
    };

    const variantClasses = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
      secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
      outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500',
      ghost: 'hover:bg-gray-100 focus:ring-gray-200'
    };

    return `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;
  };

  return (
    <button
      onClick={handleSSOLaunch}
      disabled={isLoading}
      className={getButtonClasses()}
    >
      {isLoading ? (
        <>
          <svg 
            className="animate-spin -ml-1 mr-2 h-4 w-4" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Launching...
        </>
      ) : (
        <>
          {children || (
            <>
              <svg 
                className="mr-2 h-5 w-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M13 10V3L4 14h7v7l9-11h-7z" 
                />
              </svg>
              Launch OpenLearning
            </>
          )}
        </>
      )}
    </button>
  );
};
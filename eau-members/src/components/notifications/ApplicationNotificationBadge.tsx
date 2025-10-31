import React from 'react';
import { Bell, FileText } from 'lucide-react';
import { useApplicationNotifications } from '../../hooks/useApplicationNotifications';

interface ApplicationNotificationBadgeProps {
  className?: string;
  onClick?: () => void;
}

export const ApplicationNotificationBadge: React.FC<ApplicationNotificationBadgeProps> = ({ 
  className = '',
  onClick 
}) => {
  const { newApplicationsCount, resetNotificationCount, isPolling } = useApplicationNotifications({
    enabled: false, // DISABLED until backend is running
    pollInterval: 30000 // Check every 30 seconds
  });

  const handleClick = () => {
    resetNotificationCount();
    if (onClick) {
      onClick();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`relative p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg ${className}`}
      title={newApplicationsCount > 0 ? `${newApplicationsCount} new membership applications` : 'No new applications'}
    >
      <Bell className="h-6 w-6" />
      
      {/* Notification Badge */}
      {newApplicationsCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white animate-pulse">
          {newApplicationsCount > 9 ? '9+' : newApplicationsCount}
        </span>
      )}
      
      {/* Polling Indicator */}
      {isPolling && (
        <span className="absolute -bottom-1 -right-1 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
        </span>
      )}
    </button>
  );
};

// Dropdown component for showing notification details
export const ApplicationNotificationDropdown: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onViewApplications: () => void;
}> = ({ isOpen, onClose, onViewApplications }) => {
  const { newApplicationsCount, lastChecked } = useApplicationNotifications({
    enabled: false // DISABLED until backend is running
  });

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-sm"
          >
            ×
          </button>
        </div>
        
        {newApplicationsCount > 0 ? (
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
              <div className="flex-shrink-0">
                <FileText className="h-5 w-5 text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  New Membership Applications
                </p>
                <p className="text-sm text-gray-600">
                  {newApplicationsCount} new application{newApplicationsCount !== 1 ? 's' : ''} 
                  {newApplicationsCount === 1 ? ' has' : ' have'} been submitted and 
                  {newApplicationsCount === 1 ? ' is' : ' are'} waiting for review.
                </p>
                <button
                  onClick={() => {
                    onViewApplications();
                    onClose();
                  }}
                  className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  Review Applications →
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <Bell className="mx-auto h-8 w-8 text-gray-300" />
            <p className="mt-2 text-sm text-gray-500">No new notifications</p>
          </div>
        )}
        
        {lastChecked && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Last checked: {new Date(lastChecked).toLocaleTimeString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
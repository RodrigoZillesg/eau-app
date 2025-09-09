import React, { useEffect, useState } from 'react';
import { User, LogOut, AlertTriangle } from 'lucide-react';
import { impersonationService } from '../../services/impersonationService';
import { useNavigate } from 'react-router-dom';
import { showNotification } from '../../utils/notifications';

export const ImpersonationBanner: React.FC = () => {
  const navigate = useNavigate();
  const [displayInfo, setDisplayInfo] = useState(impersonationService.getDisplayInfo());
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Check impersonation status on mount and after storage changes
    const checkStatus = () => {
      setDisplayInfo(impersonationService.getDisplayInfo());
    };

    checkStatus();
    
    // Listen for storage changes
    window.addEventListener('storage', checkStatus);
    
    // Check periodically
    const interval = setInterval(checkStatus, 1000);

    return () => {
      window.removeEventListener('storage', checkStatus);
      clearInterval(interval);
    };
  }, []);

  const handleExitImpersonation = async () => {
    setIsExiting(true);
    try {
      const result = await impersonationService.stopImpersonation();
      if (result.success) {
        showNotification('success', 'Exited impersonation mode');
        navigate('/dashboard');
        window.location.reload(); // Force refresh to update all components
      } else {
        showNotification('error', result.error || 'Failed to exit impersonation');
      }
    } catch (error) {
      showNotification('error', 'Error exiting impersonation');
    } finally {
      setIsExiting(false);
    }
  };

  if (!displayInfo.isImpersonating) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 animate-pulse" />
              <span className="font-semibold">IMPERSONATION MODE</span>
            </div>
            
            <div className="hidden sm:flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <User className="h-4 w-4" />
                <span>Original: <strong>{displayInfo.originalEmail}</strong></span>
              </div>
              <span>→</span>
              <div className="flex items-center space-x-1">
                <User className="h-4 w-4" />
                <span>Viewing as: <strong>{displayInfo.targetEmail}</strong></span>
              </div>
            </div>
          </div>

          <button
            onClick={handleExitImpersonation}
            disabled={isExiting}
            className="flex items-center space-x-2 bg-white text-orange-600 px-4 py-2 rounded-md font-medium hover:bg-orange-50 transition-colors disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" />
            <span>{isExiting ? 'Exiting...' : 'Exit Impersonation'}</span>
          </button>
        </div>

        {/* Mobile view */}
        <div className="sm:hidden pb-3 text-sm">
          <div className="flex flex-col space-y-1">
            <span>From: <strong>{displayInfo.originalEmail}</strong></span>
            <span>As: <strong>{displayInfo.targetEmail}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
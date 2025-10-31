import { useState, useEffect, useCallback } from 'react';
import { notifications } from '../lib/notifications';

interface MembershipApplication {
  id: string;
  institution_name: string;
  contact_person_email: string;
  membership_type: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  submitted_at: string;
}

interface UseApplicationNotificationsProps {
  enabled?: boolean;
  pollInterval?: number; // in milliseconds
}

export const useApplicationNotifications = ({ 
  enabled = true, 
  pollInterval = 30000 // 30 seconds default
}: UseApplicationNotificationsProps = {}) => {
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [newApplicationsCount, setNewApplicationsCount] = useState(0);

  const checkForNewApplications = useCallback(async () => {
    if (!enabled || isPolling) return;

    try {
      setIsPolling(true);
      
      // Get Supabase auth token
      const authData = localStorage.getItem('sb-english-australia-eau-supabase-auth-token');
      const token = authData ? JSON.parse(authData).access_token : null;
      
      if (!token) return; // User not authenticated

      const response = await fetch('http://localhost:3001/api/v1/admin/membership-applications', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        const applications: MembershipApplication[] = result.data;
        
        // Filter for new applications since last check
        if (lastChecked) {
          const newApps = applications.filter(app => 
            app.status === 'pending' && 
            new Date(app.submitted_at) > new Date(lastChecked)
          );

          if (newApps.length > 0) {
            setNewApplicationsCount(prev => prev + newApps.length);
            
            // Show notification for each new application
            newApps.forEach(app => {
              notifications.info(
                `New membership application from ${app.institution_name}`,
                {
                  duration: 8000,
                  position: 'top-right'
                }
              );
            });

            // Play notification sound (optional)
            try {
              const audio = new Audio('/notification.mp3'); // Add notification sound file to public folder
              audio.volume = 0.3;
              audio.play().catch(() => {
                // Ignore audio play errors (browser restrictions)
              });
            } catch (error) {
              // Ignore audio errors
            }
          }
        }

        setLastChecked(new Date().toISOString());
      }
    } catch (error) {
      console.error('Error checking for new applications:', error);
    } finally {
      setIsPolling(false);
    }
  }, [enabled, isPolling, lastChecked]);

  // Initialize last checked time
  useEffect(() => {
    if (enabled && !lastChecked) {
      setLastChecked(new Date().toISOString());
    }
  }, [enabled, lastChecked]);

  // Set up polling interval
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(checkForNewApplications, pollInterval);
    
    return () => clearInterval(interval);
  }, [checkForNewApplications, pollInterval, enabled]);

  // Check immediately when enabled
  useEffect(() => {
    if (enabled) {
      checkForNewApplications();
    }
  }, [enabled, checkForNewApplications]);

  const resetNotificationCount = useCallback(() => {
    setNewApplicationsCount(0);
  }, []);

  const forceCheck = useCallback(() => {
    checkForNewApplications();
  }, [checkForNewApplications]);

  return {
    newApplicationsCount,
    resetNotificationCount,
    forceCheck,
    isPolling,
    lastChecked
  };
};
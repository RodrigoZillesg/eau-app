import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { showNotification } from '../../lib/notifications';
import { useAuthStore } from '../../stores/authStore';

interface OpenLearningAccessButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const OpenLearningAccessButton: React.FC<OpenLearningAccessButtonProps> = ({
  className = '',
  variant = 'outline',
  size = 'md',
  fullWidth = false
}) => {
  const [loading, setLoading] = useState(false);
  const { getEffectiveUserId } = useAuthStore();
  const effectiveUserId = getEffectiveUserId();

  const handleOpenLearningAccess = async () => {
    if (!effectiveUserId) {
      showNotification('error', 'Please log in to access OpenLearning');
      return;
    }

    setLoading(true);
    try {
      // Get auth token for backend API
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        showNotification('error', 'Authentication required');
        return;
      }

      // Get member ID from user ID
      const { data: member } = await supabase
        .from('members')
        .select('id')
        .eq('user_id', effectiveUserId)
        .single();

      if (!member) {
        throw new Error('Member profile not found');
      }

      // Generate SSO link from backend (backend will handle provisioning if needed)
      console.log('Generating OpenLearning SSO link for member:', member.id);

      const ssoResponse = await fetch('http://localhost:3001/api/v1/openlearning/sso/launch', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          memberId: member.id
        })
      });

      if (!ssoResponse.ok) {
        const error = await ssoResponse.json();
        throw new Error(error.error || 'Failed to generate SSO link');
      }

      const result = await ssoResponse.json();
      console.log('SSO response:', result);

      if (result.success && result.launchData) {
        const launchData = result.launchData;

        // Create a form and submit it (LTI requires POST)
        const form = document.createElement('form');
        form.method = launchData.method || 'POST';
        form.action = launchData.url;
        form.target = '_blank';

        // Add all LTI/OAuth parameters as hidden fields
        if (launchData.params) {
          Object.entries(launchData.params).forEach(([key, value]) => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = String(value);
            form.appendChild(input);
          });
        }

        // Append form to body and submit
        document.body.appendChild(form);
        form.submit();

        // Clean up
        setTimeout(() => {
          document.body.removeChild(form);
        }, 100);

        showNotification('success', 'Opening OpenLearning...');
      } else {
        throw new Error(result.error || 'No SSO data received');
      }

    } catch (error: any) {
      console.error('Error accessing OpenLearning:', error);
      showNotification('error', error.message || 'Failed to access OpenLearning');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={`${fullWidth ? 'w-full' : ''} ${className} flex items-center justify-center gap-2`}
      onClick={handleOpenLearningAccess}
      disabled={loading}
    >
      {loading ? (
        <>
          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
          Connecting...
        </>
      ) : (
        <>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          Access OpenLearning
        </>
      )}
    </Button>
  );
};
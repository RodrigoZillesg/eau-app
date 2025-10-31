import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { BookOpen } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { showNotification } from '../lib/notifications';
import { useAuthStore } from '../stores/authStore';

interface OpenLearningSmartButtonProps {
  courseId: string;
  courseUrl: string;
  courseTitle?: string;
}

export const OpenLearningSmartButton: React.FC<OpenLearningSmartButtonProps> = ({
  courseId,
  courseUrl,
  courseTitle
}) => {
  const [launching, setLaunching] = useState(false);
  const [isOpenLearningAuthenticated, setIsOpenLearningAuthenticated] = useState(false);
  const { getEffectiveUserId } = useAuthStore();
  const effectiveUserId = getEffectiveUserId();

  useEffect(() => {
    checkOpenLearningAuth();
  }, []);

  const checkOpenLearningAuth = async () => {
    try {
      // Check if user has been provisioned in OpenLearning
      if (!effectiveUserId) return;

      const { data: member } = await supabase
        .from('members')
        .select('openlearning_user_id, openlearning_last_sso')
        .eq('user_id', effectiveUserId)
        .single();

      if (member?.openlearning_user_id) {
        // User has been provisioned
        // Check if SSO was done recently (within last 24 hours)
        if (member.openlearning_last_sso) {
          const lastSSO = new Date(member.openlearning_last_sso);
          const hoursSinceSSO = (Date.now() - lastSSO.getTime()) / (1000 * 60 * 60);

          // Consider authenticated if SSO was done in the last 24 hours
          setIsOpenLearningAuthenticated(hoursSinceSSO < 24);
        }
      }
    } catch (error) {
      console.error('Error checking OpenLearning auth:', error);
    }
  };

  const handleClick = async () => {
    if (!effectiveUserId) {
      showNotification('error', 'Please log in to access courses');
      return;
    }

    setLaunching(true);

    try {
      if (isOpenLearningAuthenticated) {
        // User is already authenticated, just open the course URL
        console.log('User authenticated, opening direct link:', courseUrl);
        window.open(courseUrl, '_blank');
        showNotification('success', 'Opening course...');
      } else {
        // User needs SSO
        console.log('User needs SSO, launching SSO flow');
        await launchWithSSO();

        // Update the last SSO timestamp
        await supabase
          .from('members')
          .update({ openlearning_last_sso: new Date().toISOString() })
          .eq('user_id', effectiveUserId);

        // Update local state
        setIsOpenLearningAuthenticated(true);
      }
    } catch (error: any) {
      console.error('Error accessing course:', error);
      showNotification('error', error.message || 'Failed to access course');
    } finally {
      setLaunching(false);
    }
  };

  const launchWithSSO = async () => {
    // Get auth token
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.access_token) {
      throw new Error('Authentication required');
    }

    // Get member data
    const { data: member } = await supabase
      .from('members')
      .select('id')
      .eq('user_id', effectiveUserId)
      .single();

    if (!member) {
      throw new Error('Member profile not found');
    }

    // Launch SSO without specific course (general login)
    const ssoResponse = await fetch('http://localhost:3001/api/v1/openlearning/sso/launch', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        memberId: member.id
        // Not sending classId/courseId to avoid the "course not set up" error
      })
    });

    if (!ssoResponse.ok) {
      const error = await ssoResponse.json();
      throw new Error(error.error || 'Failed to generate SSO link');
    }

    const result = await ssoResponse.json();

    if (result.success && result.launchData) {
      const launchData = result.launchData;

      // Create form and submit for SSO
      const form = document.createElement('form');
      form.method = launchData.method || 'POST';
      form.action = launchData.url;
      form.target = '_blank';

      if (launchData.params) {
        Object.entries(launchData.params).forEach(([key, value]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = String(value);
          form.appendChild(input);
        });
      }

      document.body.appendChild(form);
      form.submit();

      setTimeout(() => {
        document.body.removeChild(form);
      }, 100);

      // After SSO, user should navigate to the course manually
      // Show a notification to guide them
      setTimeout(() => {
        showNotification('info', 'Now you can access the course from OpenLearning');
      }, 3000);
    } else {
      throw new Error(result.error || 'No SSO data received');
    }
  };

  return (
    <Button
      variant="default"
      size="sm"
      className="w-full"
      onClick={handleClick}
      disabled={launching}
    >
      {launching ? (
        <>
          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
          Opening...
        </>
      ) : (
        <>
          <BookOpen className="w-4 h-4 mr-2" />
          {isOpenLearningAuthenticated ? 'Open Course' : 'Access Course (Login Required)'}
        </>
      )}
    </Button>
  );
};
import React, { useState } from 'react';
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
  const { getEffectiveUserId } = useAuthStore();
  const effectiveUserId = getEffectiveUserId();

  const handleClick = async () => {
    if (!effectiveUserId) {
      showNotification('error', 'Please log in to access courses');
      return;
    }

    setLaunching(true);

    try {
      // Check if user has done SSO recently (within last 4 hours)
      const { data: member } = await supabase
        .from('members')
        .select('openlearning_last_sso')
        .eq('user_id', effectiveUserId)
        .single();

      const lastSSO = member?.openlearning_last_sso;
      const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
      const needsSSO = !lastSSO || new Date(lastSSO) < fourHoursAgo;

      if (needsSSO) {
        // First time or SSO expired - do general SSO first
        console.log('First time access or SSO expired - launching general SSO...');
        await launchWithSSO();

        // Update timestamp
        await supabase
          .from('members')
          .update({ openlearning_last_sso: new Date().toISOString() })
          .eq('user_id', effectiveUserId);

        // After SSO, redirect to course
        setTimeout(() => {
          console.log('Redirecting to course:', courseUrl);
          window.open(courseUrl, '_blank');
        }, 2000);
      } else {
        // Already authenticated - just open the course URL directly
        console.log('Already authenticated - opening course directly:', courseUrl);
        window.open(courseUrl, '_blank');
        showNotification('success', 'Opening course...');
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

    // Launch GENERAL SSO (no courseId - just authenticate)
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
    const ssoResponse = await fetch(`${backendUrl}/api/v1/openlearning/sso/launch`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        memberId: member.id
        // NOT sending classId - general SSO only
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

      showNotification('info', 'Authenticating... Course will open shortly');
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
          Access Course
        </>
      )}
    </Button>
  );
};

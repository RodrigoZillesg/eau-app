import React from 'react';
import { Button } from './ui/Button';
import { BookOpen, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { showNotification } from '../lib/notifications';
import { useAuthStore } from '../stores/authStore';

interface OpenLearningDirectLinkProps {
  courseId: string;
  courseUrl: string;
  courseTitle?: string;
  variant?: 'button' | 'link';
}

export const OpenLearningDirectLink: React.FC<OpenLearningDirectLinkProps> = ({
  courseId,
  courseUrl,
  courseTitle,
  variant = 'button'
}) => {
  const [launching, setLaunching] = React.useState(false);
  const { getEffectiveUserId } = useAuthStore();
  const effectiveUserId = getEffectiveUserId();

  const handleAccessCourse = async () => {
    if (!effectiveUserId) {
      showNotification('error', 'Please log in to access courses');
      return;
    }

    setLaunching(true);
    try {
      // Get auth token
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        showNotification('error', 'Authentication required');
        return;
      }

      // Get member data
      const { data: member } = await supabase
        .from('members')
        .select('id, openlearning_user_id')
        .eq('user_id', effectiveUserId)
        .single();

      if (!member) {
        throw new Error('Member profile not found');
      }

      // Check if user has been provisioned in OpenLearning
      if (!member.openlearning_user_id) {
        console.log('User not provisioned in OpenLearning, will do SSO');
        // User needs SSO for first-time provisioning
        await launchWithSSO(session.session.access_token, member.id, courseId);
      } else {
        console.log('User already provisioned, trying direct link first');
        // User already provisioned, try direct link first
        // Use the original course URL instead of constructing one
        console.log('Opening direct URL:', courseUrl);

        // Open in new tab
        const newWindow = window.open(courseUrl, '_blank');

        // Set a timeout to check if we need SSO fallback
        setTimeout(async () => {
          // If window is still open and user reports issues, they can click again for SSO
          showNotification('info', 'If you see an error, click the button again to authenticate');
        }, 3000);
      }

      showNotification('success', 'Opening course...');
    } catch (error: any) {
      console.error('Error accessing course:', error);
      showNotification('error', error.message || 'Failed to access course');
    } finally {
      setLaunching(false);
    }
  };

  const launchWithSSO = async (token: string, memberId: string, courseId: string) => {
    console.log('Launching with SSO for course:', courseId);

    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
    const ssoResponse = await fetch(`${backendUrl}/api/v1/openlearning/sso/launch`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        memberId: memberId,
        classId: courseId
      })
    });

    if (!ssoResponse.ok) {
      const error = await ssoResponse.json();
      throw new Error(error.error || 'Failed to generate SSO link');
    }

    const result = await ssoResponse.json();

    if (result.success && result.launchData) {
      const launchData = result.launchData;

      // Create form and submit
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
    } else {
      throw new Error(result.error || 'No SSO data received');
    }
  };

  if (variant === 'link') {
    return (
      <a
        href={courseUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 underline"
      >
        {courseTitle || 'View Course'}
        <ExternalLink className="w-4 h-4" />
      </a>
    );
  }

  return (
    <Button
      variant="default"
      size="sm"
      className="flex-1"
      onClick={handleAccessCourse}
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
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { OpenLearningAccessButton } from './OpenLearningAccessButton';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';

export const OpenLearningCard: React.FC = () => {
  const [stats, setStats] = useState({
    coursesCompleted: 0,
    cpdPointsEarned: 0,
    lastSync: null as string | null,
    loading: true
  });

  const { getEffectiveUserId } = useAuthStore();
  const effectiveUserId = getEffectiveUserId();

  useEffect(() => {
    const fetchOpenLearningStats = async () => {
      if (!effectiveUserId) return;

      try {
        // Get member info
        const { data: member } = await supabase
          .from('members')
          .select('id, openlearning_user_id, openlearning_last_sync')
          .eq('user_id', effectiveUserId)
          .single();

        if (!member) {
          setStats(prev => ({ ...prev, loading: false }));
          return;
        }

        // Get OpenLearning courses and CPD activities
        const { data: courses } = await supabase
          .from('openlearning_courses')
          .select('*, cpd_activities(*)')
          .eq('member_id', member.id);

        let coursesCompleted = 0;
        let cpdPointsEarned = 0;

        if (courses) {
          coursesCompleted = courses.filter(c => c.completion_percentage >= 100).length;
          courses.forEach(course => {
            if (course.cpd_activities) {
              cpdPointsEarned += course.cpd_activities.cpd_points || 0;
            }
          });
        }

        setStats({
          coursesCompleted,
          cpdPointsEarned,
          lastSync: member.openlearning_last_sync,
          loading: false
        });
      } catch (error) {
        console.error('Error fetching OpenLearning stats:', error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchOpenLearningStats();
  }, [effectiveUserId]);

  const formatLastSync = (date: string | null) => {
    if (!date) return 'Never synced';

    const syncDate = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - syncDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) return 'Less than 1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return syncDate.toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          OpenLearning
        </CardTitle>
        <CardDescription>
          Access your online courses and training materials
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stats.loading ? (
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Courses Completed:</span>
                  <span className="text-lg font-semibold text-indigo-600">
                    {stats.coursesCompleted}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">CPD Points Earned:</span>
                  <span className="text-lg font-semibold text-green-600">
                    {stats.cpdPointsEarned}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Last Sync:</span>
                  <span className="text-xs text-gray-500">
                    {formatLastSync(stats.lastSync)}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t">
                <OpenLearningAccessButton
                  variant="default"
                  fullWidth={true}
                />
              </div>

              <div className="text-xs text-gray-500 text-center">
                Click to access your courses and certifications
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
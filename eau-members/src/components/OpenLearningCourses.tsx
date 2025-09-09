import React, { useEffect, useState } from 'react';
import { openLearningService, OpenLearningCourse } from '../services/openlearningService';
import { format } from 'date-fns';
import { showNotification } from '../utils/notifications';
import { ExternalLink, Award, Calendar, CheckCircle, Clock } from 'lucide-react';

interface OpenLearningCoursesProps {
  memberId?: string;
  showSync?: boolean;
  onCourseClick?: (course: OpenLearningCourse) => void;
}

export const OpenLearningCourses: React.FC<OpenLearningCoursesProps> = ({
  memberId,
  showSync = true,
  onCourseClick
}) => {
  const [courses, setCourses] = useState<OpenLearningCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    loadCourses();
  }, [memberId]);

  const loadCourses = async () => {
    setIsLoading(true);
    try {
      const result = await openLearningService.getCourses(memberId);
      if (result.success && result.courses) {
        setCourses(result.courses);
      }
    } catch (error) {
      console.error('Error loading OpenLearning courses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const result = await openLearningService.syncCourses(memberId);
      if (result.success) {
        showNotification('success', result.message || 'Courses synced successfully');
        await loadCourses();
      } else {
        showNotification('error', result.error || 'Failed to sync courses');
      }
    } catch (error) {
      showNotification('error', 'Error syncing courses');
    } finally {
      setIsSyncing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-100 rounded"></div>
            <div className="h-20 bg-gray-100 rounded"></div>
            <div className="h-20 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Award className="h-6 w-6 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">OpenLearning Courses</h3>
          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {courses.length} courses
          </span>
        </div>
        
        {showSync && (
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isSyncing ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Syncing...
              </>
            ) : (
              <>
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Sync to CPD
              </>
            )}
          </button>
        )}
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-8">
          <Award className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">No OpenLearning courses found</p>
          <p className="mt-1 text-xs text-gray-400">Complete courses in OpenLearning and sync them to see them here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {courses.map((course) => (
            <div
              key={course.id}
              onClick={() => onCourseClick?.(course)}
              className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                onCourseClick ? 'cursor-pointer' : ''
              } ${course.cpd_activity_id ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <h4 className="text-sm font-medium text-gray-900">{course.course_name}</h4>
                    {course.cpd_activity_id && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        In CPD
                      </span>
                    )}
                  </div>
                  
                  {course.course_description && (
                    <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                      {course.course_description}
                    </p>
                  )}
                  
                  <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      Completed: {format(new Date(course.completion_date), 'MMM d, yyyy')}
                    </div>
                    
                    {course.completion_percentage && (
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-1.5">
                          <div 
                            className="bg-blue-600 h-1.5 rounded-full" 
                            style={{ width: `${course.completion_percentage}%` }}
                          />
                        </div>
                        <span className="ml-1">{course.completion_percentage}%</span>
                      </div>
                    )}
                    
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      Synced: {format(new Date(course.synced_at), 'MMM d, HH:mm')}
                    </div>
                  </div>
                </div>
                
                {course.certificate_url && (
                  <a
                    href={course.certificate_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="ml-4 p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
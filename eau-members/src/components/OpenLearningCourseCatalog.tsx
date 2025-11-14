import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Search, BookOpen, Clock, DollarSign } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { showNotification } from '../lib/notifications';
import { useAuthStore } from '../stores/authStore';
import { OpenLearningSmartButton } from './OpenLearningSmartButton';

interface Course {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  url: string;
  price: number | null;
  selfPaced: boolean;
}

export const OpenLearningCourseCatalog: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    // Filter courses based on search term
    if (searchTerm.trim() === '') {
      setFilteredCourses(courses);
    } else {
      const filtered = courses.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCourses(filtered);
    }
  }, [searchTerm, courses]);

  const fetchCourses = async () => {
    try {
      // Get auth token
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        console.log('No auth token available');
        setLoading(false);
        return;
      }

      // Fetch courses from backend API
      const response = await fetch('http://localhost:3001/api/v1/openlearning-courses/available', {
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.courses) {
        setCourses(data.courses);
        setFilteredCourses(data.courses);
      }
    } catch (error: any) {
      console.error('Error fetching courses:', error);
      // Don't show error notification, just log it (silent failure)
      // User will see "No courses available" message instead
    } finally {
      setLoading(false);
    }
  };



  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Loading courses...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Search */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">OpenLearning Courses</h2>
            <p className="text-gray-600 mt-1">
              Browse and access {courses.length} available professional development courses
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {searchTerm ? 'No courses found matching your search' : 'No courses available'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map(course => (
            <Card key={course.id} className="hover:shadow-lg transition-shadow duration-200">
              {/* Course Image */}
              {course.imageUrl && (
                <div className="aspect-video bg-gray-100 overflow-hidden">
                  <img
                    src={course.imageUrl}
                    alt={course.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              <CardContent className="p-6">
                {/* Course Title */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                  {course.title}
                </h3>

                {/* Course Description */}
                {course.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {course.description}
                  </p>
                )}

                {/* Course Meta */}
                <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
                  {course.selfPaced && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>Self-paced</span>
                    </div>
                  )}
                  {course.price && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      <span>${course.price}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="w-full">
                  <OpenLearningSmartButton
                    courseId={course.id}
                    courseUrl={course.url}
                    courseTitle={course.title}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
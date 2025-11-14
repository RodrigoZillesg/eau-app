import React, { useState, useEffect } from 'react';
import { Search, CheckCircle, XCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { showNotification } from '../../../lib/notifications';
import { supabase } from '../../../lib/supabase/client';

interface Course {
  id: string;
  courseId: string;
  title: string;
  description: string;
  imageUrl: string;
  url: string;
  price: number | null;
  selfPaced: boolean;
  isAvailable: boolean;
  isManuallyDisabled: boolean;
  disabledAt: string | null;
  lastChecked: string;
}

export default function OpenLearningCoursesManagement() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [processingCourseId, setProcessingCourseId] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const fetchCourses = async () => {
    try {
      setLoading(true);

      // Get token from Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('http://localhost:3001/api/v1/openlearning-courses/all', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch courses');

      const data = await response.json();
      setCourses(data.courses);
      setFilteredCourses(data.courses);
    } catch (error: any) {
      showNotification('error', 'Failed to load courses', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    let filtered = courses;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter === 'enabled') {
      filtered = filtered.filter(course => !course.isManuallyDisabled);
    } else if (statusFilter === 'disabled') {
      filtered = filtered.filter(course => course.isManuallyDisabled);
    }

    setFilteredCourses(filtered);
  }, [searchTerm, statusFilter, courses]);

  const toggleCourseStatus = async (course: Course) => {
    try {
      setProcessingCourseId(course.courseId);

      // Get token from Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('No authentication token found');
      }

      const action = course.isManuallyDisabled ? 'enable' : 'disable';

      const response = await fetch(
        `http://localhost:3001/api/v1/openlearning-courses/${course.courseId}/${action}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) throw new Error(`Failed to ${action} course`);

      showNotification(
        'success',
        `Course ${action}d successfully`,
        `"${course.title}" has been ${action}d`
      );

      // Clear selection after action
      setSelectedCourseId(null);

      // Refresh the list
      await fetchCourses();
    } catch (error: any) {
      showNotification('error', 'Operation failed', error.message);
    } finally {
      setProcessingCourseId(null);
    }
  };

  const stats = {
    total: courses.length,
    enabled: courses.filter(c => !c.isManuallyDisabled).length,
    disabled: courses.filter(c => c.isManuallyDisabled).length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            OpenLearning Course Management
          </h1>
          <p className="text-gray-600">
            Manage which courses are visible to members in the course catalog
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Courses</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Enabled</p>
                <p className="text-3xl font-bold text-green-600">{stats.enabled}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Disabled</p>
                <p className="text-3xl font-bold text-red-600">{stats.disabled}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Courses
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by title or description..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Courses ({stats.total})</option>
                <option value="enabled">Enabled Only ({stats.enabled})</option>
                <option value="disabled">Disabled Only ({stats.disabled})</option>
              </select>
            </div>
          </div>
        </div>

        {/* Courses List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCourses.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                      No courses found matching your filters
                    </td>
                  </tr>
                ) : (
                  filteredCourses.map((course) => (
                    <tr
                      key={course.id}
                      className={`transition-colors ${
                        selectedCourseId === course.courseId
                          ? 'bg-yellow-50 hover:bg-yellow-100'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <img
                            src={course.imageUrl}
                            alt={course.title}
                            className="w-16 h-16 rounded-lg object-cover mr-4"
                          />
                          <div>
                            <div className="font-medium text-gray-900">{course.title}</div>
                            <div className="text-sm text-gray-500 line-clamp-2">
                              {course.description || 'No description'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {course.isManuallyDisabled ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                            <XCircle className="w-4 h-4 mr-1" />
                            Disabled
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Enabled
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {/* View on OpenLearning button */}
                          <a
                            href={course.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setSelectedCourseId(course.courseId)}
                            className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                            title="View course on OpenLearning to check if it's active"
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            View
                          </a>

                          {/* Enable/Disable button */}
                          <button
                            onClick={() => toggleCourseStatus(course)}
                            disabled={processingCourseId === course.courseId}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              course.isManuallyDisabled
                                ? 'bg-green-600 text-white hover:bg-green-700'
                                : 'bg-red-600 text-white hover:bg-red-700'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {processingCourseId === course.courseId ? (
                              <RefreshCw className="w-4 h-4 animate-spin inline" />
                            ) : course.isManuallyDisabled ? (
                              'Enable'
                            ) : (
                              'Disable'
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            How to Manage Courses
          </h3>
          <ul className="text-blue-800 space-y-2">
            <li>• <strong>View Button:</strong> Click to open the course on OpenLearning in a new tab - <span className="bg-yellow-100 px-1 rounded">the row will be highlighted in yellow</span> so you know which course you're checking</li>
            <li>• <strong>Check Course Status:</strong> On OpenLearning, verify if the course shows "This course is currently unavailable"</li>
            <li>• <strong>Return & Act:</strong> Come back to this page - the highlighted row shows you exactly which course to disable</li>
            <li>• <strong>Disable Button:</strong> Hide inactive courses from the member catalog - they won't see unavailable courses</li>
            <li>• <strong>Enable Button:</strong> Make courses visible again in the member catalog</li>
            <li>• <strong>Search & Filter:</strong> Use the search box and status filter to quickly find specific courses</li>
            <li>• <strong>Changes are immediate:</strong> All changes take effect instantly for all members</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

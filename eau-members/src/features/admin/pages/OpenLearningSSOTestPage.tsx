import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { showNotification } from '../../../lib/notifications';
import { supabase } from '../../../lib/supabase';
import { SkeletonLoader } from '../../../components/ui/SkeletonLoader';
import { User, ExternalLink, CheckCircle, XCircle, RefreshCw, Award, Book, Clock, Users } from 'lucide-react';

interface Member {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  openlearning_user_id?: string;
  openlearning_external_id?: string;
  openlearning_sync_enabled?: boolean;
  openlearning_last_sync?: string;
  openlearning_provisioned_at?: string;
}

interface OpenLearningCourse {
  id: string;
  course_name: string;
  course_description?: string;
  completion_date?: string;
  completion_percentage?: number;
  certificate_url?: string;
  cpd_activity_id?: string;
  synced_at: string;
}

export default function OpenLearningSSOTestPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [memberCourses, setMemberCourses] = useState<OpenLearningCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [provisioningLoading, setProvisioningLoading] = useState(false);
  const [ssoLoading, setSsoLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadMembers();
  }, []);

  useEffect(() => {
    if (selectedMember) {
      loadMemberCourses(selectedMember.id);
    }
  }, [selectedMember]);

  const loadMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error loading members:', error);
      showNotification('Error loading members', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadMemberCourses = async (memberId: string) => {
    setCoursesLoading(true);
    try {
      const { data, error } = await supabase
        .from('openlearning_courses')
        .select('*')
        .eq('member_id', memberId)
        .order('completion_date', { ascending: false });

      if (error) throw error;
      setMemberCourses(data || []);
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setCoursesLoading(false);
    }
  };

  const handleProvisionUser = async (member: Member) => {
    setProvisioningLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/v1/openlearning/provision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          memberId: member.id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to provision user');
      }

      showNotification(`User ${member.first_name} ${member.last_name} provisioned successfully!`, 'success');

      // Reload members to update status
      await loadMembers();

      // Update selected member
      const updatedMember = members.find(m => m.id === member.id);
      if (updatedMember) {
        setSelectedMember(updatedMember);
      }
    } catch (error: any) {
      console.error('Error provisioning user:', error);
      showNotification(error.message || 'Failed to provision user', 'error');
    } finally {
      setProvisioningLoading(false);
    }
  };

  const handleGenerateSSO = async (member: Member) => {
    setSsoLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/v1/openlearning/sso', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          memberId: member.id,
          returnUrl: window.location.origin + '/dashboard'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate SSO');
      }

      // Create form and submit to launch SSO
      if (data.launchData?.url) {
        const form = document.createElement('form');
        form.method = data.launchData.method || 'POST';
        form.action = data.launchData.url;
        form.target = '_blank';

        // Add all params as hidden fields
        if (data.launchData.params) {
          Object.entries(data.launchData.params).forEach(([key, value]) => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = String(value);
            form.appendChild(input);
          });
        }

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);

        showNotification('SSO launched in new tab!', 'success');
      } else {
        throw new Error('No launch URL received');
      }
    } catch (error: any) {
      console.error('Error generating SSO:', error);
      showNotification(error.message || 'Failed to generate SSO', 'error');
    } finally {
      setSsoLoading(false);
    }
  };

  const handleSyncCourses = async (member: Member) => {
    setSyncLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/v1/openlearning/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          memberId: member.id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync courses');
      }

      showNotification(data.message || 'Courses synced successfully!', 'success');

      // Reload courses
      await loadMemberCourses(member.id);
    } catch (error: any) {
      console.error('Error syncing courses:', error);
      showNotification(error.message || 'Failed to sync courses', 'error');
    } finally {
      setSyncLoading(false);
    }
  };

  const filteredMembers = members.filter(member =>
    member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SkeletonLoader width="100%" height="400px" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">OpenLearning SSO Test</h1>
        <p className="mt-2 text-gray-600">
          Test provisioning, SSO launch, and course synchronization for members
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Members List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Select a Member</h2>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="max-h-96 overflow-y-auto">
            {filteredMembers.map((member) => (
              <div
                key={member.id}
                onClick={() => setSelectedMember(member)}
                className={`p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${
                  selectedMember?.id === member.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gray-100 p-2 rounded-full">
                      <User className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {member.first_name} {member.last_name}
                      </div>
                      <div className="text-sm text-gray-500">{member.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    {member.openlearning_user_id ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Member Details & Actions */}
        <div className="space-y-6">
          {selectedMember ? (
            <>
              {/* Member Info Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Member Details</h3>

                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Name:</span>
                    <p className="text-gray-900">{selectedMember.first_name} {selectedMember.last_name}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Email:</span>
                    <p className="text-gray-900">{selectedMember.email}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">OpenLearning Status:</span>
                    <p className={`font-medium ${selectedMember.openlearning_user_id ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedMember.openlearning_user_id ? 'Provisioned' : 'Not Provisioned'}
                    </p>
                  </div>
                  {selectedMember.openlearning_user_id && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">OpenLearning User ID:</span>
                      <p className="text-gray-900 font-mono text-xs">{selectedMember.openlearning_user_id}</p>
                    </div>
                  )}
                  {selectedMember.openlearning_provisioned_at && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Provisioned At:</span>
                      <p className="text-gray-900">
                        {format(new Date(selectedMember.openlearning_provisioned_at), 'PPp')}
                      </p>
                    </div>
                  )}
                  {selectedMember.openlearning_last_sync && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Last Sync:</span>
                      <p className="text-gray-900">
                        {format(new Date(selectedMember.openlearning_last_sync), 'PPp')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Actions</h3>

                <div className="space-y-3">
                  {/* Provision User Button */}
                  <button
                    onClick={() => handleProvisionUser(selectedMember)}
                    disabled={provisioningLoading || !!selectedMember.openlearning_user_id}
                    className={`w-full flex items-center justify-center px-4 py-2 rounded-md text-white font-medium ${
                      selectedMember.openlearning_user_id
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700'
                    } disabled:opacity-50`}
                  >
                    {provisioningLoading ? (
                      <>
                        <RefreshCw className="animate-spin h-5 w-5 mr-2" />
                        Provisioning...
                      </>
                    ) : (
                      <>
                        <Users className="h-5 w-5 mr-2" />
                        {selectedMember.openlearning_user_id ? 'Already Provisioned' : 'Provision User'}
                      </>
                    )}
                  </button>

                  {/* Generate SSO Button */}
                  <button
                    onClick={() => handleGenerateSSO(selectedMember)}
                    disabled={ssoLoading || !selectedMember.openlearning_user_id}
                    className={`w-full flex items-center justify-center px-4 py-2 rounded-md text-white font-medium ${
                      !selectedMember.openlearning_user_id
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                    } disabled:opacity-50`}
                  >
                    {ssoLoading ? (
                      <>
                        <RefreshCw className="animate-spin h-5 w-5 mr-2" />
                        Generating SSO...
                      </>
                    ) : (
                      <>
                        <ExternalLink className="h-5 w-5 mr-2" />
                        Launch SSO (Opens New Tab)
                      </>
                    )}
                  </button>

                  {/* Sync Courses Button */}
                  <button
                    onClick={() => handleSyncCourses(selectedMember)}
                    disabled={syncLoading || !selectedMember.openlearning_user_id}
                    className={`w-full flex items-center justify-center px-4 py-2 rounded-md text-white font-medium ${
                      !selectedMember.openlearning_user_id
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-purple-600 hover:bg-purple-700'
                    } disabled:opacity-50`}
                  >
                    {syncLoading ? (
                      <>
                        <RefreshCw className="animate-spin h-5 w-5 mr-2" />
                        Syncing Courses...
                      </>
                    ) : (
                      <>
                        <Book className="h-5 w-5 mr-2" />
                        Sync Courses & Certificates
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Synced Courses */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Synced Courses ({memberCourses.length})
                </h3>

                {coursesLoading ? (
                  <SkeletonLoader width="100%" height="100px" />
                ) : memberCourses.length > 0 ? (
                  <div className="space-y-3">
                    {memberCourses.map((course) => (
                      <div key={course.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{course.course_name}</h4>
                            {course.course_description && (
                              <p className="text-sm text-gray-500 mt-1">{course.course_description}</p>
                            )}
                            <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500">
                              {course.completion_date && (
                                <div className="flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {format(new Date(course.completion_date), 'PP')}
                                </div>
                              )}
                              <div className="flex items-center">
                                <div className="w-20 bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-green-600 h-2 rounded-full"
                                    style={{ width: `${course.completion_percentage || 0}%` }}
                                  />
                                </div>
                                <span className="ml-2">{course.completion_percentage || 0}%</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            {course.certificate_url && (
                              <a
                                href={course.certificate_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <Award className="h-5 w-5" />
                              </a>
                            )}
                            {course.cpd_activity_id && (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                CPD Created
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    No courses synced yet. Click "Sync Courses & Certificates" to check for completed courses.
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="bg-gray-50 rounded-lg p-12 text-center">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Select a member to test OpenLearning integration</p>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-blue-900 mb-2">Test Flow Instructions</h4>
        <ol className="list-decimal list-inside text-sm text-blue-800 space-y-2">
          <li>Select a member from the list on the left</li>
          <li>If not provisioned, click "Provision User" to create their OpenLearning account</li>
          <li>Click "Launch SSO" to test single sign-on (opens in new tab)</li>
          <li>Complete a course in OpenLearning platform</li>
          <li>Return here and click "Sync Courses & Certificates" to import completed courses</li>
          <li>Synced courses will automatically create CPD activities if 100% complete</li>
        </ol>
      </div>
    </div>
  );
}
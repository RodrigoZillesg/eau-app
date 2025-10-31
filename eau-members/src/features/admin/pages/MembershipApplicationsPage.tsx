import React, { useState, useEffect, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Check, X, Eye, Clock, FileText, Filter, Search, Calendar, Building, MapPin } from 'lucide-react';
import { notifications } from '../../../lib/notifications';
import { StatsCardSkeleton } from '../../../components/ui/SkeletonLoader';
import { getUserInstitution } from '../../../services/institutionService';
import { useAuthStore } from '../../../stores/authStore';

interface MembershipApplication {
  id: string;
  institution_name: string;
  institution_id?: string; // Link to institution if application is for existing institution
  contact_person_email: string;
  membership_type: string;
  application_data: {
    institutionName: string;
    institutionType: string;
    website?: string;
    establishedYear?: number;
    streetAddress: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    contactPersonName: string;
    contactPersonTitle: string;
    contactPersonEmail: string;
    contactPersonPhone: string;
    numberOfStudents?: number;
    accreditations?: string[];
    specialPrograms?: string;
    motivationStatement: string;
  };
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  review_notes?: string;
  approved_at?: string;
  rejected_at?: string;
}

interface MembershipApplicationsPageProps {}

// Predefined rejection reasons
const REJECTION_REASONS = [
  'Insufficient documentation provided',
  'Institution does not meet minimum requirements',
  'Application incomplete or missing required information',
  'Institution type not eligible for selected membership',
  'Accreditation requirements not met',
  'Previous membership issues on record',
  'Geographic location restrictions apply',
  'Institution not actively teaching English',
  'Financial requirements not demonstrated',
  'Other (please specify below)'
];

export const MembershipApplicationsPage: React.FC<MembershipApplicationsPageProps> = () => {
  const { roles } = useAuthStore();
  const [applications, setApplications] = useState<MembershipApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<MembershipApplication | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [userInstitution, setUserInstitution] = useState<{ institutionId: string | null; institutionName: string }>({
    institutionId: null,
    institutionName: 'All Institutions'
  });

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [membershipTypeFilter, setMembershipTypeFilter] = useState<string>('all');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Rejection modal states
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingApplication, setRejectingApplication] = useState<MembershipApplication | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [customRejectionReason, setCustomRejectionReason] = useState('');

  useEffect(() => {
    fetchApplications();
  }, []);

  // Filtered applications with memoization for performance
  const filteredApplications = useMemo(() => {
    let filtered = applications;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(app =>
        app.institution_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.contact_person_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.application_data.contactPersonName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.application_data.city.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    // Membership type filter
    if (membershipTypeFilter !== 'all') {
      filtered = filtered.filter(app => app.membership_type === membershipTypeFilter);
    }

    // State filter
    if (stateFilter !== 'all') {
      filtered = filtered.filter(app => app.application_data.state === stateFilter);
    }

    // Date range filter
    if (dateRangeFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateRangeFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        default:
          break;
      }
      
      if (dateRangeFilter !== 'all') {
        filtered = filtered.filter(app => 
          new Date(app.submitted_at) >= filterDate
        );
      }
    }

    return filtered;
  }, [applications, searchTerm, statusFilter, membershipTypeFilter, stateFilter, dateRangeFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = applications.length;
    const pending = applications.filter(app => app.status === 'pending').length;
    const underReview = applications.filter(app => app.status === 'under_review').length;
    const approved = applications.filter(app => app.status === 'approved').length;
    const rejected = applications.filter(app => app.status === 'rejected').length;
    
    return { total, pending, underReview, approved, rejected };
  }, [applications]);

  // Get unique values for filter dropdowns
  const membershipTypes = useMemo(() => {
    return Array.from(new Set(applications.map(app => app.membership_type))).sort();
  }, [applications]);

  const states = useMemo(() => {
    return Array.from(new Set(applications.map(app => app.application_data.state))).sort();
  }, [applications]);

  const fetchApplications = async () => {
    try {
      setLoading(true);

      // Get user's institution context
      const institution = await getUserInstitution();
      setUserInstitution(institution);

      // Get Supabase auth token
      const authData = localStorage.getItem('sb-english-australia-eau-supabase-auth-token');
      const token = authData ? JSON.parse(authData).access_token : null;

      const response = await fetch('http://localhost:3001/api/v1/admin/membership-applications', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        let applicationsData = result.data;

        // Filter applications for Institution Admin
        if (!roles.includes('AdminSuper') && institution.institutionId) {
          // For Institution Admin, show only applications related to their institution
          applicationsData = applicationsData.filter((app: MembershipApplication) =>
            app.institution_id === institution.institutionId ||
            app.institution_name === institution.institutionName
          );
        }

        setApplications(applicationsData);
      } else {
        notifications.error('Error loading applications');
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      notifications.error('Error loading applications');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectWithReason = async () => {
    if (!rejectingApplication) return;

    const finalRejectionReason = rejectionReason === 'Other (please specify below)' 
      ? customRejectionReason 
      : rejectionReason;

    if (!finalRejectionReason.trim()) {
      notifications.error('Please select or specify a rejection reason');
      return;
    }

    try {
      await handleApplicationAction(rejectingApplication.id, 'reject', finalRejectionReason);
      
      // Close modal and reset states
      setShowRejectModal(false);
      setRejectingApplication(null);
      setRejectionReason('');
      setCustomRejectionReason('');
    } catch (error) {
      console.error('Error rejecting application:', error);
    }
  };

  const handleApplicationAction = async (applicationId: string, action: 'approve' | 'reject', notes?: string) => {
    try {
      setProcessing(true);
      
      // Get Supabase auth token
      const authData = localStorage.getItem('sb-english-australia-eau-supabase-auth-token');
      const token = authData ? JSON.parse(authData).access_token : null;
      
      const response = await fetch(`http://localhost:3001/api/v1/admin/membership-applications/${applicationId}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          review_notes: notes || reviewNotes,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        notifications.success(
          `Application ${action === 'approve' ? 'approved' : 'rejected'} successfully`
        );
        
        // Refresh applications list
        await fetchApplications();
        setSelectedApplication(null);
        setReviewNotes('');
      } else {
        const error = await response.json();
        notifications.error(error.error || `Failed to ${action} application`);
      }
    } catch (error) {
      console.error(`Error ${action}ing application:`, error);
      notifications.error(`Error ${action}ing application`);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      pending: 'bg-yellow-100 text-yellow-800',
      under_review: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status as keyof typeof statusStyles]}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Membership Applications</h1>
        <p className="mt-2 text-gray-600">Review and manage incoming membership applications</p>
      </div>

      {/* Institution Context Indicator */}
      {!roles.includes('AdminSuper') && userInstitution.institutionId && (
        <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Institution View:</strong> Showing applications for {userInstitution.institutionName} only
          </p>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        {loading ? (
          <>
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </>
        ) : (
          <>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-400" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Under Review</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.underReview}</p>
                </div>
                <Eye className="h-8 w-8 text-blue-400" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                </div>
                <Check className="h-8 w-8 text-green-400" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Rejected</p>
                  <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                </div>
                <X className="h-8 w-8 text-red-400" />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search institutions, contacts, or locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {(statusFilter !== 'all' || membershipTypeFilter !== 'all' || stateFilter !== 'all' || dateRangeFilter !== 'all') && (
                <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  Active
                </span>
              )}
            </button>
            
            <span className="text-sm text-gray-500">
              {filteredApplications.length} of {applications.length} applications
            </span>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="under_review">Under Review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Membership Type</label>
                <select
                  value={membershipTypeFilter}
                  onChange={(e) => setMembershipTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  {membershipTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <select
                  value={stateFilter}
                  onChange={(e) => setStateFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All States</option>
                  {states.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                <select
                  value={dateRangeFilter}
                  onChange={(e) => setDateRangeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Applications List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          {filteredApplications.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No applications</h3>
              <p className="mt-1 text-sm text-gray-500">No membership applications to review at this time.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Institution
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact Person
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredApplications.map((application) => (
                    <tr key={application.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {application.institution_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {application.application_data.city}, {application.application_data.state}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {application.application_data.contactPersonName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {application.contact_person_email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{application.membership_type}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(application.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDistanceToNow(new Date(application.submitted_at), { addSuffix: true })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setSelectedApplication(application)}
                            className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </button>
                          {application.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApplicationAction(application.id, 'approve')}
                                disabled={processing}
                                className="text-green-600 hover:text-green-900 inline-flex items-center disabled:opacity-50"
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  setRejectingApplication(application);
                                  setShowRejectModal(true);
                                }}
                                disabled={processing}
                                className="text-red-600 hover:text-red-900 inline-flex items-center disabled:opacity-50"
                              >
                                <X className="w-4 h-4 mr-1" />
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Application Detail Modal */}
      {selectedApplication && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 lg:w-3/4 xl:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Application Details - {selectedApplication.institution_name}
                </h3>
                <button
                  onClick={() => setSelectedApplication(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6 max-h-96 overflow-y-auto">
                {/* Institution Information */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-2">Institution Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-500">Name:</span>
                      <p className="text-gray-900">{selectedApplication.application_data.institutionName}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Type:</span>
                      <p className="text-gray-900">{selectedApplication.application_data.institutionType}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Website:</span>
                      <p className="text-gray-900">{selectedApplication.application_data.website || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Established:</span>
                      <p className="text-gray-900">{selectedApplication.application_data.establishedYear || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-2">Address</h4>
                  <div className="text-sm text-gray-900">
                    <p>{selectedApplication.application_data.streetAddress}</p>
                    <p>{selectedApplication.application_data.city}, {selectedApplication.application_data.state} {selectedApplication.application_data.postalCode}</p>
                    <p>{selectedApplication.application_data.country}</p>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-2">Contact Person</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-500">Name:</span>
                      <p className="text-gray-900">{selectedApplication.application_data.contactPersonName}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Title:</span>
                      <p className="text-gray-900">{selectedApplication.application_data.contactPersonTitle}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Email:</span>
                      <p className="text-gray-900">{selectedApplication.application_data.contactPersonEmail}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Phone:</span>
                      <p className="text-gray-900">{selectedApplication.application_data.contactPersonPhone}</p>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                {(selectedApplication.application_data.numberOfStudents || 
                  selectedApplication.application_data.accreditations?.length ||
                  selectedApplication.application_data.specialPrograms) && (
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-2">Additional Information</h4>
                    <div className="space-y-2 text-sm">
                      {selectedApplication.application_data.numberOfStudents && (
                        <div>
                          <span className="font-medium text-gray-500">Number of Students:</span>
                          <p className="text-gray-900">{selectedApplication.application_data.numberOfStudents}</p>
                        </div>
                      )}
                      {selectedApplication.application_data.accreditations?.length && (
                        <div>
                          <span className="font-medium text-gray-500">Accreditations:</span>
                          <p className="text-gray-900">{selectedApplication.application_data.accreditations.join(', ')}</p>
                        </div>
                      )}
                      {selectedApplication.application_data.specialPrograms && (
                        <div>
                          <span className="font-medium text-gray-500">Special Programs:</span>
                          <p className="text-gray-900">{selectedApplication.application_data.specialPrograms}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Motivation Statement */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-2">Motivation Statement</h4>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">
                    {selectedApplication.application_data.motivationStatement}
                  </p>
                </div>

                {/* Review Section */}
                {selectedApplication.status === 'pending' && (
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-2">Review Notes</h4>
                    <textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      rows={3}
                      placeholder="Add notes for your review decision..."
                    />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => setSelectedApplication(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Close
                </button>
                {selectedApplication.status === 'pending' && (
                  <>
                    <button
                      onClick={() => {
                        setRejectingApplication(selectedApplication);
                        setShowRejectModal(true);
                        setSelectedApplication(null);
                      }}
                      disabled={processing}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50"
                    >
                      {processing ? 'Processing...' : 'Reject'}
                    </button>
                    <button
                      onClick={() => handleApplicationAction(selectedApplication.id, 'approve', reviewNotes)}
                      disabled={processing}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50"
                    >
                      {processing ? 'Processing...' : 'Approve'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && rejectingApplication && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 lg:w-2/3 xl:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Reject Application - {rejectingApplication.institution_name}
                </h3>
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectingApplication(null);
                    setRejectionReason('');
                    setCustomRejectionReason('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Application Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-500">Contact Person:</span>
                      <p className="text-gray-900">{rejectingApplication.application_data.contactPersonName}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Email:</span>
                      <p className="text-gray-900">{rejectingApplication.contact_person_email}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Membership Type:</span>
                      <p className="text-gray-900">{rejectingApplication.membership_type}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Location:</span>
                      <p className="text-gray-900">{rejectingApplication.application_data.city}, {rejectingApplication.application_data.state}</p>
                    </div>
                  </div>
                </div>

                {/* Rejection Reason Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Rejection Reason <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    {REJECTION_REASONS.map((reason) => (
                      <label key={reason} className="flex items-center">
                        <input
                          type="radio"
                          name="rejectionReason"
                          value={reason}
                          checked={rejectionReason === reason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          className="mr-3 text-red-600 focus:ring-red-500"
                        />
                        <span className="text-sm text-gray-700">{reason}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Custom Reason Input */}
                {rejectionReason === 'Other (please specify below)' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Custom Rejection Reason <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={customRejectionReason}
                      onChange={(e) => setCustomRejectionReason(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      rows={4}
                      placeholder="Please specify the reason for rejection..."
                    />
                  </div>
                )}

                {/* Warning Notice */}
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex">
                    <X className="w-5 h-5 text-red-400 mt-0.5 mr-3" />
                    <div>
                      <h4 className="text-sm font-medium text-red-800">Rejection Notice</h4>
                      <p className="mt-1 text-sm text-red-700">
                        This action will reject the membership application and send an automatic email notification 
                        to the contact person with the selected reason. This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectingApplication(null);
                    setRejectionReason('');
                    setCustomRejectionReason('');
                  }}
                  disabled={processing}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectWithReason}
                  disabled={processing || !rejectionReason || (rejectionReason === 'Other (please specify below)' && !customRejectionReason.trim())}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? 'Rejecting...' : 'Reject Application'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
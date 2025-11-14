import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { showNotification } from '../../../lib/notifications';
import { Search, LogIn, User, Mail, Building2, Filter } from 'lucide-react';

export default function MemberImpersonationPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState<string>('all');
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [impersonating, setImpersonating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadMembers();
  }, []);

  useEffect(() => {
    let filtered = members;

    // Apply user type filter
    if (userTypeFilter !== 'all') {
      filtered = filtered.filter(member => member.user_type === userTypeFilter);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(member =>
        member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.institution_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Limit to 50 if no search term
    setFilteredMembers(searchTerm ? filtered : filtered.slice(0, 50));
  }, [searchTerm, userTypeFilter, members]);

  const loadMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select(`
          id,
          email,
          first_name,
          last_name,
          user_id,
          institution_id,
          membership_type,
          membership_status,
          user_type,
          institutions (
            name
          )
        `)
        .not('email', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedMembers = data?.map(m => ({
        ...m,
        full_name: `${m.first_name || ''} ${m.last_name || ''}`.trim() || m.email,
        institution_name: m.institutions?.name || 'No Institution',
        has_auth: !!m.user_id
      })) || [];

      setMembers(formattedMembers);
      setFilteredMembers(formattedMembers.slice(0, 50));
    } catch (error) {
      console.error('Error loading members:', error);
      showNotification({
        title: 'Error',
        message: 'Failed to load members',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImpersonate = async (member: any) => {
    if (!member.has_auth) {
      showNotification({
        title: 'No Credentials',
        message: 'This member does not have login credentials yet.',
        type: 'warning'
      });
      return;
    }

    setImpersonating(true);
    setSelectedMember(member);

    try {
      // Get current session for auth token
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      // Call backend API to generate impersonation token
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/v1/auth/impersonate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ email: member.email })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate impersonation token');
      }

      const { data } = await response.json();

      // Sign out current user
      await supabase.auth.signOut();

      // Use the magic link token to authenticate as the target user
      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: data.token,
        type: 'magiclink'
      });

      if (verifyError) {
        throw new Error(verifyError.message || 'Failed to authenticate as member');
      }

      showNotification({
        title: 'Success',
        message: `Logged in as ${member.full_name}`,
        type: 'success'
      });

      // Redirect to member dashboard
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Impersonation error:', error);
      showNotification({
        title: 'Login Failed',
        message: error.message || 'Failed to impersonate member',
        type: 'error'
      });

      // Try to restore the admin session if impersonation failed
      window.location.href = '/login';
    } finally {
      setImpersonating(false);
    }
  };

  const getUserTypeBadge = (userType: string) => {
    const colorMap: Record<string, string> = {
      'super_admin': 'bg-purple-100 text-purple-800',
      'admin': 'bg-red-100 text-red-800',
      'institution_admin': 'bg-orange-100 text-orange-800',
      'member': 'bg-gray-100 text-gray-800'
    };

    const labelMap: Record<string, string> = {
      'super_admin': 'Super Admin',
      'admin': 'Admin',
      'institution_admin': 'Institution Admin',
      'member': 'Member'
    };

    const color = colorMap[userType] || 'bg-gray-100 text-gray-800';
    const label = labelMap[userType] || userType || 'Member';

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${color}`}>
        {label}
      </span>
    );
  };

  const getMembershipBadge = (type: string, status: string) => {
    const statusColor = status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
    return (
      <div className="flex gap-2">
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColor}`}>
          {status}
        </span>
        {type && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
            {type}
          </span>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Loading Overlay */}
      {impersonating && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl">
            <div className="flex items-center space-x-3">
              <div className="animate-spin h-8 w-8 border-3 border-primary-600 border-t-transparent rounded-full"></div>
              <div>
                <p className="text-lg font-semibold text-gray-900">Logging in as {selectedMember.full_name}</p>
                <p className="text-sm text-gray-600 mt-1">Please wait...</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Member Impersonation (Dev Tool)</h1>
          <p className="mt-1 text-sm text-gray-600">
            Login as any member for testing purposes. Default password: <code className="bg-gray-100 px-2 py-1 rounded">EAU2025temp!</code>
          </p>
        </div>

        <div className="p-6">
          {/* Search Bar and Filters */}
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="md:col-span-3 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by email, name, or institution..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  value={userTypeFilter}
                  onChange={(e) => setUserTypeFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="all">All User Types</option>
                  <option value="super_admin">Super Admin</option>
                  <option value="admin">Admin</option>
                  <option value="institution_admin">Institution Admin</option>
                  <option value="member">Member</option>
                </select>
              </div>
            </div>

            <p className="text-sm text-gray-500">
              Total members: {members.length} | Members with auth: {members.filter(m => m.has_auth).length} | Showing: {filteredMembers.length}
            </p>
          </div>

          {/* Members Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMembers.map((member) => (
              <div
                key={member.id}
                className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                  !member.has_auth ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <h3 className="font-medium text-gray-900">{member.full_name}</h3>
                    </div>

                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{member.email}</span>
                      </div>

                      <div className="flex items-center gap-2 text-gray-600">
                        <Building2 className="h-3 w-3" />
                        <span className="truncate">{member.institution_name}</span>
                      </div>
                    </div>

                    <div className="mt-2 space-y-2">
                      <div>
                        {getUserTypeBadge(member.user_type)}
                      </div>
                      <div>
                        {getMembershipBadge(member.membership_type, member.membership_status)}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleImpersonate(member)}
                    disabled={!member.has_auth || impersonating}
                    className={`ml-2 p-2 rounded-lg transition-colors relative ${
                      member.has_auth && !impersonating
                        ? 'text-primary-600 hover:bg-primary-50'
                        : 'text-gray-300 cursor-not-allowed'
                    } ${impersonating && selectedMember?.id === member.id ? 'bg-primary-50' : ''}`}
                    title={member.has_auth ? 'Login as this member' : 'No credentials available'}
                  >
                    {impersonating && selectedMember?.id === member.id ? (
                      <div className="animate-spin h-5 w-5 border-2 border-primary-600 border-t-transparent rounded-full"></div>
                    ) : (
                      <LogIn className="h-5 w-5" />
                    )}
                  </button>
                </div>

                {!member.has_auth && (
                  <div className="mt-3 text-xs text-orange-600 bg-orange-50 rounded p-2">
                    ⚠️ No auth credentials. Run SQL script first.
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredMembers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No members found matching your search.
            </div>
          )}

          {!searchTerm && members.length > 50 && (
            <div className="mt-4 text-center text-sm text-gray-500">
              Showing first 50 members. Use search to find specific members.
            </div>
          )}
        </div>
      </div>

      {/* Instructions Panel */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-3">How to Use Member Impersonation</h2>
        <ol className="space-y-2 text-sm text-blue-800">
          <li>1. First, run the SQL script provided to create authentication credentials for all imported members</li>
          <li>2. All members will have the default password: <code className="bg-blue-100 px-2 py-1 rounded">EAU2025temp!</code></li>
          <li>3. Search for a member using their email, name, or institution</li>
          <li>4. Click the login icon to impersonate that member</li>
          <li>5. You'll be logged in as that member and redirected to their dashboard</li>
          <li>6. To return to admin, logout and login with your admin credentials</li>
        </ol>

        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm text-yellow-800">
            <strong>Security Note:</strong> This is a development tool only. In production, implement proper security measures and audit logging for impersonation features.
          </p>
        </div>
      </div>
    </div>
  );
}
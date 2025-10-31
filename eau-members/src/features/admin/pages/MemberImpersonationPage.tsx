import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { showNotification } from '../../../lib/notifications';
import { Search, LogIn, User, Mail, Building2 } from 'lucide-react';

export default function MemberImpersonationPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [impersonating, setImpersonating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadMembers();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = members.filter(member =>
        member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.institution_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMembers(filtered);
    } else {
      setFilteredMembers(members.slice(0, 50)); // Show first 50 when no search
    }
  }, [searchTerm, members]);

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
        message: 'This member does not have login credentials yet. Run the SQL script to create credentials.',
        type: 'warning'
      });
      return;
    }

    setImpersonating(true);
    setSelectedMember(member);

    try {
      // First, sign out current user
      await supabase.auth.signOut();

      // Sign in as the selected member with default password
      const { data, error } = await supabase.auth.signInWithPassword({
        email: member.email,
        password: 'EAU2025temp!'
      });

      if (error) {
        // Try alternative password if the first one fails
        const { data: data2, error: error2 } = await supabase.auth.signInWithPassword({
          email: member.email,
          password: 'Salmo119:97' // Your default password
        });

        if (error2) {
          throw new Error('Failed to login as member. Make sure the SQL script has been run to create credentials.');
        }
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
    } finally {
      setImpersonating(false);
    }
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
      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Member Impersonation (Dev Tool)</h1>
          <p className="mt-1 text-sm text-gray-600">
            Login as any member for testing purposes. Default password: <code className="bg-gray-100 px-2 py-1 rounded">EAU2025temp!</code>
          </p>
        </div>

        <div className="p-6">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by email, name, or institution..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Total members: {members.length} | Members with auth: {members.filter(m => m.has_auth).length}
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

                    <div className="mt-2">
                      {getMembershipBadge(member.membership_type, member.membership_status)}
                    </div>
                  </div>

                  <button
                    onClick={() => handleImpersonate(member)}
                    disabled={!member.has_auth || impersonating}
                    className={`ml-2 p-2 rounded-lg transition-colors ${
                      member.has_auth
                        ? 'text-primary-600 hover:bg-primary-50'
                        : 'text-gray-300 cursor-not-allowed'
                    }`}
                    title={member.has_auth ? 'Login as this member' : 'No credentials available'}
                  >
                    <LogIn className="h-5 w-5" />
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
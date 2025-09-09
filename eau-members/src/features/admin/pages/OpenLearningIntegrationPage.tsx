import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  RefreshCw, 
  BookOpen, 
  CheckCircle, 
  XCircle,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { showNotification } from '../../../utils/notifications';
import { openLearningService } from '../../../services/openlearningService';
import { memberService } from '../../../services/memberService';

export function OpenLearningIntegrationPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [provisioningStatus, setProvisioningStatus] = useState<Record<string, string>>({});
  const [integrationStats, setIntegrationStats] = useState({
    totalMembers: 0,
    provisionedMembers: 0,
    totalCourses: 0,
    syncedActivities: 0
  });

  useEffect(() => {
    loadMembers();
    loadIntegrationStats();
  }, []);

  const loadMembers = async () => {
    try {
      const response = await memberService.getAllMembers();
      setMembers(response.members || []);
    } catch (error) {
      console.error('Error loading members:', error);
      showNotification('error', 'Failed to load members');
    }
  };

  const loadIntegrationStats = async () => {
    try {
      // Load stats from backend
      const response = await memberService.getAllMembers();
      const allMembers = response.members || [];
      const provisioned = allMembers.filter((m: any) => m.openlearning_user_id).length;
      
      setIntegrationStats({
        totalMembers: allMembers.length,
        provisionedMembers: provisioned,
        totalCourses: 0, // Will be updated from API
        syncedActivities: 0 // Will be updated from API
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleProvisionSelected = async () => {
    if (selectedMembers.length === 0) {
      showNotification('warning', 'Please select members to provision');
      return;
    }

    setLoading(true);
    try {
      const result = await openLearningService.bulkProvision(selectedMembers);
      
      if (result.success && result.results) {
        const { provisioned, failed, alreadyProvisioned } = result.results;
        
        // Update status for each member
        const newStatus: Record<string, string> = {};
        provisioned.forEach(id => newStatus[id] = 'success');
        failed.forEach(({ memberId }) => newStatus[memberId] = 'failed');
        alreadyProvisioned.forEach(id => newStatus[id] = 'already');
        
        setProvisioningStatus(newStatus);
        
        showNotification('success', 
          `Provisioned ${provisioned.length} members successfully. ` +
          `${failed.length} failed, ${alreadyProvisioned.length} already provisioned.`
        );
        
        // Reload data
        await loadMembers();
        await loadIntegrationStats();
        setSelectedMembers([]);
      } else {
        showNotification('error', result.error || 'Provisioning failed');
      }
    } catch (error) {
      console.error('Error provisioning members:', error);
      showNotification('error', 'Failed to provision members');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncCourses = async (memberId: string) => {
    setLoading(true);
    try {
      const result = await openLearningService.syncCourses(memberId);
      
      if (result.success) {
        showNotification('success', result.message || 'Courses synced successfully');
        await loadIntegrationStats();
      } else {
        showNotification('error', result.error || 'Sync failed');
      }
    } catch (error) {
      console.error('Error syncing courses:', error);
      showNotification('error', 'Failed to sync courses');
    } finally {
      setLoading(false);
    }
  };

  const handleLaunchSSO = async (memberId: string) => {
    try {
      const member = members.find(m => m.id === memberId);
      if (!member) return;
      
      // Create a temporary form to submit SSO
      await openLearningService.launchSSO(undefined, true);
      showNotification('info', 'Opening OpenLearning in new window...');
    } catch (error) {
      console.error('Error launching SSO:', error);
      showNotification('error', 'Failed to launch OpenLearning');
    }
  };

  const toggleMemberSelection = (memberId: string) => {
    setSelectedMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const selectAllUnprovisioned = () => {
    const unprovisioned = members
      .filter(m => !m.openlearning_user_id)
      .map(m => m.id);
    setSelectedMembers(unprovisioned);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">OpenLearning Integration</h1>
          <Button
            variant="outline"
            onClick={() => navigate('/admin')}
          >
            Back to Admin
          </Button>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Members</p>
                <p className="text-2xl font-bold">{integrationStats.totalMembers}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Provisioned</p>
                <p className="text-2xl font-bold">{integrationStats.provisionedMembers}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Courses</p>
                <p className="text-2xl font-bold">{integrationStats.totalCourses}</p>
              </div>
              <BookOpen className="h-8 w-8 text-purple-500" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">CPD Activities</p>
                <p className="text-2xl font-bold">{integrationStats.syncedActivities}</p>
              </div>
              <RefreshCw className="h-8 w-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={selectAllUnprovisioned}
                variant="outline"
                disabled={loading}
              >
                Select All Unprovisioned
              </Button>
              <Button
                onClick={handleProvisionSelected}
                disabled={loading || selectedMembers.length === 0}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Provisioning...
                  </>
                ) : (
                  <>
                    <Users className="h-4 w-4 mr-2" />
                    Provision Selected ({selectedMembers.length})
                  </>
                )}
              </Button>
            </div>
            <div className="text-sm text-gray-600">
              {selectedMembers.length} of {members.length} members selected
            </div>
          </div>
        </div>

        {/* Members Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedMembers.length === members.filter(m => !m.openlearning_user_id).length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        selectAllUnprovisioned();
                      } else {
                        setSelectedMembers([]);
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  OpenLearning ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {members.map((member) => (
                <tr key={member.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(member.id)}
                      onChange={() => toggleMemberSelection(member.id)}
                      disabled={member.openlearning_user_id}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {member.first_name} {member.last_name}
                      </div>
                      <div className="text-sm text-gray-500">{member.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {member.openlearning_user_id ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Provisioned
                      </span>
                    ) : provisioningStatus[member.id] === 'failed' ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <XCircle className="h-3 w-3 mr-1" />
                        Failed
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Not Provisioned
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {member.openlearning_user_id || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      {member.openlearning_user_id && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSyncCourses(member.id)}
                            disabled={loading}
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Sync
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleLaunchSSO(member.id)}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Open
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
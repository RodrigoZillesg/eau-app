import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { showNotification } from '../../../lib/notifications';
import { supabase } from '../../../lib/supabase';
import { SkeletonLoader } from '../../../components/ui/SkeletonLoader';

interface SyncLog {
  id: string;
  sync_type: 'scheduled' | 'manual' | 'webhook';
  started_at: string;
  completed_at?: string;
  status: 'running' | 'completed' | 'failed';
  members_processed?: number;
  courses_imported?: number;
  cpd_activities_created?: number;
  execution_time_ms?: number;
  error_message?: string;
  result?: any;
}

interface SyncStats {
  totalMembers: number;
  provisionedMembers: number;
  totalCourses: number;
  totalCPDActivities: number;
  lastSyncTime: string | null;
  avgExecutionTime: number;
}

interface SyncStatus {
  syncInProgress: boolean;
  lastSyncTime: Date | null;
}

export default function OpenLearningSyncPage() {
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [syncStats, setSyncStats] = useState<SyncStats | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [manualSyncLoading, setManualSyncLoading] = useState(false);

  useEffect(() => {
    loadData();

    // Refresh data every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      await Promise.all([
        loadSyncLogs(),
        loadSyncStats(),
        loadSyncStatus()
      ]);
    } catch (error) {
      console.error('Error loading sync dashboard data:', error);
      showNotification('Error loading sync dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadSyncLogs = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/v1/openlearning/sync/logs', {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sync logs');
      }

      const data = await response.json();
      setSyncLogs(data.logs || []);
    } catch (error) {
      console.error('Error loading sync logs:', error);
    }
  };

  const loadSyncStats = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/v1/openlearning/sync/stats', {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sync stats');
      }

      const data = await response.json();
      setSyncStats(data.stats);
    } catch (error) {
      console.error('Error loading sync stats:', error);
    }
  };

  const loadSyncStatus = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/v1/openlearning/status', {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sync status');
      }

      const data = await response.json();
      setSyncStatus(data.status);
    } catch (error) {
      console.error('Error loading sync status:', error);
    }
  };

  const handleManualSync = async () => {
    setManualSyncLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/v1/openlearning/sync/manual', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to start manual sync');
      }

      const data = await response.json();
      showNotification('Manual sync started successfully', 'success');

      // Refresh data after starting sync
      setTimeout(loadData, 2000);
    } catch (error: any) {
      console.error('Error starting manual sync:', error);
      showNotification(error.message || 'Failed to start manual sync', 'error');
    } finally {
      setManualSyncLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      running: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800'
    };
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  const getSyncTypeBadge = (type: string) => {
    const badges = {
      scheduled: 'bg-purple-100 text-purple-800',
      manual: 'bg-blue-100 text-blue-800',
      webhook: 'bg-orange-100 text-orange-800'
    };
    return badges[type as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  const formatExecutionTime = (ms?: number) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <SkeletonLoader width="300px" height="32px" />
          <SkeletonLoader width="500px" height="20px" className="mt-2" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <SkeletonLoader key={i} width="100%" height="120px" />
          ))}
        </div>

        <SkeletonLoader width="100%" height="400px" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">OpenLearning Sync Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Monitor and manage synchronization between EAU and OpenLearning platform
        </p>
      </div>

      {/* Sync Status and Manual Trigger */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Sync Status</h3>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  syncStatus?.syncInProgress ? 'bg-blue-500 animate-pulse' : 'bg-green-500'
                }`}></div>
                <span className="text-sm text-gray-600">
                  {syncStatus?.syncInProgress ? 'Sync in Progress' : 'Ready'}
                </span>
              </div>
              {syncStatus?.lastSyncTime && (
                <span className="text-sm text-gray-500">
                  Last sync: {format(new Date(syncStatus.lastSyncTime), 'PPp')}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={handleManualSync}
            disabled={manualSyncLoading || syncStatus?.syncInProgress}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {manualSyncLoading ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Starting...
              </>
            ) : (
              'Start Manual Sync'
            )}
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {syncStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-2xl font-bold text-blue-600">{syncStats.provisionedMembers}</div>
            <div className="text-sm text-gray-600">Provisioned Members</div>
            <div className="text-xs text-gray-500 mt-1">
              of {syncStats.totalMembers} total members
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-2xl font-bold text-green-600">{syncStats.totalCourses}</div>
            <div className="text-sm text-gray-600">Synced Courses</div>
            <div className="text-xs text-gray-500 mt-1">from OpenLearning</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-2xl font-bold text-purple-600">{syncStats.totalCPDActivities}</div>
            <div className="text-sm text-gray-600">CPD Activities</div>
            <div className="text-xs text-gray-500 mt-1">auto-generated</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-2xl font-bold text-orange-600">
              {formatExecutionTime(syncStats.avgExecutionTime)}
            </div>
            <div className="text-sm text-gray-600">Avg Sync Time</div>
            <div className="text-xs text-gray-500 mt-1">execution duration</div>
          </div>
        </div>
      )}

      {/* Sync Logs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Sync Operations</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type & Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Started
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Results
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Error
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {syncLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No sync operations found
                  </td>
                </tr>
              ) : (
                syncLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSyncTypeBadge(log.sync_type)}`}>
                          {log.sync_type}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(log.status)}`}>
                          {log.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(log.started_at), 'PPp')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatExecutionTime(log.execution_time_ms)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.status === 'completed' && (
                        <div className="text-xs space-y-1">
                          <div>Members: {log.members_processed || 0}</div>
                          <div>Courses: {log.courses_imported || 0}</div>
                          <div>CPD: {log.cpd_activities_created || 0}</div>
                        </div>
                      )}
                      {log.status === 'running' && (
                        <span className="text-blue-600">Processing...</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-red-600 max-w-xs truncate">
                      {log.error_message}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sync Schedule Info */}
      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-blue-900 mb-2">Automatic Sync Schedule</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <div>• Daily sync at 2:00 AM AEST (full synchronization)</div>
          <div>• Frequent sync every 6 hours (incremental updates)</div>
          <div>• Webhook-triggered sync for real-time updates</div>
          <div>• Automatic retry on transient failures with exponential backoff</div>
        </div>
      </div>
    </div>
  );
}
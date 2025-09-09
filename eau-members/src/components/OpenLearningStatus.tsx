import React, { useEffect, useState } from 'react';
import { openLearningService, OpenLearningStatus as StatusType } from '../services/openlearningService';
import { OpenLearningSSOButton } from './OpenLearningSSOButton';
import { showNotification } from '../utils/notifications';

interface OpenLearningStatusProps {
  memberId?: string;
  showSyncButton?: boolean;
  showLaunchButton?: boolean;
  onStatusUpdate?: (status: StatusType) => void;
}

export const OpenLearningStatus: React.FC<OpenLearningStatusProps> = ({
  memberId,
  showSyncButton = true,
  showLaunchButton = true,
  onStatusUpdate
}) => {
  const [status, setStatus] = useState<StatusType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isProvisioning, setIsProvisioning] = useState(false);

  useEffect(() => {
    loadStatus();
  }, [memberId]);

  const loadStatus = async () => {
    setIsLoading(true);
    try {
      const result = await openLearningService.getStatus(memberId);
      if (result.success && result.status) {
        setStatus(result.status);
        onStatusUpdate?.(result.status);
      }
    } catch (error) {
      console.error('Error loading OpenLearning status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProvision = async () => {
    setIsProvisioning(true);
    try {
      const result = await openLearningService.provisionCurrentUser();
      if (result.success) {
        showNotification('success', 'Successfully provisioned in OpenLearning');
        await loadStatus();
      } else {
        showNotification('error', result.error || 'Failed to provision user');
      }
    } catch (error) {
      showNotification('error', 'Error provisioning user');
    } finally {
      setIsProvisioning(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const result = await openLearningService.syncCourses(memberId);
      if (result.success) {
        showNotification('success', result.message || 'Courses synced successfully');
        await loadStatus();
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
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500">Unable to load OpenLearning status</p>
      </div>
    );
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">OpenLearning Integration</h3>
        <div className="flex items-center space-x-2">
          {status.isProvisioned ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Connected
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Not Connected
            </span>
          )}
          {status.syncEnabled && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Sync Enabled
            </span>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Status</p>
            <p className="font-medium text-gray-900">
              {status.isProvisioned ? 'Provisioned' : 'Not Provisioned'}
            </p>
          </div>
          
          {status.isProvisioned && (
            <>
              <div>
                <p className="text-gray-500">OpenLearning ID</p>
                <p className="font-medium text-gray-900 font-mono text-xs">
                  {status.openLearningUserId || 'N/A'}
                </p>
              </div>
              
              <div>
                <p className="text-gray-500">Courses</p>
                <p className="font-medium text-gray-900">{status.courseCount}</p>
              </div>
              
              <div>
                <p className="text-gray-500">CPD Activities</p>
                <p className="font-medium text-gray-900">{status.cpdActivitiesCount}</p>
              </div>
              
              <div>
                <p className="text-gray-500">Provisioned</p>
                <p className="font-medium text-gray-900">{formatDate(status.provisionedAt)}</p>
              </div>
              
              <div>
                <p className="text-gray-500">Last Synced</p>
                <p className="font-medium text-gray-900">{formatDate(status.lastSynced)}</p>
              </div>
            </>
          )}
        </div>

        <div className="flex space-x-3 pt-4 border-t">
          {!status.isProvisioned ? (
            <button
              onClick={handleProvision}
              disabled={isProvisioning}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isProvisioning ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Provisioning...
                </>
              ) : (
                'Connect to OpenLearning'
              )}
            </button>
          ) : (
            <>
              {showLaunchButton && (
                <OpenLearningSSOButton variant="primary" size="sm">
                  Launch OpenLearning
                </OpenLearningSSOButton>
              )}
              
              {showSyncButton && (
                <button
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
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
                      Sync Courses
                    </>
                  )}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
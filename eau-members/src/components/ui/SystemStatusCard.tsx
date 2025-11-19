import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './Card';
import { supabase } from '../../lib/supabase/client';

interface SystemStatus {
  status: 'online' | 'offline';
  backend: {
    status: string;
    uptime: string;
    uptimeSeconds: number;
  };
  cpu: {
    cores: number;
    usage: number;
    usagePercent: string;
  };
  memory: {
    total: string;
    used: string;
    free: string;
    usage: number;
    usagePercent: string;
  };
  disk: {
    total: string;
    used: string;
    free: string;
    usage: number;
    usagePercent: string;
  };
  timestamp: string;
}

export const SystemStatusCard: React.FC = () => {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSystemStatus = async () => {
    try {
      setError(null);

      // Get authentication token from Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No authentication token found');
      }

      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/v1/system/status`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch system status');
      }

      const result = await response.json();

      if (result.success) {
        setStatus(result.data);
      } else {
        throw new Error(result.message || 'Failed to get system status');
      }
    } catch (err) {
      console.error('Error fetching system status:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStatus({
        status: 'offline',
        backend: { status: 'offline', uptime: 'N/A', uptimeSeconds: 0 },
        cpu: { cores: 0, usage: 0, usagePercent: 'N/A' },
        memory: { total: 'N/A', used: 'N/A', free: 'N/A', usage: 0, usagePercent: 'N/A' },
        disk: { total: 'N/A', used: 'N/A', free: 'N/A', usage: 0, usagePercent: 'N/A' },
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemStatus();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchSystemStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (usage: number): string => {
    if (usage >= 90) return 'text-red-600';
    if (usage >= 70) return 'text-orange-600';
    return 'text-green-600';
  };

  const getStatusBgColor = (usage: number): string => {
    if (usage >= 90) return 'bg-red-100';
    if (usage >= 70) return 'bg-orange-100';
    return 'bg-green-100';
  };

  const getProgressBarColor = (usage: number): string => {
    if (usage >= 90) return 'bg-red-500';
    if (usage >= 70) return 'bg-orange-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🖥️ System Status
          </CardTitle>
          <CardDescription>
            Server health and performance monitoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🖥️ System Status
        </CardTitle>
        <CardDescription>
          Server health and performance monitoring
          {status && (
            <span className="text-xs text-gray-500 ml-2">
              (Updated: {new Date(status.timestamp).toLocaleTimeString()})
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">❌</span>
                <span className="font-medium text-red-800">Backend Offline</span>
              </div>
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button
              onClick={fetchSystemStatus}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Retry Connection
            </button>
          </div>
        ) : status ? (
          <div className="space-y-4">
            {/* Backend Status */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">✅</span>
                  <span className="font-medium text-green-800">Backend Online</span>
                </div>
                <span className="text-sm text-green-700">
                  Uptime: {status.backend.uptime}
                </span>
              </div>
            </div>

            {/* CPU Usage */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  CPU Usage ({status.cpu.cores} cores)
                </span>
                <span className={`text-sm font-bold ${getStatusColor(status.cpu.usage)}`}>
                  {status.cpu.usagePercent}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full ${getProgressBarColor(status.cpu.usage)}`}
                  style={{ width: `${Math.min(status.cpu.usage, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Memory Usage */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Memory Usage
                </span>
                <span className={`text-sm font-bold ${getStatusColor(status.memory.usage)}`}>
                  {status.memory.usagePercent}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                <div
                  className={`h-2.5 rounded-full ${getProgressBarColor(status.memory.usage)}`}
                  style={{ width: `${Math.min(status.memory.usage, 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Used: {status.memory.used}</span>
                <span>Total: {status.memory.total}</span>
              </div>
            </div>

            {/* Disk Usage */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Disk Usage
                </span>
                <span className={`text-sm font-bold ${getStatusColor(status.disk.usage)}`}>
                  {status.disk.usagePercent}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                <div
                  className={`h-2.5 rounded-full ${getProgressBarColor(status.disk.usage)}`}
                  style={{ width: `${Math.min(status.disk.usage, 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Used: {status.disk.used}</span>
                <span>Total: {status.disk.total}</span>
              </div>
            </div>

            {/* Refresh Button */}
            <button
              onClick={fetchSystemStatus}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Refresh Status
            </button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};

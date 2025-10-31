import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Calendar, Mail, AlertCircle, CheckCircle, XCircle, Eye, MousePointer, Clock, Filter, Download, RefreshCw } from 'lucide-react';
import { showNotification } from '../../../lib/notifications';
import { format } from 'date-fns';
import { getUserInstitution } from '../../../services/institutionService';
import { useAuthStore } from '../../../stores/authStore';
import { MembersService } from '../../../lib/supabase/members';

interface EmailLog {
  id: string;
  recipient_email: string;
  from_email: string;
  subject: string;
  email_type: string;
  status: 'sent' | 'opened' | 'clicked' | 'failed' | 'bounced' | 'pending' | 'queued';
  sent_at: string;
  opened_at: string | null;
  clicked_at: string | null;
  error_message: string | null;
  message_id: string | null;
  metadata: any;
}

interface EmailStatistics {
  total_sent: number;
  total_opened: number;
  total_clicked: number;
  total_failed: number;
  open_rate: number;
  click_rate: number;
  by_type: Record<string, any>;
  by_day: Array<any>;
}

const EmailLogsPage: React.FC = () => {
  const { roles } = useAuthStore();
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [statistics, setStatistics] = useState<EmailStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);
  const [filters, setFilters] = useState({
    email_type: '',
    status: '',
    start_date: '',
    end_date: '',
    recipient_email: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [userInstitution, setUserInstitution] = useState<{ institutionId: string | null; institutionName: string }>({
    institutionId: null,
    institutionName: 'All Institutions'
  });
  const [institutionMemberEmails, setInstitutionMemberEmails] = useState<string[]>([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (institutionMemberEmails.length > 0 || roles.includes('AdminSuper')) {
      fetchEmailLogs();
      fetchStatistics();
    }
  }, [filters, currentPage, institutionMemberEmails]);

  const loadInitialData = async () => {
    // Get institution context for Institution Admin
    const institution = await getUserInstitution();
    setUserInstitution(institution);

    if (!roles.includes('AdminSuper') && institution.institutionId) {
      // Get all member emails for this institution
      const members = await MembersService.searchMembers({
        institutionId: institution.institutionId
      } as any);
      const emails = members.map(m => m.email);
      setInstitutionMemberEmails(emails);
    }
  };

  const fetchEmailLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      });

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/api/v1/admin/email-logs?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (data.success) {
        let filteredLogs = data.data.logs;

        // Filter logs for Institution Admin
        if (!roles.includes('AdminSuper') && institutionMemberEmails.length > 0) {
          filteredLogs = data.data.logs.filter((log: EmailLog) =>
            institutionMemberEmails.includes(log.recipient_email)
          );
        }

        setLogs(filteredLogs);
        setTotalPages(data.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching email logs:', error);
      showNotification('Failed to fetch email logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem('token');

      const params = new URLSearchParams();
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/api/v1/admin/email-logs/statistics?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (data.success) {
        setStatistics(data.data);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <Mail className="w-4 h-4 text-blue-500" />;
      case 'opened':
        return <Eye className="w-4 h-4 text-green-500" />;
      case 'clicked':
        return <MousePointer className="w-4 h-4 text-purple-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'bounced':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'pending':
      case 'queued':
        return <Clock className="w-4 h-4 text-gray-500" />;
      default:
        return <Mail className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'opened':
        return 'bg-green-100 text-green-800';
      case 'clicked':
        return 'bg-purple-100 text-purple-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'bounced':
        return 'bg-orange-100 text-orange-800';
      case 'pending':
      case 'queued':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const exportLogs = async () => {
    try {
      const csvContent = [
        ['Date', 'To', 'From', 'Subject', 'Type', 'Status', 'Opened', 'Clicked'].join(','),
        ...logs.map(log => [
          format(new Date(log.sent_at), 'yyyy-MM-dd HH:mm'),
          log.recipient_email,
          log.from_email,
          `"${log.subject}"`,
          log.email_type,
          log.status,
          log.opened_at ? 'Yes' : 'No',
          log.clicked_at ? 'Yes' : 'No'
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `email-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      showNotification('Email logs exported successfully', 'success');
    } catch (error) {
      console.error('Error exporting logs:', error);
      showNotification('Failed to export email logs', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Email Logs</h1>
        <p className="mt-2 text-gray-600">Monitor and track all emails sent by the system</p>
      </div>

      {/* Institution Context Indicator */}
      {!roles.includes('AdminSuper') && userInstitution.institutionId && (
        <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Institution View:</strong> Showing email logs for members of {userInstitution.institutionName} only
          </p>
        </div>
      )}

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sent</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.total_sent}</p>
              </div>
              <Mail className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Opened</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.total_opened}</p>
              </div>
              <Eye className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Clicked</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.total_clicked}</p>
              </div>
              <MousePointer className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.total_failed}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Open Rate</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.open_rate}%</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Click Rate</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.click_rate}%</p>
              </div>
              <MousePointer className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold">Filters</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <input
            type="text"
            placeholder="Recipient email..."
            className="px-3 py-2 border rounded-lg"
            value={filters.recipient_email}
            onChange={(e) => setFilters({ ...filters, recipient_email: e.target.value })}
          />

          <select
            className="px-3 py-2 border rounded-lg"
            value={filters.email_type}
            onChange={(e) => setFilters({ ...filters, email_type: e.target.value })}
          >
            <option value="">All Types</option>
            <option value="welcome">Welcome</option>
            <option value="reminder">Reminder</option>
            <option value="notification">Notification</option>
            <option value="application">Application</option>
            <option value="general">General</option>
          </select>

          <select
            className="px-3 py-2 border rounded-lg"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">All Status</option>
            <option value="sent">Sent</option>
            <option value="opened">Opened</option>
            <option value="clicked">Clicked</option>
            <option value="failed">Failed</option>
            <option value="bounced">Bounced</option>
            <option value="pending">Pending</option>
          </select>

          <input
            type="date"
            className="px-3 py-2 border rounded-lg"
            value={filters.start_date}
            onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
          />

          <input
            type="date"
            className="px-3 py-2 border rounded-lg"
            value={filters.end_date}
            onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
          />
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={() => setFilters({ email_type: '', status: '', start_date: '', end_date: '', recipient_email: '' })}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Clear Filters
          </button>
          <button
            onClick={fetchEmailLogs}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={exportLogs}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Email Logs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date/Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recipient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Engagement
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No email logs found
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(log.sent_at), 'MMM dd, HH:mm')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.recipient_email}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="truncate max-w-xs" title={log.subject}>
                        {log.subject}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        {log.email_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(log.status)}
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(log.status)}`}>
                          {log.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-3">
                        {log.opened_at && (
                          <div className="flex items-center gap-1 text-green-600">
                            <Eye className="w-3 h-3" />
                            <span className="text-xs">Opened</span>
                          </div>
                        )}
                        {log.clicked_at && (
                          <div className="flex items-center gap-1 text-purple-600">
                            <MousePointer className="w-3 h-3" />
                            <span className="text-xs">Clicked</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 bg-gray-50 flex items-center justify-between border-t">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded-md disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded-md disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Email Details</h2>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Recipient</label>
                  <p className="text-gray-900">{selectedLog.recipient_email}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Subject</label>
                  <p className="text-gray-900">{selectedLog.subject}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusIcon(selectedLog.status)}
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedLog.status)}`}>
                      {selectedLog.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Sent At</label>
                    <p className="text-gray-900">{format(new Date(selectedLog.sent_at), 'PPpp')}</p>
                  </div>

                  {selectedLog.opened_at && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Opened At</label>
                      <p className="text-gray-900">{format(new Date(selectedLog.opened_at), 'PPpp')}</p>
                    </div>
                  )}

                  {selectedLog.clicked_at && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Clicked At</label>
                      <p className="text-gray-900">{format(new Date(selectedLog.clicked_at), 'PPpp')}</p>
                    </div>
                  )}
                </div>

                {selectedLog.error_message && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Error Message</label>
                    <p className="text-red-600 bg-red-50 p-3 rounded-md">{selectedLog.error_message}</p>
                  </div>
                )}

                {selectedLog.metadata && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Metadata</label>
                    <pre className="bg-gray-50 p-3 rounded-md text-xs overflow-auto">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailLogsPage;
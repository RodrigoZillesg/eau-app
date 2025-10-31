import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Mail,
  Play,
  Pause,
  Trash2,
  Plus,
  Edit2,
  CheckCircle,
  XCircle,
  AlertCircle,
  History,
  FileText,
  Download,
  Send
} from 'lucide-react';
import {
  ScheduledReport,
  ScheduledReportRun,
  ScheduledReportService
} from '../../../services/scheduledReportService';
import { showNotification } from '../../../lib/notifications';
import { supabase } from '../../../lib/supabase';

interface ScheduleConfig {
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string; // HH:MM format
  dayOfWeek?: number; // 0-6, 0 = Sunday
  dayOfMonth?: number; // 1-31
}

interface ScheduleFormData {
  name: string;
  description: string;
  savedReportId: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  recipients: string;
  format: 'pdf' | 'excel' | 'csv' | 'json';
  enabled: boolean;
}

const ScheduledReportsPage: React.FC = () => {
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);
  const [savedReports, setSavedReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ScheduledReport | null>(null);
  const [reportRuns, setReportRuns] = useState<ScheduledReportRun[]>([]);
  const [formData, setFormData] = useState<ScheduleFormData>({
    name: '',
    description: '',
    savedReportId: '',
    frequency: 'weekly',
    time: '09:00',
    dayOfWeek: 1,
    dayOfMonth: 1,
    recipients: '',
    format: 'pdf',
    enabled: true
  });

  useEffect(() => {
    loadScheduledReports();
    loadSavedReports();
  }, []);

  const loadScheduledReports = async () => {
    try {
      const reports = await ScheduledReportService.getScheduledReports();
      setScheduledReports(reports);
    } catch (error) {
      console.error('Error loading scheduled reports:', error);
      showNotification('error', 'Failed to load scheduled reports');
    } finally {
      setLoading(false);
    }
  };

  const loadSavedReports = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedReports(data || []);
    } catch (error) {
      console.error('Error loading saved reports:', error);
    }
  };

  const loadReportHistory = async (reportId: string) => {
    try {
      const runs = await ScheduledReportService.getReportRuns(reportId);
      setReportRuns(runs);
      setShowHistoryModal(true);
    } catch (error) {
      console.error('Error loading report history:', error);
      showNotification('error', 'Failed to load report history');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const scheduleConfig: ScheduleConfig = {
        frequency: formData.frequency,
        time: formData.time,
        ...(formData.frequency === 'weekly' && { dayOfWeek: formData.dayOfWeek }),
        ...(formData.frequency === 'monthly' && { dayOfMonth: formData.dayOfMonth })
      };

      // Validate schedule configuration
      const validation = ScheduledReportService.validateScheduleConfig(scheduleConfig);
      if (!validation.valid) {
        showNotification('error', validation.errors.join(', '));
        return;
      }

      const reportData = {
        name: formData.name,
        description: formData.description,
        report_config: {
          savedReportId: formData.savedReportId
        },
        schedule_config: scheduleConfig,
        recipients: formData.recipients.split(',').map(email => email.trim()).filter(Boolean),
        format: formData.format,
        enabled: formData.enabled
      };

      if (selectedReport) {
        await ScheduledReportService.updateScheduledReport(selectedReport.id, reportData);
        showNotification('success', 'Scheduled report updated successfully');
      } else {
        await ScheduledReportService.createScheduledReport(reportData);
        showNotification('success', 'Scheduled report created successfully');
      }

      setShowModal(false);
      resetForm();
      loadScheduledReports();
    } catch (error) {
      console.error('Error saving scheduled report:', error);
      showNotification('error', 'Failed to save scheduled report');
    }
  };

  const handleEdit = (report: ScheduledReport) => {
    setSelectedReport(report);
    setFormData({
      name: report.name,
      description: report.description || '',
      savedReportId: report.report_config.savedReportId || '',
      frequency: report.schedule_config.frequency,
      time: report.schedule_config.time,
      dayOfWeek: report.schedule_config.dayOfWeek,
      dayOfMonth: report.schedule_config.dayOfMonth,
      recipients: report.recipients.join(', '),
      format: report.format,
      enabled: report.enabled
    });
    setShowModal(true);
  };

  const handleDelete = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this scheduled report?')) return;

    try {
      await ScheduledReportService.deleteScheduledReport(reportId);
      showNotification('success', 'Scheduled report deleted successfully');
      loadScheduledReports();
    } catch (error) {
      console.error('Error deleting scheduled report:', error);
      showNotification('error', 'Failed to delete scheduled report');
    }
  };

  const handleToggle = async (report: ScheduledReport) => {
    try {
      await ScheduledReportService.toggleScheduledReport(report.id, !report.enabled);
      showNotification('success', `Report ${!report.enabled ? 'enabled' : 'disabled'} successfully`);
      loadScheduledReports();
    } catch (error) {
      console.error('Error toggling scheduled report:', error);
      showNotification('error', 'Failed to toggle scheduled report');
    }
  };

  const handleTrigger = async (reportId: string) => {
    try {
      showNotification('info', 'Generating report...');
      await ScheduledReportService.triggerReport(reportId);
      showNotification('success', 'Report generated and sent successfully');
      loadScheduledReports();
    } catch (error) {
      console.error('Error triggering report:', error);
      showNotification('error', 'Failed to generate report');
    }
  };

  const resetForm = () => {
    setSelectedReport(null);
    setFormData({
      name: '',
      description: '',
      savedReportId: '',
      frequency: 'weekly',
      time: '09:00',
      dayOfWeek: 1,
      dayOfMonth: 1,
      recipients: '',
      format: 'pdf',
      enabled: true
    });
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'running':
        return <AlertCircle className="w-5 h-5 text-yellow-500 animate-pulse" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleString('en-AU', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Scheduled Reports</h1>
            <p className="mt-2 text-gray-600">
              Automate report generation and delivery
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Schedule New Report
          </button>
        </div>
      </div>

      {/* Scheduled Reports List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : scheduledReports.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Scheduled Reports</h3>
          <p className="text-gray-500 mb-4">
            Schedule reports to be automatically generated and emailed
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Create First Schedule
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Report
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Schedule
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recipients
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Run
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Next Run
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {scheduledReports.map((report) => (
                <tr key={report.id} className={!report.enabled ? 'opacity-60' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{report.name}</div>
                      {report.description && (
                        <div className="text-sm text-gray-500">{report.description}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm text-gray-900">
                      <Clock className="w-4 h-4 text-gray-400" />
                      {ScheduledReportService.formatSchedule(report.schedule_config)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">
                        {report.recipients.length} recipient{report.recipients.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(report.last_run_status)}
                      <span className="text-sm text-gray-900">
                        {formatDate(report.last_run_at)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {report.enabled ? formatDate(report.next_run_at) : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      report.enabled
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {report.enabled ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleTrigger(report.id)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Run Now"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggle(report)}
                        className="text-gray-600 hover:text-gray-900"
                        title={report.enabled ? 'Disable' : 'Enable'}
                      >
                        {report.enabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedReport(report);
                          loadReportHistory(report.id);
                        }}
                        className="text-gray-600 hover:text-gray-900"
                        title="View History"
                      >
                        <History className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(report)}
                        className="text-gray-600 hover:text-gray-900"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(report.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Schedule Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {selectedReport ? 'Edit' : 'Create'} Scheduled Report
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                {/* Report Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Report Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                    rows={2}
                  />
                </div>

                {/* Select Report */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Report Template
                  </label>
                  <select
                    value={formData.savedReportId}
                    onChange={(e) => setFormData({ ...formData, savedReportId: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                    required
                  >
                    <option value="">Choose a saved report...</option>
                    {savedReports.map((report) => (
                      <option key={report.id} value={report.id}>
                        {report.name} - {report.description}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Schedule Configuration */}
                <div className="border-t pt-4">
                  <h3 className="font-medium text-gray-900 mb-3">Schedule Configuration</h3>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Frequency */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Frequency
                      </label>
                      <select
                        value={formData.frequency}
                        onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
                        className="w-full p-2 border rounded-lg"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>

                    {/* Time */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Time
                      </label>
                      <input
                        type="time"
                        value={formData.time}
                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                        className="w-full p-2 border rounded-lg"
                        required
                      />
                    </div>

                    {/* Day of Week (for weekly) */}
                    {formData.frequency === 'weekly' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Day of Week
                        </label>
                        <select
                          value={formData.dayOfWeek}
                          onChange={(e) => setFormData({ ...formData, dayOfWeek: parseInt(e.target.value) })}
                          className="w-full p-2 border rounded-lg"
                        >
                          <option value={0}>Sunday</option>
                          <option value={1}>Monday</option>
                          <option value={2}>Tuesday</option>
                          <option value={3}>Wednesday</option>
                          <option value={4}>Thursday</option>
                          <option value={5}>Friday</option>
                          <option value={6}>Saturday</option>
                        </select>
                      </div>
                    )}

                    {/* Day of Month (for monthly) */}
                    {formData.frequency === 'monthly' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Day of Month
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={formData.dayOfMonth}
                          onChange={(e) => setFormData({ ...formData, dayOfMonth: parseInt(e.target.value) })}
                          className="w-full p-2 border rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Delivery Configuration */}
                <div className="border-t pt-4">
                  <h3 className="font-medium text-gray-900 mb-3">Delivery Configuration</h3>

                  {/* Recipients */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Recipients (comma-separated emails)
                    </label>
                    <textarea
                      value={formData.recipients}
                      onChange={(e) => setFormData({ ...formData, recipients: e.target.value })}
                      className="w-full p-2 border rounded-lg"
                      rows={2}
                      placeholder="admin@example.com, finance@example.com"
                      required
                    />
                  </div>

                  {/* Format */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Export Format
                    </label>
                    <select
                      value={formData.format}
                      onChange={(e) => setFormData({ ...formData, format: e.target.value as any })}
                      className="w-full p-2 border rounded-lg"
                    >
                      <option value="pdf">PDF</option>
                      <option value="excel">Excel</option>
                      <option value="csv">CSV</option>
                      <option value="json">JSON</option>
                    </select>
                  </div>
                </div>

                {/* Enabled Status */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="enabled"
                    checked={formData.enabled}
                    onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="enabled" className="text-sm font-medium text-gray-700">
                    Enable this scheduled report
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {selectedReport ? 'Update' : 'Create'} Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Report Execution History</h2>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {reportRuns.length === 0 ? (
              <div className="text-center py-8">
                <History className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No execution history available</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Started
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Completed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recipients
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Error
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportRuns.map((run) => (
                    <tr key={run.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(run.started_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(run.completed_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(run.status)}
                          <span className="text-sm capitalize">{run.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {run.recipients_notified.length} sent
                      </td>
                      <td className="px-6 py-4 text-sm text-red-600">
                        {run.error_message || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduledReportsPage;
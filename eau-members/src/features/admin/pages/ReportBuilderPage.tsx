import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText, Download, Plus, Play, Clock, Calendar,
  Filter, Table, ChevronDown, X, Save, Eye,
  BarChart3, PieChart, TrendingUp, Users, Award, DollarSign,
  FileSpreadsheet, FileJson
} from 'lucide-react';
import { notifications } from '../../../lib/notifications';
import { supabase } from '../../../lib/supabase';
import { StatsCardSkeleton } from '../../../components/ui/SkeletonLoader';
import { ReportExportService } from '../../../services/reportExportService';
import { getUserInstitution } from '../../../services/institutionService';
import { useAuthStore } from '../../../stores/authStore';

// Report types
interface ReportField {
  name: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  table: string;
}

interface ReportFilter {
  field: string;
  operator: string;
  value: any;
  label?: string;
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: any;
  fields: string[];
  defaultFilters?: ReportFilter[];
  groupBy?: string[];
  orderBy?: string;
  aggregations?: { field: string; function: string; alias: string }[];
}

// Predefined report templates
const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'membership-summary',
    name: 'Membership Summary',
    description: 'Overview of all active memberships',
    category: 'Memberships',
    icon: Users,
    fields: ['members.first_name', 'members.last_name', 'members.email', 'members.membership_type', 'members.membership_status'],
    defaultFilters: [
      { field: 'members.membership_status', operator: '=', value: 'active', label: 'Active memberships only' }
    ],
    orderBy: 'members.last_name'
  },
  {
    id: 'cpd-report',
    name: 'CPD Activities Report',
    description: 'Summary of CPD activities by member',
    category: 'CPD',
    icon: Award,
    fields: ['members.first_name', 'members.last_name', 'cpd_activities.activity_name', 'cpd_activities.cpd_points', 'cpd_activities.activity_date', 'cpd_activities.status'],
    defaultFilters: [
      { field: 'cpd_activities.status', operator: '=', value: 'approved', label: 'Approved activities only' }
    ],
    orderBy: 'cpd_activities.activity_date DESC'
  },
  {
    id: 'event-attendance',
    name: 'Event Attendance Report',
    description: 'Attendance statistics for events',
    category: 'Events',
    icon: Calendar,
    fields: ['events.title', 'events.start_date', 'events.location_type', 'events.capacity'],
    aggregations: [
      { field: 'event_registrations.id', function: 'COUNT', alias: 'total_registrations' }
    ],
    groupBy: ['events.id', 'events.title', 'events.start_date', 'events.location_type', 'events.capacity'],
    orderBy: 'events.start_date DESC'
  },
  {
    id: 'financial-summary',
    name: 'Financial Summary',
    description: 'Membership fees and revenue report',
    category: 'Financial',
    icon: DollarSign,
    fields: ['institutions.name', 'institutions.membership_type', 'membership_fees.base_fee', 'membership_fees.gst_amount', 'membership_fees.total_amount'],
    orderBy: 'membership_fees.total_amount DESC'
  },
  {
    id: 'member-demographics',
    name: 'Member Demographics',
    description: 'Distribution of members by location and institution',
    category: 'Analytics',
    icon: PieChart,
    fields: ['institutions.name', 'members.membership_type', 'members.membership_status'],
    aggregations: [
      { field: 'members.id', function: 'COUNT', alias: 'member_count' }
    ],
    groupBy: ['institutions.name', 'members.membership_type', 'members.membership_status'],
    orderBy: 'member_count DESC'
  }
];

// Available fields for custom reports
const AVAILABLE_FIELDS: ReportField[] = [
  // Members fields
  { name: 'members.first_name', label: 'First Name', type: 'string', table: 'members' },
  { name: 'members.last_name', label: 'Last Name', type: 'string', table: 'members' },
  { name: 'members.email', label: 'Email', type: 'string', table: 'members' },
  { name: 'members.membership_type', label: 'Membership Type', type: 'string', table: 'members' },
  { name: 'members.membership_status', label: 'Membership Status', type: 'string', table: 'members' },
  { name: 'members.created_at', label: 'Member Since', type: 'date', table: 'members' },

  // Institutions fields
  { name: 'institutions.name', label: 'Institution Name', type: 'string', table: 'institutions' },
  { name: 'institutions.membership_type', label: 'Institution Type', type: 'string', table: 'institutions' },
  { name: 'institutions.membership_status', label: 'Institution Status', type: 'string', table: 'institutions' },
  { name: 'institutions.membership_start_date', label: 'Membership Start', type: 'date', table: 'institutions' },
  { name: 'institutions.membership_expiry_date', label: 'Membership Expiry', type: 'date', table: 'institutions' },

  // Events fields
  { name: 'events.title', label: 'Event Title', type: 'string', table: 'events' },
  { name: 'events.start_date', label: 'Event Date', type: 'date', table: 'events' },
  { name: 'events.location_type', label: 'Location Type', type: 'string', table: 'events' },
  { name: 'events.capacity', label: 'Capacity', type: 'number', table: 'events' },
  { name: 'events.cpd_points', label: 'CPD Points', type: 'number', table: 'events' },

  // CPD fields
  { name: 'cpd_activities.activity_name', label: 'Activity Name', type: 'string', table: 'cpd_activities' },
  { name: 'cpd_activities.cpd_points', label: 'CPD Points', type: 'number', table: 'cpd_activities' },
  { name: 'cpd_activities.activity_date', label: 'Activity Date', type: 'date', table: 'cpd_activities' },
  { name: 'cpd_activities.status', label: 'CPD Status', type: 'string', table: 'cpd_activities' },
];

// Filter operators
const OPERATORS = {
  string: [
    { value: '=', label: 'equals' },
    { value: '!=', label: 'not equals' },
    { value: 'LIKE', label: 'contains' },
    { value: 'NOT LIKE', label: 'does not contain' },
    { value: 'ILIKE', label: 'contains (case insensitive)' }
  ],
  number: [
    { value: '=', label: 'equals' },
    { value: '!=', label: 'not equals' },
    { value: '>', label: 'greater than' },
    { value: '>=', label: 'greater than or equal' },
    { value: '<', label: 'less than' },
    { value: '<=', label: 'less than or equal' }
  ],
  date: [
    { value: '=', label: 'equals' },
    { value: '!=', label: 'not equals' },
    { value: '>', label: 'after' },
    { value: '>=', label: 'on or after' },
    { value: '<', label: 'before' },
    { value: '<=', label: 'on or before' }
  ],
  boolean: [
    { value: '=', label: 'is' }
  ]
};

export const ReportBuilderPage: React.FC = () => {
  const { roles } = useAuthStore();
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [filters, setFilters] = useState<ReportFilter[]>([]);
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showQueryBuilder, setShowQueryBuilder] = useState(false);
  const [reportName, setReportName] = useState('');
  const [savedReports, setSavedReports] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'templates' | 'custom' | 'saved'>('templates');
  const [userInstitution, setUserInstitution] = useState<{ institutionId: string | null; institutionName: string }>({
    institutionId: null,
    institutionName: 'All Institutions'
  });

  // Load saved reports and institution context
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    // Get user's institution context
    const institution = await getUserInstitution();
    setUserInstitution(institution);

    // Load saved reports
    await loadSavedReports();
  };

  const loadSavedReports = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setSavedReports(data);
      }
    } catch (error) {
      console.error('Error loading saved reports:', error);
    }
  };

  // Apply template
  const applyTemplate = (template: ReportTemplate) => {
    setSelectedTemplate(template);
    setSelectedFields(template.fields);
    setFilters(template.defaultFilters || []);
    setReportName(template.name);
    setShowQueryBuilder(true);
  };

  // Add field to report
  const addField = (fieldName: string) => {
    if (!selectedFields.includes(fieldName)) {
      setSelectedFields([...selectedFields, fieldName]);
    }
  };

  // Remove field from report
  const removeField = (fieldName: string) => {
    setSelectedFields(selectedFields.filter(f => f !== fieldName));
  };

  // Add filter
  const addFilter = () => {
    setFilters([...filters, { field: '', operator: '=', value: '' }]);
  };

  // Update filter
  const updateFilter = (index: number, updates: Partial<ReportFilter>) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], ...updates };
    setFilters(newFilters);
  };

  // Remove filter
  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  // Generate and run report
  const runReport = async () => {
    if (selectedFields.length === 0) {
      notifications.error('Please select at least one field for the report');
      return;
    }

    setLoading(true);
    try {
      // Build query dynamically
      const tables = new Set(selectedFields.map(f => f.split('.')[0]));
      const baseTable = Array.from(tables)[0];

      let query = supabase.from(baseTable).select(selectedFields.join(','));

      // Apply institution filter for Institution Admin
      if (!roles.includes('AdminSuper') && userInstitution.institutionId) {
        // Apply institution filter based on the table
        if (baseTable === 'members' || baseTable === 'institutions') {
          query = query.eq('institution_id', userInstitution.institutionId);
        } else if (baseTable === 'events') {
          query = query.eq('institution_id', userInstitution.institutionId);
        } else if (baseTable === 'cpd_activities') {
          // For CPD, we need to filter by member's institution
          // This requires joining with members table
          query = query.in('member_id',
            supabase.from('members')
              .select('id')
              .eq('institution_id', userInstitution.institutionId)
          );
        }
      }

      // Apply filters
      filters.forEach(filter => {
        if (filter.field && filter.value) {
          const [table, field] = filter.field.split('.');
          if (filter.operator === 'LIKE' || filter.operator === 'ILIKE') {
            query = query.filter(field, filter.operator.toLowerCase(), `%${filter.value}%`);
          } else {
            query = query.filter(field, filter.operator.toLowerCase(), filter.value);
          }
        }
      });

      // Apply ordering
      if (selectedTemplate?.orderBy) {
        const [field, direction] = selectedTemplate.orderBy.split(' ');
        query = query.order(field.split('.')[1], { ascending: direction !== 'DESC' });
      }

      const { data, error } = await query;

      if (error) throw error;

      setReportData(data || []);
      notifications.success(`Report generated with ${data?.length || 0} rows`);
    } catch (error) {
      console.error('Error running report:', error);
      notifications.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  // Export report using the new service
  const exportReport = (format: 'csv' | 'excel' | 'pdf' | 'json') => {
    if (reportData.length === 0) {
      notifications.error('No data to export');
      return;
    }

    const exportOptions = {
      title: reportName || 'Report',
      filename: reportName || 'report',
      includeTimestamp: true,
      includeMetadata: true,
      author: 'English Australia',
      subject: selectedTemplate?.description || 'Custom Report'
    };

    switch (format) {
      case 'csv':
        ReportExportService.exportToCSV(reportData, exportOptions);
        break;
      case 'excel':
        ReportExportService.exportToExcel(reportData, exportOptions);
        break;
      case 'pdf':
        ReportExportService.exportToPDF(reportData, exportOptions);
        break;
      case 'json':
        ReportExportService.exportToJSON(reportData, exportOptions);
        break;
    }
  };

  // Save report configuration
  const saveReport = async () => {
    if (!reportName) {
      notifications.error('Please enter a report name');
      return;
    }

    try {
      const { error } = await supabase.from('saved_reports').insert({
        name: reportName,
        description: selectedTemplate?.description || 'Custom report',
        configuration: {
          fields: selectedFields,
          filters,
          template: selectedTemplate?.id
        }
      });

      if (error) throw error;

      notifications.success('Report saved successfully');
      loadSavedReports();
    } catch (error) {
      console.error('Error saving report:', error);
      notifications.error('Failed to save report');
    }
  };

  // Group templates by category
  const templatesByCategory = useMemo(() => {
    return REPORT_TEMPLATES.reduce((acc, template) => {
      if (!acc[template.category]) {
        acc[template.category] = [];
      }
      acc[template.category].push(template);
      return acc;
    }, {} as Record<string, ReportTemplate[]>);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Report Builder</h1>
            <p className="mt-2 text-gray-600">Create custom reports and analytics from your data</p>
          </div>
          <a
            href="/admin/scheduled-reports"
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
          >
            <Calendar className="w-5 h-5" />
            Scheduled Reports
          </a>
        </div>
      </div>

      {/* Institution Context Indicator */}
      {!roles.includes('AdminSuper') && userInstitution.institutionId && (
        <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Institution View:</strong> Reports will be filtered to show data for {userInstitution.institutionName} only
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('templates')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'templates'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FileText className="inline-block w-4 h-4 mr-2" />
            Report Templates
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'custom'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Plus className="inline-block w-4 h-4 mr-2" />
            Custom Report
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'saved'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Save className="inline-block w-4 h-4 mr-2" />
            Saved Reports
          </button>
        </nav>
      </div>

      {/* Report Templates */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          {Object.entries(templatesByCategory).map(([category, templates]) => (
            <div key={category}>
              <h3 className="text-lg font-medium text-gray-900 mb-3">{category}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map(template => {
                  const Icon = template.icon;
                  return (
                    <div
                      key={template.id}
                      className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
                      onClick={() => applyTemplate(template)}
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <Icon className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="ml-3 flex-1">
                          <h4 className="text-sm font-medium text-gray-900">{template.name}</h4>
                          <p className="mt-1 text-sm text-gray-500">{template.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Custom Report Builder */}
      {activeTab === 'custom' && (
        <div>
          <button
            onClick={() => {
              setSelectedTemplate(null);
              setSelectedFields([]);
              setFilters([]);
              setReportName('Custom Report');
              setShowQueryBuilder(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Custom Report
          </button>
        </div>
      )}

      {/* Saved Reports */}
      {activeTab === 'saved' && (
        <div className="space-y-4">
          {savedReports.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg">
              <Save className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No saved reports</h3>
              <p className="mt-1 text-sm text-gray-500">Create and save reports to access them here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedReports.map(report => (
                <div
                  key={report.id}
                  className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
                  onClick={() => {
                    setSelectedFields(report.configuration.fields);
                    setFilters(report.configuration.filters);
                    setReportName(report.name);
                    setShowQueryBuilder(true);
                  }}
                >
                  <h4 className="text-sm font-medium text-gray-900">{report.name}</h4>
                  <p className="mt-1 text-sm text-gray-500">{report.description}</p>
                  <p className="mt-2 text-xs text-gray-400">
                    Created {new Date(report.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Query Builder Modal */}
      {showQueryBuilder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 lg:w-4/5 shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <input
                  type="text"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  className="text-lg font-medium text-gray-900 border-b border-gray-300 focus:border-blue-500 focus:outline-none"
                />
                <p className="text-sm text-gray-500 mt-1">Configure your report parameters</p>
              </div>
              <button
                onClick={() => setShowQueryBuilder(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Field Selection */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Select Fields</h3>
                <div className="border border-gray-200 rounded-md p-4 max-h-96 overflow-y-auto">
                  {AVAILABLE_FIELDS.map(field => (
                    <label key={field.name} className="flex items-center py-2 hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={selectedFields.includes(field.name)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            addField(field.name);
                          } else {
                            removeField(field.name);
                          }
                        }}
                        className="mr-3 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{field.label}</span>
                      <span className="ml-auto text-xs text-gray-400">{field.table}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Filters */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-900">Filters</h3>
                  <button
                    onClick={addFilter}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    <Plus className="inline-block w-4 h-4 mr-1" />
                    Add Filter
                  </button>
                </div>
                <div className="border border-gray-200 rounded-md p-4 max-h-96 overflow-y-auto">
                  {filters.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No filters applied</p>
                  ) : (
                    <div className="space-y-3">
                      {filters.map((filter, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <select
                            value={filter.field}
                            onChange={(e) => updateFilter(index, { field: e.target.value })}
                            className="flex-1 text-sm border-gray-300 rounded-md"
                          >
                            <option value="">Select field...</option>
                            {AVAILABLE_FIELDS.map(field => (
                              <option key={field.name} value={field.name}>
                                {field.label}
                              </option>
                            ))}
                          </select>
                          <select
                            value={filter.operator}
                            onChange={(e) => updateFilter(index, { operator: e.target.value })}
                            className="text-sm border-gray-300 rounded-md"
                          >
                            {OPERATORS.string.map(op => (
                              <option key={op.value} value={op.value}>
                                {op.label}
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={filter.value}
                            onChange={(e) => updateFilter(index, { value: e.target.value })}
                            placeholder="Value"
                            className="flex-1 text-sm border-gray-300 rounded-md"
                          />
                          <button
                            onClick={() => removeFilter(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
              <button
                onClick={() => setShowQueryBuilder(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveReport}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <Save className="inline-block w-4 h-4 mr-1" />
                Save Configuration
              </button>
              <button
                onClick={() => {
                  runReport();
                  setShowQueryBuilder(false);
                }}
                disabled={loading || selectedFields.length === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                <Play className="inline-block w-4 h-4 mr-1" />
                Run Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Results */}
      {reportData.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">
              Report Results ({reportData.length} rows)
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={() => exportReport('pdf')}
                className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
              >
                <FileText className="mr-2 h-4 w-4" />
                PDF
              </button>
              <button
                onClick={() => exportReport('excel')}
                className="inline-flex items-center px-3 py-2 border border-green-300 shadow-sm text-sm leading-4 font-medium rounded-md text-green-700 bg-white hover:bg-green-50"
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Excel
              </button>
              <button
                onClick={() => exportReport('csv')}
                className="inline-flex items-center px-3 py-2 border border-blue-300 shadow-sm text-sm leading-4 font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50"
              >
                <Table className="mr-2 h-4 w-4" />
                CSV
              </button>
              <button
                onClick={() => exportReport('json')}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <FileJson className="mr-2 h-4 w-4" />
                JSON
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {Object.keys(reportData[0]).map(key => (
                    <th
                      key={key}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {key.replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.slice(0, 100).map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    {Object.values(row).map((value: any, i) => (
                      <td key={i} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {value instanceof Date
                          ? new Date(value).toLocaleDateString()
                          : value?.toString() || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {reportData.length > 100 && (
              <div className="text-center py-4 text-sm text-gray-500">
                Showing first 100 rows of {reportData.length}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
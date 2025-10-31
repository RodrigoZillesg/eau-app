import React, { useState, useEffect } from 'react';
import {
  FileText, Download, Users, Calendar, Award, DollarSign,
  TrendingUp, BarChart3, Clock, CheckCircle, AlertCircle,
  Filter, Search, RefreshCw
} from 'lucide-react';
import { notifications } from '../../../lib/notifications';
import { supabase } from '../../../lib/supabase';
import { StatsCardSkeleton } from '../../../components/ui/SkeletonLoader';
import { ReportExportService } from '../../../services/reportExportService';

// Standard Report Types
interface StandardReport {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: any;
  color: string;
  features: string[];
  query: () => Promise<any[]>;
  processData?: (data: any[]) => any[];
}

// Define standard reports
const STANDARD_REPORTS: StandardReport[] = [
  {
    id: 'membership-detailed',
    name: 'Detailed Membership Report',
    description: 'Comprehensive overview of all memberships with institution details, expiry dates, and status',
    category: 'Memberships',
    icon: Users,
    color: 'blue',
    features: [
      'Institution details and contact information',
      'Membership types, status, and expiry dates',
      'Member counts per institution',
      'Days until expiry calculations',
      'Renewal alerts and notifications'
    ],
    query: async () => {
      const { data, error } = await supabase
        .from('institutions')
        .select(`
          id,
          name,
          membership_type,
          membership_status,
          membership_start_date,
          membership_expiry_date,
          address,
          city,
          state,
          postal_code,
          country,
          primary_contact_name,
          primary_contact_email,
          created_at,
          members!inner(id)
        `)
        .order('membership_expiry_date', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    processData: (data: any[]) => {
      return data.map(institution => {
        const expiryDate = new Date(institution.membership_expiry_date);
        const today = new Date();
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

        return {
          'Institution Name': institution.name,
          'Membership Type': institution.membership_type,
          'Status': institution.membership_status,
          'Start Date': new Date(institution.membership_start_date).toLocaleDateString(),
          'Expiry Date': expiryDate.toLocaleDateString(),
          'Days Until Expiry': daysUntilExpiry,
          'Renewal Status': daysUntilExpiry < 0 ? 'EXPIRED' : daysUntilExpiry <= 30 ? 'DUE SOON' : 'CURRENT',
          'Member Count': institution.members?.length || 0,
          'Primary Contact': institution.primary_contact_name,
          'Contact Email': institution.primary_contact_email,
          'Location': `${institution.city}, ${institution.state}`,
          'Country': institution.country,
          'Created': new Date(institution.created_at).toLocaleDateString()
        };
      });
    }
  },
  {
    id: 'financial-comprehensive',
    name: 'Comprehensive Financial Report',
    description: 'Complete financial overview including membership fees, GST, payment status, and revenue analysis',
    category: 'Financial',
    icon: DollarSign,
    color: 'green',
    features: [
      'Membership fee breakdown by type',
      'GST calculations and totals',
      'Revenue projections and trends',
      'Payment status tracking',
      'Financial summaries by period'
    ],
    query: async () => {
      const { data, error } = await supabase
        .from('membership_fees')
        .select(`
          id,
          membership_type,
          base_fee,
          gst_amount,
          total_amount,
          effective_from,
          created_at,
          institutions!inner(
            name,
            membership_status,
            membership_type,
            membership_start_date,
            membership_expiry_date
          )
        `)
        .order('total_amount', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    processData: (data: any[]) => {
      return data.map(fee => ({
        'Institution': fee.institutions.name,
        'Membership Type': fee.membership_type,
        'Institution Status': fee.institutions.membership_status,
        'Base Fee (AUD)': `$${fee.base_fee.toFixed(2)}`,
        'GST Amount (AUD)': `$${fee.gst_amount.toFixed(2)}`,
        'Total Amount (AUD)': `$${fee.total_amount.toFixed(2)}`,
        'Start Date': new Date(fee.institutions.membership_start_date).toLocaleDateString(),
        'Expiry Date': new Date(fee.institutions.membership_expiry_date).toLocaleDateString(),
        'Fee Effective From': new Date(fee.effective_from).toLocaleDateString(),
        'Annual Revenue': fee.institutions.membership_status === 'active' ? `$${fee.total_amount.toFixed(2)}` : '$0.00'
      }));
    }
  },
  {
    id: 'events-comprehensive',
    name: 'Comprehensive Events Report',
    description: 'Detailed analysis of events including attendance, capacity utilization, CPD impact, and member engagement',
    category: 'Events',
    icon: Calendar,
    color: 'purple',
    features: [
      'Event attendance and capacity analysis',
      'CPD points distribution',
      'Member engagement metrics',
      'Location and format statistics',
      'Registration trends over time'
    ],
    query: async () => {
      const { data, error } = await supabase
        .from('events')
        .select(`
          id,
          title,
          description,
          start_date,
          end_date,
          location_type,
          venue_name,
          virtual_link,
          capacity,
          cpd_points,
          cpd_category,
          status,
          created_at
        `)
        .order('start_date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    processData: (data: any[]) => {
      return data.map(event => {
        const registrations = event.event_registrations || [];
        const attended = registrations.filter(r => r.attended).length;
        const capacityUtilization = event.capacity ? (registrations.length / event.capacity * 100) : 0;
        const attendanceRate = registrations.length > 0 ? (attended / registrations.length * 100) : 0;

        return {
          'Event Title': event.title,
          'Date': new Date(event.start_date).toLocaleDateString(),
          'Time': new Date(event.start_date).toLocaleTimeString(),
          'Location Type': event.location_type,
          'Venue': event.venue_name || event.virtual_link || 'N/A',
          'Status': event.status,
          'Capacity': event.capacity || 'Unlimited',
          'Registrations': registrations.length,
          'Attended': attended,
          'Attendance Rate (%)': `${attendanceRate.toFixed(1)}%`,
          'Capacity Utilization (%)': `${capacityUtilization.toFixed(1)}%`,
          'CPD Points': event.cpd_points || 0,
          'CPD Category': event.cpd_category || 'N/A',
          'Total CPD Awarded': (attended * (event.cpd_points || 0)),
          'Created Date': new Date(event.created_at).toLocaleDateString()
        };
      });
    }
  },
  {
    id: 'cpd-detailed',
    name: 'Detailed CPD Report',
    description: 'Complete CPD tracking including member progress, activity types, approval status, and annual targets',
    category: 'CPD',
    icon: Award,
    color: 'orange',
    features: [
      'Individual member CPD progress',
      'Activity type distribution',
      'Approval status tracking',
      'Annual target achievement',
      'CPD points by category and source'
    ],
    query: async () => {
      const { data, error } = await supabase
        .from('cpd_activities')
        .select(`
          id,
          activity_name,
          activity_type,
          cpd_points,
          activity_date,
          status,
          cpd_category,
          created_at,
          user_id,
          members!inner(
            first_name,
            last_name,
            email,
            membership_type,
            institutions(name)
          )
        `)
        .order('activity_date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    processData: (data: any[]) => {
      // Calculate yearly totals for each member
      const memberTotals = data.reduce((acc, activity) => {
        const memberId = activity.user_id;
        const year = new Date(activity.activity_date).getFullYear();
        const key = `${memberId}-${year}`;

        if (!acc[key]) {
          acc[key] = {
            member: activity.members,
            year,
            totalPoints: 0,
            approvedPoints: 0,
            activities: 0,
            categories: new Set()
          };
        }

        acc[key].activities++;
        acc[key].categories.add(activity.cpd_category);

        if (activity.status === 'approved') {
          acc[key].approvedPoints += activity.cpd_points || 0;
        }

        acc[key].totalPoints += activity.cpd_points || 0;

        return acc;
      }, {} as any);

      return data.map(activity => {
        const memberKey = `${activity.user_id}-${new Date(activity.activity_date).getFullYear()}`;
        const memberTotal = memberTotals[memberKey];

        return {
          'Member Name': `${activity.members.first_name} ${activity.members.last_name}`,
          'Institution': activity.members.institutions?.name || 'N/A',
          'Membership Type': activity.members.membership_type,
          'Activity Name': activity.activity_name,
          'Activity Type': activity.activity_type,
          'CPD Category': activity.cpd_category,
          'Points': activity.cpd_points || 0,
          'Status': activity.status,
          'Activity Date': new Date(activity.activity_date).toLocaleDateString(),
          'Year': new Date(activity.activity_date).getFullYear(),
          'Annual Total Points': memberTotal?.totalPoints || 0,
          'Annual Approved Points': memberTotal?.approvedPoints || 0,
          'Annual Activities': memberTotal?.activities || 0,
          'Target Achievement (%)': `${((memberTotal?.approvedPoints || 0) / 20 * 100).toFixed(1)}%`,
          'Created Date': new Date(activity.created_at).toLocaleDateString()
        };
      });
    }
  }
];

export const StandardReportsPage: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState<StandardReport | null>(null);
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Get unique categories
  const categories = Array.from(new Set(STANDARD_REPORTS.map(r => r.category)));

  // Filter reports
  const filteredReports = STANDARD_REPORTS.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || report.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Run selected report
  const runReport = async (report: StandardReport) => {
    setSelectedReport(report);
    setLoading(true);

    try {
      const rawData = await report.query();
      const processedData = report.processData ? report.processData(rawData) : rawData;
      setReportData(processedData);
      notifications.success(`${report.name} generated with ${processedData.length} rows`);
    } catch (error) {
      console.error('Error running report:', error);
      notifications.error(`Failed to generate ${report.name}`);
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  // Export report
  const exportReport = (format: 'csv' | 'excel' | 'pdf' | 'json') => {
    if (!selectedReport || reportData.length === 0) {
      notifications.error('No data to export');
      return;
    }

    const exportOptions = {
      title: selectedReport.name,
      filename: selectedReport.id,
      includeTimestamp: true,
      includeMetadata: true,
      author: 'English Australia',
      subject: selectedReport.description
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Standard Reports</h1>
            <p className="mt-2 text-gray-600">
              Pre-configured reports for common business insights and analytics
            </p>
          </div>
          <div className="flex space-x-3">
            <a
              href="/admin/reports"
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center gap-2"
            >
              <BarChart3 className="w-5 h-5" />
              Report Builder
            </a>
            <a
              href="/admin/reports"
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
            >
              <BarChart3 className="w-5 h-5" />
              Custom Reports
            </a>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="sm:w-48">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Reports Grid */}
      {!selectedReport && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredReports.map(report => {
            const Icon = report.icon;
            const colorClasses = {
              blue: 'border-blue-200 hover:border-blue-300 bg-blue-50',
              green: 'border-green-200 hover:border-green-300 bg-green-50',
              purple: 'border-purple-200 hover:border-purple-300 bg-purple-50',
              orange: 'border-orange-200 hover:border-orange-300 bg-orange-50'
            };

            return (
              <div
                key={report.id}
                className={`bg-white p-6 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  colorClasses[report.color as keyof typeof colorClasses]
                }`}
                onClick={() => runReport(report)}
              >
                <div className="flex items-start">
                  <div className={`flex-shrink-0 p-3 rounded-lg bg-${report.color}-100`}>
                    <Icon className={`h-8 w-8 text-${report.color}-600`} />
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {report.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {report.description}
                    </p>
                    <div className="space-y-1">
                      {report.features.slice(0, 3).map((feature, index) => (
                        <div key={index} className="flex items-center text-xs text-gray-500">
                          <CheckCircle className="w-3 h-3 mr-2 text-green-500" />
                          {feature}
                        </div>
                      ))}
                      {report.features.length > 3 && (
                        <div className="text-xs text-gray-400 ml-5">
                          +{report.features.length - 3} more features
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex justify-between items-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${report.color}-100 text-${report.color}-800`}>
                    {report.category}
                  </span>
                  <div className="flex items-center text-sm text-gray-500">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    Generate Report
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          <StatsCardSkeleton />
          <StatsCardSkeleton />
          <StatsCardSkeleton />
        </div>
      )}

      {/* Report Results */}
      {selectedReport && reportData.length > 0 && !loading && (
        <div>
          {/* Report Header */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <selectedReport.icon className={`h-8 w-8 text-${selectedReport.color}-600 mr-3`} />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {selectedReport.name}
                  </h2>
                  <p className="text-sm text-gray-600">{selectedReport.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Generated on {new Date().toLocaleString()} • {reportData.length} records
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => runReport(selectedReport)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </button>
                <button
                  onClick={() => {
                    setSelectedReport(null);
                    setReportData([]);
                  }}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Back to Reports
                </button>
              </div>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="flex space-x-2 mb-4">
            <button
              onClick={() => exportReport('pdf')}
              className="inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
            >
              <FileText className="mr-2 h-4 w-4" />
              Export PDF
            </button>
            <button
              onClick={() => exportReport('excel')}
              className="inline-flex items-center px-4 py-2 border border-green-300 shadow-sm text-sm font-medium rounded-md text-green-700 bg-white hover:bg-green-50"
            >
              <Download className="mr-2 h-4 w-4" />
              Export Excel
            </button>
            <button
              onClick={() => exportReport('csv')}
              className="inline-flex items-center px-4 py-2 border border-blue-300 shadow-sm text-sm font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50"
            >
              <FileText className="mr-2 h-4 w-4" />
              Export CSV
            </button>
            <button
              onClick={() => exportReport('json')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Download className="mr-2 h-4 w-4" />
              Export JSON
            </button>
          </div>

          {/* Data Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {Object.keys(reportData[0]).map(key => (
                      <th
                        key={key}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      {Object.values(row).map((value: any, i) => (
                        <td key={i} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {value?.toString() || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Empty State for Search */}
      {filteredReports.length === 0 && !loading && !selectedReport && (
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No reports found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search terms or category filter
          </p>
        </div>
      )}
    </div>
  );
};
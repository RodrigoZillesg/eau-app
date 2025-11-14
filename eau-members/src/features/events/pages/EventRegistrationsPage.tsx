import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Users,
  Filter,
  Search,
  Edit2,
  Mail,
  FileText,
  Eye,
  Trash2
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { EventService } from '../../../services/eventService';
import { EventRegistrationService } from '../../../services/eventRegistrationService';
import type { Event, EventRegistration } from '../../../types/events';
import { format } from 'date-fns';
import { showNotification, notifications } from '../../../lib/notifications';
import { supabase } from '../../../lib/supabase';
import { RegistrationEditModalNew } from '../components/RegistrationEditModalNew';

export function EventRegistrationsPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [selectedRegistrations, setSelectedRegistrations] = useState<Set<string>>(new Set());
  const [editingPayment, setEditingPayment] = useState<string | null>(null);
  const [editingRegistration, setEditingRegistration] = useState<EventRegistration | null>(null);

  useEffect(() => {
    if (eventId) {
      loadData();
    }
  }, [eventId]);

  useEffect(() => {
    applyFilters();
  }, [registrations, searchTerm, statusFilter, paymentFilter]);

  const loadData = async () => {
    if (!eventId) return;

    try {
      setLoading(true);

      // Load event details
      const eventData = await EventService.getEventById(eventId);
      if (!eventData) {
        showNotification('error', 'Event not found');
        navigate('/admin/events');
        return;
      }
      setEvent(eventData);

      // Load registrations with member details
      const { data, error } = await supabase
        .from('event_registrations')
        .select(`
          *,
          members!fk_event_registrations_member (
            id,
            first_name,
            last_name,
            email,
            phone,
            membership_status,
            membership_type
          )
        `)
        .eq('event_id', eventId)
        .order('registration_date', { ascending: false });

      if (error) throw error;

      setRegistrations(data || []);
    } catch (error) {
      console.error('Error loading registrations:', error);
      showNotification('error', 'Failed to load registrations');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...registrations];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(reg => {
        const member = reg.members as any;
        const searchLower = searchTerm.toLowerCase();
        return (
          member?.first_name?.toLowerCase().includes(searchLower) ||
          member?.last_name?.toLowerCase().includes(searchLower) ||
          member?.email?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(reg => reg.status === statusFilter);
    }

    // Payment filter
    if (paymentFilter !== 'all') {
      filtered = filtered.filter(reg => reg.payment_status === paymentFilter);
    }

    setFilteredRegistrations(filtered);
  };

  const handleUpdatePaymentStatus = async (registrationId: string, paymentStatus: string) => {
    try {
      const { error } = await supabase
        .from('event_registrations')
        .update({
          payment_status: paymentStatus,
          payment_date: paymentStatus === 'paid' ? new Date().toISOString() : null
        })
        .eq('id', registrationId);

      if (error) throw error;

      showNotification('success', 'Payment status updated successfully');
      loadData();
      setEditingPayment(null);
    } catch (error) {
      console.error('Error updating payment status:', error);
      showNotification('error', 'Failed to update payment status');
    }
  };

  const handleBulkUpdatePayment = async (status: string) => {
    if (selectedRegistrations.size === 0) {
      showNotification('error', 'Please select registrations to update');
      return;
    }

    try {
      const { error } = await supabase
        .from('event_registrations')
        .update({
          payment_status: status,
          payment_date: status === 'paid' ? new Date().toISOString() : null
        })
        .in('id', Array.from(selectedRegistrations));

      if (error) throw error;

      showNotification('success', `Updated ${selectedRegistrations.size} registrations`);
      setSelectedRegistrations(new Set());
      loadData();
    } catch (error) {
      console.error('Error bulk updating:', error);
      showNotification('error', 'Failed to update registrations');
    }
  };

  const handleDeleteRegistration = async (id: string, memberName: string) => {
    const result = await notifications.confirmDelete(`the registration for ${memberName}`);

    if (!result.isConfirmed) {
      return;
    }

    try {
      setLoading(true);

      // First, delete the payment receipt from storage if it exists
      const registration = registrations.find(r => r.id === id);
      if (registration?.payment_receipt_url) {
        try {
          const url = new URL(registration.payment_receipt_url);
          const filePath = url.pathname.split('/event-registrations/')[1];
          if (filePath) {
            await supabase.storage
              .from('event-registrations')
              .remove([filePath]);
          }
        } catch (storageError) {
          console.error('Error deleting receipt:', storageError);
          // Continue with deletion even if storage cleanup fails
        }
      }

      // Delete the registration
      const { error } = await supabase
        .from('event_registrations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      showNotification('success', 'Registration deleted successfully');
      loadData();
    } catch (error: any) {
      console.error('Error deleting registration:', error);
      showNotification('error', error.message || 'Failed to delete registration');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRegistrations.size === 0) {
      showNotification('error', 'Please select registrations to delete');
      return;
    }

    const result = await notifications.confirm(
      'Delete Multiple Registrations?',
      `You are about to delete ${selectedRegistrations.size} registration(s). This action cannot be undone and will also delete any associated payment receipts.`,
      'Yes, delete them!',
      'Cancel'
    );

    if (!result.isConfirmed) {
      return;
    }

    try {
      setLoading(true);

      // First, delete all payment receipts from storage
      const selectedRegs = registrations.filter(r => selectedRegistrations.has(r.id));
      for (const reg of selectedRegs) {
        if (reg.payment_receipt_url) {
          try {
            const url = new URL(reg.payment_receipt_url);
            const filePath = url.pathname.split('/event-registrations/')[1];
            if (filePath) {
              await supabase.storage
                .from('event-registrations')
                .remove([filePath]);
            }
          } catch (storageError) {
            console.error('Error deleting receipt:', storageError);
            // Continue with deletion even if storage cleanup fails
          }
        }
      }

      // Delete the registrations
      const { error } = await supabase
        .from('event_registrations')
        .delete()
        .in('id', Array.from(selectedRegistrations));

      if (error) throw error;

      showNotification('success', `${selectedRegistrations.size} registration(s) deleted successfully`);
      setSelectedRegistrations(new Set());
      loadData();
    } catch (error: any) {
      console.error('Error bulk deleting:', error);
      showNotification('error', error.message || 'Failed to delete registrations');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Registration Date', 'Status', 'Payment Status', 'Payment Amount', 'Attended', 'Certificate Issued'];

    const rows = filteredRegistrations.map(reg => {
      const member = reg.members as any;
      return [
        `${member?.first_name || ''} ${member?.last_name || ''}`,
        member?.email || '',
        member?.phone || '',
        format(new Date(reg.registration_date), 'dd/MM/yyyy HH:mm'),
        reg.status || 'confirmed',
        reg.payment_status || 'pending',
        reg.payment_amount ? `$${(reg.payment_amount / 100).toFixed(2)}` : '',
        reg.attended ? 'Yes' : 'No',
        reg.certificate_issued ? 'Yes' : 'No'
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event?.slug || 'event'}-registrations-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    showNotification('success', 'Registrations exported successfully');
  };

  const toggleSelectAll = () => {
    if (selectedRegistrations.size === filteredRegistrations.length) {
      setSelectedRegistrations(new Set());
    } else {
      setSelectedRegistrations(new Set(filteredRegistrations.map(r => r.id)));
    }
  };

  const toggleSelectRegistration = (id: string) => {
    const newSelected = new Set(selectedRegistrations);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRegistrations(newSelected);
  };

  const getPaymentStatusBadge = (status: string | null) => {
    const statusMap = {
      paid: { label: 'Paid', className: 'bg-green-100 text-green-800' },
      partially_paid: { label: 'Partially Paid', className: 'bg-blue-100 text-blue-800' },
      pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
      failed: { label: 'Failed', className: 'bg-red-100 text-red-800' },
      refunded: { label: 'Refunded', className: 'bg-gray-100 text-gray-800' }
    };

    const config = statusMap[status as keyof typeof statusMap] || statusMap.pending;

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const getStatusBadge = (status: string | null) => {
    const statusMap = {
      confirmed: { label: 'Confirmed', className: 'bg-blue-100 text-blue-800' },
      cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800' },
      waitlist: { label: 'Waitlist', className: 'bg-orange-100 text-orange-800' }
    };

    const config = statusMap[status as keyof typeof statusMap] || statusMap.confirmed;

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  // Calculate statistics
  const stats = {
    total: registrations.length,
    paid: registrations.filter(r => r.payment_status === 'paid').length,
    pending: registrations.filter(r => r.payment_status === 'pending').length,
    attended: registrations.filter(r => r.attended).length,
    revenue: registrations
      .filter(r => r.payment_status === 'paid')
      .reduce((sum, r) => sum + (r.payment_amount || 0), 0)
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!event) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate('/admin/events')}
        className="mb-6"
      >
        <ChevronLeft className="h-4 w-4 mr-2" />
        Back to Events
      </Button>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{event.title} - Registrations</h1>
        <p className="text-gray-600">
          {format(new Date(event.start_date), 'MMMM d, yyyy')} • {event.location_type}
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Paid</p>
              <p className="text-2xl font-bold text-green-600">{stats.paid}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Attended</p>
              <p className="text-2xl font-bold text-purple-600">{stats.attended}</p>
            </div>
            <FileText className="w-8 h-8 text-purple-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Revenue</p>
              <p className="text-2xl font-bold text-indigo-600">
                ${(stats.revenue / 100).toFixed(2)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-indigo-500" />
          </div>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Status</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
            <option value="waitlist">Waitlist</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Payments</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>

          <Button onClick={handleExportCSV} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Bulk Actions */}
        {selectedRegistrations.size > 0 && (
          <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-md">
            <span className="text-sm font-medium text-blue-900">
              {selectedRegistrations.size} selected
            </span>
            <Button
              size="sm"
              onClick={() => handleBulkUpdatePayment('paid')}
              className="bg-green-600 hover:bg-green-700"
            >
              Mark as Paid
            </Button>
            <Button
              size="sm"
              onClick={() => handleBulkUpdatePayment('pending')}
              variant="outline"
            >
              Mark as Pending
            </Button>
            <Button
              size="sm"
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Selected
            </Button>
            <Button
              size="sm"
              onClick={() => setSelectedRegistrations(new Set())}
              variant="ghost"
            >
              Clear Selection
            </Button>
          </div>
        )}
      </Card>

      {/* Registrations Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedRegistrations.size === filteredRegistrations.length && filteredRegistrations.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registration Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRegistrations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    No registrations found
                  </td>
                </tr>
              ) : (
                filteredRegistrations.map((registration) => {
                  const member = registration.members as any;
                  return (
                    <tr key={registration.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedRegistrations.has(registration.id)}
                          onChange={() => toggleSelectRegistration(registration.id)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {member?.first_name} {member?.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {member?.membership_type || 'No membership'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{member?.email}</div>
                        <div className="text-sm text-gray-500">{member?.phone || '-'}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {format(new Date(registration.registration_date), 'dd MMM yyyy HH:mm')}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(registration.status)}
                      </td>
                      <td className="px-6 py-4">
                        {editingPayment === registration.id ? (
                          <select
                            value={registration.payment_status || 'pending'}
                            onChange={(e) => handleUpdatePaymentStatus(registration.id, e.target.value)}
                            className="text-sm border border-gray-300 rounded px-2 py-1"
                            autoFocus
                            onBlur={() => setEditingPayment(null)}
                          >
                            <option value="pending">Pending</option>
                            <option value="partially_paid">Partially Paid</option>
                            <option value="paid">Paid</option>
                            <option value="failed">Failed</option>
                            <option value="refunded">Refunded</option>
                          </select>
                        ) : (
                          <div className="flex items-center gap-2">
                            {getPaymentStatusBadge(registration.payment_status)}
                            <button
                              onClick={() => setEditingPayment(registration.id)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {registration.amount_paid_cents
                          ? `$${(registration.amount_paid_cents / 100).toFixed(2)}`
                          : (registration.payment_amount
                              ? `$${(registration.payment_amount / 100).toFixed(2)}`
                              : 'Free'
                            )
                        }
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingRegistration(registration)}
                            title="Edit full details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRegistration(
                              registration.id,
                              `${member?.first_name} ${member?.last_name}`
                            )}
                            title="Delete registration"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          {registration.attended && (
                            <CheckCircle className="w-4 h-4 text-green-600" title="Attended" />
                          )}
                          {registration.certificate_issued && (
                            <FileText className="w-4 h-4 text-blue-600" title="Certificate Issued" />
                          )}
                          {registration.checked_in && (
                            <Users className="w-4 h-4 text-purple-600" title="Checked In" />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit Registration Modal */}
      {editingRegistration && (
        <RegistrationEditModalNew
          registration={editingRegistration}
          onClose={() => setEditingRegistration(null)}
          onSave={() => {
            setEditingRegistration(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}

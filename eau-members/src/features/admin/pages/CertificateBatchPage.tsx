import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Award, 
  Calendar, 
  CheckCircle, 
  Clock, 
  Download, 
  RefreshCw,
  Users,
  AlertCircle,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { supabase } from '../../../lib/supabase/client';
import { EventRegistrationService } from '../../../services/eventRegistrationService';
import { showNotification } from '../../../lib/notifications';
import { format } from 'date-fns';

interface CompletedEvent {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  event_type: string;
  cpd_points: number;
  cpd_category: string;
  registration_count?: number;
  processed_count?: number;
  pending_count?: number;
}

export function CertificateBatchPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [completedEvents, setCompletedEvents] = useState<CompletedEvent[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalRegistrations: 0,
    pendingCertificates: 0,
    processedToday: 0
  });

  useEffect(() => {
    loadCompletedEvents();
    loadStats();
  }, []);

  const loadCompletedEvents = async () => {
    try {
      setLoading(true);
      
      // Get events that ended in the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'published')
        .lte('end_date', new Date().toISOString())
        .gte('end_date', thirtyDaysAgo.toISOString())
        .order('end_date', { ascending: false });
      
      if (error) throw error;
      
      // For each event, get registration counts
      const eventsWithCounts = await Promise.all(
        (events || []).map(async (event) => {
          // Get total registrations
          const { count: totalCount } = await supabase
            .from('event_registrations')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', event.id);
          
          // Get attended registrations
          const { count: attendedCount } = await supabase
            .from('event_registrations')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', event.id)
            .or('checked_in.eq.true,attended.eq.true');
          
          // Get processed (certificate issued) registrations
          const { count: processedCount } = await supabase
            .from('event_registrations')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', event.id)
            .eq('certificate_issued', true);
          
          return {
            ...event,
            registration_count: attendedCount || 0,
            processed_count: processedCount || 0,
            pending_count: (attendedCount || 0) - (processedCount || 0)
          };
        })
      );
      
      setCompletedEvents(eventsWithCounts.filter(e => e.pending_count > 0));
    } catch (error) {
      console.error('Error loading events:', error);
      showNotification('error', 'Failed to load completed events');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Total completed events
      const { count: totalEvents } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published')
        .lte('end_date', new Date().toISOString());
      
      // Total registrations for completed events
      const { data: completedEventIds } = await supabase
        .from('events')
        .select('id')
        .eq('status', 'published')
        .lte('end_date', new Date().toISOString());
      
      let totalRegistrations = 0;
      let pendingCertificates = 0;
      
      if (completedEventIds && completedEventIds.length > 0) {
        const eventIds = completedEventIds.map(e => e.id);
        
        // Total attended registrations
        const { count: attendedCount } = await supabase
          .from('event_registrations')
          .select('*', { count: 'exact', head: true })
          .in('event_id', eventIds)
          .or('checked_in.eq.true,attended.eq.true');
        
        totalRegistrations = attendedCount || 0;
        
        // Pending certificates
        const { count: pendingCount } = await supabase
          .from('event_registrations')
          .select('*', { count: 'exact', head: true })
          .in('event_id', eventIds)
          .or('checked_in.eq.true,attended.eq.true')
          .eq('certificate_issued', false);
        
        pendingCertificates = pendingCount || 0;
      }
      
      // Processed today
      const { count: processedToday } = await supabase
        .from('event_registrations')
        .select('*', { count: 'exact', head: true })
        .eq('certificate_issued', true)
        .gte('certificate_issued_date', today.toISOString());
      
      setStats({
        totalEvents: totalEvents || 0,
        totalRegistrations,
        pendingCertificates,
        processedToday: processedToday || 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleProcessSelected = async () => {
    if (selectedEvents.length === 0) {
      showNotification('warning', 'Please select events to process');
      return;
    }
    
    setProcessing(true);
    let totalProcessed = 0;
    let totalErrors = 0;
    
    try {
      for (const eventId of selectedEvents) {
        console.log(`Processing event ${eventId}...`);
        
        // Get all attended registrations without certificates
        const { data: registrations, error } = await supabase
          .from('event_registrations')
          .select('*')
          .eq('event_id', eventId)
          .or('checked_in.eq.true,attended.eq.true')
          .eq('certificate_issued', false);
        
        if (error) {
          console.error(`Error fetching registrations for event ${eventId}:`, error);
          totalErrors++;
          continue;
        }
        
        if (!registrations || registrations.length === 0) {
          console.log(`No pending registrations for event ${eventId}`);
          continue;
        }
        
        // Process each registration
        for (const registration of registrations) {
          try {
            console.log(`Generating certificate and CPD for registration ${registration.id}...`);
            await EventRegistrationService.generateCertificateAndCPD(registration.id);
            totalProcessed++;
          } catch (error) {
            console.error(`Error processing registration ${registration.id}:`, error);
            totalErrors++;
          }
        }
      }
      
      // Show results
      if (totalProcessed > 0) {
        showNotification('success', 
          `Successfully processed ${totalProcessed} certificates and CPD activities!`
        );
      }
      
      if (totalErrors > 0) {
        showNotification('warning', 
          `Completed with ${totalErrors} errors. Check console for details.`
        );
      }
      
      // Reload data
      await loadCompletedEvents();
      await loadStats();
      setSelectedEvents([]);
      
    } catch (error) {
      console.error('Error processing certificates:', error);
      showNotification('error', 'Failed to process certificates');
    } finally {
      setProcessing(false);
    }
  };

  const handleProcessAll = async () => {
    setProcessing(true);
    
    try {
      console.log('Processing all completed events...');
      await EventRegistrationService.processCompletedEvents();
      
      showNotification('success', 'All completed events processed successfully!');
      
      // Reload data
      await loadCompletedEvents();
      await loadStats();
      
    } catch (error) {
      console.error('Error processing all events:', error);
      showNotification('error', 'Failed to process events');
    } finally {
      setProcessing(false);
    }
  };

  const toggleEventSelection = (eventId: string) => {
    setSelectedEvents(prev => 
      prev.includes(eventId) 
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    );
  };

  const selectAllEvents = () => {
    if (selectedEvents.length === completedEvents.length) {
      setSelectedEvents([]);
    } else {
      setSelectedEvents(completedEvents.map(e => e.id));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Certificate & CPD Batch Processing</h1>
          <Button
            variant="outline"
            onClick={() => navigate('/admin')}
          >
            Back to Admin
          </Button>
        </div>
        
        <p className="text-gray-600">
          Generate certificates and CPD activities in batch for completed events
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Events</p>
                <p className="text-2xl font-bold">{stats.totalEvents}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Attendees</p>
                <p className="text-2xl font-bold">{stats.totalRegistrations}</p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Certificates</p>
                <p className="text-2xl font-bold">{stats.pendingCertificates}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Processed Today</p>
                <p className="text-2xl font-bold">{stats.processedToday}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </Card>
      </div>

      {/* Action Bar */}
      <Card className="mb-6">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={selectAllEvents}
                variant="outline"
                disabled={processing || loading}
              >
                {selectedEvents.length === completedEvents.length ? 'Deselect All' : 'Select All'}
              </Button>
              
              <Button
                onClick={handleProcessSelected}
                disabled={processing || selectedEvents.length === 0}
              >
                {processing ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Award className="h-4 w-4 mr-2" />
                    Process Selected ({selectedEvents.length})
                  </>
                )}
              </Button>
              
              <Button
                onClick={handleProcessAll}
                variant="secondary"
                disabled={processing}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Process Last 24 Hours
              </Button>
            </div>
            
            <div className="text-sm text-gray-600">
              {selectedEvents.length} of {completedEvents.length} events selected
            </div>
          </div>
        </div>
      </Card>

      {/* Events List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin h-8 w-8 text-primary-600" />
        </div>
      ) : completedEvents.length === 0 ? (
        <Card>
          <div className="p-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">All Certificates Processed</h3>
            <p className="text-gray-600">
              All attendees from recent events have their certificates and CPD points.
            </p>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedEvents.length === completedEvents.length}
                      onChange={selectAllEvents}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CPD Points
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pending
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {completedEvents.map((event) => (
                  <tr key={event.id} className={selectedEvents.includes(event.id) ? 'bg-blue-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedEvents.includes(event.id)}
                        onChange={() => toggleEventSelection(event.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {event.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {event.registration_count} attendees • {event.processed_count} processed
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(event.end_date), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        event.event_type === 'online' 
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {event.event_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {event.cpd_points || 1} points
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {event.pending_count > 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {event.pending_count} pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Complete
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          setSelectedEvents([event.id]);
                          await handleProcessSelected();
                        }}
                        disabled={processing || event.pending_count === 0}
                      >
                        Process
                        <ChevronRight className="h-3 w-3 ml-1" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Information Card */}
      <Card className="mt-6">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-3">How Automatic Processing Works</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• When members attend online events, the system marks their attendance automatically</p>
            <p>• After an event ends, certificates and CPD points are generated for all attendees</p>
            <p>• This page allows manual batch processing for any events that were missed</p>
            <p>• CPD activities are automatically approved and points are added instantly</p>
            <p>• Members can view their certificates and CPD points immediately after processing</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  DollarSign, 
  Award,
  CheckCircle,
  UserCheck,
  Download,
  AlertCircle,
  Ticket
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { EventRegistrationService } from '../../../services/eventRegistrationService';
import { EventService } from '../../../services/eventService';
import type { EventRegistration } from '../../../services/eventRegistrationService';
import type { Event } from '../../../types/events';
import { format } from 'date-fns';
import { useAuthStore } from '../../../stores/authStore';
import { showNotification } from '../../../lib/notifications';

interface RegisteredEvent {
  registration: EventRegistration;
  event: Event | null;
}

export function MyRegistrationsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [registrations, setRegistrations] = useState<RegisteredEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    if (user) {
      loadRegistrations();
    }
  }, [user]);

  const loadRegistrations = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      // Get user's registrations
      const userRegistrations = await EventRegistrationService.getUserRegistrations(user.id);
      
      // Load event details for each registration
      const registeredEvents: RegisteredEvent[] = await Promise.all(
        userRegistrations.map(async (registration) => {
          try {
            const event = await EventService.getEventById(registration.event_id);
            return { registration, event };
          } catch (error) {
            console.error(`Failed to load event ${registration.event_id}:`, error);
            return { registration, event: null };
          }
        })
      );
      
      setRegistrations(registeredEvents);
    } catch (error) {
      console.error('Error loading registrations:', error);
      showNotification('error', 'Failed to load your registrations');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRegistration = async (registrationId: string) => {
    try {
      await EventRegistrationService.cancelRegistration(registrationId);
      showNotification('success', 'Registration cancelled successfully');
      loadRegistrations(); // Reload the list
    } catch (error) {
      console.error('Error cancelling registration:', error);
      showNotification('error', 'Failed to cancel registration');
    }
  };

  const handleGenerateCertificate = async (registration: EventRegistration) => {
    try {
      const certificate = await EventRegistrationService.generateCertificate(registration.id);
      if (certificate) {
        showNotification('success', 'Certificate generated successfully');
        // In the future, this would open or download the certificate
        console.log('Certificate:', certificate);
      }
    } catch (error: any) {
      console.error('Error generating certificate:', error);
      showNotification('error', error.message || 'Failed to generate certificate');
    }
  };

  // Separate upcoming and past events
  const now = new Date();
  const upcomingRegistrations = registrations.filter(
    r => r.event && new Date(r.event.end_date) >= now
  );
  const pastRegistrations = registrations.filter(
    r => r.event && new Date(r.event.end_date) < now
  );

  const displayedRegistrations = activeTab === 'upcoming' ? upcomingRegistrations : pastRegistrations;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Event Registrations</h1>
        <p className="text-gray-600">Manage your event registrations and access certificates</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Registrations</p>
              <p className="text-2xl font-bold text-gray-900">{registrations.length}</p>
            </div>
            <Ticket className="h-8 w-8 text-primary-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Upcoming Events</p>
              <p className="text-2xl font-bold text-gray-900">{upcomingRegistrations.length}</p>
            </div>
            <Calendar className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Events Attended</p>
              <p className="text-2xl font-bold text-gray-900">
                {registrations.filter(r => r.registration.attended || r.registration.checked_in).length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'upcoming'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Upcoming Events ({upcomingRegistrations.length})
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'past'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Past Events ({pastRegistrations.length})
          </button>
        </nav>
      </div>

      {/* Registrations List */}
      {displayedRegistrations.length > 0 ? (
        <div className="space-y-4">
          {displayedRegistrations.map(({ registration, event }) => {
            if (!event) return null;
            
            const isPast = new Date(event.end_date) < now;
            const canCancel = !isPast && registration.status === 'registered';
            const canGetCertificate = isPast && (registration.attended || registration.checked_in);
            
            return (
              <Card key={registration.id} className="p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  {/* Event Info */}
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      {/* Event Image */}
                      <img 
                        src={event.image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=200&h=150&fit=crop'}
                        alt={event.title}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                      
                      {/* Event Details */}
                      <div className="flex-1">
                        <h3 
                          className="text-lg font-semibold text-gray-900 mb-2 cursor-pointer hover:text-primary-600"
                          onClick={() => navigate(`/events/${event.slug}`)}
                        >
                          {event.title}
                        </h3>
                        
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{format(new Date(event.start_date), 'PPP')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>
                              {format(new Date(event.start_date), 'p')} - 
                              {format(new Date(event.end_date), 'p')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>
                              {event.location_type === 'virtual' ? 'Online Event' : 
                               event.venue_name || event.city || 'Location TBA'}
                            </span>
                          </div>
                        </div>
                        
                        {/* Registration Status */}
                        <div className="flex items-center gap-4 mt-3">
                          {/* Registration Status Badge */}
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            registration.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                            registration.status === 'attended' ? 'bg-green-100 text-green-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {registration.status === 'attended' ? 'Attended' :
                             registration.status === 'cancelled' ? 'Cancelled' :
                             'Registered'}
                          </span>
                          
                          {/* Check-in Status */}
                          {(registration.checked_in || registration.attended) && (
                            <span className="inline-flex items-center gap-1 text-xs text-green-600">
                              <UserCheck className="h-3 w-3" />
                              Checked In
                            </span>
                          )}
                          
                          {/* Payment Status */}
                          {registration.payment_amount && registration.payment_amount > 0 && (
                            <span className={`inline-flex items-center gap-1 text-xs ${
                              registration.payment_status === 'completed' ? 'text-green-600' :
                              registration.payment_status === 'pending' ? 'text-orange-600' :
                              'text-gray-600'
                            }`}>
                              <DollarSign className="h-3 w-3" />
                              {registration.payment_status === 'completed' ? 'Paid' :
                               registration.payment_status === 'pending' ? 'Payment Pending' :
                               registration.payment_status}
                            </span>
                          )}
                          
                          {/* CPD Points */}
                          {event.cpd_points > 0 && (
                            <span className="inline-flex items-center gap-1 text-xs text-purple-600">
                              <Award className="h-3 w-3" />
                              {event.cpd_points} CPD Points
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/events/${event.slug}`)}
                    >
                      View Event
                    </Button>
                    
                    {canGetCertificate && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerateCertificate(registration)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Certificate
                      </Button>
                    )}
                    
                    {canCancel && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm('Are you sure you want to cancel this registration?')) {
                            handleCancelRegistration(registration.id);
                          }
                        }}
                        className="text-red-600 hover:text-red-700 hover:border-red-300"
                      >
                        Cancel Registration
                      </Button>
                    )}
                    
                    {registration.cpd_activity_id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/cpd/activities')}
                      >
                        View in CPD
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <AlertCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {activeTab === 'upcoming' ? 'No upcoming events' : 'No past events'}
          </h3>
          <p className="text-gray-600 mb-4">
            {activeTab === 'upcoming' 
              ? 'You are not registered for any upcoming events.'
              : 'You have not attended any past events.'}
          </p>
          {activeTab === 'upcoming' && (
            <Button onClick={() => navigate('/events')}>
              Browse Events
            </Button>
          )}
        </Card>
      )}
    </div>
  );
}
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  DollarSign, 
  Award,
  ChevronLeft,
  Share2,
  Heart,
  Globe,
  Building,
  CheckCircle,
  UserCheck,
  Video,
  AlertCircle
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { EventService } from '../../../services/eventService';
import { EventRegistrationService } from '../../../services/eventRegistrationService';
import { EventRegistrationModal } from '../components/EventRegistrationModal';
import type { Event } from '../../../types/events';
import type { EventRegistration } from '../../../services/eventRegistrationService';
import { format } from 'date-fns';
import { useAuthStore } from '../../../stores/authStore';
import { showNotification } from '../../../lib/notifications';
import { QuillContentUltraFixed } from '../../../components/ui/QuillContentUltraFixed';
import { EventCountdown } from '../../../components/EventCountdown';

export function EventDetailsPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, getEffectiveUserId } = useAuthStore();
  const effectiveUserId = getEffectiveUserId();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRegistration, setUserRegistration] = useState<EventRegistration | null>(null);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [registrationCount, setRegistrationCount] = useState(0);

  useEffect(() => {
    if (slug) {
      loadEvent();
    }
  }, [slug]);

  const loadEvent = async () => {
    if (!slug) return;
    
    try {
      setLoading(true);
      const eventData = await EventService.getEventBySlug(slug);
      
      if (!eventData) {
        showNotification('error', 'Event not found');
        navigate('/events');
        return;
      }
      
      setEvent(eventData);
      
      // Load registrations count
      const regs = await EventRegistrationService.getEventRegistrations(eventData.id);
      setRegistrationCount(regs.length);
      
      // Check if current user is registered and auto check-in if applicable
      if (effectiveUserId) {
        const isRegistered = await EventRegistrationService.isUserRegistered(eventData.id, effectiveUserId);
        if (isRegistered) {
          // Get full registration details
          const userRegs = await EventRegistrationService.getUserRegistrations(effectiveUserId);
          const userReg = userRegs.find(r => r.event_id === eventData.id);
          setUserRegistration(userReg || null);
          
          // Auto check-in if within event time
          await EventRegistrationService.autoCheckIn(eventData.id, effectiveUserId);
        }
      }
    } catch (error) {
      console.error('Error loading event:', error);
      showNotification('error', 'Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    setShowRegistrationModal(true);
  };

  const handleRegistrationSuccess = () => {
    setShowRegistrationModal(false);
    loadEvent(); // Reload to update registration status
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: event?.title,
        text: event?.short_description,
        url: window.location.href,
      });
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      showNotification('success', 'Link copied to clipboard');
    }
  };

  // Check if event is live or about to go live (10 minutes before)
  const isEventLive = () => {
    if (!event) return false;
    
    const now = new Date();
    const eventStart = new Date(event.start_date);
    const eventEnd = new Date(event.end_date);
    
    // Allow joining 10 minutes before event starts
    const bufferMinutes = 10;
    const joinAllowedTime = new Date(eventStart.getTime() - bufferMinutes * 60 * 1000);
    
    return now >= joinAllowedTime && now <= eventEnd;
  };

  // Handle joining live event
  const handleJoinLiveEvent = async () => {
    if (!event || !userRegistration) return;
    
    try {
      // 1. Perform auto check-in
      await EventRegistrationService.checkInUser(userRegistration.id, 'auto');
      
      // 2. Log attendance
      await EventRegistrationService.logAttendance(
        userRegistration.id,
        event.id,
        effectiveUserId,
        'video_start'
      );
      
      // 3. Open virtual link in new tab
      if (event.virtual_link) {
        window.open(event.virtual_link, '_blank');
      }
      
      // 4. Show success notification
      showNotification('success', 'Check-in successful! Opening event...');
      
      // 5. Schedule CPD points awarding after event ends
      const eventEnd = new Date(event.end_date);
      const now = new Date();
      if (eventEnd > now) {
        // Store in localStorage to process later
        const cpdPending = {
          eventId: event.id,
          registrationId: userRegistration.id,
          eventTitle: event.title,
          eventEndTime: eventEnd.toISOString(),
          cpdPoints: event.cpd_points,
          cpdCategory: event.cpd_category || 'Event Attendance'
        };
        localStorage.setItem(`cpd_pending_${event.id}`, JSON.stringify(cpdPending));
      }
      
      // 6. Reload to update UI
      await loadEvent();
    } catch (error) {
      console.error('Error joining event:', error);
      showNotification('error', 'Failed to join event. Please try again.');
    }
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

  const isMember = user?.membership_status === 'active';
  const price = isMember ? event.member_price_cents : event.non_member_price_cents;
  const availableSpots = event.capacity - registrationCount;
  const isRegistrationOpen = EventService.isRegistrationOpen(event);
  const eventStatus = EventService.getEventStatus(event);
  const isPastEvent = new Date(event.end_date) < new Date();
  const isEventFull = availableSpots <= 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate('/events')}
        className="mb-6"
      >
        <ChevronLeft className="h-4 w-4 mr-2" />
        Back to Events
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Hero Image */}
          <img 
            src={event.image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=600&fit=crop'}
            alt={event.title}
            className="w-full h-64 lg:h-96 object-cover rounded-lg"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=600&fit=crop';
            }}
          />

          {/* Event Title and Category */}
          <div>
            {event.category && (
              <span 
                className="inline-block px-3 py-1 text-sm font-semibold rounded-full mb-3"
                style={{ 
                  backgroundColor: `${event.category.color}20`,
                  color: event.category.color 
                }}
              >
                {event.category.name}
              </span>
            )}
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              {event.title}
            </h1>
            {event.short_description && (
              <p className="text-lg text-gray-600">{event.short_description}</p>
            )}
          </div>

          {/* Quick Info */}
          <Card className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">Date & Time</p>
                  <p className="text-gray-600">
                    {format(new Date(event.start_date), 'EEEE, MMMM d, yyyy')}
                  </p>
                  <p className="text-gray-600">
                    {format(new Date(event.start_date), 'h:mm a')} - 
                    {format(new Date(event.end_date), 'h:mm a')}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">Location</p>
                  {event.location_type === 'virtual' ? (
                    <div>
                      <p className="text-gray-600 flex items-center">
                        <Globe className="h-4 w-4 mr-1" />
                        Online Event
                      </p>
                      {userRegistration && event.virtual_link && (
                        <div className="mt-2">
                          {isEventLive() ? (
                            <Button
                              onClick={handleJoinLiveEvent}
                              className="bg-green-600 hover:bg-green-700 text-white"
                              size="sm"
                            >
                              <Video className="h-4 w-4 mr-2" />
                              Join Live Event
                            </Button>
                          ) : (
                            <p className="text-sm text-gray-500 flex items-center">
                              <AlertCircle className="h-4 w-4 mr-1" />
                              Join button available 10 min before start
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      {event.venue_name && (
                        <p className="text-gray-600 flex items-center">
                          <Building className="h-4 w-4 mr-1" />
                          {event.venue_name}
                        </p>
                      )}
                      <p className="text-gray-600">
                        {event.address_line1}
                        {event.address_line2 && `, ${event.address_line2}`}
                      </p>
                      <p className="text-gray-600">
                        {event.city}, {event.state} {event.postal_code}
                      </p>
                    </div>
                  )}
                  {event.location_instructions && (
                    <p className="text-sm text-gray-500 mt-1">
                      {event.location_instructions}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Description */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">About This Event</h2>
            {event.description ? (
              <QuillContentUltraFixed content={event.description} />
            ) : (
              <p className="text-gray-600">No description available</p>
            )}
          </Card>

          {/* CPD Information */}
          {event.cpd_points > 0 && (
            <Card className="p-6">
              <div className="flex items-center mb-4">
                <Award className="h-6 w-6 text-primary-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">CPD Points</h2>
              </div>
              <p className="text-gray-600">
                Earn <span className="font-semibold">{event.cpd_points} CPD points</span> by 
                attending this event.
              </p>
              {event.cpd_category && (
                <p className="text-gray-600 mt-1">
                  Category: <span className="font-semibold">{event.cpd_category}</span>
                </p>
              )}
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Registration Card */}
          <Card className="p-6 sticky top-4 bg-white">
            <div className="space-y-4">
              {/* Price */}
              <div>
                <p className="text-sm text-gray-600 mb-1">
                  {isMember ? 'Member Price' : 'Non-Member Price'}
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {price === 0 ? 'Free' : EventService.formatPrice(price)}
                </p>
                {event.early_bird_price_cents && event.early_bird_end_date && 
                 new Date() < new Date(event.early_bird_end_date) && (
                  <p className="text-sm text-green-600 mt-1">
                    Early bird pricing available until {format(new Date(event.early_bird_end_date), 'MMM d')}
                  </p>
                )}
              </div>

              {/* Capacity */}
              <div className="flex items-center justify-between py-3 border-y">
                <div className="flex items-center text-gray-600">
                  <Users className="h-5 w-5 mr-2" />
                  <span>Capacity</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{event.capacity}</p>
                  {availableSpots > 0 && availableSpots < 10 && (
                    <p className="text-sm text-orange-600">
                      Only {availableSpots} spots left!
                    </p>
                  )}
                </div>
              </div>

              {/* Registration Button */}
              {!isPastEvent && (
                <>
                  {userRegistration ? (
                    <div className="space-y-3">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <p className="text-green-800 font-semibold">You're registered!</p>
                        </div>
                        {(userRegistration.checked_in || userRegistration.attended) && (
                          <div className="flex items-center gap-2 mt-2">
                            <UserCheck className="h-4 w-4 text-green-600" />
                            <p className="text-sm text-green-600">Checked in</p>
                          </div>
                        )}
                        {userRegistration.certificate_issued && (
                          <Button 
                            variant="link" 
                            className="text-sm text-primary-600 p-0 h-auto mt-2"
                            onClick={() => navigate(`/certificates/${userRegistration.certificate_number}`)}
                          >
                            View Certificate →
                          </Button>
                        )}
                      </div>
                      
                      {/* Event Countdown Timer */}
                      <EventCountdown 
                        startDate={event.start_date}
                        eventTitle={event.title}
                        locationName={event.venue_name}
                        virtualLink={event.virtual_link}
                        locationType={event.location_type}
                      />
                      
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => navigate('/cpd/activities')}
                      >
                        View in My CPD
                      </Button>
                    </div>
                  ) : (
                    <>
                      {isRegistrationOpen && !isEventFull ? (
                        <Button 
                          className="w-full" 
                          size="lg"
                          onClick={handleRegister}
                        >
                          Register Now
                        </Button>
                      ) : (
                        <Button 
                          className="w-full" 
                          size="lg"
                          disabled
                        >
                          {isEventFull ? 'Event Full' : 'Registration Closed'}
                        </Button>
                      )}
                      
                      {event.waitlist_enabled && isEventFull && (
                        <Button 
                          variant="outline"
                          className="w-full mt-2"
                          onClick={() => showNotification('info', 'Waitlist feature coming soon')}
                        >
                          Join Waitlist
                        </Button>
                      )}
                    </>
                  )}
                </>
              )}

              {isPastEvent && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-gray-600 text-center">This event has ended</p>
                </div>
              )}

              {/* Share Buttons */}
              <div className="flex gap-2 pt-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={handleShare}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {/* Handle save */}}
                >
                  <Heart className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </div>
            </div>
          </Card>

          {/* Organizer Info */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Organized by</h3>
            <div className="flex items-center">
              <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
                <Building className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-3">
                <p className="font-semibold text-gray-900">English Australia</p>
                <p className="text-sm text-gray-600">Professional Development Team</p>
              </div>
            </div>
          </Card>

          {/* Tags */}
          {event.tags && event.tags.length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {event.tags.map((tag, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
      
      {/* Registration Modal */}
      {showRegistrationModal && event && (
        <EventRegistrationModal
          event={event}
          onClose={() => setShowRegistrationModal(false)}
          onSuccess={handleRegistrationSuccess}
        />
      )}
    </div>
  );
}
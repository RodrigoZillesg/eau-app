import { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, Clock, DollarSign, Award, Plus, Settings } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { EventService } from '../../../services/eventService';
import type { Event, EventCategory } from '../../../types/events';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../stores/authStore';
import { usePermissions } from '../../../hooks/usePermissions';

export function EventsListPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { hasPermission } = usePermissions();
  const isAdmin = hasPermission('ACCESS_ADMIN_DASHBOARD');
  
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [eventsData, categoriesData] = await Promise.all([
        EventService.getPublicEvents(),
        EventService.getCategories()
      ]);
      setEvents(eventsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter(event => {
    // Search filter
    if (searchTerm && !event.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !event.description?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Category filter
    if (selectedCategory !== 'all' && event.category_id !== selectedCategory) {
      return false;
    }

    // Type filter
    if (selectedType !== 'all' && event.location_type !== selectedType) {
      return false;
    }

    return true;
  });

  const upcomingEvents = filteredEvents.filter(
    event => new Date(event.start_date) >= new Date()
  );

  const pastEvents = filteredEvents.filter(
    event => new Date(event.start_date) < new Date()
  );

  const getEventPrice = (event: Event) => {
    const isMember = !!user; // Simplified - should check actual membership
    const price = isMember ? event.member_price_cents : event.non_member_price_cents;
    
    if (price === 0) return 'Free';
    
    return EventService.formatPrice(price);
  };

  const getEventStatus = (event: Event) => {
    const now = new Date();
    const startDate = new Date(event.start_date);
    const registrationEnd = event.registration_end_date ? new Date(event.registration_end_date) : startDate;
    
    if (now > registrationEnd) {
      return { text: 'Registration Closed', color: 'text-gray-500' };
    }
    
    if (event.capacity > 0) {
      // TODO: Get actual registration count
      const spotsLeft = event.capacity;
      if (spotsLeft === 0) {
        return { text: 'Sold Out', color: 'text-red-500' };
      }
      if (spotsLeft < 10) {
        return { text: `${spotsLeft} spots left`, color: 'text-orange-500' };
      }
    }
    
    return { text: 'Open', color: 'text-green-500' };
  };

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-600 mt-1">Discover and register for upcoming events</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button onClick={() => navigate('/admin/events')}>
              <Settings className="h-4 w-4 mr-2" />
              Manage Events
            </Button>
          </div>
        )}
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="md:col-span-2"
          />
          
          <select
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          
          <select
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="physical">In-Person</option>
            <option value="virtual">Virtual</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>
      </Card>

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingEvents.map(event => {
              const status = getEventStatus(event);
              return (
                <Card 
                  key={event.id} 
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/events/${event.slug}`)}
                >
                  {/* Event Image */}
                  {event.image_url ? (
                    <img 
                      src={event.image_url} 
                      alt={event.title}
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop';
                      }}
                    />
                  ) : (
                    <img 
                      src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop"
                      alt={event.title}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  
                  <div className="p-6">
                    {/* Category Badge */}
                    {event.category && (
                      <span 
                        className="inline-block px-2 py-1 text-xs font-semibold rounded-full mb-2"
                        style={{ 
                          backgroundColor: `${event.category.color}20`,
                          color: event.category.color 
                        }}
                      >
                        {event.category.name}
                      </span>
                    )}
                    
                    {/* Title */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {event.title}
                    </h3>
                    
                    {/* Date & Time */}
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <Calendar className="h-4 w-4 mr-2" />
                      {format(new Date(event.start_date), 'MMM d, yyyy')}
                      <Clock className="h-4 w-4 ml-3 mr-2" />
                      {format(new Date(event.start_date), 'h:mm a')}
                    </div>
                    
                    {/* Location */}
                    <div className="flex items-center text-sm text-gray-600 mb-3">
                      <MapPin className="h-4 w-4 mr-2" />
                      {event.location_type === 'virtual' ? 'Online Event' : 
                       event.venue_name || event.city || 'Location TBA'}
                    </div>
                    
                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="flex items-center space-x-3">
                        {/* Price */}
                        <div className="flex items-center text-sm">
                          <DollarSign className="h-4 w-4 text-gray-400" />
                          <span className="font-semibold">{getEventPrice(event)}</span>
                        </div>
                        
                        {/* CPD Points */}
                        {event.cpd_points > 0 && (
                          <div className="flex items-center text-sm">
                            <Award className="h-4 w-4 text-gray-400" />
                            <span>{event.cpd_points} CPD</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Status */}
                      <span className={`text-xs font-semibold ${status.color}`}>
                        {status.text}
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Past Events */}
      {pastEvents.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Past Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-75">
            {pastEvents.map(event => (
              <Card 
                key={event.id} 
                className="overflow-hidden"
              >
                {/* Similar structure but simplified */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {event.title}
                  </h3>
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <Calendar className="h-4 w-4 mr-2" />
                    {format(new Date(event.start_date), 'MMM d, yyyy')}
                  </div>
                  <span className="text-xs text-gray-500">Event Completed</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* No Events */}
      {filteredEvents.length === 0 && (
        <Card className="p-12 text-center">
          <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No events found</h3>
          <p className="text-gray-600">Try adjusting your filters or check back later for new events.</p>
        </Card>
      )}
    </div>
  );
}
import { useState, useEffect } from 'react';
import { Plus, Calendar, Edit, Trash2, Eye, Copy, MoreVertical } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { EventService } from '../../../services/eventService';
import type { Event, EventCategory } from '../../../types/events';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { showNotification } from '../../../lib/notifications';
import { EventFormModal } from '../components/EventFormModal';

export function AdminEventsPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [eventsData, categoriesData] = await Promise.all([
        EventService.getEvents(), // Get all events, not just public
        EventService.getCategories()
      ]);
      setEvents(eventsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading events:', error);
      showNotification('error', 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = () => {
    setEditingEvent(null);
    setShowFormModal(true);
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setShowFormModal(true);
  };

  const handleDuplicateEvent = async (event: Event) => {
    try {
      const newEvent = {
        ...event,
        title: `${event.title} (Copy)`,
        slug: undefined, // Will be auto-generated
        status: 'draft' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      delete (newEvent as any).id;
      
      await EventService.createEvent(newEvent as any);
      showNotification('success', 'Event duplicated successfully');
      loadData();
    } catch (error) {
      console.error('Error duplicating event:', error);
      showNotification('error', 'Failed to duplicate event');
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      await EventService.deleteEvent(id);
      showNotification('success', 'Event deleted successfully');
      setShowDeleteConfirm(null);
      loadData();
    } catch (error) {
      console.error('Error deleting event:', error);
      showNotification('error', 'Failed to delete event');
    }
  };

  const handlePublishEvent = async (event: Event) => {
    try {
      if (event.status === 'published') {
        await EventService.updateEvent(event.id, { status: 'draft' });
        showNotification('success', 'Event unpublished');
      } else {
        await EventService.publishEvent(event.id);
        showNotification('success', 'Event published successfully');
      }
      loadData();
    } catch (error) {
      console.error('Error publishing event:', error);
      showNotification('error', 'Failed to publish event');
    }
  };

  const filteredEvents = events.filter(event => {
    if (searchTerm && !event.title.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (statusFilter !== 'all' && event.status !== statusFilter) {
      return false;
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-800',
      published: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[status as keyof typeof styles]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
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
          <h1 className="text-3xl font-bold text-gray-900">Event Management</h1>
          <p className="text-gray-600 mt-2">Create and manage events</p>
        </div>
        <Button onClick={handleCreateEvent}>
          <Plus className="h-4 w-4 mr-2" />
          Create Event
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Events</p>
              <p className="text-2xl font-bold text-gray-900">{events.length}</p>
            </div>
            <Calendar className="h-8 w-8 text-gray-400" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Published</p>
              <p className="text-2xl font-bold text-green-600">
                {events.filter(e => e.status === 'published').length}
              </p>
            </div>
            <Eye className="h-8 w-8 text-green-400" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Draft</p>
              <p className="text-2xl font-bold text-gray-600">
                {events.filter(e => e.status === 'draft').length}
              </p>
            </div>
            <Edit className="h-8 w-8 text-gray-400" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Upcoming</p>
              <p className="text-2xl font-bold text-blue-600">
                {events.filter(e => new Date(e.start_date) > new Date()).length}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-blue-400" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <select
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </Card>

      {/* Events Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Capacity
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
              {filteredEvents.map(event => (
                <tr key={event.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {event.title}
                      </div>
                      {event.category && (
                        <div className="text-xs text-gray-500">
                          {event.category.name}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(new Date(event.start_date), 'MMM d, yyyy')}
                    <div className="text-xs text-gray-500">
                      {format(new Date(event.start_date), 'h:mm a')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {event.location_type === 'virtual' ? 'Online' : event.venue_name || event.city}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {event.capacity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(event.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/events/${event.slug}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditEvent(event)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowDeleteConfirm(showDeleteConfirm === event.id ? null : event.id)}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                        
                        {showDeleteConfirm === event.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                            <div className="py-1">
                              <button
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                onClick={() => handlePublishEvent(event)}
                              >
                                {event.status === 'published' ? 'Unpublish' : 'Publish'}
                              </button>
                              <button
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                onClick={() => handleDuplicateEvent(event)}
                              >
                                <Copy className="h-4 w-4 inline mr-2" />
                                Duplicate
                              </button>
                              <button
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                onClick={() => navigate(`/admin/events/${event.id}/registrations`)}
                              >
                                View Registrations
                              </button>
                              <hr className="my-1" />
                              <button
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                onClick={() => handleDeleteEvent(event.id)}
                              >
                                <Trash2 className="h-4 w-4 inline mr-2" />
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredEvents.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No events found</p>
              <Button onClick={handleCreateEvent} className="mt-4">
                Create your first event
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Event Form Modal */}
      {showFormModal && (
        <EventFormModal
          event={editingEvent}
          categories={categories}
          onClose={() => {
            setShowFormModal(false);
            setEditingEvent(null);
          }}
          onSuccess={() => {
            setShowFormModal(false);
            setEditingEvent(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}
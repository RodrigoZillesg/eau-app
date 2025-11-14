import { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Users, DollarSign, Award, Globe, Building } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { QuillBulletFix } from '../../../components/ui/QuillBulletFix';
import { EventImageUpload } from '../../../components/ui/EventImageUpload';
import { EventService } from '../../../services/eventService';
import type { Event, EventCategory, EventFormData } from '../../../types/events';
import { showNotification } from '../../../lib/notifications';
import { supabase } from '../../../lib/supabase';

interface CPDCategory {
  id: number;
  name: string;
  points_per_hour: number;
  description: string | null;
  is_active: boolean;
}

interface EventFormModalProps {
  event: Event | null;
  categories: EventCategory[];
  onClose: () => void;
  onSuccess: () => void;
}

export function EventFormModal({ event, categories, onClose, onSuccess }: EventFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [cpdCategories, setCpdCategories] = useState<CPDCategory[]>([]);

  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    short_description: '',
    category_id: '',
    start_date: '',
    end_date: '',
    timezone: 'Australia/Sydney',
    location_type: 'physical',
    venue_name: '',
    address_line1: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'Australia',
    virtual_link: '',
    capacity: 50,
    member_price: 0,
    non_member_price: 0,
    early_bird_price: undefined,
    early_bird_end_date: undefined,
    cpd_points: 1,
    cpd_category: '',
    visibility: 'public',
    allow_guests: false,
    max_guests_per_registration: 0,
    requires_approval: false,
    members_only: true,
    image_url: '',
  });

  useEffect(() => {
    if (event) {
      console.log('🔄 [EventFormModal] Loading event data:', {
        id: event.id,
        title: event.title,
        description_length: event.description?.length,
        description_preview: event.description?.substring(0, 100)
      });
      
      // Convert UTC timestamps to local datetime for datetime-local inputs
      const formatForInput = (utcString: string) => {
        const date = new Date(utcString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };

      // Load existing event data
      setFormData({
        title: event.title,
        description: event.description || '',
        short_description: event.short_description || '',
        category_id: event.category_id || '',
        start_date: formatForInput(event.start_date),
        end_date: formatForInput(event.end_date),
        timezone: event.timezone,
        location_type: event.location_type,
        venue_name: event.venue_name || '',
        address_line1: event.address_line1 || '',
        city: event.city || '',
        state: event.state || '',
        postal_code: event.postal_code || '',
        country: event.country,
        virtual_link: event.virtual_link || '',
        capacity: event.capacity,
        member_price: event.member_price_cents / 100,
        non_member_price: event.non_member_price_cents / 100,
        early_bird_price: event.early_bird_price_cents ? event.early_bird_price_cents / 100 : undefined,
        early_bird_end_date: event.early_bird_end_date ? formatForInput(event.early_bird_end_date) : undefined,
        cpd_points: event.cpd_points,
        cpd_category: event.cpd_category || '',
        visibility: event.visibility,
        allow_guests: event.allow_guests,
        max_guests_per_registration: event.max_guests_per_registration,
        requires_approval: event.requires_approval,
        members_only: event.members_only || false,
        image_url: event.image_url || '',
      });
    }
  }, [event]);

  // Load CPD categories from database
  useEffect(() => {
    const loadCPDCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('cpd_categories')
          .select('*')
          .eq('is_active', true)
          .order('name');

        if (error) throw error;

        setCpdCategories(data || []);
      } catch (error) {
        console.error('Error loading CPD categories:', error);
        showNotification('error', 'Failed to load CPD categories');
      }
    };

    loadCPDCategories();
  }, []);

  // Handler to update CPD points when category changes
  const handleCPDCategoryChange = (categoryName: string) => {
    const selectedCategory = cpdCategories.find(cat => cat.name === categoryName);

    setFormData({
      ...formData,
      cpd_category: categoryName,
      cpd_points: selectedCategory ? selectedCategory.points_per_hour : 1
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Debug logging
    console.log('🔵 [EventFormModal] Submitting form with data:', {
      title: formData.title,
      description_length: formData.description?.length,
      description_preview: formData.description?.substring(0, 100),
      full_formData: formData
    });
    
    // Validation
    if (!formData.title || !formData.start_date || !formData.end_date) {
      showNotification('error', 'Please fill in all required fields');
      return;
    }

    if (!formData.cpd_category) {
      showNotification('error', 'Please select a CPD category');
      return;
    }

    if (new Date(formData.end_date) < new Date(formData.start_date)) {
      showNotification('error', 'End date must be after start date');
      return;
    }
    
    setLoading(true);
    
    try {
      // Convert datetime-local to ISO format with timezone
      const eventDataToSave = {
        ...formData,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString(),
        early_bird_end_date: formData.early_bird_end_date 
          ? new Date(formData.early_bird_end_date).toISOString() 
          : undefined
      };
      
      console.log('🟢 [EventFormModal] Data being sent to service:', {
        description_length: eventDataToSave.description?.length,
        description_preview: eventDataToSave.description?.substring(0, 100),
        full_data: eventDataToSave
      });
      
      if (event) {
        console.log('🔄 [EventFormModal] Updating event ID:', event.id);
        await EventService.updateEvent(event.id, eventDataToSave);
        showNotification('success', 'Event updated successfully');
      } else {
        console.log('➕ [EventFormModal] Creating new event');
        await EventService.createEvent(eventDataToSave);
        showNotification('success', 'Event created successfully');
      }
      onSuccess();
    } catch (error) {
      console.error('❌ [EventFormModal] Error saving event:', error);
      showNotification('error', 'Failed to save event. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: Calendar },
    { id: 'location', label: 'Location', icon: MapPin },
    { id: 'capacity', label: 'Capacity & Pricing', icon: Users },
    { id: 'cpd', label: 'CPD & Settings', icon: Award },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            {event ? 'Edit Event' : 'Create New Event'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'text-primary-600 border-primary-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Event Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter event title"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="short_description">Short Description</Label>
                  <Input
                    id="short_description"
                    value={formData.short_description}
                    onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                    placeholder="Brief description for event cards (max 500 characters)"
                    maxLength={500}
                  />
                </div>

                <div>
                  <Label htmlFor="description">Full Description</Label>
                  <QuillBulletFix
                    content={formData.description}
                    onChange={(content) => {
                      console.log('📝 [EventFormModal] Description changed:', {
                        length: content?.length,
                        preview: content?.substring(0, 100)
                      });
                      setFormData(prev => ({ ...prev, description: content }));
                    }}
                    placeholder="Enter detailed event description..."
                    height="250px"
                    enableDebugLogs={true}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Tip: Use the toolbar to format text and add images.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_date">Start Date & Time *</Label>
                    <Input
                      id="start_date"
                      type="datetime-local"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="end_date">End Date & Time *</Label>
                    <Input
                      id="end_date"
                      type="datetime-local"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <select
                    id="timezone"
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="Australia/Sydney">Sydney</option>
                    <option value="Australia/Melbourne">Melbourne</option>
                    <option value="Australia/Brisbane">Brisbane</option>
                    <option value="Australia/Perth">Perth</option>
                    <option value="Australia/Adelaide">Adelaide</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="image_url">Event Image</Label>
                  <EventImageUpload
                    currentImage={formData.image_url}
                    onImageChange={(url) => setFormData({ ...formData, image_url: url || '' })}
                  />
                </div>
              </div>
            )}

            {/* Location Tab */}
            {activeTab === 'location' && (
              <div className="space-y-4">
                <div>
                  <Label>Event Type</Label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="physical"
                        checked={formData.location_type === 'physical'}
                        onChange={(e) => setFormData({ ...formData, location_type: e.target.value as any })}
                        className="mr-2"
                      />
                      <Building className="h-4 w-4 mr-1" />
                      In-Person
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="virtual"
                        checked={formData.location_type === 'virtual'}
                        onChange={(e) => setFormData({ ...formData, location_type: e.target.value as any })}
                        className="mr-2"
                      />
                      <Globe className="h-4 w-4 mr-1" />
                      Virtual
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="hybrid"
                        checked={formData.location_type === 'hybrid'}
                        onChange={(e) => setFormData({ ...formData, location_type: e.target.value as any })}
                        className="mr-2"
                      />
                      Hybrid
                    </label>
                  </div>
                </div>

                {(formData.location_type === 'physical' || formData.location_type === 'hybrid') && (
                  <>
                    <div>
                      <Label htmlFor="venue_name">Venue Name</Label>
                      <Input
                        id="venue_name"
                        value={formData.venue_name}
                        onChange={(e) => setFormData({ ...formData, venue_name: e.target.value })}
                        placeholder="e.g., Sydney Convention Centre"
                      />
                    </div>

                    <div>
                      <Label htmlFor="address_line1">Address</Label>
                      <Input
                        id="address_line1"
                        value={formData.address_line1}
                        onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                        placeholder="Street address"
                      />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          value={formData.state}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="postal_code">Postal Code</Label>
                        <Input
                          id="postal_code"
                          value={formData.postal_code}
                          onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="country">Country</Label>
                        <Input
                          id="country"
                          value={formData.country}
                          onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        />
                      </div>
                    </div>
                  </>
                )}

                {(formData.location_type === 'virtual' || formData.location_type === 'hybrid') && (
                  <div>
                    <Label htmlFor="virtual_link">Virtual Event Link</Label>
                    <Input
                      id="virtual_link"
                      value={formData.virtual_link}
                      onChange={(e) => setFormData({ ...formData, virtual_link: e.target.value })}
                      placeholder="https://zoom.us/j/..."
                    />
                  </div>
                )}
              </div>
            )}

            {/* Capacity & Pricing Tab */}
            {activeTab === 'capacity' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="capacity">Event Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                    min="1"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="member_price">Member Price ($)</Label>
                    <Input
                      id="member_price"
                      type="number"
                      value={formData.member_price}
                      onChange={(e) => setFormData({ ...formData, member_price: parseFloat(e.target.value) })}
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <Label htmlFor="non_member_price">Non-Member Price ($)</Label>
                    <Input
                      id="non_member_price"
                      type="number"
                      value={formData.non_member_price}
                      onChange={(e) => setFormData({ ...formData, non_member_price: parseFloat(e.target.value) })}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Early Bird Pricing (Optional)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="early_bird_price">Early Bird Price ($)</Label>
                      <Input
                        id="early_bird_price"
                        type="number"
                        value={formData.early_bird_price || ''}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          early_bird_price: e.target.value ? parseFloat(e.target.value) : undefined 
                        })}
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <Label htmlFor="early_bird_end_date">Early Bird End Date</Label>
                      <Input
                        id="early_bird_end_date"
                        type="datetime-local"
                        value={formData.early_bird_end_date || ''}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          early_bird_end_date: e.target.value || undefined 
                        })}
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Guest Settings</h3>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.allow_guests}
                        onChange={(e) => setFormData({ ...formData, allow_guests: e.target.checked })}
                        className="mr-2"
                      />
                      Allow guests
                    </label>
                    
                    {formData.allow_guests && (
                      <div>
                        <Label htmlFor="max_guests">Max Guests per Registration</Label>
                        <Input
                          id="max_guests"
                          type="number"
                          value={formData.max_guests_per_registration}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            max_guests_per_registration: parseInt(e.target.value) 
                          })}
                          min="0"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* CPD & Settings Tab */}
            {activeTab === 'cpd' && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">CPD Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cpd_points">CPD Points</Label>
                      <Input
                        id="cpd_points"
                        type="number"
                        value={formData.cpd_points}
                        onChange={(e) => setFormData({ ...formData, cpd_points: parseFloat(e.target.value) })}
                        min="0"
                        step="0.5"
                      />
                    </div>

                    <div>
                      <Label htmlFor="cpd_category">CPD Category *</Label>
                      <select
                        id="cpd_category"
                        value={formData.cpd_category}
                        onChange={(e) => handleCPDCategoryChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        required
                      >
                        <option value="">Select CPD category</option>
                        {cpdCategories.map(category => (
                          <option key={category.id} value={category.name}>
                            {category.name} ({category.points_per_hour} {category.points_per_hour === 1 ? 'point' : 'points'}/hour)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Visibility Settings</h3>
                  <div className="space-y-3">
                    <div>
                      <Label>Event Visibility</Label>
                      <select
                        value={formData.visibility}
                        onChange={(e) => setFormData({ ...formData, visibility: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="public">Public - Everyone can see</option>
                        <option value="members">Members Only</option>
                        <option value="private">Private - Invite only</option>
                      </select>
                    </div>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.requires_approval}
                        onChange={(e) => setFormData({ ...formData, requires_approval: e.target.checked })}
                        className="mr-2"
                      />
                      Require approval for registrations
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.members_only}
                        onChange={(e) => setFormData({ ...formData, members_only: e.target.checked })}
                        className="mr-2"
                      />
                      Members Only (only authenticated members can register)
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? 'Saving...' : (event ? 'Update Event' : 'Create Event')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
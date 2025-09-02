import { supabase } from '../lib/supabase/client';
import type { 
  Event, 
  EventCategory, 
  EventRegistration, 
  EventEmail,
  EventFormData,
  RegistrationFormData,
  EventFilters,
  RegistrationFilters,
  EventStatistics
} from '../types/events';

export class EventService {
  // ==================== Categories ====================
  
  static async getCategories(activeOnly = true): Promise<EventCategory[]> {
    let query = supabase
      .from('event_categories')
      .select('*')
      .order('sort_order');
    
    if (activeOnly) {
      query = query.eq('is_active', true);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
    
    return data || [];
  }
  
  // ==================== Events ====================
  
  static async getEvents(filters?: EventFilters): Promise<Event[]> {
    let query = supabase
      .from('events')
      .select(`
        *,
        category:event_categories(*)
      `)
      .order('start_date', { ascending: true });
    
    // Apply filters
    if (filters) {
      if (filters.status?.length) {
        query = query.in('status', filters.status);
      }
      
      if (filters.category?.length) {
        query = query.in('category_id', filters.category);
      }
      
      if (filters.location_type?.length) {
        query = query.in('location_type', filters.location_type);
      }
      
      if (filters.date_from) {
        query = query.gte('start_date', filters.date_from);
      }
      
      if (filters.date_to) {
        query = query.lte('start_date', filters.date_to);
      }
      
      if (filters.has_cpd !== undefined) {
        query = filters.has_cpd 
          ? query.gt('cpd_points', 0)
          : query.eq('cpd_points', 0);
      }
      
      if (filters.featured_only) {
        query = query.eq('featured', true);
      }
      
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
    
    return data || [];
  }
  
  static async getPublicEvents(): Promise<Event[]> {
    return this.getEvents({
      status: ['published'],
    });
  }
  
  static async getUpcomingEvents(limit = 10): Promise<Event[]> {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        category:event_categories(*)
      `)
      .eq('status', 'published')
      .gte('start_date', new Date().toISOString())
      .order('start_date', { ascending: true })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching upcoming events:', error);
      throw error;
    }
    
    return data || [];
  }
  
  static async getEventById(id: string): Promise<Event | null> {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        category:event_categories(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching event:', error);
      throw error;
    }
    
    return data;
  }
  
  static async getEventBySlug(slug: string): Promise<Event | null> {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        category:event_categories(*)
      `)
      .eq('slug', slug)
      .single();
    
    if (error) {
      console.error('Error fetching event by slug:', error);
      throw error;
    }
    
    return data;
  }
  
  static async createEvent(eventData: EventFormData): Promise<Event> {
    // Get current user from auth session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      throw new Error('User not authenticated');
    }
    
    // Convert dollar amounts to cents and ensure proper data types
    const dataForDb: any = {
      title: eventData.title,
      description: eventData.description || null,
      short_description: eventData.short_description || null,
      category_id: eventData.category_id || null,
      start_date: eventData.start_date,
      end_date: eventData.end_date,
      timezone: eventData.timezone,
      location_type: eventData.location_type,
      venue_name: eventData.venue_name || null,
      address_line1: eventData.address_line1 || null,
      city: eventData.city || null,
      state: eventData.state || null,
      postal_code: eventData.postal_code || null,
      country: eventData.country,
      virtual_link: eventData.virtual_link || null,
      capacity: Number(eventData.capacity) || 50,
      member_price_cents: Math.round((Number(eventData.member_price) || 0) * 100),
      non_member_price_cents: Math.round((Number(eventData.non_member_price) || 0) * 100),
      early_bird_price_cents: eventData.early_bird_price 
        ? Math.round(Number(eventData.early_bird_price) * 100) 
        : null,
      early_bird_end_date: eventData.early_bird_end_date || null,
      cpd_points: Number(eventData.cpd_points) || 0,
      cpd_category: eventData.cpd_category || null,
      visibility: eventData.visibility,
      featured: Boolean(eventData.featured),
      allow_guests: Boolean(eventData.allow_guests),
      max_guests_per_registration: Number(eventData.max_guests_per_registration) || 0,
      requires_approval: Boolean(eventData.requires_approval),
      image_url: eventData.image_url || null,
      created_by: session.user.id,
      status: 'published'
    };
    
    console.log('Creating event with data:', dataForDb);
    
    const { data, error } = await supabase
      .from('events')
      .insert(dataForDb)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating event:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw error;
    }
    
    return data;
  }
  
  static async updateEvent(id: string, eventData: Partial<EventFormData>): Promise<Event> {
    console.log('🔵 [EventService.updateEvent] Input data:', {
      id,
      description_length: eventData.description?.length,
      description_preview: eventData.description?.substring(0, 100),
      hasDescription: 'description' in eventData,
      eventData_keys: Object.keys(eventData),
      full_eventData: eventData
    });
    
    const dataForDb: any = { ...eventData };
    
    // Remove undefined fields that might cause issues
    Object.keys(dataForDb).forEach(key => {
      if (dataForDb[key] === undefined) {
        delete dataForDb[key];
      }
    });
    
    // Handle image URL
    if ('image_url' in eventData) {
      dataForDb.image_url = eventData.image_url || null;
    }
    
    // Convert dollar amounts to cents if provided
    if (eventData.member_price !== undefined) {
      dataForDb.member_price_cents = Math.round(eventData.member_price * 100);
      delete dataForDb.member_price;
    }
    
    if (eventData.non_member_price !== undefined) {
      dataForDb.non_member_price_cents = Math.round(eventData.non_member_price * 100);
      delete dataForDb.non_member_price;
    }
    
    if (eventData.early_bird_price !== undefined) {
      dataForDb.early_bird_price_cents = eventData.early_bird_price 
        ? Math.round(eventData.early_bird_price * 100) 
        : null;
      delete dataForDb.early_bird_price;
    }
    
    console.log('🟢 [EventService.updateEvent] Data for DB:', {
      id,
      description_length: dataForDb.description?.length,
      description_preview: dataForDb.description?.substring(0, 100),
      hasDescription: 'description' in dataForDb,
      dataForDb_keys: Object.keys(dataForDb),
      dataForDb_types: Object.fromEntries(Object.entries(dataForDb).map(([k, v]) => [k, typeof v])),
      full_dataForDb: dataForDb
    });
    
    try {
      const { data, error } = await supabase
        .from('events')
        .update(dataForDb)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('❌ [EventService.updateEvent] Supabase error details:', {
          error,
          errorMessage: error.message,
          errorCode: error.code,
          errorDetails: error.details,
          errorHint: error.hint
        });
        throw error;
      }
      
      console.log('✅ [EventService.updateEvent] Response from Supabase:', {
        id: data.id,
        description_length: data.description?.length,
        description_preview: data.description?.substring(0, 100)
      });
      
      return data;
    } catch (fetchError) {
      console.error('❌ [EventService.updateEvent] Network/Request error:', fetchError);
      throw fetchError;
    }
  }
  
  static async publishEvent(id: string): Promise<Event> {
    const { data, error } = await supabase
      .from('events')
      .update({ 
        status: 'published',
        published_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error publishing event:', error);
      throw error;
    }
    
    return data;
  }
  
  static async cancelEvent(id: string, reason?: string): Promise<Event> {
    const { data, error } = await supabase
      .from('events')
      .update({ 
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error cancelling event:', error);
      throw error;
    }
    
    // TODO: Trigger email notifications to registered participants
    
    return data;
  }
  
  static async deleteEvent(id: string): Promise<void> {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }
  
  // ==================== Registrations ====================
  
  static async getRegistrations(filters?: RegistrationFilters): Promise<EventRegistration[]> {
    let query = supabase
      .from('event_registrations')
      .select(`
        *,
        event:events(*)
      `)
      .order('created_at', { ascending: false });
    
    // Apply filters
    if (filters) {
      if (filters.event_id) {
        query = query.eq('event_id', filters.event_id);
      }
      
      if (filters.status?.length) {
        query = query.in('status', filters.status);
      }
      
      if (filters.payment_status?.length) {
        query = query.in('payment_status', filters.payment_status);
      }
      
      if (filters.attended !== undefined) {
        query = query.eq('attended', filters.attended);
      }
      
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      
      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }
      
      if (filters.search) {
        query = query.or(
          `first_name.ilike.%${filters.search}%,` +
          `last_name.ilike.%${filters.search}%,` +
          `email.ilike.%${filters.search}%,` +
          `registration_number.ilike.%${filters.search}%`
        );
      }
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching registrations:', error);
      throw error;
    }
    
    return data || [];
  }
  
  static async getEventRegistrations(eventId: string): Promise<EventRegistration[]> {
    return this.getRegistrations({ event_id: eventId });
  }
  
  static async getUserRegistrations(userId: string): Promise<EventRegistration[]> {
    const { data, error } = await supabase
      .from('event_registrations')
      .select(`
        *,
        event:events(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching user registrations:', error);
      throw error;
    }
    
    return data || [];
  }
  
  static async getRegistrationById(id: string): Promise<EventRegistration | null> {
    const { data, error } = await supabase
      .from('event_registrations')
      .select(`
        *,
        event:events(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching registration:', error);
      throw error;
    }
    
    return data;
  }
  
  static async registerForEvent(registrationData: RegistrationFormData): Promise<EventRegistration> {
    // Get event details to calculate price
    const event = await this.getEventById(registrationData.event_id);
    if (!event) {
      throw new Error('Event not found');
    }
    
    // Check if event is full
    const existingRegistrations = await this.getEventRegistrations(registrationData.event_id);
    const confirmedCount = existingRegistrations.filter(r => r.status === 'confirmed').length;
    
    let status: 'confirmed' | 'waitlisted' = 'confirmed';
    if (confirmedCount >= event.capacity) {
      if (event.waitlist_enabled) {
        status = 'waitlisted';
      } else {
        throw new Error('Event is full and waitlist is not enabled');
      }
    }
    
    // TODO: Determine if user is a member and calculate appropriate price
    const isMember = false; // This should be determined from user context
    const priceInCents = isMember ? event.member_price_cents : event.non_member_price_cents;
    
    // Check for early bird pricing
    let finalPriceInCents = priceInCents;
    if (event.early_bird_price_cents && event.early_bird_end_date) {
      if (new Date() < new Date(event.early_bird_end_date)) {
        finalPriceInCents = event.early_bird_price_cents;
      }
    }
    
    const { data, error } = await supabase
      .from('event_registrations')
      .insert({
        ...registrationData,
        status,
        registration_type: isMember ? 'member' : 'non_member',
        amount_paid_cents: finalPriceInCents,
        payment_status: finalPriceInCents === 0 ? 'exempt' : 'pending',
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating registration:', error);
      throw error;
    }
    
    // TODO: Send confirmation email
    
    return data;
  }
  
  static async updateRegistration(
    id: string, 
    updates: Partial<EventRegistration>
  ): Promise<EventRegistration> {
    const { data, error } = await supabase
      .from('event_registrations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating registration:', error);
      throw error;
    }
    
    return data;
  }
  
  static async cancelRegistration(id: string, reason?: string): Promise<EventRegistration> {
    const { data, error } = await supabase
      .from('event_registrations')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error cancelling registration:', error);
      throw error;
    }
    
    // TODO: Send cancellation email
    // TODO: Process refund if applicable
    
    return data;
  }
  
  static async checkInRegistration(
    id: string, 
    method: 'qr_code' | 'manual' = 'manual'
  ): Promise<EventRegistration> {
    const { data, error } = await supabase
      .from('event_registrations')
      .update({
        attended: true,
        check_in_time: new Date().toISOString(),
        check_in_method: method
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error checking in registration:', error);
      throw error;
    }
    
    return data;
  }
  
  static async checkInByQRCode(qrToken: string): Promise<EventRegistration> {
    // Find registration by QR token
    const { data: registration, error: findError } = await supabase
      .from('event_registrations')
      .select('*')
      .eq('qr_code_token', qrToken)
      .single();
    
    if (findError || !registration) {
      throw new Error('Invalid QR code');
    }
    
    // Check if already checked in
    if (registration.attended) {
      throw new Error('Already checked in');
    }
    
    // Perform check-in
    return this.checkInRegistration(registration.id, 'qr_code');
  }
  
  // ==================== Statistics ====================
  
  static async getEventStatistics(eventId: string): Promise<any> {
    const { data, error } = await supabase
      .from('event_statistics')
      .select('*')
      .eq('id', eventId)
      .single();
    
    if (error) {
      console.error('Error fetching event statistics:', error);
      throw error;
    }
    
    return data;
  }
  
  static async getDashboardStatistics(): Promise<EventStatistics> {
    // Get total events
    const { count: totalEvents } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true });
    
    // Get upcoming events
    const { count: upcomingEvents } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')
      .gte('start_date', new Date().toISOString());
    
    // Get total registrations
    const { count: totalRegistrations } = await supabase
      .from('event_registrations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'confirmed');
    
    // Get total revenue
    const { data: revenueData } = await supabase
      .from('event_registrations')
      .select('amount_paid_cents')
      .eq('payment_status', 'paid');
    
    const totalRevenue = revenueData?.reduce(
      (sum, r) => sum + (r.amount_paid_cents || 0), 
      0
    ) || 0;
    
    // Get upcoming events list
    const upcomingEventsList = await this.getUpcomingEvents(5);
    
    // Get recent registrations
    const { data: recentRegs } = await supabase
      .from('event_registrations')
      .select(`
        *,
        event:events(title, start_date)
      `)
      .order('created_at', { ascending: false })
      .limit(10);
    
    return {
      total_events: totalEvents || 0,
      upcoming_events: upcomingEvents || 0,
      total_registrations: totalRegistrations || 0,
      total_revenue: totalRevenue / 100, // Convert cents to dollars
      average_attendance_rate: 0, // TODO: Calculate this
      popular_categories: [], // TODO: Calculate this
      recent_registrations: recentRegs || [],
      upcoming_events_list: upcomingEventsList
    };
  }
  
  // ==================== Email Templates ====================
  
  static async getEventEmails(eventId: string): Promise<EventEmail[]> {
    const { data, error } = await supabase
      .from('event_emails')
      .select('*')
      .eq('event_id', eventId)
      .order('type');
    
    if (error) {
      console.error('Error fetching event emails:', error);
      throw error;
    }
    
    return data || [];
  }
  
  static async updateEmailTemplate(
    id: string, 
    updates: Partial<EventEmail>
  ): Promise<EventEmail> {
    const { data, error } = await supabase
      .from('event_emails')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating email template:', error);
      throw error;
    }
    
    return data;
  }
  
  // ==================== Utility Functions ====================
  
  static formatPrice(cents: number): string {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
    }).format(cents / 100);
  }
  
  static getEventStatus(event: Event): string {
    const now = new Date();
    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);
    
    if (event.status === 'cancelled') return 'Cancelled';
    if (event.status === 'draft') return 'Draft';
    if (now < startDate) return 'Upcoming';
    if (now >= startDate && now <= endDate) return 'In Progress';
    return 'Completed';
  }
  
  static getAvailableSpots(event: Event, registrations: EventRegistration[]): number {
    const confirmedCount = registrations.filter(r => r.status === 'confirmed').length;
    return Math.max(0, event.capacity - confirmedCount);
  }
  
  static isRegistrationOpen(event: Event): boolean {
    const now = new Date();
    
    if (event.status !== 'published') return false;
    
    if (event.registration_start_date && now < new Date(event.registration_start_date)) {
      return false;
    }
    
    if (event.registration_end_date && now > new Date(event.registration_end_date)) {
      return false;
    }
    
    return true;
  }
}
// Event Management System Types

export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed';
export type EventVisibility = 'public' | 'members' | 'private';
export type LocationType = 'physical' | 'virtual' | 'hybrid';
export type RegistrationStatus = 'pending' | 'confirmed' | 'waitlisted' | 'cancelled' | 'refunded';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'exempt';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type EmailType = 
  | 'registration_confirmation'
  | 'payment_confirmation'
  | 'waitlist_notification'
  | 'reminder_1_week'
  | 'reminder_1_day'
  | 'reminder_1_hour'
  | 'cancellation_notice'
  | 'post_event_thank_you'
  | 'post_event_survey'
  | 'certificate_delivery'
  | 'custom';

export interface EventCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  
  // Basic Information
  title: string;
  slug: string;
  description?: string;
  short_description?: string;
  image_url?: string;
  
  // Category
  category_id?: string;
  category?: EventCategory;
  
  // Date and Time
  start_date: string;
  end_date: string;
  timezone: string;
  
  // Location
  location_type: LocationType;
  venue_name?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country: string;
  virtual_link?: string;
  location_instructions?: string;
  
  // Capacity and Registration
  capacity: number;
  waitlist_enabled: boolean;
  registration_start_date?: string;
  registration_end_date?: string;
  
  // Pricing (stored in cents, displayed in dollars)
  member_price_cents: number;
  non_member_price_cents: number;
  early_bird_price_cents?: number;
  early_bird_end_date?: string;
  
  // CPD Integration
  cpd_points: number;
  cpd_category?: string;
  
  // Status and Visibility
  status: EventStatus;
  visibility: EventVisibility;
  featured: boolean;
  
  // Meta Information
  created_by?: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  
  // Additional Settings
  allow_guests: boolean;
  max_guests_per_registration: number;
  requires_approval: boolean;
  show_attendee_list: boolean;
  
  // SEO and Marketing
  meta_title?: string;
  meta_description?: string;
  tags?: string[];
  
  // Custom Fields
  custom_fields?: Record<string, any>;
  settings?: Record<string, any>;
  
  // Computed fields (from joins)
  confirmed_count?: number;
  waitlist_count?: number;
  attended_count?: number;
  total_revenue_cents?: number;
  occupancy_rate?: number;
}

export interface EventRegistration {
  id: string;
  
  // Relationships
  event_id: string;
  event?: Event;
  member_id?: string;
  user_id?: string;
  
  // Registration Details
  registration_number: string;
  registration_type: 'member' | 'non_member' | 'guest';
  
  // Personal Information
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  organization?: string;
  dietary_requirements?: string;
  accessibility_requirements?: string;
  
  // Guest Information
  guest_count: number;
  guest_names?: string[];
  
  // Status
  status: RegistrationStatus;
  
  // Payment Information
  payment_status: PaymentStatus;
  amount_paid_cents: number;
  payment_method?: string;
  payment_reference?: string;
  paid_at?: string;
  refunded_at?: string;
  refund_amount_cents?: number;
  refund_reason?: string;
  
  // Attendance
  attended: boolean;
  check_in_time?: string;
  check_in_method?: 'qr_code' | 'manual' | 'auto';
  checked_in_by?: string;
  
  // QR Code
  qr_code_token?: string;
  qr_code_url?: string;
  
  // Approval
  approval_status?: ApprovalStatus;
  approved_by?: string;
  approved_at?: string;
  approval_notes?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  
  // Additional Data
  notes?: string;
  custom_responses?: Record<string, any>;
  source?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

export interface EventEmail {
  id: string;
  event_id: string;
  type: EmailType;
  subject: string;
  content: string;
  is_active: boolean;
  send_trigger: 'immediate' | 'scheduled' | 'before_event' | 'after_event' | 'on_registration' | 'on_payment' | 'on_cancellation';
  send_offset_minutes?: number;
  scheduled_at?: string;
  sent_count: number;
  last_sent_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CPDEventActivity {
  id: string;
  event_id: string;
  member_id: string;
  registration_id?: string;
  points_earned: number;
  cpd_category?: string;
  certificate_number?: string;
  certificate_url?: string;
  certificate_generated_at?: string;
  status: 'pending' | 'approved' | 'issued';
  issued_at?: string;
  issued_by?: string;
  created_at: string;
}

// Form types for creating/editing
export interface EventFormData {
  title: string;
  description?: string;
  short_description?: string;
  category_id?: string;
  start_date: string;
  end_date: string;
  timezone: string;
  location_type: LocationType;
  venue_name?: string;
  address_line1?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country: string;
  virtual_link?: string;
  capacity: number;
  member_price: number; // In dollars
  non_member_price: number; // In dollars
  early_bird_price?: number; // In dollars
  early_bird_end_date?: string;
  cpd_points?: number;
  cpd_category?: string;
  visibility: EventVisibility;
  featured: boolean;
  allow_guests: boolean;
  max_guests_per_registration: number;
  requires_approval: boolean;
  image_url?: string;
}

export interface RegistrationFormData {
  event_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  organization?: string;
  dietary_requirements?: string;
  accessibility_requirements?: string;
  guest_count?: number;
  guest_names?: string[];
  custom_responses?: Record<string, any>;
}

// Dashboard statistics
export interface EventStatistics {
  total_events: number;
  upcoming_events: number;
  total_registrations: number;
  total_revenue: number;
  average_attendance_rate: number;
  popular_categories: Array<{
    category: string;
    count: number;
  }>;
  recent_registrations: EventRegistration[];
  upcoming_events_list: Event[];
}

// Filter and search types
export interface EventFilters {
  status?: EventStatus[];
  category?: string[];
  location_type?: LocationType[];
  date_from?: string;
  date_to?: string;
  has_cpd?: boolean;
  featured_only?: boolean;
  search?: string;
}

export interface RegistrationFilters {
  event_id?: string;
  status?: RegistrationStatus[];
  payment_status?: PaymentStatus[];
  attended?: boolean;
  date_from?: string;
  date_to?: string;
  search?: string;
}
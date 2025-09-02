import { supabase } from '../lib/supabase/client';
import { EventService } from './eventService';
import { EmailService } from './emailService';
import cpd from '../features/cpd/cpdService';
const CPDService = cpd;
import { format } from 'date-fns';
import { createClient } from '@supabase/supabase-js';

export interface EventRegistration {
  id: string;
  event_id: string;
  user_id: string;
  created_at: string;
  status?: string;
  registration_type?: string;
  payment_status?: string;
  payment_amount?: number;
  payment_date?: string;
  payment_method?: string;
  invoice_number?: string;
  is_guest?: boolean;
  guest_of?: string;
  guest_name?: string;
  guest_email?: string;
  // These might not exist in the database yet
  checked_in?: boolean;
  check_in_date?: string;
  check_in_method?: string;
  certificate_issued?: boolean;
  certificate_issued_date?: string;
  certificate_number?: string;
  certificate_url?: string;
  cpd_activity_created?: boolean;
  cpd_activity_id?: string;
  reminder_email_sent?: boolean;
  reminder_email_date?: string;
  // Alternative simple fields
  attended?: boolean;
  attendance_date?: string;
  dietary_requirements?: string;
  accessibility_requirements?: string;
  notes?: string;
  updated_at?: string;
}

export interface EventCertificate {
  id: string;
  registration_id: string;
  event_id: string;
  user_id: string;
  certificate_number: string;
  issue_date: string;
  recipient_name: string;
  event_title: string;
  event_date: string;
  cpd_points?: number;
  cpd_category?: string;
  pdf_url?: string;
  pdf_generated: boolean;
  pdf_generation_date?: string;
  verification_code?: string;
  is_valid: boolean;
  created_at: string;
  updated_at: string;
}

export interface AttendanceLog {
  id: string;
  registration_id: string;
  event_id: string;
  user_id: string;
  access_date: string;
  access_type: 'check_in' | 'page_view' | 'video_start' | 'video_complete' | 'download';
  ip_address?: string;
  user_agent?: string;
  session_duration?: number;
  video_progress?: number;
  created_at: string;
}

export class EventRegistrationService {
  /**
   * Register a user for an event
   */
  static async registerForEvent(
    eventId: string,
    userId: string,
    additionalInfo?: {
      dietary_requirements?: string;
      accessibility_requirements?: string;
      notes?: string;
    }
  ): Promise<EventRegistration> {
    try {
      // Check if already registered
      const { data: existing, error: checkError } = await supabase
        .from('event_registrations')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .single();

      if (existing) {
        throw new Error('You are already registered for this event');
      }

      // Get event details to determine payment amount
      const event = await EventService.getEventById(eventId);
      if (!event) {
        throw new Error('Event not found');
      }

      // Check capacity
      const registrations = await this.getEventRegistrations(eventId);
      if (registrations.length >= event.capacity) {
        throw new Error('Event is full');
      }

      // For now, assume non-member price (can be updated later when profiles table exists)
      const isMember = false; // Will be updated when profiles table is available
      let paymentAmount = isMember ? event.member_price_cents : event.non_member_price_cents;

      // Check for early bird pricing
      if (event.early_bird_price_cents && event.early_bird_end_date) {
        if (new Date() < new Date(event.early_bird_end_date)) {
          paymentAmount = event.early_bird_price_cents;
        }
      }

      // Create registration
      const { data, error } = await supabase
        .from('event_registrations')
        .insert({
          event_id: eventId,
          user_id: userId,
          status: 'registered',
          registration_type: 'participant',
          payment_status: paymentAmount === 0 ? 'waived' : 'pending',
          payment_amount: paymentAmount,
          ...additionalInfo
        })
        .select()
        .single();

      if (error) throw error;

      // Send confirmation email
      try {
        // Get user details
        const { data: { user } } = await supabase.auth.getUser();
        const userEmail = user?.email || '';
        const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Member';
        
        // Format event details for email
        const eventDate = format(new Date(event.start_date), 'EEEE, MMMM d, yyyy');
        const eventTime = format(new Date(event.start_date), 'h:mm a');
        const eventLocation = event.location_type === 'virtual' 
          ? 'Online Event' 
          : event.venue_name || 'TBA';
        
        // Send confirmation email
        await EmailService.sendEventRegistrationConfirmation({
          to: userEmail,
          userName: userName,
          eventTitle: event.title,
          eventDate: eventDate,
          eventTime: eventTime,
          eventLocation: eventLocation,
          eventLink: `${window.location.origin}/events/${event.slug}`,
          registrationId: data.id
        });
        
        console.log('Registration confirmation email sent to:', userEmail);
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
        // Don't throw - email failure shouldn't break registration
      }

      // Schedule reminders with configurable times
      console.log('🚨 ABOUT TO CALL scheduleConfigurableReminders');
      await this.scheduleConfigurableReminders(data.id, eventId, userId, event);
      console.log('🚨 FINISHED CALLING scheduleConfigurableReminders');

      return data;
    } catch (error: any) {
      console.error('Error registering for event:', error);
      throw new Error(error.message || 'Failed to register for event');
    }
  }

  /**
   * Cancel registration
   */
  static async cancelRegistration(registrationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('event_registrations')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', registrationId);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error cancelling registration:', error);
      throw new Error(error.message || 'Failed to cancel registration');
    }
  }

  /**
   * Check in a user at an event
   */
  static async checkInUser(
    registrationId: string,
    method: 'manual' | 'qr_code' | 'auto' = 'manual'
  ): Promise<void> {
    try {
      // Try to update with new columns first, fall back to simpler fields
      const updateData: any = {
        status: 'attended',
        attended: true,
        attendance_date: new Date().toISOString()
      };

      // Try to set check_in fields if they exist
      if (method) {
        updateData.check_in_date = new Date().toISOString();
        updateData.check_in_method = method;
        updateData.checked_in = true;
      }

      if ('updated_at' in updateData) {
        updateData.updated_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('event_registrations')
        .update(updateData)
        .eq('id', registrationId);

      if (error) {
        console.error('Check-in error:', error);
        // If specific columns don't exist, try minimal update
        const { error: fallbackError } = await supabase
          .from('event_registrations')
          .update({
            status: 'attended',
            attended: true,
            attendance_date: new Date().toISOString()
          })
          .eq('id', registrationId);
        
        if (fallbackError) throw fallbackError;
      }

      // Automatically create CPD activity after successful check-in
      try {
        // Get registration details
        const { data: registration } = await supabase
          .from('event_registrations')
          .select('*')
          .eq('id', registrationId)
          .single();
        
        if (registration && !registration.cpd_activity_created) {
          // Get event details
          const event = await EventService.getEventById(registration.event_id);
          
          if (event && event.cpd_points > 0) {
            // Get user details
            const { data: { user } } = await supabase.auth.getUser();
            const userEmail = user?.email || '';
            const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Member';
            
            // Calculate hours from event duration
            const startDate = new Date(event.start_date);
            const endDate = new Date(event.end_date);
            const durationMs = endDate.getTime() - startDate.getTime();
            const hours = Math.floor(durationMs / (1000 * 60 * 60));
            const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
            
            // Create CPD activity
            const cpdActivity = await CPDService.createActivity({
              category_id: 14, // "Attend English Australia PD event"
              activity_title: `Event: ${event.title}`,
              description: `Attended ${event.title} on ${format(startDate, 'MMMM d, yyyy')}`,
              provider: 'English Australia',
              date_completed: format(new Date(), 'yyyy-MM-dd'),
              hours: hours,
              minutes: minutes
            }, registration.user_id, userEmail);
            
            // Update registration to mark CPD as created
            await supabase
              .from('event_registrations')
              .update({
                cpd_activity_created: true,
                cpd_activity_id: cpdActivity.id
              })
              .eq('id', registrationId);
            
            // Send CPD notification email
            await EmailService.sendCPDPointsNotification({
              to: userEmail,
              userName: userName,
              eventTitle: event.title,
              cpdPoints: event.cpd_points,
              cpdCategory: event.cpd_category || 'Event Attendance',
              certificateLink: `/certificates/${registrationId}`
            });
            
            console.log(`CPD activity created for registration ${registrationId}: ${event.cpd_points} points`);
          }
        }
      } catch (cpdError) {
        console.error('Error creating CPD activity:', cpdError);
        // Don't throw - CPD creation failure shouldn't break check-in
      }
    } catch (error: any) {
      console.error('Error checking in user:', error);
      throw new Error(error.message || 'Failed to check in');
    }
  }

  /**
   * Auto check-in when user accesses event during event time
   */
  static async autoCheckIn(eventId: string, userId: string): Promise<void> {
    try {
      // Get registration
      const { data: registration, error: regError } = await supabase
        .from('event_registrations')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .single();

      if (regError || !registration) {
        console.log('No registration found for auto check-in');
        return;
      }

      // Skip if already checked in (check both possible fields)
      if (registration.checked_in || registration.attended) {
        console.log('User already checked in');
        return;
      }

      // Get event details
      const event = await EventService.getEventById(eventId);
      if (!event) return;

      // Check if current time is within event time
      const now = new Date();
      const eventStart = new Date(event.start_date);
      const eventEnd = new Date(event.end_date);

      // Allow check-in 30 minutes before start and during the event
      const checkInStart = new Date(eventStart.getTime() - 30 * 60 * 1000);

      if (now >= checkInStart && now <= eventEnd) {
        await this.checkInUser(registration.id, 'auto');
        console.log('Auto check-in successful');
      }
    } catch (error) {
      console.error('Error in auto check-in:', error);
      // Don't throw - this is a background operation
    }
  }

  /**
   * Log attendance/access
   */
  static async logAttendance(
    registrationId: string,
    eventId: string,
    userId: string,
    accessType: AttendanceLog['access_type'],
    additionalData?: {
      ip_address?: string;
      user_agent?: string;
      session_duration?: number;
      video_progress?: number;
    }
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('event_attendance_log')
        .insert({
          registration_id: registrationId,
          event_id: eventId,
          user_id: userId,
          access_type: accessType,
          ...additionalData
        });

      if (error) throw error;
    } catch (error: any) {
      console.error('Error logging attendance:', error);
      // Don't throw - logging shouldn't break the flow
    }
  }

  /**
   * Generate certificate for completed event
   */
  static async generateCertificate(registrationId: string): Promise<EventCertificate> {
    try {
      // Get registration details
      const { data: registration, error: regError } = await supabase
        .from('event_registrations')
        .select('*')
        .eq('id', registrationId)
        .single();

      if (regError || !registration) {
        throw new Error('Registration not found');
      }

      // Check if user attended (check both fields)
      if (!registration.checked_in && !registration.attended) {
        throw new Error('Certificate can only be issued for attended events');
      }

      // Get event details separately
      const event = await EventService.getEventById(registration.event_id);
      if (!event) {
        throw new Error('Event not found');
      }

      // Get user info from auth.users instead of profiles
      // For certificate generation, we'll use the current user's email
      const { data: { user } } = await supabase.auth.getUser();
      
      // Use email as name if no profile exists
      const userName = user?.email?.split('@')[0] || 'Member';

      // Check if certificate table exists before trying to use it
      try {
        const { data: existing } = await supabase
          .from('event_certificates')
          .select('*')
          .eq('registration_id', registrationId)
          .single();

        if (existing) {
          return existing;
        }
      } catch (certTableError) {
        console.log('Certificate table might not exist yet');
      }

      // For now, return a mock certificate
      const mockCertificate: EventCertificate = {
        id: `cert-${Date.now()}`,
        registration_id: registrationId,
        event_id: registration.event_id,
        user_id: registration.user_id,
        certificate_number: `CERT-${Date.now()}`,
        issue_date: new Date().toISOString(),
        recipient_name: userName,
        event_title: event.title,
        event_date: new Date(event.start_date).toLocaleDateString('en-AU'),
        cpd_points: event.cpd_points,
        cpd_category: event.cpd_category,
        pdf_generated: false,
        is_valid: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Try to update registration with certificate info
      try {
        await supabase
          .from('event_registrations')
          .update({
            certificate_issued: true,
            certificate_issued_date: new Date().toISOString(),
            certificate_number: mockCertificate.certificate_number
          })
          .eq('id', registrationId);
      } catch (updateError) {
        console.log('Could not update registration with certificate info');
      }

      return mockCertificate;
    } catch (error: any) {
      console.error('Error generating certificate:', error);
      throw new Error(error.message || 'Failed to generate certificate');
    }
  }

  /**
   * Schedule configurable reminders for an event registration
   * Admin can configure: 7 days, 3 days, 1 day, 30 min before, and "we're live" notification
   */
  static async scheduleConfigurableReminders(
    registrationId: string,
    eventId: string,
    userId: string,
    event: any
  ): Promise<void> {
    try {
      console.log('🔍 DEBUG: Starting scheduleConfigurableReminders');
      console.log('📅 Event start date:', event.start_date);
      console.log('🕐 Current time:', new Date().toISOString());
      
      // Get user email from auth
      const { data: { user } } = await supabase.auth.getUser();
      const email = user?.email;
      
      // Use email server API to create reminders (bypasses RLS issues)
      console.log('🔄 Using email server API to create reminders...');

      console.log('📧 User email:', email);

      if (!email) {
        console.log('❌ No email found, skipping reminders');
        return;
      }

      // Use email server API to create reminders (bypasses RLS completely)
      try {
        const response = await fetch('http://localhost:3001/api/create-reminders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            registrationId,
            eventId,
            userId,
            event
          })
        });
        
        const result = await response.json();
        
        if (result.success) {
          console.log(`✅ Successfully created ${result.created} reminders via email server`);
          console.log('📋 Reminders created:', result.reminders);
        } else {
          console.error('❌ Email server API error:', result.error);
        }
      } catch (apiError) {
        console.error('❌ Failed to call email server API:', apiError.message);
      }
    } catch (error) {
      console.error('Error scheduling reminders:', error);
      // Don't throw - reminders are not critical
    }
  }

  /**
   * Legacy Schedule reminders for an event registration (deprecated)
   */
  static async scheduleReminders(
    registrationId: string,
    eventId: string,
    userId: string,
    eventStartDate: string
  ): Promise<void> {
    try {
      // Get user email from auth - we'll use the current user's email
      const { data: { user } } = await supabase.auth.getUser();
      const email = user?.email;

      if (!email) return;

      const eventStart = new Date(eventStartDate);
      
      // Schedule reminders: 1 week before, 1 day before, 1 hour before
      const reminders = [
        {
          reminder_type: '1_week',
          scheduled_date: new Date(eventStart.getTime() - 7 * 24 * 60 * 60 * 1000)
        },
        {
          reminder_type: '1_day',
          scheduled_date: new Date(eventStart.getTime() - 24 * 60 * 60 * 1000)
        },
        {
          reminder_type: '1_hour',
          scheduled_date: new Date(eventStart.getTime() - 60 * 60 * 1000)
        }
      ];

      for (const reminder of reminders) {
        // Only schedule if the reminder date is in the future
        if (reminder.scheduled_date > new Date()) {
          await supabase
            .from('event_reminders')
            .insert({
              event_id: eventId,
              registration_id: registrationId,
              user_id: userId,
              reminder_type: reminder.reminder_type,
              scheduled_date: reminder.scheduled_date.toISOString(),
              email_to: email
            });
        }
      }
    } catch (error) {
      console.error('Error scheduling reminders:', error);
      // Don't throw - reminders are not critical
    }
  }

  /**
   * Get user's registrations
   */
  static async getUserRegistrations(userId: string): Promise<EventRegistration[]> {
    try {
      const { data, error } = await supabase
        .from('event_registrations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching user registrations:', error);
      // Return empty array instead of throwing
      return [];
    }
  }

  /**
   * Get event registrations
   */
  static async getEventRegistrations(eventId: string): Promise<EventRegistration[]> {
    try {
      // Just get registrations without joining profiles for now
      const { data, error } = await supabase
        .from('event_registrations')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching event registrations:', error);
      // Return empty array instead of throwing to prevent page crash
      return [];
    }
  }

  /**
   * Get registration by ID
   */
  static async getRegistration(registrationId: string): Promise<EventRegistration | null> {
    try {
      const { data, error } = await supabase
        .from('event_registrations')
        .select('*')
        .eq('id', registrationId)
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error fetching registration:', error);
      return null;
    }
  }

  /**
   * Check if user is registered for an event
   */
  static async isUserRegistered(eventId: string, userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('event_registrations')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .single();

      return !!data && !error;
    } catch (error) {
      return false;
    }
  }
}
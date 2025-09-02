import type { UserRole } from '../stores/authStore'

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type { UserRole }

export type MembershipStatus = 'active' | 'inactive' | 'suspended' | 'expired'
export type MembershipType = 'standard' | 'premium' | 'student' | 'corporate'
export type MemberRole = 'member' | 'admin' | 'super_admin' | 'moderator' | 'instructor'
export type InterestGroup = 'Full Provider' | 'Associate Provider' | 'Corporate Affiliate' | 'Professional Affiliate'

export interface Database {
  public: {
    Tables: {
      members: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          first_name: string
          last_name: string
          email: string
          phone: string | null
          date_of_birth: string | null
          address_line1: string | null
          address_line2: string | null
          city: string | null
          state: string | null
          postal_code: string | null
          country: string | null
          membership_status: MembershipStatus
          membership_type: MembershipType
          membership_start_date: string | null
          membership_end_date: string | null
          profession: string | null
          experience_years: number | null
          qualifications: string | null
          receive_newsletters: boolean
          receive_event_notifications: boolean
          interest_group: InterestGroup | null
          created_by: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          first_name: string
          last_name: string
          email: string
          phone?: string | null
          date_of_birth?: string | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          state?: string | null
          postal_code?: string | null
          country?: string | null
          membership_status?: MembershipStatus
          membership_type?: MembershipType
          membership_start_date?: string | null
          membership_end_date?: string | null
          profession?: string | null
          experience_years?: number | null
          qualifications?: string | null
          receive_newsletters?: boolean
          receive_event_notifications?: boolean
          interest_group?: InterestGroup | null
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          first_name?: string
          last_name?: string
          email?: string
          phone?: string | null
          date_of_birth?: string | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          state?: string | null
          postal_code?: string | null
          country?: string | null
          membership_status?: MembershipStatus
          membership_type?: MembershipType
          membership_start_date?: string | null
          membership_end_date?: string | null
          profession?: string | null
          experience_years?: number | null
          qualifications?: string | null
          receive_newsletters?: boolean
          receive_event_notifications?: boolean
          interest_group?: InterestGroup | null
          created_by?: string | null
          updated_by?: string | null
        }
      }
      member_roles: {
        Row: {
          id: string
          created_at: string
          member_id: string
          role: MemberRole
        }
        Insert: {
          id?: string
          created_at?: string
          member_id: string
          role: MemberRole
        }
        Update: {
          id?: string
          created_at?: string
          member_id?: string
          role?: MemberRole
        }
      }
      member_history: {
        Row: {
          id: string
          created_at: string
          member_id: string
          action: string
          details: Json | null
          performed_by: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          member_id: string
          action: string
          details?: Json | null
          performed_by?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          member_id?: string
          action?: string
          details?: Json | null
          performed_by?: string | null
        }
      }
      user_profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          organization: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          organization?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          organization?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role: UserRole
          assigned_at: string
          assigned_by: string | null
        }
        Insert: {
          id?: string
          user_id: string
          role: UserRole
          assigned_at?: string
          assigned_by?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          role?: UserRole
          assigned_at?: string
          assigned_by?: string | null
        }
      }
      cpd_activities: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          category: string
          points: number
          date_completed: string
          evidence_url: string | null
          status: 'pending' | 'approved' | 'rejected'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          category: string
          points: number
          date_completed: string
          evidence_url?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          category?: string
          points?: number
          date_completed?: string
          evidence_url?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
          updated_at?: string
        }
      }
      events: {
        Row: {
          id: string
          title: string
          description: string | null
          date_start: string
          date_end: string
          location: string | null
          max_participants: number | null
          cpd_points: number
          created_by: string
          status: 'draft' | 'published' | 'completed' | 'cancelled'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          date_start: string
          date_end: string
          location?: string | null
          max_participants?: number | null
          cpd_points: number
          created_by: string
          status?: 'draft' | 'published' | 'completed' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          date_start?: string
          date_end?: string
          location?: string | null
          max_participants?: number | null
          cpd_points?: number
          created_by?: string
          status?: 'draft' | 'published' | 'completed' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
      }
      event_registrations: {
        Row: {
          id: string
          event_id: string
          user_id: string
          registration_date: string
          attendance_confirmed: boolean
          cpd_points_awarded: number | null
        }
        Insert: {
          id?: string
          event_id: string
          user_id: string
          registration_date?: string
          attendance_confirmed?: boolean
          cpd_points_awarded?: number | null
        }
        Update: {
          id?: string
          event_id?: string
          user_id?: string
          registration_date?: string
          attendance_confirmed?: boolean
          cpd_points_awarded?: number | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
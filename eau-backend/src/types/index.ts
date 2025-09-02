import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    institutionId?: string;
    userType: string;
    roles?: string[];
  };
}

export interface Institution {
  id: string;
  name: string;
  trading_name?: string;
  abn?: string;
  cricos_code?: string;
  membership_type: string;
  status: string;
  payment_status?: string;
  primary_contact_name?: string;
  primary_contact_email?: string;
  primary_contact_phone?: string;
  billing_email?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  annual_fee?: number;
  payment_due_date?: Date;
  last_payment_date?: Date;
  additional_sites?: number;
  student_weeks?: number;
  application_date?: Date;
  approval_date?: Date;
  membership_start_date?: Date;
  membership_end_date?: Date;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Member {
  id: string;
  email: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  institution_id?: string;
  user_type?: string;
  membership_type?: string;
  membership_status?: string;
  interest_group?: string;
  cpd_points_current_year?: number;
  created_at: Date;
  updated_at: Date;
  institutions?: {
    name: string;
    membership_type: string;
  };
}

export interface CPDActivity {
  id: string;
  member_id: string;
  activity_date: Date;
  activity_type: string;
  description: string;
  points: number;
  status: string;
  evidence_url?: string;
  approver_id?: string;
  approved_date?: Date;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface StaffInvitation {
  id: string;
  institution_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  user_type: string;
  status: string;
  token: string;
  expires_at: Date;
  accepted_at?: Date;
  created_at: Date;
  created_by: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface TokenPayload {
  userId: string;
  email: string;
  institutionId?: string;
  userType: string;
  roles?: string[];
}
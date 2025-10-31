import { logError, logInfo } from '../utils/logger';
import { supabaseAdmin } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import { MembershipApplicationEmailService } from './membershipApplicationEmail.service';

export interface MembershipApplicationData {
  // Institution Details
  institutionName: string;
  institutionType: string;
  website?: string;
  establishedYear?: number;
  
  // Address
  streetAddress: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  
  // Contact Person
  contactPersonName: string;
  contactPersonTitle: string;
  contactPersonEmail: string;
  contactPersonPhone: string;
  
  // Membership Details
  membershipType: string;
  motivationStatement: string;
  
  // Optional fields
  numberOfStudents?: number;
  accreditations?: string[];
  specialPrograms?: string;
}

export interface MembershipApplication {
  id: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  institution_name: string;
  contact_person_email: string;
  membership_type: string;
  application_data: MembershipApplicationData;
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  review_notes?: string;
  approved_at?: string;
  rejected_at?: string;
}

export class MembershipApplicationService {
  /**
   * Submit a new membership application
   */
  static async submitApplication(applicationData: MembershipApplicationData): Promise<string> {
    try {
      logInfo('Submitting membership application', { 
        institutionName: applicationData.institutionName,
        contactEmail: applicationData.contactPersonEmail 
      });

      // Check if application already exists for this institution
      const { data: existingApp, error: checkError } = await supabaseAdmin
        .from('membership_applications')
        .select('id, status')
        .eq('institution_name', applicationData.institutionName)
        .in('status', ['pending', 'under_review'])
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') throw checkError;

      if (existingApp) {
        throw new Error('An active application already exists for this institution');
      }

      const applicationId = uuidv4();
      const now = new Date().toISOString();

      // Insert application
      const { error: insertError } = await supabaseAdmin
        .from('membership_applications')
        .insert({
          id: applicationId,
          institution_name: applicationData.institutionName,
          contact_person_email: applicationData.contactPersonEmail,
          membership_type: applicationData.membershipType,
          application_data: applicationData,
          status: 'pending',
          submitted_at: now
        });

      if (insertError) throw insertError;

      logInfo('Membership application submitted successfully', { applicationId });
      
      // Send confirmation email
      try {
        await MembershipApplicationEmailService.sendApplicationReceivedEmail(
          applicationData,
          applicationId
        );
        logInfo('Application received confirmation email sent', { applicationId });
      } catch (emailError) {
        logError(emailError as Error);
        // Don't fail the application submission if email fails
        logInfo('Application submitted successfully but confirmation email failed', { applicationId });
      }
      
      return applicationId;

    } catch (error) {
      logError(error as Error);
      throw new Error('Failed to submit application');
    }
  }

  /**
   * Get all membership applications (admin only)
   */
  static async getAllApplications(): Promise<MembershipApplication[]> {
    try {
      const { data: applications, error } = await supabaseAdmin
        .from('membership_applications')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      return applications || [];
    } catch (error) {
      logError(error as Error);
      throw new Error('Failed to fetch applications');
    }
  }

  /**
   * Get application by ID
   */
  static async getApplicationById(applicationId: string): Promise<MembershipApplication | null> {
    try {
      const { data: application, error } = await supabaseAdmin
        .from('membership_applications')
        .select('*')
        .eq('id', applicationId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return application || null;
    } catch (error) {
      logError(error as Error);
      throw new Error('Failed to fetch application');
    }
  }

  /**
   * Update application status
   */
  static async updateApplicationStatus(
    applicationId: string, 
    status: 'under_review' | 'approved' | 'rejected',
    reviewedBy: string,
    reviewNotes?: string
  ): Promise<void> {
    try {
      const now = new Date().toISOString();
      const updateData: any = {
        status,
        reviewed_by: reviewedBy,
        reviewed_at: now,
        review_notes: reviewNotes
      };

      if (status === 'approved') {
        updateData.approved_at = now;
      } else if (status === 'rejected') {
        updateData.rejected_at = now;
      }

      const { error } = await supabaseAdmin
        .from('membership_applications')
        .update(updateData)
        .eq('id', applicationId);

      if (error) throw error;

      logInfo('Application status updated', { applicationId, status, reviewedBy });

    } catch (error) {
      logError(error as Error);
      throw new Error('Failed to update application status');
    }
  }

  /**
   * Approve application and create institution + member
   */
  static async approveApplication(
    applicationId: string,
    reviewedBy: string,
    reviewNotes?: string
  ): Promise<{ institutionId: string; memberId: string }> {
    try {
      // Get application details
      const application = await this.getApplicationById(applicationId);
      if (!application) {
        throw new Error('Application not found');
      }

      if (application.status !== 'under_review' && application.status !== 'pending') {
        throw new Error('Application cannot be approved in current status');
      }

      const appData = application.application_data as MembershipApplicationData;

      // Create institution - Simplified version to avoid schema cache issues
      const institutionId = uuidv4();
      const { error: institutionError } = await supabaseAdmin
        .from('institutions')
        .insert({
          id: institutionId,
          name: appData.institutionName,
          membership_type: appData.membershipType,
          membership_status: 'active'
        });

      if (institutionError) throw institutionError;

      // Create member (contact person) - this will be the institution admin
      const memberId = uuidv4();
      const { error: memberError } = await supabaseAdmin
        .from('members')
        .insert({
          id: memberId,
          email: appData.contactPersonEmail,
          first_name: appData.contactPersonName.split(' ')[0],
          last_name: appData.contactPersonName.split(' ').slice(1).join(' ') || 'Admin',
          institution_id: institutionId,
          membership_type: appData.membershipType,
          membership_status: 'active',
          user_type: 'institution_admin'
        });

      if (memberError) throw memberError;

      // Create member role for institution admin
      const { error: roleError } = await supabaseAdmin
        .from('member_roles')
        .insert({
          member_id: memberId,
          role: 'Institution Admin'
        });

      if (roleError) throw roleError;

      // Update application status
      await this.updateApplicationStatus(applicationId, 'approved', reviewedBy, reviewNotes);

      // Send approval email
      try {
        await MembershipApplicationEmailService.sendApprovalEmail(
          appData,
          applicationId,
          institutionId,
          memberId,
          reviewNotes
        );
        logInfo('Approval email sent successfully', { applicationId });
      } catch (emailError) {
        logError(emailError as Error);
        logError(new Error('Failed to send approval email but application was approved successfully'));
      }

      logInfo('Application approved and institution created', { 
        applicationId, 
        institutionId, 
        memberId 
      });

      return { institutionId, memberId };

    } catch (error) {
      logError(error as Error);
      throw new Error('Failed to approve application');
    }
  }

  /**
   * Reject application
   */
  static async rejectApplication(
    applicationId: string,
    reviewedBy: string,
    reviewNotes?: string
  ): Promise<void> {
    try {
      // Get application details
      const application = await this.getApplicationById(applicationId);
      if (!application) {
        throw new Error('Application not found');
      }

      if (application.status !== 'pending' && application.status !== 'under_review') {
        throw new Error('Application cannot be rejected in current status');
      }

      // Update application status to rejected
      await this.updateApplicationStatus(applicationId, 'rejected', reviewedBy, reviewNotes);

      // Send rejection email
      try {
        const appData = application.application_data as MembershipApplicationData;
        await MembershipApplicationEmailService.sendRejectionEmail(
          appData,
          applicationId,
          reviewNotes || 'Your application did not meet our current membership criteria.'
        );
        logInfo('Rejection email sent successfully', { applicationId });
      } catch (emailError) {
        logError(emailError as Error);
        logError(new Error('Failed to send rejection email but application was rejected successfully'));
      }

      logInfo('Application rejected', { 
        applicationId, 
        reviewedBy,
        reviewNotes 
      });

    } catch (error) {
      logError(error as Error);
      throw new Error('Failed to reject application');
    }
  }
}
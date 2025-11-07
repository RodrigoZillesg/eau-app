"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MembershipApplicationService = void 0;
const logger_1 = require("../utils/logger");
const database_1 = require("../config/database");
const uuid_1 = require("uuid");
const membershipApplicationEmail_service_1 = require("./membershipApplicationEmail.service");
class MembershipApplicationService {
    /**
     * Submit a new membership application
     */
    static async submitApplication(applicationData) {
        try {
            (0, logger_1.logInfo)('Submitting membership application', {
                institutionName: applicationData.institutionName,
                contactEmail: applicationData.contactPersonEmail
            });
            // Check if application already exists for this institution
            const { data: existingApp, error: checkError } = await database_1.supabaseAdmin
                .from('membership_applications')
                .select('id, status')
                .eq('institution_name', applicationData.institutionName)
                .in('status', ['pending', 'under_review'])
                .maybeSingle();
            if (checkError && checkError.code !== 'PGRST116')
                throw checkError;
            if (existingApp) {
                throw new Error('An active application already exists for this institution');
            }
            const applicationId = (0, uuid_1.v4)();
            const now = new Date().toISOString();
            // Insert application
            const { error: insertError } = await database_1.supabaseAdmin
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
            if (insertError)
                throw insertError;
            (0, logger_1.logInfo)('Membership application submitted successfully', { applicationId });
            // Send confirmation email
            try {
                await membershipApplicationEmail_service_1.MembershipApplicationEmailService.sendApplicationReceivedEmail(applicationData, applicationId);
                (0, logger_1.logInfo)('Application received confirmation email sent', { applicationId });
            }
            catch (emailError) {
                (0, logger_1.logError)(emailError);
                // Don't fail the application submission if email fails
                (0, logger_1.logInfo)('Application submitted successfully but confirmation email failed', { applicationId });
            }
            return applicationId;
        }
        catch (error) {
            (0, logger_1.logError)(error);
            throw new Error('Failed to submit application');
        }
    }
    /**
     * Get all membership applications (admin only)
     */
    static async getAllApplications() {
        try {
            const { data: applications, error } = await database_1.supabaseAdmin
                .from('membership_applications')
                .select('*')
                .order('submitted_at', { ascending: false });
            if (error)
                throw error;
            return applications || [];
        }
        catch (error) {
            (0, logger_1.logError)(error);
            throw new Error('Failed to fetch applications');
        }
    }
    /**
     * Get application by ID
     */
    static async getApplicationById(applicationId) {
        try {
            const { data: application, error } = await database_1.supabaseAdmin
                .from('membership_applications')
                .select('*')
                .eq('id', applicationId)
                .single();
            if (error && error.code !== 'PGRST116')
                throw error;
            return application || null;
        }
        catch (error) {
            (0, logger_1.logError)(error);
            throw new Error('Failed to fetch application');
        }
    }
    /**
     * Update application status
     */
    static async updateApplicationStatus(applicationId, status, reviewedBy, reviewNotes) {
        try {
            const now = new Date().toISOString();
            const updateData = {
                status,
                reviewed_by: reviewedBy,
                reviewed_at: now,
                review_notes: reviewNotes
            };
            if (status === 'approved') {
                updateData.approved_at = now;
            }
            else if (status === 'rejected') {
                updateData.rejected_at = now;
            }
            const { error } = await database_1.supabaseAdmin
                .from('membership_applications')
                .update(updateData)
                .eq('id', applicationId);
            if (error)
                throw error;
            (0, logger_1.logInfo)('Application status updated', { applicationId, status, reviewedBy });
        }
        catch (error) {
            (0, logger_1.logError)(error);
            throw new Error('Failed to update application status');
        }
    }
    /**
     * Approve application and create institution + member
     */
    static async approveApplication(applicationId, reviewedBy, reviewNotes) {
        try {
            // Get application details
            const application = await this.getApplicationById(applicationId);
            if (!application) {
                throw new Error('Application not found');
            }
            if (application.status !== 'under_review' && application.status !== 'pending') {
                throw new Error('Application cannot be approved in current status');
            }
            const appData = application.application_data;
            // Create institution - Simplified version to avoid schema cache issues
            const institutionId = (0, uuid_1.v4)();
            const { error: institutionError } = await database_1.supabaseAdmin
                .from('institutions')
                .insert({
                id: institutionId,
                name: appData.institutionName,
                membership_type: appData.membershipType,
                membership_status: 'active'
            });
            if (institutionError)
                throw institutionError;
            // Create member (contact person) - this will be the institution admin
            const memberId = (0, uuid_1.v4)();
            const { error: memberError } = await database_1.supabaseAdmin
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
            if (memberError)
                throw memberError;
            // Create member role for institution admin
            const { error: roleError } = await database_1.supabaseAdmin
                .from('member_roles')
                .insert({
                member_id: memberId,
                role: 'Institution Admin'
            });
            if (roleError)
                throw roleError;
            // Update application status
            await this.updateApplicationStatus(applicationId, 'approved', reviewedBy, reviewNotes);
            // Send approval email
            try {
                await membershipApplicationEmail_service_1.MembershipApplicationEmailService.sendApprovalEmail(appData, applicationId, institutionId, memberId, reviewNotes);
                (0, logger_1.logInfo)('Approval email sent successfully', { applicationId });
            }
            catch (emailError) {
                (0, logger_1.logError)(emailError);
                (0, logger_1.logError)(new Error('Failed to send approval email but application was approved successfully'));
            }
            (0, logger_1.logInfo)('Application approved and institution created', {
                applicationId,
                institutionId,
                memberId
            });
            return { institutionId, memberId };
        }
        catch (error) {
            (0, logger_1.logError)(error);
            throw new Error('Failed to approve application');
        }
    }
    /**
     * Reject application
     */
    static async rejectApplication(applicationId, reviewedBy, reviewNotes) {
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
                const appData = application.application_data;
                await membershipApplicationEmail_service_1.MembershipApplicationEmailService.sendRejectionEmail(appData, applicationId, reviewNotes || 'Your application did not meet our current membership criteria.');
                (0, logger_1.logInfo)('Rejection email sent successfully', { applicationId });
            }
            catch (emailError) {
                (0, logger_1.logError)(emailError);
                (0, logger_1.logError)(new Error('Failed to send rejection email but application was rejected successfully'));
            }
            (0, logger_1.logInfo)('Application rejected', {
                applicationId,
                reviewedBy,
                reviewNotes
            });
        }
        catch (error) {
            (0, logger_1.logError)(error);
            throw new Error('Failed to reject application');
        }
    }
}
exports.MembershipApplicationService = MembershipApplicationService;
//# sourceMappingURL=membershipApplication.service.js.map
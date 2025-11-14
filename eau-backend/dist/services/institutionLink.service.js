"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestInstitutionLink = requestInstitutionLink;
exports.approveLinkRequest = approveLinkRequest;
exports.rejectLinkRequest = rejectLinkRequest;
exports.getPendingLinkRequests = getPendingLinkRequests;
exports.getAllLinkRequests = getAllLinkRequests;
exports.unlinkFromInstitution = unlinkFromInstitution;
exports.getMemberLinkStatus = getMemberLinkStatus;
exports.getAllPendingLinkRequestsForSuperAdmin = getAllPendingLinkRequestsForSuperAdmin;
exports.getAllLinkRequestsForSuperAdmin = getAllLinkRequestsForSuperAdmin;
const database_1 = require("../config/database");
const email_service_1 = require("./email.service");
/**
 * Member requests to link with an institution
 * Creates pending request and sends email to institution admin
 */
async function requestInstitutionLink(data) {
    try {
        // 1. Check if member is already linked to an institution
        const { data: member, error: memberError } = await database_1.supabaseAdmin
            .from('members')
            .select('institution_id, first_name, last_name, email')
            .eq('id', data.member_id)
            .single();
        if (memberError) {
            console.error('Error fetching member:', memberError);
            throw new Error('Member not found');
        }
        // Note: Removed the check that prevents linked members from requesting.
        // Members can now request to link to a different institution, and upon approval,
        // they will be automatically unlinked from their current institution.
        // This implements the client requirement: "ao ser aprovado por uma, deve ser deslidado da outra"
        // 2. Check if there's already a pending request
        const { data: existing, error: existingError } = await database_1.supabaseAdmin
            .from('institution_link_requests')
            .select('id')
            .eq('member_id', data.member_id)
            .eq('status', 'pending')
            .maybeSingle();
        if (existingError) {
            console.error('Error checking existing requests:', existingError);
        }
        if (existing) {
            throw new Error('You already have a pending link request. Please wait for it to be reviewed.');
        }
        // 3. Create the link request
        const { data: request, error: requestError } = await database_1.supabaseAdmin
            .from('institution_link_requests')
            .insert({
            member_id: data.member_id,
            institution_id: data.institution_id,
            status: 'pending',
            requested_at: new Date().toISOString()
        })
            .select()
            .single();
        if (requestError) {
            console.error('Error creating link request:', requestError);
            throw new Error('Failed to create link request');
        }
        // 4. Fetch institution details for email
        const { data: institution, error: instError } = await database_1.supabaseAdmin
            .from('institutions')
            .select('name, email')
            .eq('id', data.institution_id)
            .single();
        if (instError) {
            console.error('Error fetching institution:', instError);
            // Don't fail the request if we can't send the email
        }
        // 5. Find institution admins to notify
        const { data: admins, error: adminsError } = await database_1.supabaseAdmin
            .from('members')
            .select('email, first_name, last_name')
            .eq('institution_id', data.institution_id)
            .in('user_type', ['admin', 'super_admin'])
            .limit(10);
        if (adminsError) {
            console.error('Error fetching institution admins:', adminsError);
        }
        const memberFullName = `${member.first_name || ''} ${member.last_name || ''}`.trim() || member.email;
        // 6. Send notification email to institution admin(s)
        if (institution && admins && admins.length > 0) {
            for (const admin of admins) {
                const adminName = `${admin.first_name || ''} ${admin.last_name || ''}`.trim() || 'Admin';
                try {
                    await email_service_1.EmailService.sendEmail({
                        to: admin.email,
                        subject: `New Institution Link Request - ${memberFullName}`,
                        html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">New Institution Link Request</h2>
                <p>Hello ${adminName},</p>
                <p>A member has requested to be linked to your institution:</p>
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <p style="margin: 5px 0;"><strong>Member Name:</strong> ${memberFullName}</p>
                  <p style="margin: 5px 0;"><strong>Member Email:</strong> ${member.email}</p>
                  <p style="margin: 5px 0;"><strong>Institution:</strong> ${institution.name}</p>
                </div>
                <p>Please review this request in your admin dashboard:</p>
                <p style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.FRONTEND_URL || 'http://localhost:5180'}/admin/institution-links"
                     style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    Review Link Requests
                  </a>
                </p>
                <p>Thank you,<br/>
                <strong>English Australia System</strong></p>
              </div>
            `
                    });
                }
                catch (emailError) {
                    console.error(`Failed to send email to admin ${admin.email}:`, emailError);
                    // Continue with other admins even if one fails
                }
            }
        }
        else if (institution?.email) {
            // Fallback: send to institution email if no admins found
            try {
                await email_service_1.EmailService.sendEmail({
                    to: institution.email,
                    subject: `New Institution Link Request - ${memberFullName}`,
                    html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">New Institution Link Request</h2>
              <p>Hello,</p>
              <p>A member has requested to be linked to your institution:</p>
              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Member Name:</strong> ${memberFullName}</p>
                <p style="margin: 5px 0;"><strong>Member Email:</strong> ${member.email}</p>
                <p style="margin: 5px 0;"><strong>Institution:</strong> ${institution.name}</p>
              </div>
              <p>Please contact your system administrator to review this request.</p>
              <p>Thank you,<br/>
              <strong>English Australia System</strong></p>
            </div>
          `
                });
            }
            catch (emailError) {
                console.error('Failed to send email to institution:', emailError);
            }
        }
        return {
            success: true,
            request,
            message: 'Link request submitted successfully. The institution admin will be notified.'
        };
    }
    catch (error) {
        console.error('Error in requestInstitutionLink:', error);
        throw error;
    }
}
/**
 * Institution admin approves a link request
 */
async function approveLinkRequest({ requestId, reviewedBy, notes }) {
    try {
        // 1. Fetch the request with member details
        const { data: request, error: requestError } = await database_1.supabaseAdmin
            .from('institution_link_requests')
            .select(`
        *,
        member:members!institution_link_requests_member_id_fkey(id, first_name, last_name, email, institution_id),
        institution:institutions!institution_link_requests_institution_id_fkey(id, name)
      `)
            .eq('id', requestId)
            .single();
        if (requestError || !request) {
            console.error('Error fetching request:', requestError);
            throw new Error('Link request not found');
        }
        if (request.status !== 'pending') {
            throw new Error('This request has already been reviewed.');
        }
        // 2. Auto-unlink from previous institution if necessary
        let previousInstitutionId = null;
        let previousInstitutionName = null;
        if (request.member.institution_id && request.member.institution_id !== request.institution_id) {
            previousInstitutionId = request.member.institution_id;
            // Fetch previous institution name for notification
            const { data: prevInst } = await database_1.supabaseAdmin
                .from('institutions')
                .select('name')
                .eq('id', previousInstitutionId)
                .single();
            previousInstitutionName = prevInst?.name || 'Unknown Institution';
            console.log(`Auto-unlinking member ${request.member_id} from institution ${previousInstitutionId} (${previousInstitutionName})`);
            // Send notification email to previous institution admins
            try {
                const { data: prevInstAdmins } = await database_1.supabaseAdmin
                    .from('members')
                    .select('email, first_name, last_name')
                    .eq('institution_id', previousInstitutionId)
                    .in('user_type', ['institution_admin', 'admin', 'super_admin']);
                if (prevInstAdmins && prevInstAdmins.length > 0) {
                    const memberFullName = `${request.member.first_name || ''} ${request.member.last_name || ''}`.trim() || request.member.email;
                    for (const admin of prevInstAdmins) {
                        await email_service_1.EmailService.sendEmail({
                            to: admin.email,
                            subject: 'Member Transferred to Another Institution',
                            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #ea580c;">Member Transfer Notification</h2>
                  <p>Hello ${admin.first_name || 'Admin'},</p>
                  <p>This is to inform you that the following member has been transferred from your institution to another:</p>
                  <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                    <p><strong>Member:</strong> ${memberFullName}</p>
                    <p><strong>Email:</strong> ${request.member.email}</p>
                    <p><strong>Previous Institution:</strong> ${previousInstitutionName}</p>
                    <p><strong>New Institution:</strong> ${request.institution.name}</p>
                    <p><strong>Transfer Date:</strong> ${new Date().toLocaleDateString()}</p>
                  </div>
                  <p>This is an automated notification. The member has been approved to link with ${request.institution.name}.</p>
                  <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
                  <p style="color: #6b7280; font-size: 14px;">English Australia Members Platform</p>
                </div>
              `
                        });
                    }
                    console.log(`Transfer notification emails sent to ${prevInstAdmins.length} admin(s) of previous institution`);
                }
            }
            catch (emailError) {
                console.error('Error sending transfer notification emails:', emailError);
                // Don't throw - email failure shouldn't block the transfer
            }
        }
        // 3. Update member with new institution_id (this automatically unlinks from previous)
        const { error: updateError } = await database_1.supabaseAdmin
            .from('members')
            .update({
            institution_id: request.institution_id,
            institution_linked_at: new Date().toISOString(),
            institution_linked_by: reviewedBy,
            updated_at: new Date().toISOString()
        })
            .eq('id', request.member_id);
        if (updateError) {
            console.error('Error updating member:', updateError);
            throw new Error('Failed to link member to institution');
        }
        // 4. Update request as approved
        const { error: requestUpdateError } = await database_1.supabaseAdmin
            .from('institution_link_requests')
            .update({
            status: 'approved',
            reviewed_by: reviewedBy,
            reviewed_at: new Date().toISOString(),
            review_notes: notes,
            updated_at: new Date().toISOString()
        })
            .eq('id', requestId);
        if (requestUpdateError) {
            console.error('Error updating request:', requestUpdateError);
            throw new Error('Failed to update request status');
        }
        // 5. Send confirmation email to member
        const memberFullName = `${request.member.first_name || ''} ${request.member.last_name || ''}`.trim() || request.member.email;
        try {
            await email_service_1.EmailService.sendEmail({
                to: request.member.email,
                subject: 'Institution Link Request Approved',
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #16a34a;">Your Institution Link Request Has Been Approved</h2>
            <p>Hello ${memberFullName},</p>
            <p>Great news! Your request to link with <strong>${request.institution.name}</strong> has been approved.</p>
            <div style="background-color: #f0fdf4; padding: 15px; border-radius: 5px; border-left: 4px solid #16a34a; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Institution:</strong> ${request.institution.name}</p>
              <p style="margin: 5px 0;"><strong>Status:</strong> Approved</p>
              ${notes ? `<p style="margin: 5px 0;"><strong>Notes:</strong> ${notes}</p>` : ''}
            </div>
            <p>You now have full access to your institution's resources and events.</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5180'}/dashboard"
                 style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Go to Dashboard
              </a>
            </p>
            <p>Thank you,<br/>
            <strong>English Australia System</strong></p>
          </div>
        `
            });
        }
        catch (emailError) {
            console.error('Failed to send approval email:', emailError);
            // Don't fail the approval if email fails
        }
        return {
            success: true,
            message: 'Link request approved successfully'
        };
    }
    catch (error) {
        console.error('Error in approveLinkRequest:', error);
        throw error;
    }
}
/**
 * Institution admin rejects a link request
 */
async function rejectLinkRequest({ requestId, reviewedBy, notes }) {
    try {
        // 1. Fetch the request with member details
        const { data: request, error: requestError } = await database_1.supabaseAdmin
            .from('institution_link_requests')
            .select(`
        *,
        member:members!institution_link_requests_member_id_fkey(id, first_name, last_name, email),
        institution:institutions!institution_link_requests_institution_id_fkey(id, name)
      `)
            .eq('id', requestId)
            .single();
        if (requestError || !request) {
            console.error('Error fetching request:', requestError);
            throw new Error('Link request not found');
        }
        if (request.status !== 'pending') {
            throw new Error('This request has already been reviewed.');
        }
        // 2. Update request as rejected
        const { error: updateError } = await database_1.supabaseAdmin
            .from('institution_link_requests')
            .update({
            status: 'rejected',
            reviewed_by: reviewedBy,
            reviewed_at: new Date().toISOString(),
            review_notes: notes,
            updated_at: new Date().toISOString()
        })
            .eq('id', requestId);
        if (updateError) {
            console.error('Error updating request:', updateError);
            throw new Error('Failed to update request status');
        }
        // 3. Send notification email to member
        const memberFullName = `${request.member.first_name || ''} ${request.member.last_name || ''}`.trim() || request.member.email;
        try {
            await email_service_1.EmailService.sendEmail({
                to: request.member.email,
                subject: 'Institution Link Request - Update',
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">Institution Link Request Update</h2>
            <p>Hello ${memberFullName},</p>
            <p>Your request to link with <strong>${request.institution.name}</strong> was not approved at this time.</p>
            ${notes ? `
              <div style="background-color: #fef2f2; padding: 15px; border-radius: 5px; border-left: 4px solid #dc2626; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Reason:</strong></p>
                <p style="margin: 5px 0;">${notes}</p>
              </div>
            ` : ''}
            <p>If you have questions about this decision, please contact the institution directly.</p>
            <p>You may submit a new link request at any time.</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5180'}/institutions/link"
                 style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Request New Link
              </a>
            </p>
            <p>Thank you,<br/>
            <strong>English Australia System</strong></p>
          </div>
        `
            });
        }
        catch (emailError) {
            console.error('Failed to send rejection email:', emailError);
            // Don't fail the rejection if email fails
        }
        return {
            success: true,
            message: 'Link request rejected'
        };
    }
    catch (error) {
        console.error('Error in rejectLinkRequest:', error);
        throw error;
    }
}
/**
 * Get pending link requests for an institution
 */
async function getPendingLinkRequests(institutionId) {
    try {
        const { data, error } = await database_1.supabaseAdmin
            .from('institution_link_requests')
            .select(`
        *,
        member:members!institution_link_requests_member_id_fkey(
          id,
          first_name,
          last_name,
          email,
          phone,
          user_type,
          membership_type,
          created_at
        )
      `)
            .eq('institution_id', institutionId)
            .eq('status', 'pending')
            .order('requested_at', { ascending: false });
        if (error) {
            console.error('Error fetching pending requests:', error);
            throw new Error('Failed to fetch pending requests');
        }
        return data || [];
    }
    catch (error) {
        console.error('Error in getPendingLinkRequests:', error);
        throw error;
    }
}
/**
 * Get all link requests for an institution (pending, approved, rejected)
 */
async function getAllLinkRequests(institutionId) {
    try {
        const { data, error } = await database_1.supabaseAdmin
            .from('institution_link_requests')
            .select(`
        *,
        member:members!institution_link_requests_member_id_fkey(
          id,
          first_name,
          last_name,
          email,
          phone,
          user_type,
          membership_type
        ),
        reviewer:members!institution_link_requests_reviewed_by_fkey(
          id,
          first_name,
          last_name,
          email
        )
      `)
            .eq('institution_id', institutionId)
            .order('requested_at', { ascending: false });
        if (error) {
            console.error('Error fetching all requests:', error);
            throw new Error('Failed to fetch requests');
        }
        return data || [];
    }
    catch (error) {
        console.error('Error in getAllLinkRequests:', error);
        throw error;
    }
}
/**
 * Member unlinks from their current institution
 */
async function unlinkFromInstitution(memberId) {
    try {
        const { error } = await database_1.supabaseAdmin
            .from('members')
            .update({
            institution_id: null,
            institution_linked_at: null,
            institution_linked_by: null,
            updated_at: new Date().toISOString()
        })
            .eq('id', memberId);
        if (error) {
            console.error('Error unlinking member:', error);
            throw new Error('Failed to unlink from institution');
        }
        return {
            success: true,
            message: 'Successfully unlinked from institution'
        };
    }
    catch (error) {
        console.error('Error in unlinkFromInstitution:', error);
        throw error;
    }
}
/**
 * Get member's current link status and history
 */
async function getMemberLinkStatus(memberId) {
    try {
        // Get member data
        const { data: member, error: memberError } = await database_1.supabaseAdmin
            .from('members')
            .select('id, institution_id, institution_linked_at, institution_linked_by')
            .eq('id', memberId)
            .single();
        if (memberError) {
            console.error('Error fetching member:', memberError);
            throw new Error('Member not found');
        }
        // Get institution data separately if member has one
        let institutionData = null;
        if (member.institution_id) {
            const { data: inst, error: instError } = await database_1.supabaseAdmin
                .from('institutions')
                .select('id, name, email')
                .eq('id', member.institution_id)
                .single();
            if (!instError && inst) {
                institutionData = {
                    id: inst.id,
                    name: inst.name,
                    linkedAt: member.institution_linked_at
                };
            }
            else {
                console.error('Error fetching institution:', instError);
            }
        }
        // Get pending request if any
        const { data: pendingRequest } = await database_1.supabaseAdmin
            .from('institution_link_requests')
            .select(`
        *,
        institution:institutions!institution_link_requests_institution_id_fkey(id, name)
      `)
            .eq('member_id', memberId)
            .eq('status', 'pending')
            .maybeSingle();
        // Get request history
        const { data: history } = await database_1.supabaseAdmin
            .from('institution_link_requests')
            .select(`
        *,
        institution:institutions!institution_link_requests_institution_id_fkey(id, name),
        reviewer:members!institution_link_requests_reviewed_by_fkey(first_name, last_name)
      `)
            .eq('member_id', memberId)
            .order('requested_at', { ascending: false })
            .limit(10);
        return {
            currentInstitution: institutionData,
            pendingRequest: pendingRequest ? {
                id: pendingRequest.id,
                institutionName: pendingRequest.institution?.name,
                requestedAt: pendingRequest.requested_at
            } : null,
            history: history || []
        };
    }
    catch (error) {
        console.error('Error in getMemberLinkStatus:', error);
        throw error;
    }
}
/**
 * Get ALL pending link requests (for Super Admins - no institution filter)
 */
async function getAllPendingLinkRequestsForSuperAdmin() {
    try {
        const { data, error } = await database_1.supabaseAdmin
            .from('institution_link_requests')
            .select(`
        *,
        member:members!institution_link_requests_member_id_fkey(
          id,
          first_name,
          last_name,
          email,
          phone,
          user_type,
          membership_type,
          created_at
        ),
        institution:institutions!institution_link_requests_institution_id_fkey(
          id,
          name
        )
      `)
            .eq('status', 'pending')
            .order('requested_at', { ascending: false });
        if (error) {
            console.error('Error fetching all pending requests:', error);
            throw new Error('Failed to fetch pending requests');
        }
        return data || [];
    }
    catch (error) {
        console.error('Error in getAllPendingLinkRequestsForSuperAdmin:', error);
        throw error;
    }
}
/**
 * Get ALL link requests (pending, approved, rejected) for Super Admins
 */
async function getAllLinkRequestsForSuperAdmin() {
    try {
        const { data, error } = await database_1.supabaseAdmin
            .from('institution_link_requests')
            .select(`
        *,
        member:members!institution_link_requests_member_id_fkey(
          id,
          first_name,
          last_name,
          email,
          phone,
          user_type,
          membership_type
        ),
        institution:institutions!institution_link_requests_institution_id_fkey(
          id,
          name
        ),
        reviewer:members!institution_link_requests_reviewed_by_fkey(
          id,
          first_name,
          last_name,
          email
        )
      `)
            .order('requested_at', { ascending: false });
        if (error) {
            console.error('Error fetching all requests for super admin:', error);
            throw new Error('Failed to fetch requests');
        }
        return data || [];
    }
    catch (error) {
        console.error('Error in getAllLinkRequestsForSuperAdmin:', error);
        throw error;
    }
}
//# sourceMappingURL=institutionLink.service.js.map
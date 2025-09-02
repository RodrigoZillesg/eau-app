"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvitationsController = void 0;
const database_1 = require("../config/database");
const constants_1 = require("../config/constants");
const crypto_1 = require("../utils/crypto");
class InvitationsController {
    async createInvitation(req, res) {
        try {
            const { email, firstName, lastName, userType, institutionId } = req.body;
            // Check permissions
            const canInvite = req.user?.userType === constants_1.USER_TYPES.SUPER_ADMIN ||
                (req.user?.userType === constants_1.USER_TYPES.INSTITUTION_ADMIN &&
                    req.user?.institutionId === institutionId);
            if (!canInvite) {
                return res.status(403).json({
                    success: false,
                    error: 'You do not have permission to invite users'
                });
            }
            // Check if user already exists
            const { data: existingMember } = await database_1.supabaseAdmin
                .from('members')
                .select('id')
                .eq('email', email.toLowerCase())
                .single();
            if (existingMember) {
                return res.status(400).json({
                    success: false,
                    error: 'A user with this email already exists'
                });
            }
            // Check for existing pending invitation
            const { data: existingInvite } = await database_1.supabaseAdmin
                .from('staff_invitations')
                .select('id')
                .eq('email', email.toLowerCase())
                .eq('status', 'pending')
                .single();
            if (existingInvite) {
                return res.status(400).json({
                    success: false,
                    error: 'An invitation has already been sent to this email'
                });
            }
            // Create invitation
            const token = (0, crypto_1.generateInviteToken)();
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days
            const { data: invitation, error } = await database_1.supabaseAdmin
                .from('staff_invitations')
                .insert({
                institution_id: institutionId,
                email: email.toLowerCase(),
                first_name: firstName,
                last_name: lastName,
                user_type: userType,
                status: 'pending',
                token,
                expires_at: expiresAt.toISOString(),
                created_by: req.user?.id
            })
                .select()
                .single();
            if (error)
                throw error;
            // TODO: Send invitation email
            // This would integrate with your email service
            const inviteUrl = `${process.env.FRONTEND_URL}/accept-invite?token=${token}`;
            res.status(201).json({
                success: true,
                data: {
                    invitation,
                    inviteUrl
                },
                message: 'Invitation created successfully'
            });
        }
        catch (error) {
            console.error('Create invitation error:', error);
            res.status(500).json({
                success: false,
                error: constants_1.ERROR_MESSAGES.SERVER_ERROR
            });
        }
    }
    async listInvitations(req, res) {
        try {
            const { institutionId } = req.params;
            const { status = 'pending' } = req.query;
            // Check permissions
            if (req.user?.userType !== constants_1.USER_TYPES.SUPER_ADMIN &&
                req.user?.institutionId !== institutionId) {
                return res.status(403).json({
                    success: false,
                    error: 'You can only view invitations for your institution'
                });
            }
            const { data: invitations, error } = await database_1.supabaseAdmin
                .from('staff_invitations')
                .select('*')
                .eq('institution_id', institutionId)
                .eq('status', status)
                .order('created_at', { ascending: false });
            if (error)
                throw error;
            res.json({
                success: true,
                data: invitations
            });
        }
        catch (error) {
            console.error('List invitations error:', error);
            res.status(500).json({
                success: false,
                error: constants_1.ERROR_MESSAGES.SERVER_ERROR
            });
        }
    }
    async acceptInvitation(req, res) {
        try {
            const { token, password, fullName } = req.body;
            // Find invitation
            const { data: invitation, error: inviteError } = await database_1.supabaseAdmin
                .from('staff_invitations')
                .select('*')
                .eq('token', token)
                .eq('status', 'pending')
                .single();
            if (inviteError || !invitation) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid or expired invitation'
                });
            }
            // Check if invitation has expired
            if (new Date(invitation.expires_at) < new Date()) {
                await database_1.supabaseAdmin
                    .from('staff_invitations')
                    .update({ status: 'expired' })
                    .eq('id', invitation.id);
                return res.status(400).json({
                    success: false,
                    error: 'This invitation has expired'
                });
            }
            // Create user in Supabase Auth
            const { data: authUser, error: authError } = await database_1.supabaseAdmin.auth.admin.createUser({
                email: invitation.email,
                password,
                email_confirm: true,
                user_metadata: {
                    full_name: fullName || `${invitation.first_name} ${invitation.last_name}`
                }
            });
            if (authError) {
                console.error('Auth creation error:', authError);
                return res.status(400).json({
                    success: false,
                    error: 'Failed to create user account'
                });
            }
            // Create member record
            const { data: member, error: memberError } = await database_1.supabaseAdmin
                .from('members')
                .insert({
                id: authUser.user.id,
                email: invitation.email,
                full_name: fullName || `${invitation.first_name} ${invitation.last_name}`,
                first_name: invitation.first_name,
                last_name: invitation.last_name,
                institution_id: invitation.institution_id,
                user_type: invitation.user_type,
                membership_status: 'active',
                created_at: new Date().toISOString()
            })
                .select()
                .single();
            if (memberError) {
                // Rollback auth user creation if member creation fails
                await database_1.supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
                throw memberError;
            }
            // Update invitation status
            await database_1.supabaseAdmin
                .from('staff_invitations')
                .update({
                status: 'accepted',
                accepted_at: new Date().toISOString()
            })
                .eq('id', invitation.id);
            res.json({
                success: true,
                data: {
                    member,
                    message: 'Invitation accepted successfully. You can now log in.'
                }
            });
        }
        catch (error) {
            console.error('Accept invitation error:', error);
            res.status(500).json({
                success: false,
                error: constants_1.ERROR_MESSAGES.SERVER_ERROR
            });
        }
    }
    async revokeInvitation(req, res) {
        try {
            const { id } = req.params;
            // Get invitation details
            const { data: invitation } = await database_1.supabaseAdmin
                .from('staff_invitations')
                .select('institution_id')
                .eq('id', id)
                .single();
            if (!invitation) {
                return res.status(404).json({
                    success: false,
                    error: 'Invitation not found'
                });
            }
            // Check permissions
            const canRevoke = req.user?.userType === constants_1.USER_TYPES.SUPER_ADMIN ||
                (req.user?.userType === constants_1.USER_TYPES.INSTITUTION_ADMIN &&
                    req.user?.institutionId === invitation.institution_id);
            if (!canRevoke) {
                return res.status(403).json({
                    success: false,
                    error: 'You do not have permission to revoke this invitation'
                });
            }
            const { error } = await database_1.supabaseAdmin
                .from('staff_invitations')
                .update({ status: 'cancelled' })
                .eq('id', id)
                .eq('status', 'pending');
            if (error)
                throw error;
            res.json({
                success: true,
                message: 'Invitation revoked successfully'
            });
        }
        catch (error) {
            console.error('Revoke invitation error:', error);
            res.status(500).json({
                success: false,
                error: constants_1.ERROR_MESSAGES.SERVER_ERROR
            });
        }
    }
    async resendInvitation(req, res) {
        try {
            const { id } = req.params;
            // Get invitation details
            const { data: invitation } = await database_1.supabaseAdmin
                .from('staff_invitations')
                .select('*')
                .eq('id', id)
                .eq('status', 'pending')
                .single();
            if (!invitation) {
                return res.status(404).json({
                    success: false,
                    error: 'Invitation not found or already accepted'
                });
            }
            // Check permissions
            const canResend = req.user?.userType === constants_1.USER_TYPES.SUPER_ADMIN ||
                (req.user?.userType === constants_1.USER_TYPES.INSTITUTION_ADMIN &&
                    req.user?.institutionId === invitation.institution_id);
            if (!canResend) {
                return res.status(403).json({
                    success: false,
                    error: 'You do not have permission to resend this invitation'
                });
            }
            // Generate new token and extend expiry
            const newToken = (0, crypto_1.generateInviteToken)();
            const newExpiresAt = new Date();
            newExpiresAt.setDate(newExpiresAt.getDate() + 7);
            const { error } = await database_1.supabaseAdmin
                .from('staff_invitations')
                .update({
                token: newToken,
                expires_at: newExpiresAt.toISOString()
            })
                .eq('id', id);
            if (error)
                throw error;
            // TODO: Resend invitation email
            const inviteUrl = `${process.env.FRONTEND_URL}/accept-invite?token=${newToken}`;
            res.json({
                success: true,
                data: { inviteUrl },
                message: 'Invitation resent successfully'
            });
        }
        catch (error) {
            console.error('Resend invitation error:', error);
            res.status(500).json({
                success: false,
                error: constants_1.ERROR_MESSAGES.SERVER_ERROR
            });
        }
    }
}
exports.InvitationsController = InvitationsController;
//# sourceMappingURL=invitations.controller.js.map
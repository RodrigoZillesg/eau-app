"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const database_1 = require("../config/database");
const jwt_1 = require("../utils/jwt");
const constants_1 = require("../config/constants");
class AuthController {
    async login(req, res) {
        try {
            const { email, password } = req.body;
            // Find user by email
            const { data: member, error } = await database_1.supabaseAdmin
                .from('members')
                .select('*')
                .eq('email', email.toLowerCase())
                .single();
            if (error || !member) {
                return res.status(401).json({
                    success: false,
                    error: constants_1.ERROR_MESSAGES.INVALID_CREDENTIALS
                });
            }
            // Verify password (assuming password is stored in a separate auth table)
            const { data: authData } = await database_1.supabaseAdmin
                .from('auth.users')
                .select('encrypted_password')
                .eq('email', email.toLowerCase())
                .single();
            if (!authData) {
                return res.status(401).json({
                    success: false,
                    error: constants_1.ERROR_MESSAGES.INVALID_CREDENTIALS
                });
            }
            // Get user roles
            const { data: roles } = await database_1.supabaseAdmin
                .from('member_roles')
                .select('roles(name)')
                .eq('member_id', member.id);
            const tokenPayload = {
                userId: member.id,
                email: member.email,
                institutionId: member.institution_id,
                userType: member.user_type || 'staff',
                roles: roles?.map((r) => r.roles?.name).filter(Boolean) || []
            };
            const tokens = (0, jwt_1.generateTokenPair)(tokenPayload);
            // Update last login
            await database_1.supabaseAdmin
                .from('members')
                .update({ last_login: new Date().toISOString() })
                .eq('id', member.id);
            res.json({
                success: true,
                data: {
                    user: {
                        id: member.id,
                        email: member.email,
                        fullName: member.full_name,
                        institutionId: member.institution_id,
                        userType: member.user_type,
                        roles: tokenPayload.roles
                    },
                    tokens
                }
            });
        }
        catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                error: constants_1.ERROR_MESSAGES.SERVER_ERROR
            });
        }
    }
    async loginWithSupabase(req, res) {
        try {
            const { email, password } = req.body;
            // Use Supabase Auth for authentication
            const { data: authData, error: authError } = await database_1.supabaseAdmin.auth.signInWithPassword({
                email,
                password
            });
            if (authError || !authData.user) {
                return res.status(401).json({
                    success: false,
                    error: constants_1.ERROR_MESSAGES.INVALID_CREDENTIALS
                });
            }
            // Get member details by user_id
            let { data: member } = await database_1.supabaseAdmin
                .from('members')
                .select('*')
                .eq('user_id', authData.user.id)
                .single();
            if (!member) {
                // Create member if doesn't exist
                const { data: newMember, error: createError } = await database_1.supabaseAdmin
                    .from('members')
                    .insert({
                    user_id: authData.user.id,
                    email: authData.user.email,
                    first_name: authData.user.user_metadata?.first_name || authData.user.email?.split('@')[0],
                    last_name: authData.user.user_metadata?.last_name || '',
                    membership_status: 'active',
                    user_type: 'staff', // Default user type
                    created_at: new Date().toISOString()
                })
                    .select()
                    .single();
                if (createError || !newMember) {
                    console.error('Failed to create member:', createError);
                    throw new Error('Failed to create member record');
                }
                member = newMember;
            }
            // Get user roles
            const { data: roles } = await database_1.supabaseAdmin
                .from('member_roles')
                .select('roles(name)')
                .eq('member_id', member?.id);
            const tokenPayload = {
                userId: member?.id || authData.user.id,
                email: authData.user.email,
                institutionId: member?.institution_id,
                userType: member?.user_type || 'staff',
                roles: roles?.map((r) => r.roles?.name).filter(Boolean) || []
            };
            const tokens = (0, jwt_1.generateTokenPair)(tokenPayload);
            res.json({
                success: true,
                data: {
                    user: {
                        id: member?.id || authData.user.id,
                        email: authData.user.email,
                        fullName: `${member?.first_name || ''} ${member?.last_name || ''}`.trim() || authData.user.user_metadata?.full_name,
                        institutionId: member?.institution_id,
                        userType: member?.user_type,
                        roles: tokenPayload.roles
                    },
                    tokens,
                    supabaseSession: authData.session
                }
            });
        }
        catch (error) {
            console.error('Supabase login error:', error);
            res.status(500).json({
                success: false,
                error: constants_1.ERROR_MESSAGES.SERVER_ERROR
            });
        }
    }
    async refreshToken(req, res) {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                return res.status(400).json({
                    success: false,
                    error: 'Refresh token is required'
                });
            }
            const decoded = (0, jwt_1.verifyRefreshToken)(refreshToken);
            // Verify user still exists and is active
            const { data: member } = await database_1.supabaseAdmin
                .from('members')
                .select('*')
                .eq('id', decoded.userId)
                .single();
            if (!member) {
                return res.status(401).json({
                    success: false,
                    error: constants_1.ERROR_MESSAGES.USER_NOT_FOUND
                });
            }
            // Get updated roles
            const { data: roles } = await database_1.supabaseAdmin
                .from('member_roles')
                .select('roles(name)')
                .eq('member_id', member.id);
            const tokenPayload = {
                userId: member.id,
                email: member.email,
                institutionId: member.institution_id,
                userType: member.user_type || 'staff',
                roles: roles?.map((r) => r.roles?.name).filter(Boolean) || []
            };
            const tokens = (0, jwt_1.generateTokenPair)(tokenPayload);
            res.json({
                success: true,
                data: { tokens }
            });
        }
        catch (error) {
            console.error('Refresh token error:', error);
            res.status(401).json({
                success: false,
                error: constants_1.ERROR_MESSAGES.INVALID_TOKEN
            });
        }
    }
    async logout(req, res) {
        try {
            // In a production app, you might want to:
            // 1. Invalidate the refresh token in a database
            // 2. Add the access token to a blacklist
            // 3. Clear any server-side sessions
            res.json({
                success: true,
                message: 'Logged out successfully'
            });
        }
        catch (error) {
            console.error('Logout error:', error);
            res.status(500).json({
                success: false,
                error: constants_1.ERROR_MESSAGES.SERVER_ERROR
            });
        }
    }
    async me(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: constants_1.ERROR_MESSAGES.UNAUTHORIZED
                });
            }
            // Get full member details
            const { data: member, error: memberError } = await database_1.supabaseAdmin
                .from('members')
                .select(`
          *,
          institutions (
            id,
            name,
            membership_type,
            membership_status
          )
        `)
                .eq('id', req.user.id)
                .single();
            console.log('📊 /auth/me query result:', { member, memberError });
            // Set no-cache headers to prevent browser caching stale data
            res.set({
                'Cache-Control': 'no-store, no-cache, must-revalidate, private',
                'Pragma': 'no-cache',
                'Expires': '0'
            });
            res.json({
                success: true,
                data: member
            });
        }
        catch (error) {
            console.error('Get current user error:', error);
            res.status(500).json({
                success: false,
                error: constants_1.ERROR_MESSAGES.SERVER_ERROR
            });
        }
    }
    async impersonate(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: constants_1.ERROR_MESSAGES.UNAUTHORIZED
                });
            }
            // Check if user is admin or super_admin
            const { data: currentMember } = await database_1.supabaseAdmin
                .from('members')
                .select('user_type')
                .eq('id', req.user.id)
                .single();
            if (!currentMember || !['admin', 'super_admin'].includes(currentMember.user_type)) {
                return res.status(403).json({
                    success: false,
                    error: 'Only admins can impersonate users'
                });
            }
            const { email } = req.body;
            // Find member to impersonate
            const { data: member, error: memberError } = await database_1.supabaseAdmin
                .from('members')
                .select('*')
                .eq('email', email.toLowerCase())
                .single();
            if (memberError || !member) {
                return res.status(404).json({
                    success: false,
                    error: 'Member not found'
                });
            }
            if (!member.user_id) {
                return res.status(400).json({
                    success: false,
                    error: 'Member does not have authentication credentials'
                });
            }
            // Use Supabase Admin API to generate a session for the user
            const { data: sessionData, error: sessionError } = await database_1.supabaseAdmin.auth.admin.generateLink({
                type: 'magiclink',
                email: member.email,
            });
            if (sessionError || !sessionData) {
                console.error('Failed to generate session:', sessionError);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to generate impersonation session'
                });
            }
            // Extract the token from the generated link
            const url = new URL(sessionData.properties.action_link);
            const token = url.searchParams.get('token');
            const type = url.searchParams.get('type');
            if (!token) {
                return res.status(500).json({
                    success: false,
                    error: 'Failed to extract authentication token'
                });
            }
            res.json({
                success: true,
                data: {
                    member: {
                        id: member.id,
                        email: member.email,
                        fullName: `${member.first_name || ''} ${member.last_name || ''}`.trim(),
                        userType: member.user_type
                    },
                    token,
                    type: type || 'magiclink'
                }
            });
        }
        catch (error) {
            console.error('Impersonation error:', error);
            res.status(500).json({
                success: false,
                error: error.message || constants_1.ERROR_MESSAGES.SERVER_ERROR
            });
        }
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=auth.controller.js.map
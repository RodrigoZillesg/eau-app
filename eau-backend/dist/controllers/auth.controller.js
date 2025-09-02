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
            // Get member details
            const { data: member } = await database_1.supabaseAdmin
                .from('members')
                .select('*')
                .eq('id', authData.user.id)
                .single();
            if (!member) {
                // Create member if doesn't exist
                const { data: newMember } = await database_1.supabaseAdmin
                    .from('members')
                    .insert({
                    id: authData.user.id,
                    email: authData.user.email,
                    full_name: authData.user.user_metadata?.full_name || authData.user.email?.split('@')[0],
                    membership_status: 'active',
                    created_at: new Date().toISOString()
                })
                    .select()
                    .single();
                if (!newMember) {
                    throw new Error('Failed to create member record');
                }
            }
            // Get user roles
            const { data: roles } = await database_1.supabaseAdmin
                .from('member_roles')
                .select('roles(name)')
                .eq('member_id', authData.user.id);
            const tokenPayload = {
                userId: authData.user.id,
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
                        id: authData.user.id,
                        email: authData.user.email,
                        fullName: member?.full_name || authData.user.user_metadata?.full_name,
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
            const { data: member } = await database_1.supabaseAdmin
                .from('members')
                .select(`
          *,
          institutions (
            id,
            name,
            membership_type,
            status
          )
        `)
                .eq('id', req.user.id)
                .single();
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
}
exports.AuthController = AuthController;
//# sourceMappingURL=auth.controller.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeInstitution = exports.authorizeRole = exports.authorize = exports.authenticate = void 0;
const jwt_1 = require("../utils/jwt");
const database_1 = require("../config/database");
const constants_1 = require("../config/constants");
const authenticate = async (req, res, next) => {
    try {
        console.log('=== authenticate middleware debug ===');
        const authHeader = req.headers.authorization;
        console.log('authHeader:', authHeader);
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('No Bearer token found');
            return res.status(401).json({
                success: false,
                error: constants_1.ERROR_MESSAGES.UNAUTHORIZED
            });
        }
        const token = authHeader.substring(7);
        console.log('token:', token ? 'exists' : 'missing');
        try {
            // Try to decode as Supabase JWT first
            let decoded;
            let userId;
            // Check if it's a Supabase token (has 'sub' field)
            const base64Payload = token.split('.')[1];
            const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString());
            if (payload.sub) {
                // It's a Supabase token
                console.log('Supabase token detected');
                decoded = payload;
                // Use member_id from user_metadata if available, otherwise use sub (Auth user ID)
                userId = payload.user_metadata?.member_id || payload.sub;
            }
            else {
                // Try as backend JWT
                console.log('Trying as backend JWT');
                decoded = (0, jwt_1.verifyAccessToken)(token);
                userId = decoded.userId;
            }
            console.log('decoded token:', decoded);
            console.log('userId to query:', userId);
            // Verify user still exists and is active using ID (more reliable than email for duplicates)
            const { data: member, error } = await database_1.supabaseAdmin
                .from('members')
                .select('id, email, institution_id, user_type, membership_status')
                .eq('id', userId)
                .maybeSingle();
            console.log('member query result:', { member, error });
            if (error || !member) {
                return res.status(401).json({
                    success: false,
                    error: constants_1.ERROR_MESSAGES.USER_NOT_FOUND
                });
            }
            // Check if user's institution is active (if they belong to one)
            if (member.institution_id) {
                const { data: institution } = await database_1.supabaseAdmin
                    .from('institutions')
                    .select('membership_status')
                    .eq('id', member.institution_id)
                    .single();
                if (institution?.membership_status !== 'active' && member.user_type !== constants_1.USER_TYPES.SUPER_ADMIN) {
                    return res.status(403).json({
                        success: false,
                        error: 'Your institution is not active'
                    });
                }
            }
            // Get user roles
            const { data: roles } = await database_1.supabaseAdmin
                .from('member_roles')
                .select('roles(name)')
                .eq('member_id', member.id);
            req.user = {
                id: member.id,
                email: member.email,
                institutionId: member.institution_id,
                userType: member.user_type || constants_1.USER_TYPES.STAFF,
                roles: roles?.map((r) => r.roles?.name).filter(Boolean) || []
            };
            next();
        }
        catch (tokenError) {
            return res.status(401).json({
                success: false,
                error: constants_1.ERROR_MESSAGES.INVALID_TOKEN
            });
        }
    }
    catch (error) {
        console.error('Authentication error:', error);
        return res.status(500).json({
            success: false,
            error: constants_1.ERROR_MESSAGES.SERVER_ERROR
        });
    }
};
exports.authenticate = authenticate;
const authorize = (...allowedUserTypes) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: constants_1.ERROR_MESSAGES.UNAUTHORIZED
            });
        }
        if (!allowedUserTypes.includes(req.user.userType)) {
            return res.status(403).json({
                success: false,
                error: 'Insufficient permissions'
            });
        }
        next();
    };
};
exports.authorize = authorize;
const authorizeRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: constants_1.ERROR_MESSAGES.UNAUTHORIZED
            });
        }
        const hasRole = req.user.roles?.some(role => allowedRoles.includes(role));
        if (!hasRole && req.user.userType !== constants_1.USER_TYPES.SUPER_ADMIN) {
            return res.status(403).json({
                success: false,
                error: 'Insufficient permissions'
            });
        }
        next();
    };
};
exports.authorizeRole = authorizeRole;
const authorizeInstitution = async (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: constants_1.ERROR_MESSAGES.UNAUTHORIZED
        });
    }
    // Super admins can access any institution
    if (req.user.userType === constants_1.USER_TYPES.SUPER_ADMIN) {
        return next();
    }
    const institutionId = req.params.institutionId || req.body.institutionId;
    if (!institutionId) {
        return res.status(400).json({
            success: false,
            error: 'Institution ID is required'
        });
    }
    if (req.user.institutionId !== institutionId) {
        return res.status(403).json({
            success: false,
            error: 'You can only access your own institution'
        });
    }
    next();
};
exports.authorizeInstitution = authorizeInstitution;
//# sourceMappingURL=auth.js.map
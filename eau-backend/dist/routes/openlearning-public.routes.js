"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const router = (0, express_1.Router)();
/**
 * @route   POST /api/v1/openlearning/sso/public
 * @desc    Generate SSO URL for OpenLearning (public endpoint for login page)
 * @access  Public
 */
router.post('/sso/public', async (req, res) => {
    try {
        const { classId, returnUrl, email } = req.body;
        // For public SSO, we need to handle authentication differently
        // The user will authenticate through OpenLearning
        // If email is provided, try to find the member
        let memberId = null;
        if (email) {
            const { data: member } = await database_1.supabaseAdmin
                .from('members')
                .select('id')
                .eq('email', email)
                .single();
            if (member) {
                memberId = member.id;
            }
        }
        // For now, return a mock response indicating that OpenLearning integration needs proper credentials
        // In production, this would redirect to OpenLearning's OAuth flow
        res.json({
            success: true,
            message: 'OpenLearning SSO would redirect here',
            launchData: {
                url: `https://www.openlearning.com/auth/oauth/authorize`,
                method: 'GET',
                params: {
                    client_id: process.env.OPENLEARNING_CLIENT_ID,
                    redirect_uri: returnUrl || 'http://localhost:5180/auth/callback',
                    response_type: 'code',
                    scope: 'read write',
                    state: Buffer.from(JSON.stringify({
                        classId,
                        memberId,
                        timestamp: Date.now()
                    })).toString('base64')
                }
            }
        });
    }
    catch (error) {
        console.error('Error in public SSO endpoint:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
/**
 * @route   GET /api/v1/openlearning/auth/callback
 * @desc    Handle OAuth callback from OpenLearning
 * @access  Public
 */
router.get('/auth/callback', async (req, res) => {
    try {
        const { code, state } = req.query;
        if (!code || !state) {
            return res.status(400).json({
                success: false,
                error: 'Missing authorization code or state'
            });
        }
        // Decode state to get original request info
        const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
        // Here you would exchange the code for an access token with OpenLearning
        // For now, we'll return a success message
        res.json({
            success: true,
            message: 'OAuth callback received',
            code,
            stateData
        });
    }
    catch (error) {
        console.error('Error in OAuth callback:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=openlearning-public.routes.js.map
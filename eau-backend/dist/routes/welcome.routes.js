"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabaseAuth_1 = require("../middleware/supabaseAuth");
const welcomeEmail_service_1 = require("../services/welcomeEmail.service");
const database_1 = require("../config/database");
const router = (0, express_1.Router)();
// Apply authentication middleware
router.use(supabaseAuth_1.authenticateSupabase);
// Send welcome email to a single member
router.post('/send', async (req, res) => {
    try {
        const { userId, email, name, institutionId, temporaryPassword } = req.body;
        if (!userId || !email) {
            return res.status(400).json({
                success: false,
                error: 'User ID and email are required'
            });
        }
        const result = await welcomeEmail_service_1.WelcomeEmailService.sendWelcomeEmail(userId, email, name || email.split('@')[0], institutionId, temporaryPassword);
        if (result) {
            res.json({
                success: true,
                message: 'Welcome email sent successfully'
            });
        }
        else {
            res.status(500).json({
                success: false,
                error: 'Failed to send welcome email'
            });
        }
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// Send welcome emails in batch
router.post('/send-batch', async (req, res) => {
    try {
        const { members } = req.body;
        if (!members || !Array.isArray(members) || members.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Members array is required'
            });
        }
        const results = await welcomeEmail_service_1.WelcomeEmailService.sendWelcomeEmailBatch(members);
        res.json({
            success: true,
            results
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// Resend welcome email
router.post('/resend/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await welcomeEmail_service_1.WelcomeEmailService.resendWelcomeEmail(userId);
        if (result) {
            res.json({
                success: true,
                message: 'Welcome email resent successfully'
            });
        }
        else {
            res.status(500).json({
                success: false,
                error: 'Failed to resend welcome email'
            });
        }
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// Get members who haven't received welcome email
router.get('/pending', async (req, res) => {
    try {
        // Get members created in last 30 days who haven't received welcome email
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const { data: members, error } = await database_1.supabaseAdmin
            .from('members')
            .select(`
        id,
        email,
        full_name,
        institution_id,
        created_at,
        institutions (name)
      `)
            .gte('created_at', thirtyDaysAgo.toISOString())
            .is('welcome_email_sent', null)
            .order('created_at', { ascending: false });
        if (error) {
            throw error;
        }
        res.json({
            success: true,
            members: members || []
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
exports.default = router;
//# sourceMappingURL=welcome.routes.js.map
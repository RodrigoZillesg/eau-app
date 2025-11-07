"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const openlearningSSO_service_1 = require("../services/openlearningSSO.service");
const database_1 = require("../config/database");
const router = (0, express_1.Router)();
/**
 * Generate SSO link for current user
 */
router.post('/generate-sso', auth_1.authenticate, async (req, res) => {
    try {
        const { returnUrl } = req.body;
        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        // Get user's full name from database
        const { data: member } = await database_1.supabaseAdmin
            .from('members')
            .select('full_name, first_name, last_name')
            .eq('id', user.id)
            .single();
        const fullName = member?.full_name || `${member?.first_name || ''} ${member?.last_name || ''}`.trim() || user.email;
        // Generate SSO link
        const ssoData = await openlearningSSO_service_1.openLearningSSOService.generateSSOLink({
            userId: user.id,
            email: user.email,
            fullName: fullName,
            returnUrl: returnUrl || 'http://localhost:5180/dashboard'
        });
        res.json({
            success: true,
            sso: ssoData
        });
    }
    catch (error) {
        console.error('SSO generation error:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * Get user's course completions from OpenLearning
 */
router.get('/course-completions', auth_1.authenticate, async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        // Get member's OpenLearning ID from database
        const { data: member } = await database_1.supabaseAdmin
            .from('members')
            .select('openlearning_user_id')
            .eq('id', user.id)
            .single();
        if (!member?.openlearning_user_id) {
            return res.json({
                success: true,
                completions: [],
                message: 'User not provisioned in OpenLearning'
            });
        }
        // Get completions
        const completions = await openlearningSSO_service_1.openLearningSSOService.getUserCourseCompletions(member.openlearning_user_id);
        res.json({
            success: true,
            completions
        });
    }
    catch (error) {
        console.error('Failed to get course completions:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * Import certificates for current user
 */
router.post('/import-certificates', auth_1.authenticate, async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        // Get member's OpenLearning ID from database
        const { data: member } = await database_1.supabaseAdmin
            .from('members')
            .select('openlearning_user_id')
            .eq('id', user.id)
            .single();
        if (!member?.openlearning_user_id) {
            return res.json({
                success: false,
                error: 'User not provisioned in OpenLearning',
                imported: 0
            });
        }
        // Import certificates as CPD activities
        const result = await openlearningSSO_service_1.openLearningSSOService.importCertificatesAsCPD(user.id, member.openlearning_user_id);
        res.json(result);
    }
    catch (error) {
        console.error('Failed to import certificates:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * Sync all OpenLearning users (admin only)
 */
router.post('/sync-users', auth_1.authenticate, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user?.userType !== 'super_admin' && req.user?.userType !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        // Start sync in background
        openlearningSSO_service_1.openLearningSSOService.syncAllUsers()
            .then(count => {
            console.log(`✅ Background sync completed: ${count} users`);
        })
            .catch(error => {
            console.error('❌ Background sync failed:', error);
        });
        res.json({
            success: true,
            message: 'Sync started in background'
        });
    }
    catch (error) {
        console.error('Sync error:', error);
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=openlearningSSO.routes.js.map
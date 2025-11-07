"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const openlearningCorrect_service_1 = require("../services/openlearningCorrect.service");
const database_1 = require("../config/database");
const router = (0, express_1.Router)();
/**
 * @route   POST /api/v1/openlearning/sso/launch
 * @desc    Generate SSO launch data for OpenLearning (auto-provisions if needed)
 * @access  Private (Authenticated users)
 */
router.post('/sso/launch', auth_1.authenticate, async (req, res) => {
    try {
        const { memberId, classId } = req.body;
        if (!memberId) {
            return res.status(400).json({
                success: false,
                error: 'memberId is required'
            });
        }
        // Get member data
        const { data: member, error: memberError } = await database_1.supabaseAdmin
            .from('members')
            .select('id, first_name, last_name, email, openlearning_user_id')
            .eq('id', memberId)
            .single();
        if (memberError || !member) {
            return res.status(404).json({
                success: false,
                error: 'Member not found'
            });
        }
        // Auto-provision if not already provisioned
        let openLearningUserId = member.openlearning_user_id;
        if (!openLearningUserId) {
            console.log('Member not provisioned, auto-provisioning...');
            const provisionResult = await openlearningCorrect_service_1.openLearningCorrectService.provisionUser(memberId, {
                fullName: `${member.first_name} ${member.last_name}`,
                email: member.email,
                externalId: memberId
            });
            if (!provisionResult.success) {
                return res.status(400).json({
                    success: false,
                    error: provisionResult.error || 'Failed to provision user in OpenLearning'
                });
            }
            openLearningUserId = provisionResult.openLearningUserId || '';
        }
        // Generate SSO launch data
        const ssoResult = await openlearningCorrect_service_1.openLearningCorrectService.generateSSOLaunchUrl(memberId, openLearningUserId, classId);
        if (ssoResult.success) {
            res.json({
                success: true,
                launchData: ssoResult.launchData,
                launchUrl: ssoResult.launchUrl
            });
        }
        else {
            res.status(400).json({
                success: false,
                error: ssoResult.error || 'Failed to generate SSO launch data'
            });
        }
    }
    catch (error) {
        console.error('Error in SSO launch endpoint:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=openlearning.routes.js.map
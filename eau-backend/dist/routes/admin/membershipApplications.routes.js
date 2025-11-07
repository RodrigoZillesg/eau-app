"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const membershipApplication_service_1 = require("../../services/membershipApplication.service");
const auth_1 = require("../../middleware/auth");
const constants_1 = require("../../config/constants");
const router = (0, express_1.Router)();
// Apply authentication middleware to all routes
router.use(auth_1.authenticate);
// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
    console.log('=== requireAdmin middleware debug ===');
    console.log('req.user:', req.user);
    console.log('userType:', req.user?.userType);
    console.log('email:', req.user?.email);
    if (!req.user || (req.user.userType !== constants_1.USER_TYPES.SUPER_ADMIN && req.user.userType !== 'Admin')) {
        console.log('Access denied - not admin');
        return res.status(403).json({
            success: false,
            error: 'Admin access required'
        });
    }
    console.log('Access granted - user is admin');
    next();
};
/**
 * GET /api/v1/admin/membership-applications
 * Get all membership applications
 */
router.get('/', requireAdmin, async (req, res) => {
    try {
        const applications = await membershipApplication_service_1.MembershipApplicationService.getAllApplications();
        res.json({
            success: true,
            data: applications
        });
    }
    catch (error) {
        console.error('Error fetching applications:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch applications'
        });
    }
});
/**
 * POST /api/v1/admin/membership-applications/:id/approve
 * Approve a membership application
 */
router.post('/:id/approve', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { review_notes } = req.body;
        const reviewedBy = req.user.id;
        const result = await membershipApplication_service_1.MembershipApplicationService.approveApplication(id, reviewedBy, review_notes);
        res.json({
            success: true,
            data: result,
            message: 'Application approved successfully'
        });
    }
    catch (error) {
        console.error('Error approving application:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to approve application'
        });
    }
});
/**
 * POST /api/v1/admin/membership-applications/:id/reject
 * Reject a membership application
 */
router.post('/:id/reject', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { review_notes } = req.body;
        const reviewedBy = req.user.id;
        await membershipApplication_service_1.MembershipApplicationService.rejectApplication(id, reviewedBy, review_notes);
        res.json({
            success: true,
            message: 'Application rejected successfully'
        });
    }
    catch (error) {
        console.error('Error rejecting application:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to reject application'
        });
    }
});
exports.default = router;
//# sourceMappingURL=membershipApplications.routes.js.map
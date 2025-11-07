"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const membershipApplication_service_1 = require("../services/membershipApplication.service");
const auth_1 = require("../middleware/auth");
const logger_1 = require("../utils/logger");
const express_validator_1 = require("express-validator");
const router = express_1.default.Router();
// Apply authentication middleware to all routes
router.use(auth_1.authenticateSupabase);
// Middleware for validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }
    next();
};
/**
 * GET /api/v1/applications
 * Get all membership applications (admin only)
 */
router.get('/', async (req, res) => {
    try {
        // Check if user is admin - temporarily skip for testing
        // TODO: Implement proper role checking with member_roles table
        if (!req.user) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Authentication required.'
            });
        }
        (0, logger_1.logInfo)('Fetching all membership applications', { userId: req.user.id });
        const applications = await membershipApplication_service_1.MembershipApplicationService.getAllApplications();
        res.json({
            success: true,
            data: applications
        });
    }
    catch (error) {
        (0, logger_1.logError)(error, req, res);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch applications'
        });
    }
});
/**
 * GET /api/v1/applications/:id
 * Get specific application details (admin only)
 */
router.get('/:id', async (req, res) => {
    try {
        // Check if user is admin - temporarily skip for testing
        // TODO: Implement proper role checking with member_roles table
        if (!req.user) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Authentication required.'
            });
        }
        const { id } = req.params;
        (0, logger_1.logInfo)('Fetching application details', { applicationId: id, userId: req.user.id });
        const application = await membershipApplication_service_1.MembershipApplicationService.getApplicationById(id);
        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }
        res.json({
            success: true,
            data: application
        });
    }
    catch (error) {
        (0, logger_1.logError)(error, req, res);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch application'
        });
    }
});
/**
 * PUT /api/v1/applications/:id/status
 * Update application status (admin only)
 */
router.put('/:id/status', [
    (0, express_validator_1.body)('status')
        .isIn(['under_review', 'approved', 'rejected'])
        .withMessage('Status must be: under_review, approved, or rejected'),
    (0, express_validator_1.body)('reviewNotes')
        .optional()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('Review notes must be under 2000 characters')
], handleValidationErrors, async (req, res) => {
    try {
        // Check if user is admin - temporarily skip for testing
        // TODO: Implement proper role checking with member_roles table
        if (!req.user) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Authentication required.'
            });
        }
        const { id } = req.params;
        const { status, reviewNotes } = req.body;
        (0, logger_1.logInfo)('Updating application status', {
            applicationId: id,
            status,
            reviewedBy: req.user.id
        });
        if (status === 'approved') {
            // Special handling for approval - creates institution and member
            const result = await membershipApplication_service_1.MembershipApplicationService.approveApplication(id, req.user.id, reviewNotes);
            res.json({
                success: true,
                message: 'Application approved and institution created',
                data: {
                    status: 'approved',
                    institutionId: result.institutionId,
                    memberId: result.memberId
                }
            });
        }
        else {
            // Regular status update
            await membershipApplication_service_1.MembershipApplicationService.updateApplicationStatus(id, status, req.user.id, reviewNotes);
            res.json({
                success: true,
                message: 'Application status updated successfully',
                data: { status }
            });
        }
    }
    catch (error) {
        (0, logger_1.logError)(error, req, res);
        if (error instanceof Error && error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }
        if (error instanceof Error && error.message.includes('cannot be approved')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: 'Failed to update application status'
        });
    }
});
/**
 * GET /api/v1/applications/stats
 * Get application statistics (admin only)
 */
router.get('/stats/summary', async (req, res) => {
    try {
        // Check if user is admin - temporarily skip for testing
        // TODO: Implement proper role checking with member_roles table
        if (!req.user) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Authentication required.'
            });
        }
        (0, logger_1.logInfo)('Fetching application statistics', { userId: req.user.id });
        const applications = await membershipApplication_service_1.MembershipApplicationService.getAllApplications();
        const stats = {
            total: applications.length,
            pending: applications.filter(app => app.status === 'pending').length,
            under_review: applications.filter(app => app.status === 'under_review').length,
            approved: applications.filter(app => app.status === 'approved').length,
            rejected: applications.filter(app => app.status === 'rejected').length,
            recent: applications.filter(app => {
                const submittedDate = new Date(app.submittedAt);
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                return submittedDate > thirtyDaysAgo;
            }).length
        };
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        (0, logger_1.logError)(error, req, res);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch statistics'
        });
    }
});
exports.default = router;
//# sourceMappingURL=applications.routes.js.map
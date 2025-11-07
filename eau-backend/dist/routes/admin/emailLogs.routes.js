"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const emailLogger_service_1 = require("../../services/emailLogger.service");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
/**
 * Get email logs with filtering
 * GET /api/v1/admin/email-logs
 */
router.get('/', auth_1.authenticate, (0, auth_1.authorizeRole)('admin', 'super_admin'), async (req, res) => {
    try {
        const { email_type, status, start_date, end_date, recipient_email, page = '1', limit = '20' } = req.query;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const offset = (pageNum - 1) * limitNum;
        const filters = {
            limit: limitNum,
            offset
        };
        if (email_type)
            filters.email_type = email_type;
        if (status)
            filters.status = status;
        if (recipient_email)
            filters.recipient_email = recipient_email;
        if (start_date)
            filters.start_date = new Date(start_date);
        if (end_date)
            filters.end_date = new Date(end_date);
        const { logs, total } = await emailLogger_service_1.EmailLoggerService.getEmailLogs(filters);
        res.json({
            success: true,
            data: {
                logs,
                pagination: {
                    total,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: Math.ceil(total / limitNum)
                }
            }
        });
    }
    catch (error) {
        console.error('Error fetching email logs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch email logs',
            error: error.message
        });
    }
});
/**
 * Get email statistics
 * GET /api/v1/admin/email-logs/statistics
 */
router.get('/statistics', auth_1.authenticate, (0, auth_1.authorizeRole)('admin', 'super_admin'), async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        const startDate = start_date ? new Date(start_date) : undefined;
        const endDate = end_date ? new Date(end_date) : undefined;
        const statistics = await emailLogger_service_1.EmailLoggerService.getStatistics(startDate, endDate);
        res.json({
            success: true,
            data: statistics
        });
    }
    catch (error) {
        console.error('Error fetching email statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch email statistics',
            error: error.message
        });
    }
});
/**
 * Resend a failed email
 * POST /api/v1/admin/email-logs/:id/resend
 */
router.post('/:id/resend', auth_1.authenticate, (0, auth_1.authorizeRole)('admin', 'super_admin'), async (req, res) => {
    try {
        // This would need to be implemented based on your needs
        // For now, we'll just return a placeholder response
        res.json({
            success: false,
            message: 'Resend functionality not yet implemented'
        });
    }
    catch (error) {
        console.error('Error resending email:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to resend email',
            error: error.message
        });
    }
});
exports.default = router;
//# sourceMappingURL=emailLogs.routes.js.map
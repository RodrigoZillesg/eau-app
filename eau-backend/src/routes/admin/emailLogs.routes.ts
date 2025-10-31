import { Router, Request, Response } from 'express';
import { EmailLoggerService } from '../../services/emailLogger.service';
import { authenticate, authorizeRole } from '../../middleware/auth';

const router = Router();

/**
 * Get email logs with filtering
 * GET /api/v1/admin/email-logs
 */
router.get(
  '/',
  authenticate,
  authorizeRole('admin', 'super_admin'),
  async (req: Request, res: Response) => {
    try {
      const {
        email_type,
        status,
        start_date,
        end_date,
        recipient_email,
        page = '1',
        limit = '20'
      } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const offset = (pageNum - 1) * limitNum;

      const filters: any = {
        limit: limitNum,
        offset
      };

      if (email_type) filters.email_type = email_type;
      if (status) filters.status = status;
      if (recipient_email) filters.recipient_email = recipient_email;
      if (start_date) filters.start_date = new Date(start_date as string);
      if (end_date) filters.end_date = new Date(end_date as string);

      const { logs, total } = await EmailLoggerService.getEmailLogs(filters);

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
    } catch (error: any) {
      console.error('Error fetching email logs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch email logs',
        error: error.message
      });
    }
  }
);

/**
 * Get email statistics
 * GET /api/v1/admin/email-logs/statistics
 */
router.get(
  '/statistics',
  authenticate,
  authorizeRole('admin', 'super_admin'),
  async (req: Request, res: Response) => {
    try {
      const { start_date, end_date } = req.query;

      const startDate = start_date ? new Date(start_date as string) : undefined;
      const endDate = end_date ? new Date(end_date as string) : undefined;

      const statistics = await EmailLoggerService.getStatistics(startDate, endDate);

      res.json({
        success: true,
        data: statistics
      });
    } catch (error: any) {
      console.error('Error fetching email statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch email statistics',
        error: error.message
      });
    }
  }
);

/**
 * Resend a failed email
 * POST /api/v1/admin/email-logs/:id/resend
 */
router.post(
  '/:id/resend',
  authenticate,
  authorizeRole('admin', 'super_admin'),
  async (req: Request, res: Response) => {
    try {
      // This would need to be implemented based on your needs
      // For now, we'll just return a placeholder response
      res.json({
        success: false,
        message: 'Resend functionality not yet implemented'
      });
    } catch (error: any) {
      console.error('Error resending email:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to resend email',
        error: error.message
      });
    }
  }
);

export default router;
import { Router, Response, NextFunction } from 'express';
import { MembershipApplicationService } from '../../services/membershipApplication.service';
import { AuthRequest, ApiResponse } from '../../types';
import { authenticate } from '../../middleware/auth';
import { USER_TYPES } from '../../config/constants';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Middleware to check if user is admin
const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  console.log('=== requireAdmin middleware debug ===');
  console.log('req.user:', req.user);
  console.log('userType:', req.user?.userType);
  console.log('email:', req.user?.email);
  
  if (!req.user || (req.user.userType !== USER_TYPES.SUPER_ADMIN && req.user.userType !== 'Admin')) {
    console.log('Access denied - not admin');
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    } as ApiResponse);
  }
  
  console.log('Access granted - user is admin');
  next();
};

/**
 * GET /api/v1/admin/membership-applications
 * Get all membership applications
 */
router.get('/', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const applications = await MembershipApplicationService.getAllApplications();

    res.json({
      success: true,
      data: applications
    } as ApiResponse);

  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch applications'
    } as ApiResponse);
  }
});

/**
 * POST /api/v1/admin/membership-applications/:id/approve
 * Approve a membership application
 */
router.post('/:id/approve', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { review_notes } = req.body;
    const reviewedBy = req.user!.id;

    const result = await MembershipApplicationService.approveApplication(id, reviewedBy, review_notes);

    res.json({
      success: true,
      data: result,
      message: 'Application approved successfully'
    } as ApiResponse);

  } catch (error) {
    console.error('Error approving application:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve application'
    } as ApiResponse);
  }
});

/**
 * POST /api/v1/admin/membership-applications/:id/reject
 * Reject a membership application
 */
router.post('/:id/reject', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { review_notes } = req.body;
    const reviewedBy = req.user!.id;

    await MembershipApplicationService.rejectApplication(id, reviewedBy, review_notes);

    res.json({
      success: true,
      message: 'Application rejected successfully'
    } as ApiResponse);

  } catch (error) {
    console.error('Error rejecting application:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject application'
    } as ApiResponse);
  }
});

export default router;
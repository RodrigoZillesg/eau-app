import { Router } from 'express';
import { body, param } from 'express-validator';
import { InvitationsController } from '../controllers/invitations.controller';
import { authenticate, authorize } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/validation';
import { USER_TYPES } from '../config/constants';

const router = Router();
const invitationsController = new InvitationsController();

// Accept invitation (public route)
router.post(
  '/accept',
  [
    body('token').notEmpty(),
    body('password').isLength({ min: 6 }),
    body('fullName').notEmpty().trim()
  ],
  handleValidationErrors,
  invitationsController.acceptInvitation
);

// All other routes require authentication
router.use(authenticate);

// Create invitation
router.post(
  '/',
  authorize(USER_TYPES.SUPER_ADMIN, USER_TYPES.INSTITUTION_ADMIN),
  [
    body('email').isEmail().normalizeEmail(),
    body('firstName').optional().trim(),
    body('lastName').optional().trim(),
    body('userType').isIn(['institution_admin', 'staff', 'teacher', 'limited']),
    body('institutionId').isUUID()
  ],
  handleValidationErrors,
  invitationsController.createInvitation
);

// List invitations for institution
router.get(
  '/institution/:institutionId',
  [param('institutionId').isUUID()],
  handleValidationErrors,
  invitationsController.listInvitations
);

// Revoke invitation
router.delete(
  '/:id',
  authorize(USER_TYPES.SUPER_ADMIN, USER_TYPES.INSTITUTION_ADMIN),
  [param('id').isUUID()],
  handleValidationErrors,
  invitationsController.revokeInvitation
);

// Resend invitation
router.post(
  '/:id/resend',
  authorize(USER_TYPES.SUPER_ADMIN, USER_TYPES.INSTITUTION_ADMIN),
  [param('id').isUUID()],
  handleValidationErrors,
  invitationsController.resendInvitation
);

export default router;
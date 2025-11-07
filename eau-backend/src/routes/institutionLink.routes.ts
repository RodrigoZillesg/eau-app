import { Router } from 'express';
import { body, param } from 'express-validator';
import { InstitutionLinkController } from '../controllers/institutionLink.controller';
import { authenticate } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/validation';

const router = Router();
const linkController = new InstitutionLinkController();

// All routes require authentication
router.use(authenticate);

/**
 * Member requests to link with an institution
 * POST /api/v1/institution-links/request
 */
router.post(
  '/request',
  [
    body('institution_id')
      .notEmpty()
      .withMessage('Institution ID is required')
      .isUUID()
      .withMessage('Invalid institution ID format')
  ],
  handleValidationErrors,
  linkController.requestLink
);

/**
 * Get pending link requests for institution admin's institution
 * GET /api/v1/institution-links/pending
 * Requires: Institution Admin or Super Admin role
 */
router.get(
  '/pending',
  linkController.getPendingRequests
);

/**
 * Get all link requests for institution admin's institution
 * GET /api/v1/institution-links/all
 * Requires: Institution Admin or Super Admin role
 */
router.get(
  '/all',
  linkController.getAllRequests
);

/**
 * Institution admin approves a link request
 * POST /api/v1/institution-links/:id/approve
 */
router.post(
  '/:id/approve',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid request ID format'),
    body('notes')
      .optional()
      .isString()
      .withMessage('Notes must be a string')
  ],
  handleValidationErrors,
  linkController.approveRequest
);

/**
 * Institution admin rejects a link request
 * POST /api/v1/institution-links/:id/reject
 */
router.post(
  '/:id/reject',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid request ID format'),
    body('notes')
      .notEmpty()
      .withMessage('Rejection reason is required')
      .isString()
      .withMessage('Notes must be a string')
  ],
  handleValidationErrors,
  linkController.rejectRequest
);

/**
 * Member unlinks from their current institution
 * DELETE /api/v1/institution-links/unlink
 */
router.delete(
  '/unlink',
  linkController.unlinkFromInstitution
);

/**
 * Get member's current link status and history
 * GET /api/v1/institution-links/status
 */
router.get(
  '/status',
  linkController.getLinkStatus
);

export default router;

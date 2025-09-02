import { Router } from 'express';
import { body, param } from 'express-validator';
import { InstitutionsController } from '../controllers/institutions.controller';
import { authenticate, authorize } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/validation';
import { USER_TYPES } from '../config/constants';

const router = Router();
const institutionsController = new InstitutionsController();

// All routes require authentication
router.use(authenticate);

// List institutions
router.get('/', institutionsController.list);

// Get statistics (super admin only)
router.get(
  '/statistics',
  authorize(USER_TYPES.SUPER_ADMIN),
  institutionsController.getStatistics
);

// Get institution by ID
router.get(
  '/:id',
  [param('id').isUUID()],
  handleValidationErrors,
  institutionsController.getById
);

// Get institution members
router.get(
  '/:id/members',
  [param('id').isUUID()],
  handleValidationErrors,
  institutionsController.getMembers
);

// Create institution (super admin only)
router.post(
  '/',
  authorize(USER_TYPES.SUPER_ADMIN),
  [
    body('name').notEmpty().trim(),
    body('membership_type').notEmpty().isIn(['full_provider', 'associate', 'corporate', 'professional']),
    body('primary_contact_email').isEmail().normalizeEmail(),
    body('abn').optional().trim(),
    body('cricos_code').optional().trim()
  ],
  handleValidationErrors,
  institutionsController.create
);

// Update institution
router.put(
  '/:id',
  [
    param('id').isUUID(),
    body('name').optional().trim(),
    body('primary_contact_email').optional().isEmail().normalizeEmail()
  ],
  handleValidationErrors,
  institutionsController.update
);

export default router;
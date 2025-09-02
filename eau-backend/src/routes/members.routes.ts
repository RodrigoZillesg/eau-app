import { Router } from 'express';
import { body, param } from 'express-validator';
import { MembersController } from '../controllers/members.controller';
import { authenticate, authorize } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/validation';
import { USER_TYPES } from '../config/constants';

const router = Router();
const membersController = new MembersController();

// All routes require authentication
router.use(authenticate);

// List members
router.get('/', membersController.list);

// Get member statistics
router.get(
  '/statistics',
  authorize(USER_TYPES.SUPER_ADMIN, USER_TYPES.INSTITUTION_ADMIN),
  membersController.getStatistics
);

// Export members CSV
router.get(
  '/export',
  authorize(USER_TYPES.SUPER_ADMIN, USER_TYPES.INSTITUTION_ADMIN),
  membersController.exportCsv
);

// Get member by ID
router.get(
  '/:id',
  [param('id').isUUID()],
  handleValidationErrors,
  membersController.getById
);

// Update member
router.put(
  '/:id',
  [
    param('id').isUUID(),
    body('email').optional().isEmail().normalizeEmail(),
    body('full_name').optional().trim(),
    body('phone').optional().trim()
  ],
  handleValidationErrors,
  membersController.update
);

export default router;
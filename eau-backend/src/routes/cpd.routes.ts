import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { CPDController } from '../controllers/cpd.controller';
import { authenticate } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/validation';

const router = Router();
const cpdController = new CPDController();

// All routes require authentication
router.use(authenticate);

// List CPD activities
router.get(
  '/',
  [
    query('year').optional().isInt({ min: 2020, max: 2030 }),
    query('status').optional().isIn(['approved', 'pending', 'rejected', 'all'])
  ],
  handleValidationErrors,
  cpdController.list
);

// Get CPD progress
router.get(
  '/progress',
  [
    query('year').optional().isInt({ min: 2020, max: 2030 }),
    query('memberId').optional().isUUID()
  ],
  handleValidationErrors,
  cpdController.getProgress
);

// Create CPD activity
router.post(
  '/',
  [
    body('activityDate').isISO8601().toDate(),
    body('activityType').notEmpty().trim(),
    body('description').notEmpty().trim(),
    body('points').isFloat({ min: 0, max: 50 }),
    body('evidenceUrl').optional().isURL(),
    body('notes').optional().trim()
  ],
  handleValidationErrors,
  cpdController.create
);

// Update CPD activity
router.put(
  '/:id',
  [
    param('id').isUUID(),
    body('activityDate').optional().isISO8601().toDate(),
    body('activityType').optional().notEmpty().trim(),
    body('description').optional().notEmpty().trim(),
    body('points').optional().isFloat({ min: 0, max: 50 }),
    body('evidenceUrl').optional().isURL(),
    body('notes').optional().trim()
  ],
  handleValidationErrors,
  cpdController.update
);

// Delete CPD activity
router.delete(
  '/:id',
  [param('id').isUUID()],
  handleValidationErrors,
  cpdController.delete
);

export default router;
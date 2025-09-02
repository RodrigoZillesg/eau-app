import { Router } from 'express';
import { body } from 'express-validator';
import { AuthController } from '../controllers/auth.controller';
import { handleValidationErrors } from '../middleware/validation';
import { authenticate } from '../middleware/auth';

const router = Router();
const authController = new AuthController();

// Login with Supabase Auth
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty().isLength({ min: 6 })
  ],
  handleValidationErrors,
  authController.loginWithSupabase
);

// Refresh token
router.post(
  '/refresh',
  [
    body('refreshToken').notEmpty()
  ],
  handleValidationErrors,
  authController.refreshToken
);

// Logout
router.post('/logout', authenticate, authController.logout);

// Get current user
router.get('/me', authenticate, authController.me);

export default router;
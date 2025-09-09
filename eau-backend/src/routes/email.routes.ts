import { Router } from 'express';
import { EmailController } from '../controllers/email.controller';
import { authenticateSupabase } from '../middleware/supabaseAuth';

const router = Router();

// Apply authentication middleware
router.use(authenticateSupabase);

// SMTP settings routes
router.get('/settings', EmailController.getSMTPSettings);
router.post('/settings', EmailController.saveSMTPSettings);

// Test routes
router.post('/test', EmailController.sendTestEmail);
router.get('/test-connection', EmailController.testConnection);

// Generic email sending
router.post('/send', EmailController.sendEmail);

// Specific email types
router.post('/event-registration', EmailController.sendEventRegistration);
router.post('/cpd-notification', EmailController.sendCPDNotification);

export default router;
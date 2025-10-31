import { Router } from 'express';
import authRoutes from './auth.routes';
import membersRoutes from './members.routes';
import institutionsRoutes from './institutions.routes';
import invitationsRoutes from './invitations.routes';
import cpdRoutes from './cpd.routes';
import emailRoutes from './email.routes';
import openlearningRoutes from './openlearning.routes';
import openlearningPublicRoutes from './openlearning-public.routes';
import openlearningSSORoutes from './openlearningSSO.routes';
// import certificatesRoutes from './certificates.routes';
import welcomeRoutes from './welcome.routes';
import publicRoutes from './public.routes';
import adminMembershipApplicationsRoutes from './admin/membershipApplications.routes';
import emailLogsRoutes from './admin/emailLogs.routes';
import trackingRoutes from './tracking.routes';
// import applicationsRoutes from './applications.routes';
import { API_PREFIX } from '../config/constants';
import { EmailController } from '../controllers/email.controller';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'EAU Backend API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Special route for event reminders (no auth, called by frontend)
router.post('/api/create-reminders', EmailController.createReminders);

// API routes
router.use(`${API_PREFIX}/auth`, authRoutes);
router.use(`${API_PREFIX}/members`, membersRoutes);
router.use(`${API_PREFIX}/institutions`, institutionsRoutes);
router.use(`${API_PREFIX}/invitations`, invitationsRoutes);
router.use(`${API_PREFIX}/cpd`, cpdRoutes);
router.use(`${API_PREFIX}/email`, emailRoutes);
router.use(`${API_PREFIX}/openlearning`, openlearningRoutes);
router.use(`${API_PREFIX}/openlearning`, openlearningPublicRoutes); // Public routes (no auth required)
router.use(`${API_PREFIX}/openlearning-sso`, openlearningSSORoutes); // SSO routes
router.use(`${API_PREFIX}/welcome`, welcomeRoutes);
router.use(`${API_PREFIX}/public`, publicRoutes); // Public membership application routes
router.use(`${API_PREFIX}/admin/membership-applications`, adminMembershipApplicationsRoutes); // Admin application management routes
router.use(`${API_PREFIX}/admin/email-logs`, emailLogsRoutes); // Email logs admin routes
router.use(`${API_PREFIX}/track`, trackingRoutes); // Email tracking routes (public, no auth required)
// router.use(`${API_PREFIX}/applications`, applicationsRoutes); // Admin application management routes - disabled temporarily

export default router;
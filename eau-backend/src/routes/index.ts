import { Router } from 'express';
import authRoutes from './auth.routes';
import membersRoutes from './members.routes';
import institutionsRoutes from './institutions.routes';
import invitationsRoutes from './invitations.routes';
import cpdRoutes from './cpd.routes';
import { API_PREFIX } from '../config/constants';

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

// API routes
router.use(`${API_PREFIX}/auth`, authRoutes);
router.use(`${API_PREFIX}/members`, membersRoutes);
router.use(`${API_PREFIX}/institutions`, institutionsRoutes);
router.use(`${API_PREFIX}/invitations`, invitationsRoutes);
router.use(`${API_PREFIX}/cpd`, cpdRoutes);

export default router;
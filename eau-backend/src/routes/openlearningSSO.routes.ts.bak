import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { openLearningSSOService } from '../services/openlearningSSO.service';
import { supabaseAdmin } from '../config/database';
import { AuthRequest } from '../types';

const router = Router();

/**
 * Generate SSO link for current user
 */
router.post('/generate-sso', authenticate, async (req: AuthRequest, res) => {
  try {
    const { returnUrl } = req.body;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get user's full name from database
    const { data: member } = await supabaseAdmin
      .from('members')
      .select('full_name, first_name, last_name')
      .eq('id', user.id)
      .single();

    const fullName = member?.full_name || `${member?.first_name || ''} ${member?.last_name || ''}`.trim() || user.email;

    // Generate SSO link
    const ssoData = await openLearningSSOService.generateSSOLink({
      userId: user.id,
      email: user.email,
      fullName: fullName,
      returnUrl: returnUrl || 'http://localhost:5180/dashboard'
    });

    res.json({
      success: true,
      sso: ssoData
    });

  } catch (error: any) {
    console.error('SSO generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get user's course completions from OpenLearning
 */
router.get('/course-completions', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get member's OpenLearning ID from database
    const { data: member } = await supabaseAdmin
      .from('members')
      .select('openlearning_user_id')
      .eq('id', user.id)
      .single();

    if (!member?.openlearning_user_id) {
      return res.json({
        success: true,
        completions: [],
        message: 'User not provisioned in OpenLearning'
      });
    }

    // Get completions
    const completions = await openLearningSSOService.getUserCourseCompletions(
      member.openlearning_user_id
    );

    res.json({
      success: true,
      completions
    });

  } catch (error: any) {
    console.error('Failed to get course completions:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Import certificates for current user
 */
router.post('/import-certificates', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get member's OpenLearning ID from database
    const { data: member } = await supabaseAdmin
      .from('members')
      .select('openlearning_user_id')
      .eq('id', user.id)
      .single();

    if (!member?.openlearning_user_id) {
      return res.json({
        success: false,
        error: 'User not provisioned in OpenLearning',
        imported: 0
      });
    }

    // Import certificates as CPD activities
    const result = await openLearningSSOService.importCertificatesAsCPD(
      user.id,
      member.openlearning_user_id
    );

    res.json(result);

  } catch (error: any) {
    console.error('Failed to import certificates:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Sync all OpenLearning users (admin only)
 */
router.post('/sync-users', authenticate, async (req: AuthRequest, res) => {
  try {
    // Check if user is admin
    if (req.user?.userType !== 'super_admin' && req.user?.userType !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Start sync in background
    openLearningSSOService.syncAllUsers()
      .then(count => {
        console.log(`✅ Background sync completed: ${count} users`);
      })
      .catch(error => {
        console.error('❌ Background sync failed:', error);
      });

    res.json({
      success: true,
      message: 'Sync started in background'
    });

  } catch (error: any) {
    console.error('Sync error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
import { Router, Response } from 'express';
import { AuthRequest } from '../types';
import { authenticate } from '../middleware/auth';
import { openLearningCorrectService } from '../services/openlearningCorrect.service';
import { supabaseAdmin } from '../config/database';

const router = Router();

/**
 * @route   POST /api/v1/openlearning/sso/launch
 * @desc    Generate SSO launch data for OpenLearning (auto-provisions if needed)
 * @access  Private (Authenticated users)
 */
router.post('/sso/launch', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { memberId, classId } = req.body;

    if (!memberId) {
      return res.status(400).json({
        success: false,
        error: 'memberId is required'
      });
    }

    // Get member data
    const { data: member, error: memberError } = await supabaseAdmin
      .from('members')
      .select('id, first_name, last_name, email, openlearning_user_id')
      .eq('id', memberId)
      .single();

    if (memberError || !member) {
      return res.status(404).json({
        success: false,
        error: 'Member not found'
      });
    }

    // Auto-provision if not already provisioned
    let openLearningUserId = member.openlearning_user_id;

    if (!openLearningUserId) {
      console.log('Member not provisioned, auto-provisioning...');

      const provisionResult = await openLearningCorrectService.provisionUser(memberId, {
        fullName: `${member.first_name} ${member.last_name}`,
        email: member.email,
        externalId: memberId
      });

      if (!provisionResult.success) {
        return res.status(400).json({
          success: false,
          error: provisionResult.error || 'Failed to provision user in OpenLearning'
        });
      }

      openLearningUserId = provisionResult.openLearningUserId || '';
    }

    // Generate SSO launch data
    const ssoResult = await openLearningCorrectService.generateSSOLaunchUrl(
      memberId,
      openLearningUserId,
      classId
    );

    if (ssoResult.success) {
      res.json({
        success: true,
        launchData: ssoResult.launchData,
        launchUrl: ssoResult.launchUrl
      });
    } else {
      res.status(400).json({
        success: false,
        error: ssoResult.error || 'Failed to generate SSO launch data'
      });
    }

  } catch (error: any) {
    console.error('Error in SSO launch endpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

export default router;

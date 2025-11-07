import { Router, Response } from 'express';
import { openLearningService } from '../services/openlearning.service';
import { authenticateOpenLearning } from '../middleware/openlearningAuth';
import { supabaseAdmin as supabase } from '../config/database';
import { AuthRequest } from '../types';

const router = Router();

/**
 * @route   POST /api/v1/openlearning/provision
 * @desc    Provision a user in OpenLearning
 * @access  Private (Admin or Self)
 */
router.post('/provision', authenticateOpenLearning, async (req: AuthRequest, res: Response) => {
  try {
    const { memberId } = req.body;
    const requestingUserId = req.user?.id;

    // Check permissions (admin or self)
    if (memberId !== requestingUserId) {
      const { data: requestingUser } = await supabase
        .from('members')
        .select('role')
        .eq('id', requestingUserId)
        .single();

      if (!requestingUser || !['super_admin', 'admin'].includes(requestingUser.role)) {
        return res.status(403).json({ 
          success: false, 
          error: 'Insufficient permissions' 
        });
      }
    }

    // Get member data
    const { data: member, error: memberError } = await supabase
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

    // Check if already provisioned
    if (member.openlearning_user_id) {
      return res.json({ 
        success: true, 
        message: 'User already provisioned',
        openLearningUserId: member.openlearning_user_id 
      });
    }

    // Provision user
    const result = await openLearningService.provisionUser(memberId, {
      fullName: `${member.first_name} ${member.last_name}`,
      email: member.email,
      externalId: memberId
    });

    if (result.success) {
      res.json({
        success: true,
        message: 'User provisioned successfully',
        openLearningUserId: result.openLearningUserId
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error || 'Failed to provision user'
      });
    }
  } catch (error: any) {
    console.error('Error in provision endpoint:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * @route   POST /api/v1/openlearning/sso
 * @desc    Generate SSO launch URL for OpenLearning
 * @access  Private (Authenticated users)
 */
router.post('/sso', authenticateOpenLearning, async (req: AuthRequest, res: Response) => {
  try {
    const memberId = req.user?.id;
    const { classId, returnUrl } = req.body;

    if (!memberId) {
      return res.status(401).json({ 
        success: false, 
        error: 'User not authenticated' 
      });
    }

    // Check if user is provisioned
    const { data: member } = await supabase
      .from('members')
      .select('openlearning_user_id')
      .eq('id', memberId)
      .single();

    if (!member?.openlearning_user_id) {
      // Auto-provision if not already provisioned
      const { data: memberData } = await supabase
        .from('members')
        .select('first_name, last_name, email')
        .eq('id', memberId)
        .single();

      if (memberData) {
        await openLearningService.provisionUser(memberId, {
          fullName: `${memberData.first_name} ${memberData.last_name}`,
          email: memberData.email,
          externalId: memberId
        });
      }
    }

    // Generate SSO launch URL
    const result = await openLearningService.generateSSOLaunchUrl(memberId, {
      class_id: classId,
      return_url: returnUrl
    });

    if (result.success) {
      res.json({
        success: true,
        launchData: result.launchData,
        sessionToken: result.sessionToken
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error || 'Failed to generate SSO URL'
      });
    }
  } catch (error: any) {
    console.error('Error in SSO endpoint:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * @route   GET /api/v1/openlearning/courses
 * @desc    Get OpenLearning course completions for a member
 * @access  Private (Admin or Self)
 */
router.get('/courses/:memberId?', authenticateOpenLearning, async (req: AuthRequest, res: Response) => {
  try {
    const memberId = req.params.memberId || req.user?.id;
    const requestingUserId = req.user?.id;

    // Check permissions (admin or self)
    if (memberId !== requestingUserId) {
      const { data: requestingUser } = await supabase
        .from('members')
        .select('role')
        .eq('id', requestingUserId)
        .single();

      if (!requestingUser || !['super_admin', 'admin'].includes(requestingUser.role)) {
        return res.status(403).json({ 
          success: false, 
          error: 'Insufficient permissions' 
        });
      }
    }

    // Get courses from database
    const { data: courses, error } = await supabase
      .from('openlearning_courses')
      .select(`
        *,
        cpd_activity:cpd_activities(*)
      `)
      .eq('member_id', memberId)
      .order('completion_date', { ascending: false });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      courses: courses || []
    });
  } catch (error: any) {
    console.error('Error getting courses:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * @route   POST /api/v1/openlearning/sync
 * @desc    Sync OpenLearning courses to CPD activities
 * @access  Private (Admin or Self)
 */
router.post('/sync', authenticateOpenLearning, async (req: AuthRequest, res: Response) => {
  try {
    const { memberId } = req.body;
    const requestingUserId = req.user?.id;

    // Use requesting user's ID if no memberId provided
    const targetMemberId = memberId || requestingUserId;

    // Check permissions (admin or self)
    if (targetMemberId !== requestingUserId) {
      const { data: requestingUser } = await supabase
        .from('members')
        .select('role')
        .eq('id', requestingUserId)
        .single();

      if (!requestingUser || !['super_admin', 'admin'].includes(requestingUser.role)) {
        return res.status(403).json({ 
          success: false, 
          error: 'Insufficient permissions' 
        });
      }
    }

    // Sync courses to CPD
    const result = await openLearningService.syncCoursesToCPD(targetMemberId);

    if (result.success) {
      res.json({
        success: true,
        message: `Synced ${result.syncedCount} new courses to CPD activities`
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error || 'Failed to sync courses'
      });
    }
  } catch (error: any) {
    console.error('Error in sync endpoint:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * @route   POST /api/v1/openlearning/bulk-provision
 * @desc    Provision multiple users in OpenLearning
 * @access  Private (Admin only)
 */
router.post('/bulk-provision', authenticateOpenLearning, async (req: AuthRequest, res: Response) => {
  try {
    const requestingUserId = req.user?.id;
    const { memberIds } = req.body;

    // Check admin permissions
    const { data: requestingUser } = await supabase
      .from('members')
      .select('role')
      .eq('id', requestingUserId)
      .single();

    if (!requestingUser || !['super_admin', 'admin'].includes(requestingUser.role)) {
      return res.status(403).json({ 
        success: false, 
        error: 'Admin permissions required' 
      });
    }

    // Get members to provision
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('id, first_name, last_name, email, openlearning_user_id')
      .in('id', memberIds || [])
      .is('openlearning_user_id', null);

    if (membersError) {
      throw membersError;
    }

    const results = {
      provisioned: [] as string[],
      failed: [] as { memberId: string; error: string }[],
      alreadyProvisioned: [] as string[]
    };

    // Process each member
    for (const member of members || []) {
      const result = await openLearningService.provisionUser(member.id, {
        fullName: `${member.first_name} ${member.last_name}`,
        email: member.email,
        externalId: member.id
      });

      if (result.success) {
        results.provisioned.push(member.id);
      } else {
        results.failed.push({
          memberId: member.id,
          error: result.error || 'Unknown error'
        });
      }
    }

    // Check for already provisioned members
    if (memberIds) {
      const { data: alreadyProvisioned } = await supabase
        .from('members')
        .select('id')
        .in('id', memberIds)
        .not('openlearning_user_id', 'is', null);

      results.alreadyProvisioned = alreadyProvisioned?.map((m: any) => m.id) || [];
    }

    res.json({
      success: true,
      results
    });
  } catch (error: any) {
    console.error('Error in bulk provision endpoint:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * @route   GET /api/v1/openlearning/status/:memberId?
 * @desc    Get OpenLearning integration status for a member
 * @access  Private (Admin or Self)
 */
router.get('/status/:memberId?', authenticateOpenLearning, async (req: AuthRequest, res: Response) => {
  try {
    const memberId = req.params.memberId || req.user?.id;
    const requestingUserId = req.user?.id;

    // Check permissions (admin or self)
    if (memberId !== requestingUserId) {
      const { data: requestingUser } = await supabase
        .from('members')
        .select('role')
        .eq('id', requestingUserId)
        .single();

      if (!requestingUser || !['super_admin', 'admin'].includes(requestingUser.role)) {
        return res.status(403).json({ 
          success: false, 
          error: 'Insufficient permissions' 
        });
      }
    }

    // Get member's OpenLearning status
    const { data: member, error } = await supabase
      .from('members')
      .select(`
        id,
        email,
        openlearning_user_id,
        openlearning_external_id,
        openlearning_sync_enabled,
        openlearning_last_synced,
        openlearning_provisioned_at
      `)
      .eq('id', memberId)
      .single();

    if (error || !member) {
      return res.status(404).json({ 
        success: false, 
        error: 'Member not found' 
      });
    }

    // Get course count
    const { count: courseCount } = await supabase
      .from('openlearning_courses')
      .select('*', { count: 'exact', head: true })
      .eq('member_id', memberId);

    // Get CPD activities linked to OpenLearning
    const { count: cpdCount } = await supabase
      .from('cpd_activities')
      .select('*', { count: 'exact', head: true })
      .eq('member_id', memberId)
      .eq('provider', 'OpenLearning');

    res.json({
      success: true,
      status: {
        isProvisioned: !!member.openlearning_user_id,
        openLearningUserId: member.openlearning_user_id,
        externalId: member.openlearning_external_id,
        syncEnabled: member.openlearning_sync_enabled,
        lastSynced: member.openlearning_last_synced,
        provisionedAt: member.openlearning_provisioned_at,
        courseCount: courseCount || 0,
        cpdActivitiesCount: cpdCount || 0
      }
    });
  } catch (error: any) {
    console.error('Error getting status:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

export default router;
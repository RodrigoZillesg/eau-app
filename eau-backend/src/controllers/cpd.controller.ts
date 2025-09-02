import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/database';
import { AuthRequest, ApiResponse } from '../types';
import { ERROR_MESSAGES, USER_TYPES, CPD_POINTS } from '../config/constants';

export class CPDController {
  async list(req: AuthRequest, res: Response) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        year = new Date().getFullYear(),
        memberId,
        status = 'approved'
      } = req.query;
      
      const offset = (Number(page) - 1) * Number(limit);

      let query = supabaseAdmin
        .from('cpd_activities')
        .select(`
          *,
          members (
            id,
            full_name,
            email
          )
        `, { count: 'exact' });

      // Apply date filter for year
      const yearStart = `${year}-01-01`;
      const yearEnd = `${year}-12-31`;
      query = query
        .gte('activity_date', yearStart)
        .lte('activity_date', yearEnd);

      // Apply permissions and filters
      if (req.user?.userType === USER_TYPES.SUPER_ADMIN) {
        // Super admin can see all activities
        if (memberId) {
          query = query.eq('member_id', memberId);
        }
      } else if (req.user?.userType === USER_TYPES.INSTITUTION_ADMIN) {
        // Institution admin can see activities from their institution members
        const { data: institutionMembers } = await supabaseAdmin
          .from('members')
          .select('id')
          .eq('institution_id', req.user.institutionId);

        const memberIds = institutionMembers?.map(m => m.id) || [];
        if (memberIds.length > 0) {
          query = query.in('member_id', memberIds);
        } else {
          // No members found, return empty result
          return res.json({
            success: true,
            data: {
              activities: [],
              pagination: {
                total: 0,
                page: Number(page),
                limit: Number(limit),
                totalPages: 0
              }
            }
          } as ApiResponse);
        }

        if (memberId) {
          query = query.eq('member_id', memberId);
        }
      } else {
        // Regular users can only see their own activities
        query = query.eq('member_id', req.user?.id);
      }

      // Apply status filter
      if (status !== 'all') {
        query = query.eq('status', status);
      }

      const { data: activities, error, count } = await query
        .range(offset, offset + Number(limit) - 1)
        .order('activity_date', { ascending: false });

      if (error) throw error;

      res.json({
        success: true,
        data: {
          activities,
          pagination: {
            total: count,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil((count || 0) / Number(limit))
          }
        }
      } as ApiResponse);
    } catch (error) {
      console.error('List CPD activities error:', error);
      res.status(500).json({
        success: false,
        error: ERROR_MESSAGES.SERVER_ERROR
      } as ApiResponse);
    }
  }

  async create(req: AuthRequest, res: Response) {
    try {
      const { 
        activityDate, 
        activityType, 
        description, 
        points, 
        evidenceUrl,
        notes 
      } = req.body;

      // Create CPD activity with automatic approval
      const activityData = {
        member_id: req.user?.id,
        activity_date: activityDate,
        activity_type: activityType,
        description,
        points: Number(points),
        status: 'approved', // Auto-approve as per requirements
        evidence_url: evidenceUrl,
        notes,
        approved_date: new Date().toISOString(),
        approver_id: req.user?.id, // Self-approved
        created_at: new Date().toISOString()
      };

      const { data: activity, error } = await supabaseAdmin
        .from('cpd_activities')
        .insert(activityData)
        .select()
        .single();

      if (error) throw error;

      // Update member's total CPD points for current year
      await this.updateMemberCPDPoints(req.user!.id, new Date(activityDate).getFullYear());

      res.status(201).json({
        success: true,
        data: activity
      } as ApiResponse);
    } catch (error) {
      console.error('Create CPD activity error:', error);
      res.status(500).json({
        success: false,
        error: ERROR_MESSAGES.SERVER_ERROR
      } as ApiResponse);
    }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      // Get current activity to check permissions
      const { data: currentActivity } = await supabaseAdmin
        .from('cpd_activities')
        .select('member_id, activity_date')
        .eq('id', id)
        .single();

      if (!currentActivity) {
        return res.status(404).json({
          success: false,
          error: 'CPD activity not found'
        } as ApiResponse);
      }

      // Check permissions
      const canEdit = req.user?.userType === USER_TYPES.SUPER_ADMIN ||
        req.user?.id === currentActivity.member_id;

      if (!canEdit) {
        return res.status(403).json({
          success: false,
          error: 'You can only edit your own CPD activities'
        } as ApiResponse);
      }

      const updateData = {
        ...req.body,
        updated_at: new Date().toISOString()
      };

      // Remove fields that shouldn't be updated by regular users
      if (req.user?.userType !== USER_TYPES.SUPER_ADMIN) {
        delete updateData.member_id;
        delete updateData.status;
        delete updateData.approved_date;
        delete updateData.approver_id;
      }

      const { data: activity, error } = await supabaseAdmin
        .from('cpd_activities')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Update member's total CPD points if points changed
      if (updateData.points !== undefined || updateData.activity_date) {
        const year = new Date(updateData.activity_date || currentActivity.activity_date).getFullYear();
        await this.updateMemberCPDPoints(currentActivity.member_id, year);
      }

      res.json({
        success: true,
        data: activity
      } as ApiResponse);
    } catch (error) {
      console.error('Update CPD activity error:', error);
      res.status(500).json({
        success: false,
        error: ERROR_MESSAGES.SERVER_ERROR
      } as ApiResponse);
    }
  }

  async delete(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      // Get current activity to check permissions
      const { data: currentActivity } = await supabaseAdmin
        .from('cpd_activities')
        .select('member_id, activity_date')
        .eq('id', id)
        .single();

      if (!currentActivity) {
        return res.status(404).json({
          success: false,
          error: 'CPD activity not found'
        } as ApiResponse);
      }

      // Check permissions
      const canDelete = req.user?.userType === USER_TYPES.SUPER_ADMIN ||
        req.user?.id === currentActivity.member_id;

      if (!canDelete) {
        return res.status(403).json({
          success: false,
          error: 'You can only delete your own CPD activities'
        } as ApiResponse);
      }

      const { error } = await supabaseAdmin
        .from('cpd_activities')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update member's total CPD points
      const year = new Date(currentActivity.activity_date).getFullYear();
      await this.updateMemberCPDPoints(currentActivity.member_id, year);

      res.json({
        success: true,
        message: 'CPD activity deleted successfully'
      } as ApiResponse);
    } catch (error) {
      console.error('Delete CPD activity error:', error);
      res.status(500).json({
        success: false,
        error: ERROR_MESSAGES.SERVER_ERROR
      } as ApiResponse);
    }
  }

  async getProgress(req: AuthRequest, res: Response) {
    try {
      const { memberId, year = new Date().getFullYear() } = req.query;

      // Determine which member to get progress for
      let targetMemberId = req.user?.id;

      if (memberId && req.user?.userType === USER_TYPES.SUPER_ADMIN) {
        targetMemberId = memberId as string;
      } else if (memberId && req.user?.userType === USER_TYPES.INSTITUTION_ADMIN) {
        // Verify member belongs to same institution
        const { data: member } = await supabaseAdmin
          .from('members')
          .select('institution_id')
          .eq('id', memberId)
          .single();

        if (member?.institution_id === req.user?.institutionId) {
          targetMemberId = memberId as string;
        }
      }

      // Get total points for the year
      const yearStart = `${year}-01-01`;
      const yearEnd = `${year}-12-31`;

      const { data: activities } = await supabaseAdmin
        .from('cpd_activities')
        .select('points, activity_type, activity_date')
        .eq('member_id', targetMemberId)
        .eq('status', 'approved')
        .gte('activity_date', yearStart)
        .lte('activity_date', yearEnd);

      const totalPoints = activities?.reduce((sum, activity) => sum + (activity.points || 0), 0) || 0;
      const targetPoints = CPD_POINTS.YEARLY_TARGET;
      const progress = Math.min((totalPoints / targetPoints) * 100, 100);

      // Group by activity type
      const pointsByType: Record<string, number> = {};
      activities?.forEach(activity => {
        if (activity.activity_type) {
          pointsByType[activity.activity_type] = (pointsByType[activity.activity_type] || 0) + activity.points;
        }
      });

      // Get monthly breakdown
      const monthlyPoints = new Array(12).fill(0);
      activities?.forEach(activity => {
        const month = new Date(activity.activity_date).getMonth();
        monthlyPoints[month] += activity.points;
      });

      res.json({
        success: true,
        data: {
          year: Number(year),
          totalPoints,
          targetPoints,
          progress,
          remainingPoints: Math.max(0, targetPoints - totalPoints),
          pointsByType,
          monthlyPoints,
          isCompleted: totalPoints >= targetPoints
        }
      } as ApiResponse);
    } catch (error) {
      console.error('Get CPD progress error:', error);
      res.status(500).json({
        success: false,
        error: ERROR_MESSAGES.SERVER_ERROR
      } as ApiResponse);
    }
  }

  private async updateMemberCPDPoints(memberId: string, year: number) {
    try {
      const yearStart = `${year}-01-01`;
      const yearEnd = `${year}-12-31`;

      const { data: activities } = await supabaseAdmin
        .from('cpd_activities')
        .select('points')
        .eq('member_id', memberId)
        .eq('status', 'approved')
        .gte('activity_date', yearStart)
        .lte('activity_date', yearEnd);

      const totalPoints = activities?.reduce((sum, activity) => sum + (activity.points || 0), 0) || 0;

      // Update member's CPD points for current year only
      if (year === new Date().getFullYear()) {
        await supabaseAdmin
          .from('members')
          .update({ cpd_points_current_year: totalPoints })
          .eq('id', memberId);
      }
    } catch (error) {
      console.error('Error updating member CPD points:', error);
    }
  }
}
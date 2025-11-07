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
        categoryId,
        hours,
        evidenceUrl,
        notes
      } = req.body;

      let calculatedPoints = 0;

      // Calculate points based on category and hours if provided
      if (categoryId && hours) {
        const { data: category, error: categoryError } = await supabaseAdmin
          .from('cpd_categories')
          .select('points_per_hour')
          .eq('id', categoryId)
          .eq('is_active', true)
          .single();

        if (categoryError || !category) {
          return res.status(400).json({
            success: false,
            error: 'Invalid CPD category selected'
          } as ApiResponse);
        }

        // Calculate points: hours * points_per_hour
        calculatedPoints = Number(hours) * Number(category.points_per_hour);
      }

      // Create CPD activity with automatic approval
      const activityData = {
        member_id: req.user?.id,
        activity_date: activityDate,
        activity_type: activityType,
        description,
        points: calculatedPoints,
        cpd_category: categoryId,
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

  async getCategories(req: AuthRequest, res: Response) {
    try {
      const { data: categories, error } = await supabaseAdmin
        .from('cpd_categories')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;

      res.json({
        success: true,
        data: categories
      } as ApiResponse);
    } catch (error) {
      console.error('Get CPD categories error:', error);
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

  // Public (authenticated users): Get active categories only
  async getActiveCategories(req: AuthRequest, res: Response) {
    try {
      const { data: categories, error } = await supabaseAdmin
        .from('cpd_categories')
        .select('*')
        .eq('is_active', true)
        .order('points_per_hour', { ascending: false })
        .order('name', { ascending: true });

      if (error) throw error;

      res.json({
        success: true,
        data: categories
      } as ApiResponse);
    } catch (error) {
      console.error('Get active CPD categories error:', error);
      res.status(500).json({
        success: false,
        error: ERROR_MESSAGES.SERVER_ERROR
      } as ApiResponse);
    }
  }

  // Admin-only: Get all categories (including inactive)
  async getAllCategories(req: AuthRequest, res: Response) {
    try {
      // Only admins and super admins can access all categories
      if (req.user?.userType !== USER_TYPES.SUPER_ADMIN && req.user?.userType !== USER_TYPES.ADMIN) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Admin privileges required.'
        } as ApiResponse);
      }

      const { data: categories, error } = await supabaseAdmin
        .from('cpd_categories')
        .select('*')
        .order('points_per_hour', { ascending: false })
        .order('name', { ascending: true });

      if (error) throw error;

      res.json({
        success: true,
        data: categories
      } as ApiResponse);
    } catch (error) {
      console.error('Get all CPD categories error:', error);
      res.status(500).json({
        success: false,
        error: ERROR_MESSAGES.SERVER_ERROR
      } as ApiResponse);
    }
  }

  // Admin-only: Create new category
  async createCategory(req: AuthRequest, res: Response) {
    try {
      // Only admins and super admins can create categories
      if (req.user?.userType !== USER_TYPES.SUPER_ADMIN && req.user?.userType !== USER_TYPES.ADMIN) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Admin privileges required.'
        } as ApiResponse);
      }

      const { name, points_per_hour, description } = req.body;

      // Validate points_per_hour
      if (points_per_hour < 1 || points_per_hour > 30) {
        return res.status(400).json({
          success: false,
          error: 'Points per hour must be between 1 and 30'
        } as ApiResponse);
      }

      const { data: category, error } = await supabaseAdmin
        .from('cpd_categories')
        .insert({
          name,
          points_per_hour,
          description,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({
        success: true,
        data: category,
        message: 'Category created successfully'
      } as ApiResponse);
    } catch (error) {
      console.error('Create CPD category error:', error);
      res.status(500).json({
        success: false,
        error: ERROR_MESSAGES.SERVER_ERROR
      } as ApiResponse);
    }
  }

  // Admin-only: Update category
  async updateCategory(req: AuthRequest, res: Response) {
    try {
      // Only admins and super admins can update categories
      if (req.user?.userType !== USER_TYPES.SUPER_ADMIN && req.user?.userType !== USER_TYPES.ADMIN) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Admin privileges required.'
        } as ApiResponse);
      }

      const { id } = req.params;
      const { name, points_per_hour, description, is_active } = req.body;

      // Validate points_per_hour if provided
      if (points_per_hour !== undefined && (points_per_hour < 1 || points_per_hour > 30)) {
        return res.status(400).json({
          success: false,
          error: 'Points per hour must be between 1 and 30'
        } as ApiResponse);
      }

      const updateData: any = { updated_at: new Date().toISOString() };
      if (name !== undefined) updateData.name = name;
      if (points_per_hour !== undefined) updateData.points_per_hour = points_per_hour;
      if (description !== undefined) updateData.description = description;
      if (is_active !== undefined) updateData.is_active = is_active;

      const { data: category, error } = await supabaseAdmin
        .from('cpd_categories')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      res.json({
        success: true,
        data: category,
        message: 'Category updated successfully'
      } as ApiResponse);
    } catch (error) {
      console.error('Update CPD category error:', error);
      res.status(500).json({
        success: false,
        error: ERROR_MESSAGES.SERVER_ERROR
      } as ApiResponse);
    }
  }

  // Admin-only: Delete category
  async deleteCategory(req: AuthRequest, res: Response) {
    try {
      // Only admins and super admins can delete categories
      if (req.user?.userType !== USER_TYPES.SUPER_ADMIN && req.user?.userType !== USER_TYPES.ADMIN) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Admin privileges required.'
        } as ApiResponse);
      }

      const { id } = req.params;

      // Check if category is being used
      const { data: activities, error: checkError } = await supabaseAdmin
        .from('cpd_activities')
        .select('id')
        .eq('cpd_category', id)
        .limit(1);

      if (checkError) throw checkError;

      if (activities && activities.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete category that is being used by CPD activities. Consider deactivating it instead.'
        } as ApiResponse);
      }

      const { error } = await supabaseAdmin
        .from('cpd_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      res.json({
        success: true,
        message: 'Category deleted successfully'
      } as ApiResponse);
    } catch (error) {
      console.error('Delete CPD category error:', error);
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
import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/database';
import { AuthRequest, ApiResponse, Institution } from '../types';
import { ERROR_MESSAGES, USER_TYPES, INSTITUTION_STATUS } from '../config/constants';

export class InstitutionsController {
  async list(req: AuthRequest, res: Response) {
    try {
      const { page = 1, limit = 10, status, membershipType } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      let query = supabaseAdmin
        .from('institutions')
        .select('*', { count: 'exact' });

      // Apply filters
      if (status) {
        query = query.eq('status', status);
      }
      if (membershipType) {
        query = query.eq('membership_type', membershipType);
      }

      // Only show user's own institution if not super admin
      if (req.user?.userType !== USER_TYPES.SUPER_ADMIN && req.user?.institutionId) {
        query = query.eq('id', req.user.institutionId);
      }

      const { data: institutions, error, count } = await query
        .range(offset, offset + Number(limit) - 1)
        .order('created_at', { ascending: false });

      if (error) throw error;

      res.json({
        success: true,
        data: {
          institutions,
          pagination: {
            total: count,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil((count || 0) / Number(limit))
          }
        }
      } as ApiResponse);
    } catch (error) {
      console.error('List institutions error:', error);
      res.status(500).json({
        success: false,
        error: ERROR_MESSAGES.SERVER_ERROR
      } as ApiResponse);
    }
  }

  async getById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      // Check permissions
      if (req.user?.userType !== USER_TYPES.SUPER_ADMIN && 
          req.user?.institutionId !== id) {
        return res.status(403).json({
          success: false,
          error: 'You can only view your own institution'
        } as ApiResponse);
      }

      const { data: institution, error } = await supabaseAdmin
        .from('institutions')
        .select(`
          *,
          members:members(count),
          payments:institution_payments(
            id,
            amount,
            status,
            payment_date,
            period_start,
            period_end
          )
        `)
        .eq('id', id)
        .single();

      if (error || !institution) {
        return res.status(404).json({
          success: false,
          error: ERROR_MESSAGES.INSTITUTION_NOT_FOUND
        } as ApiResponse);
      }

      res.json({
        success: true,
        data: institution
      } as ApiResponse);
    } catch (error) {
      console.error('Get institution error:', error);
      res.status(500).json({
        success: false,
        error: ERROR_MESSAGES.SERVER_ERROR
      } as ApiResponse);
    }
  }

  async create(req: AuthRequest, res: Response) {
    try {
      // Only super admins can create institutions
      if (req.user?.userType !== USER_TYPES.SUPER_ADMIN) {
        return res.status(403).json({
          success: false,
          error: 'Only super admins can create institutions'
        } as ApiResponse);
      }

      const institutionData = {
        ...req.body,
        status: INSTITUTION_STATUS.PENDING,
        created_at: new Date().toISOString(),
        created_by: req.user.id
      };

      const { data: institution, error } = await supabaseAdmin
        .from('institutions')
        .insert(institutionData)
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({
        success: true,
        data: institution
      } as ApiResponse);
    } catch (error) {
      console.error('Create institution error:', error);
      res.status(500).json({
        success: false,
        error: ERROR_MESSAGES.SERVER_ERROR
      } as ApiResponse);
    }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      // Check permissions
      const canEdit = req.user?.userType === USER_TYPES.SUPER_ADMIN ||
        (req.user?.userType === USER_TYPES.INSTITUTION_ADMIN && req.user?.institutionId === id);

      if (!canEdit) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions to update institution'
        } as ApiResponse);
      }

      // Institution admins can only update certain fields
      let updateData = req.body;
      if (req.user?.userType === USER_TYPES.INSTITUTION_ADMIN) {
        const allowedFields = [
          'primary_contact_name', 'primary_contact_email', 'primary_contact_phone',
          'billing_email', 'address_line1', 'address_line2', 'city', 'state',
          'postal_code', 'notes'
        ];
        updateData = Object.keys(updateData)
          .filter(key => allowedFields.includes(key))
          .reduce((obj, key) => ({ ...obj, [key]: updateData[key] }), {});
      }

      updateData.updated_at = new Date().toISOString();
      updateData.updated_by = req.user?.id;

      const { data: institution, error } = await supabaseAdmin
        .from('institutions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      res.json({
        success: true,
        data: institution
      } as ApiResponse);
    } catch (error) {
      console.error('Update institution error:', error);
      res.status(500).json({
        success: false,
        error: ERROR_MESSAGES.SERVER_ERROR
      } as ApiResponse);
    }
  }

  async getMembers(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      // Check permissions
      if (req.user?.userType !== USER_TYPES.SUPER_ADMIN && 
          req.user?.institutionId !== id) {
        return res.status(403).json({
          success: false,
          error: 'You can only view members from your own institution'
        } as ApiResponse);
      }

      const { data: members, error, count } = await supabaseAdmin
        .from('members')
        .select('*', { count: 'exact' })
        .eq('institution_id', id)
        .range(offset, offset + Number(limit) - 1)
        .order('created_at', { ascending: false });

      if (error) throw error;

      res.json({
        success: true,
        data: {
          members,
          pagination: {
            total: count,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil((count || 0) / Number(limit))
          }
        }
      } as ApiResponse);
    } catch (error) {
      console.error('Get institution members error:', error);
      res.status(500).json({
        success: false,
        error: ERROR_MESSAGES.SERVER_ERROR
      } as ApiResponse);
    }
  }

  async getStatistics(req: AuthRequest, res: Response) {
    try {
      // Only super admins can view overall statistics
      if (req.user?.userType !== USER_TYPES.SUPER_ADMIN) {
        return res.status(403).json({
          success: false,
          error: 'Only super admins can view statistics'
        } as ApiResponse);
      }

      // Get counts by status
      const { data: statusCounts } = await supabaseAdmin
        .from('institutions')
        .select('status')
        .then(result => {
          const counts: Record<string, number> = {};
          result.data?.forEach(inst => {
            counts[inst.status] = (counts[inst.status] || 0) + 1;
          });
          return { data: counts };
        });

      // Get counts by membership type
      const { data: typeCounts } = await supabaseAdmin
        .from('institutions')
        .select('membership_type')
        .then(result => {
          const counts: Record<string, number> = {};
          result.data?.forEach(inst => {
            counts[inst.membership_type] = (counts[inst.membership_type] || 0) + 1;
          });
          return { data: counts };
        });

      // Get payment statistics
      const { data: paymentStats } = await supabaseAdmin
        .from('institutions')
        .select('payment_status')
        .then(result => {
          const counts: Record<string, number> = {};
          result.data?.forEach(inst => {
            if (inst.payment_status) {
              counts[inst.payment_status] = (counts[inst.payment_status] || 0) + 1;
            }
          });
          return { data: counts };
        });

      // Get total members across all institutions
      const { count: totalMembers } = await supabaseAdmin
        .from('members')
        .select('*', { count: 'exact', head: true })
        .not('institution_id', 'is', null);

      res.json({
        success: true,
        data: {
          byStatus: statusCounts,
          byType: typeCounts,
          byPaymentStatus: paymentStats,
          totalMembers
        }
      } as ApiResponse);
    } catch (error) {
      console.error('Get statistics error:', error);
      res.status(500).json({
        success: false,
        error: ERROR_MESSAGES.SERVER_ERROR
      } as ApiResponse);
    }
  }
}
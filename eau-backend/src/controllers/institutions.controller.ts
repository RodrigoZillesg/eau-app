import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/database';
import { AuthRequest, ApiResponse, Institution } from '../types';
import { ERROR_MESSAGES, USER_TYPES, INSTITUTION_STATUS } from '../config/constants';

export class InstitutionsController {
  async list(req: AuthRequest, res: Response) {
    try {
      const { page = 1, limit = 10, status, membershipType, forLinking, withCounts } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      // Special mode: listing institutions for linking (available to all members)
      if (forLinking === 'true') {
        // Simple query without aggregations for linking mode
        let query = supabaseAdmin
          .from('institutions')
          .select('*', { count: 'exact' })
          .eq('membership_status', 'active');

        // Apply filters
        if (status) {
          query = query.eq('status', status);
        }
        if (membershipType) {
          query = query.eq('membership_type', membershipType);
        }

        // For linking mode, return ALL institutions sorted by name
        const { data: institutions, error, count } = await query
          .order('name', { ascending: true }); // Sort alphabetically for better UX

        if (error) throw error;

        return res.json({
          success: true,
          data: {
            institutions,
            pagination: {
              total: count,
              page: 1,
              limit: count || 0,
              totalPages: 1
            }
          }
        } as ApiResponse);
      }

      // Default list mode with member counts (for admin pages)
      console.log('🔍 List institutions - withCounts:', withCounts, 'userType:', req.user?.userType);

      // Build select query with aggregations if withCounts is true
      const selectQuery = withCounts === 'true'
        ? '*, members(count)'
        : '*';

      let query = supabaseAdmin
        .from('institutions')
        .select(selectQuery, { count: 'exact' });

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
        .order('name', { ascending: true });

      if (error) {
        console.error('❌ Query error:', error);
        throw error;
      }

      console.log('🔍 Query result:', {
        count: institutions?.length,
        hasAggregations: withCounts === 'true'
      });

      // If withCounts is true, get active member counts separately
      let processedInstitutions: any = institutions;

      if (withCounts === 'true' && institutions) {
        // Get active member counts for all institutions
        // Supabase has a hard limit of 1000 records per query
        // We need to use pagination to fetch ALL active members
        console.log('🔄 Fetching ALL active members using pagination...');

        let allActiveMembers: any[] = [];
        let page = 0;
        const pageSize = 1000;
        let hasMore = true;

        while (hasMore) {
          const from = page * pageSize;
          const to = from + pageSize - 1;

          const { data: chunk, error: chunkError } = await supabaseAdmin
            .from('members')
            .select('institution_id')
            .eq('membership_status', 'active')
            .range(from, to);

          if (chunkError) {
            console.error(`❌ Error fetching page ${page}:`, chunkError);
            break;
          }

          if (chunk && chunk.length > 0) {
            allActiveMembers = allActiveMembers.concat(chunk);
            console.log(`📄 Page ${page}: ${chunk.length} members (total so far: ${allActiveMembers.length})`);

            // If we got less than pageSize, we've reached the end
            if (chunk.length < pageSize) {
              hasMore = false;
            } else {
              page++;
            }
          } else {
            hasMore = false;
          }
        }

        console.log('✅ Total active members fetched:', allActiveMembers.length);

        // Count active members per institution
        const activeCountMap: Record<string, number> = {};
        allActiveMembers.forEach(member => {
          if (member.institution_id) {
            activeCountMap[member.institution_id] = (activeCountMap[member.institution_id] || 0) + 1;
          }
        });

        // Process institutions to include counts
        processedInstitutions = (institutions as any[]).map((inst: any) => ({
          ...inst,
          member_count: inst.members?.[0]?.count || 0,
          active_memberships: activeCountMap[inst.id] || 0,
          // Remove aggregation array from response
          members: undefined
        }));

        // Log first institution for debugging
        console.log('🔍 Sample institution data:', JSON.stringify(processedInstitutions[0], null, 2));
        console.log('🔍 Total institutions:', processedInstitutions.length);
      }

      res.json({
        success: true,
        data: {
          institutions: processedInstitutions,
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
      console.log('🔍 getById - Institution ID:', id);
      console.log('🔍 getById - User:', req.user?.id, 'Type:', req.user?.userType, 'Institution:', req.user?.institutionId);

      // Check permissions
      if (req.user?.userType !== USER_TYPES.SUPER_ADMIN &&
          req.user?.institutionId !== id) {
        console.log('❌ Permission denied - User can only view their own institution');
        return res.status(403).json({
          success: false,
          error: 'You can only view your own institution'
        } as ApiResponse);
      }

      console.log('🔍 Executing query with aggregation...');
      const { data: institution, error } = await supabaseAdmin
        .from('institutions')
        .select(`
          *,
          members:members(count)
        `)
        .eq('id', id)
        .single();

      console.log('🔍 Query result:', {
        hasData: !!institution,
        hasError: !!error,
        institution: institution ? 'exists' : 'null',
        error: error
      });

      if (error) {
        console.error('❌ Supabase error details:', JSON.stringify(error, null, 2));
      }

      if (error || !institution) {
        console.error('❌ Returning 404 - Institution not found or error occurred');
        return res.status(404).json({
          success: false,
          error: ERROR_MESSAGES.INSTITUTION_NOT_FOUND
        } as ApiResponse);
      }

      console.log('✅ Institution found successfully');
      res.json({
        success: true,
        data: institution
      } as ApiResponse);
    } catch (error) {
      console.error('❌ Exception in getById:', error);
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
          'email', 'phone', 'website',
          'address', 'city', 'state', 'postal_code'
        ];
        updateData = Object.keys(updateData)
          .filter(key => allowedFields.includes(key))
          .reduce((obj, key) => ({ ...obj, [key]: updateData[key] }), {});
      }

      updateData.updated_at = new Date().toISOString();

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
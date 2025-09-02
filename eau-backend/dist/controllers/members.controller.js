"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MembersController = void 0;
const database_1 = require("../config/database");
const constants_1 = require("../config/constants");
class MembersController {
    async list(req, res) {
        try {
            const { page = 1, limit = 10, search, membershipType, interestGroup, institutionId } = req.query;
            const offset = (Number(page) - 1) * Number(limit);
            let query = database_1.supabaseAdmin
                .from('members')
                .select(`
          *,
          institutions (
            id,
            name,
            membership_type
          )
        `, { count: 'exact' });
            // Apply filters based on user permissions
            if (req.user?.userType !== constants_1.USER_TYPES.SUPER_ADMIN) {
                if (req.user?.institutionId) {
                    query = query.eq('institution_id', req.user.institutionId);
                }
                else {
                    // If user has no institution, they can only see themselves
                    query = query.eq('id', req.user?.id);
                }
            }
            else if (institutionId) {
                // Super admin can filter by institution
                query = query.eq('institution_id', institutionId);
            }
            // Apply search filter
            if (search) {
                query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
            }
            // Apply other filters
            if (membershipType) {
                query = query.eq('membership_type', membershipType);
            }
            if (interestGroup) {
                query = query.eq('interest_group', interestGroup);
            }
            const { data: members, error, count } = await query
                .range(offset, offset + Number(limit) - 1)
                .order('created_at', { ascending: false });
            if (error)
                throw error;
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
            });
        }
        catch (error) {
            console.error('List members error:', error);
            res.status(500).json({
                success: false,
                error: constants_1.ERROR_MESSAGES.SERVER_ERROR
            });
        }
    }
    async getById(req, res) {
        try {
            const { id } = req.params;
            // Check permissions
            const canView = req.user?.userType === constants_1.USER_TYPES.SUPER_ADMIN ||
                req.user?.id === id ||
                (req.user?.userType === constants_1.USER_TYPES.INSTITUTION_ADMIN &&
                    req.user?.institutionId);
            if (!canView) {
                return res.status(403).json({
                    success: false,
                    error: 'Insufficient permissions'
                });
            }
            const { data: member, error } = await database_1.supabaseAdmin
                .from('members')
                .select(`
          *,
          institutions (
            id,
            name,
            membership_type,
            status
          )
        `)
                .eq('id', id)
                .single();
            if (error || !member) {
                return res.status(404).json({
                    success: false,
                    error: constants_1.ERROR_MESSAGES.USER_NOT_FOUND
                });
            }
            // If institution admin, verify they can see this member
            if (req.user?.userType === constants_1.USER_TYPES.INSTITUTION_ADMIN &&
                member.institution_id !== req.user.institutionId) {
                return res.status(403).json({
                    success: false,
                    error: 'You can only view members from your institution'
                });
            }
            res.json({
                success: true,
                data: member
            });
        }
        catch (error) {
            console.error('Get member error:', error);
            res.status(500).json({
                success: false,
                error: constants_1.ERROR_MESSAGES.SERVER_ERROR
            });
        }
    }
    async update(req, res) {
        try {
            const { id } = req.params;
            // Check permissions
            const canEdit = req.user?.userType === constants_1.USER_TYPES.SUPER_ADMIN ||
                req.user?.id === id ||
                (req.user?.userType === constants_1.USER_TYPES.INSTITUTION_ADMIN);
            if (!canEdit) {
                return res.status(403).json({
                    success: false,
                    error: 'Insufficient permissions'
                });
            }
            // Get current member data for permission checks
            const { data: currentMember } = await database_1.supabaseAdmin
                .from('members')
                .select('institution_id, user_type')
                .eq('id', id)
                .single();
            if (!currentMember) {
                return res.status(404).json({
                    success: false,
                    error: constants_1.ERROR_MESSAGES.USER_NOT_FOUND
                });
            }
            // Institution admins can only edit members from their institution
            if (req.user?.userType === constants_1.USER_TYPES.INSTITUTION_ADMIN &&
                currentMember.institution_id !== req.user.institutionId) {
                return res.status(403).json({
                    success: false,
                    error: 'You can only edit members from your institution'
                });
            }
            // Prepare update data based on user permissions
            let updateData = req.body;
            if (req.user?.userType !== constants_1.USER_TYPES.SUPER_ADMIN) {
                // Non-super admins cannot change certain sensitive fields
                const restrictedFields = ['user_type', 'institution_id', 'membership_type', 'membership_status'];
                updateData = Object.keys(updateData)
                    .filter(key => !restrictedFields.includes(key))
                    .reduce((obj, key) => ({ ...obj, [key]: updateData[key] }), {});
            }
            updateData.updated_at = new Date().toISOString();
            const { data: member, error } = await database_1.supabaseAdmin
                .from('members')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();
            if (error)
                throw error;
            res.json({
                success: true,
                data: member
            });
        }
        catch (error) {
            console.error('Update member error:', error);
            res.status(500).json({
                success: false,
                error: constants_1.ERROR_MESSAGES.SERVER_ERROR
            });
        }
    }
    async getStatistics(req, res) {
        try {
            let baseQuery = database_1.supabaseAdmin.from('members').select('*');
            // Apply permission-based filtering
            if (req.user?.userType !== constants_1.USER_TYPES.SUPER_ADMIN) {
                if (req.user?.institutionId) {
                    baseQuery = baseQuery.eq('institution_id', req.user.institutionId);
                }
                else {
                    return res.status(403).json({
                        success: false,
                        error: 'Insufficient permissions'
                    });
                }
            }
            // Get counts by membership type
            const { data: membershipTypeCounts } = await baseQuery
                .select('membership_type')
                .then(result => {
                const counts = {};
                result.data?.forEach(member => {
                    if (member.membership_type) {
                        counts[member.membership_type] = (counts[member.membership_type] || 0) + 1;
                    }
                });
                return { data: counts };
            });
            // Get counts by interest group
            const { data: interestGroupCounts } = await baseQuery
                .select('interest_group')
                .then(result => {
                const counts = {};
                result.data?.forEach(member => {
                    if (member.interest_group) {
                        counts[member.interest_group] = (counts[member.interest_group] || 0) + 1;
                    }
                });
                return { data: counts };
            });
            // Get counts by membership status
            const { data: statusCounts } = await baseQuery
                .select('membership_status')
                .then(result => {
                const counts = {};
                result.data?.forEach(member => {
                    if (member.membership_status) {
                        counts[member.membership_status] = (counts[member.membership_status] || 0) + 1;
                    }
                });
                return { data: counts };
            });
            // Get total count
            const { count: totalMembers } = await database_1.supabaseAdmin
                .from('members')
                .select('*', { count: 'exact', head: true });
            res.json({
                success: true,
                data: {
                    total: totalMembers,
                    byMembershipType: membershipTypeCounts,
                    byInterestGroup: interestGroupCounts,
                    byStatus: statusCounts
                }
            });
        }
        catch (error) {
            console.error('Get member statistics error:', error);
            res.status(500).json({
                success: false,
                error: constants_1.ERROR_MESSAGES.SERVER_ERROR
            });
        }
    }
    async exportCsv(req, res) {
        try {
            // Check permissions
            if (req.user?.userType !== constants_1.USER_TYPES.SUPER_ADMIN &&
                req.user?.userType !== constants_1.USER_TYPES.INSTITUTION_ADMIN) {
                return res.status(403).json({
                    success: false,
                    error: 'Only admins can export member data'
                });
            }
            let query = database_1.supabaseAdmin
                .from('members')
                .select(`
          id,
          email,
          full_name,
          first_name,
          last_name,
          phone,
          membership_type,
          membership_status,
          interest_group,
          cpd_points_current_year,
          created_at,
          institutions (
            name,
            membership_type
          )
        `);
            // Apply permission-based filtering
            if (req.user?.userType === constants_1.USER_TYPES.INSTITUTION_ADMIN && req.user?.institutionId) {
                query = query.eq('institution_id', req.user.institutionId);
            }
            const { data: members, error } = await query
                .order('full_name', { ascending: true });
            if (error)
                throw error;
            // Convert to CSV format
            const csvHeaders = [
                'ID',
                'Email',
                'Full Name',
                'First Name',
                'Last Name',
                'Phone',
                'Institution',
                'Institution Type',
                'Membership Type',
                'Status',
                'Interest Group',
                'CPD Points (Current Year)',
                'Created At'
            ];
            const csvRows = members?.map(member => [
                member.id,
                member.email,
                member.full_name || '',
                member.first_name || '',
                member.last_name || '',
                member.phone || '',
                member.institutions?.name || '',
                member.institutions?.membership_type || '',
                member.membership_type || '',
                member.membership_status || '',
                member.interest_group || '',
                member.cpd_points_current_year || 0,
                new Date(member.created_at).toISOString().split('T')[0]
            ]) || [];
            const csvContent = [csvHeaders, ...csvRows]
                .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
                .join('\n');
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="members-export.csv"');
            res.send(csvContent);
        }
        catch (error) {
            console.error('Export CSV error:', error);
            res.status(500).json({
                success: false,
                error: constants_1.ERROR_MESSAGES.SERVER_ERROR
            });
        }
    }
}
exports.MembersController = MembersController;
//# sourceMappingURL=members.controller.js.map
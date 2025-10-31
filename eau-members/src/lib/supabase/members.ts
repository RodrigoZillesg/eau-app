import { supabase } from './client'
import { adminClient } from './adminClient'
import { MembersDemoService } from './membersDemo'
import type { Database, MembershipStatus, MembershipType, MemberRole } from '../../types/supabase'

type Member = Database['public']['Tables']['members']['Row']
type MemberInsert = Database['public']['Tables']['members']['Insert']
type MemberUpdate = Database['public']['Tables']['members']['Update']

// member_roles table doesn't exist, using user_type with fallback roles
export type MemberWithRoles = Member & {
  member_roles: Array<{ id: string; role: string; member_id: string }>
}

// Convert user_type to roles array (maintaining system pillars)
function userTypeToRoles(userType: string | null): Array<{ id: string; role: string; member_id: string }> {
  if (!userType) return []

  // Map user_type to displayable roles (following system conventions)
  const roleMap: Record<string, string> = {
    'super_admin': 'Super Admin',
    'admin': 'Institution Admin',
    'institution_admin': 'Institution Admin',
    'staff': 'Staff',
    'member': 'Member'
  }

  const displayRole = roleMap[userType] || userType

  return [{
    id: `${userType}_role`,
    role: displayRole,
    member_id: '' // Not needed for display
  }]
}

export class MembersService {
  // Verificar se o Supabase está disponível
  private static async isSupabaseAvailable(): Promise<boolean> {
    try {
      const { error } = await supabase.from('members').select('id').limit(1)
      return !error
    } catch {
      return false
    }
  }

  // Buscar todos os membros
  static async getAllMembers(): Promise<Member[]> {
    const isAvailable = await this.isSupabaseAvailable()
    if (!isAvailable) {
      console.warn('Supabase não disponível, usando modo demo')
      return MembersDemoService.getAllMembers()
    }

    // Use adminClient for admin operations to bypass RLS
    const { data, error } = await adminClient
      .from('members')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Erro ao buscar membros: ${error.message}`)
    }

    return data || []
  }

  // Buscar membro por ID
  static async getMemberById(id: string): Promise<Member | null> {
    const isAvailable = await this.isSupabaseAvailable()
    if (!isAvailable) {
      return MembersDemoService.getMemberById(id)
    }

    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Não encontrado
      }
      throw new Error(`Erro ao buscar membro: ${error.message}`)
    }

    return data
  }

  // Buscar membro por email
  static async getMemberByEmail(email: string): Promise<Member | null> {
    const isAvailable = await this.isSupabaseAvailable()
    if (!isAvailable) {
      return MembersDemoService.getMemberByEmail(email)
    }

    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('email', email)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Não encontrado
      }
      throw new Error(`Erro ao buscar membro: ${error.message}`)
    }

    return data
  }

  // Public helper function for batch operations (import systems)
  static async ensureAuthUserForMember(email: string, firstName: string = '', lastName: string = ''): Promise<string> {
    return this.createAuthUserForMember(email, firstName, lastName)
  }

  // Helper function to create auth user for member
  private static async createAuthUserForMember(email: string, firstName: string, lastName: string): Promise<string> {
    try {
      // Check if auth user already exists
      const { data: authUsers } = await supabase.auth.admin.listUsers()
      const existingUser = authUsers.users.find(u => u.email === email)

      if (existingUser) {
        console.log(`Auth user already exists for ${email}, linking existing user`)
        return existingUser.id
      }

      // Create new auth user
      const fullName = `${firstName || ''} ${lastName || ''}`.trim() || email
      const { data: newUser, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: 'EAU2025temp!', // Default password - users can reset
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          role: 'Member'
        }
      })

      if (authError) {
        throw new Error(`Failed to create auth user: ${authError.message}`)
      }

      console.log(`Created auth user for ${email}: ${newUser.user.id}`)
      return newUser.user.id

    } catch (error) {
      console.error('Error creating auth user:', error)
      throw error
    }
  }

  // Criar novo membro
  static async createMember(memberData: MemberInsert): Promise<Member> {
    const isAvailable = await this.isSupabaseAvailable()
    if (!isAvailable) {
      return MembersDemoService.createMember(memberData)
    }

    const { data: user } = await supabase.auth.getUser()

    // CRITICAL FIX: Always create auth user and user_id for new members
    let userId: string | undefined = memberData.user_id

    if (!userId && memberData.email) {
      try {
        userId = await this.createAuthUserForMember(
          memberData.email,
          memberData.first_name || '',
          memberData.last_name || ''
        )
        console.log(`✅ Created auth user for new member: ${memberData.email} -> ${userId}`)
      } catch (error) {
        console.error(`❌ Failed to create auth user for ${memberData.email}:`, error)
        // Continue without user_id rather than failing completely
        // This maintains backward compatibility while highlighting the issue
      }
    }

    const newMember: MemberInsert = {
      ...memberData,
      user_id: userId, // Always include user_id when available
      created_by: user.user?.id,
      updated_by: user.user?.id
    }

    const { data, error } = await supabase
      .from('members')
      .insert(newMember)
      .select()
      .single()

    if (error) {
      throw new Error(`Erro ao criar membro: ${error.message}`)
    }

    // Registrar no histórico
    await this.addMemberHistory(data.id, 'created', { member: memberData })

    return data
  }

  // Atualizar membro
  static async updateMember(id: string, updates: MemberUpdate): Promise<Member> {
    const { data: user } = await supabase.auth.getUser()
    
    const updateData: MemberUpdate = {
      ...updates,
      updated_by: user.user?.id
    }

    const { data, error } = await supabase
      .from('members')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Erro ao atualizar membro: ${error.message}`)
    }

    // Registrar no histórico
    await this.addMemberHistory(id, 'updated', { updates })

    return data
  }

  // Deletar membro
  static async deleteMember(id: string): Promise<void> {
    // Try to add history BEFORE deleting (while member still exists)
    try {
      await this.addMemberHistory(id, 'deleted', {})
    } catch (err) {
      // Log but don't fail the deletion if history fails
      console.log('Could not add deletion to history:', err)
    }

    const { error } = await supabase
      .from('members')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Erro ao deletar membro: ${error.message}`)
    }
  }
  
  // Deletar múltiplos membros de uma vez (mais eficiente)
  static async deleteMultipleMembers(ids: string[]): Promise<{ success: number; failed: number }> {
    if (ids.length === 0) return { success: 0, failed: 0 }
    
    // Try to delete all at once using IN operator
    const { error } = await supabase
      .from('members')
      .delete()
      .in('id', ids)
    
    if (error) {
      // If bulk delete fails, fall back to individual deletes
      console.error('Bulk delete failed, falling back to individual deletes:', error)
      let success = 0
      let failed = 0
      
      for (const id of ids) {
        try {
          await this.deleteMember(id)
          success++
        } catch (err) {
          console.error(`Failed to delete member ${id}:`, err)
          failed++
        }
      }
      
      return { success, failed }
    }
    
    // All deleted successfully
    return { success: ids.length, failed: 0 }
  }

  // Buscar membros com filtros
  static async searchMembers(filters: {
    search?: string
    status?: MembershipStatus
    type?: MembershipType
    limit?: number
    offset?: number
  }): Promise<Member[]> {
    const isAvailable = await this.isSupabaseAvailable()
    if (!isAvailable) {
      return MembersDemoService.searchMembers(filters)
    }

    // Use adminClient for admin searches to bypass RLS
    let query = adminClient
      .from('members')
      .select('*')

    if (filters.search) {
      query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
    }

    if (filters.status) {
      query = query.eq('membership_status', filters.status)
    }

    if (filters.type) {
      query = query.eq('membership_type', filters.type)
    }

    if (filters.limit) {
      query = query.limit(filters.limit)
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
    }

    query = query.order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) {
      throw new Error(`Erro ao buscar membros: ${error.message}`)
    }

    return data || []
  }

  // Pesquisar membros com paginação
  static async searchMembersPaginated(filters: {
    search?: string
    status?: MembershipStatus
    type?: MembershipType
    interestGroup?: string
    city?: string
    state?: string
    hasRoles?: boolean
    roleFilter?: 'all' | 'super_admin' | 'institution_admin' | 'staff' | 'no_roles'
    institutionId?: string | null // Add institution filter
    page: number
    pageSize: number
  }): Promise<{ data: Member[], count: number }> {
    const isAvailable = await this.isSupabaseAvailable()
    if (!isAvailable) {
      // For demo mode, return paginated data
      const allData = await MembersDemoService.searchMembers(filters)
      const start = (filters.page - 1) * filters.pageSize
      const end = start + filters.pageSize
      return {
        data: allData.slice(start, end),
        count: allData.length
      }
    }

    // Use adminClient for admin searches to bypass RLS
    let query = adminClient
      .from('members')
      .select('*', { count: 'exact' })

    // Apply institution filter if provided
    if (filters.institutionId !== undefined) {
      if (filters.institutionId === null) {
        // Super admin - no filter needed, show all
      } else {
        // Institution admin - filter by institution
        query = query.eq('institution_id', filters.institutionId)
      }
    }

    if (filters.search) {
      query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
    }

    if (filters.status) {
      query = query.eq('membership_status', filters.status)
    }

    if (filters.type) {
      query = query.eq('membership_type', filters.type)
    }

    if (filters.interestGroup) {
      query = query.eq('interest_group', filters.interestGroup)
    }

    if (filters.city) {
      query = query.ilike('city', `%${filters.city}%`)
    }

    if (filters.state) {
      query = query.ilike('state', `%${filters.state}%`)
    }

    // For role filtering, we'll use a database-level filter for efficiency
    if (filters.roleFilter && filters.roleFilter !== 'all') {
      // Apply role filter directly in the database query
      switch (filters.roleFilter) {
        case 'no_roles':
          // Filter for members with no user_type or just 'member' type
          query = query.or('user_type.is.null,user_type.eq.member')
          break
        case 'super_admin':
          // Filter for super admin only
          query = query.eq('user_type', 'super_admin')
          break
        case 'admin':
          // Filter for system admins only
          query = query.eq('user_type', 'admin')
          break
        case 'institution_admin':
          // Filter for institution admins only
          query = query.eq('user_type', 'institution_admin')
          break
        case 'board_member':
          // Filter for board members only
          query = query.eq('user_type', 'board_member')
          break
        case 'affiliate':
          // Filter for affiliates only
          query = query.eq('user_type', 'affiliate')
          break
        case 'staff':
          // Legacy - filter for staff user type
          query = query.eq('user_type', 'staff')
          break
      }

      query = query.order('created_at', { ascending: false })
      const { data: allData, error } = await query

      if (error) {
        throw new Error(`Erro ao pesquisar membros: ${error.message}`)
      }

      let filteredData = allData || []

      // Apply hasRoles filter if needed (should be rare since we already filtered by role)
      if (filters.hasRoles) {
        filteredData = filteredData.filter(m => m.user_type && m.user_type !== 'member')
      }

      // Apply pagination to filtered data
      const from = (filters.page - 1) * filters.pageSize
      const to = from + filters.pageSize
      const paginatedData = filteredData.slice(from, to)

      // Transform members to include member_roles from user_type
      const transformedData: MemberWithRoles[] = paginatedData.map(member => ({
        ...member,
        member_roles: userTypeToRoles(member.user_type)
      }))

      return {
        data: transformedData,
        count: filteredData.length
      }
    }

    // Apply hasRoles filter if needed (without specific role)
    if (filters.hasRoles) {
      // Get all members to filter by role presence
      query = query.order('created_at', { ascending: false })
      const { data: allData, error } = await query

      if (error) {
        throw new Error(`Erro ao pesquisar membros: ${error.message}`)
      }

      const filteredData = (allData || []).filter(m => m.user_type && m.user_type !== 'member')

      // Apply pagination to filtered data
      const from = (filters.page - 1) * filters.pageSize
      const to = from + filters.pageSize
      const paginatedData = filteredData.slice(from, to)

      // Transform members to include member_roles from user_type
      const transformedData: MemberWithRoles[] = paginatedData.map(member => ({
        ...member,
        member_roles: userTypeToRoles(member.user_type)
      }))

      return {
        data: transformedData,
        count: filteredData.length
      }
    }

    // Standard pagination for non-role filters
    const from = (filters.page - 1) * filters.pageSize
    const to = from + filters.pageSize - 1

    query = query
      .range(from, to)
      .order('created_at', { ascending: false })

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Erro ao pesquisar membros: ${error.message}`)
    }

    // Transform members to include member_roles from user_type
    const transformedData: MemberWithRoles[] = (data || []).map(member => ({
      ...member,
      member_roles: userTypeToRoles(member.user_type)
    }))

    return {
      data: transformedData,
      count: count || 0
    }
  }

  // Gerenciar roles do membro
  static async addMemberRole(memberId: string, role: MemberRole): Promise<void> {
    const { error } = await supabase
      .from('member_roles')
      .insert({
        member_id: memberId,
        role
      })

    if (error) {
      throw new Error(`Erro ao adicionar role: ${error.message}`)
    }

    await this.addMemberHistory(memberId, 'role_added', { role })
  }

  static async removeMemberRole(memberId: string, role: MemberRole): Promise<void> {
    const { error } = await supabase
      .from('member_roles')
      .delete()
      .eq('member_id', memberId)
      .eq('role', role)

    if (error) {
      throw new Error(`Erro ao remover role: ${error.message}`)
    }

    await this.addMemberHistory(memberId, 'role_removed', { role })
  }

  // Histórico do membro
  static async addMemberHistory(
    memberId: string, 
    action: string, 
    details: any
  ): Promise<void> {
    const { data: user } = await supabase.auth.getUser()
    
    const { error } = await supabase
      .from('member_history')
      .insert({
        member_id: memberId,
        action,
        details,
        performed_by: user.user?.id
      })

    if (error) {
      console.error('Erro ao adicionar histórico:', error.message)
      // Não lançamos erro aqui para não quebrar operações principais
    }
  }

  static async getMemberHistory(memberId: string) {
    const { data, error } = await supabase
      .from('member_history')
      .select('*')
      .eq('member_id', memberId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Erro ao buscar histórico: ${error.message}`)
    }

    return data || []
  }

  // Estatísticas
  static async getMemberStats(institutionId?: string | null) {
    const isAvailable = await this.isSupabaseAvailable()
    if (!isAvailable) {
      return MembersDemoService.getMemberStats()
    }

    // Use adminClient to bypass RLS restrictions for admin stats
    let totalQuery = adminClient.from('members').select('*', { count: 'exact', head: true })
    let activeQuery = adminClient.from('members').select('*', { count: 'exact', head: true })
    let newMonthQuery = adminClient.from('members').select('*', { count: 'exact', head: true })

    // Apply institution filter if provided (null means all, string means specific institution)
    if (institutionId !== undefined && institutionId !== null) {
      totalQuery = totalQuery.eq('institution_id', institutionId)
      activeQuery = activeQuery.eq('institution_id', institutionId)
      newMonthQuery = newMonthQuery.eq('institution_id', institutionId)
    }

    // Apply additional filters
    activeQuery = activeQuery.eq('membership_status', 'active')
    newMonthQuery = newMonthQuery.gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())

    // Execute queries
    const { count: totalMembers } = await totalQuery
    const { count: activeMembers } = await activeQuery
    const { count: newThisMonth } = await newMonthQuery

    return {
      total: totalMembers || 0,
      active: activeMembers || 0,
      newThisMonth: newThisMonth || 0,
      inactive: (totalMembers || 0) - (activeMembers || 0)
    }
  }
}
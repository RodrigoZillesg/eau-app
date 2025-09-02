import { supabase } from './client'
import { MembersDemoService } from './membersDemo'
import type { Database, MembershipStatus, MembershipType, MemberRole } from '../../types/supabase'

type Member = Database['public']['Tables']['members']['Row']
type MemberInsert = Database['public']['Tables']['members']['Insert']
type MemberUpdate = Database['public']['Tables']['members']['Update']
type MemberRoleRow = Database['public']['Tables']['member_roles']['Row']

export interface MemberWithRoles extends Member {
  member_roles: MemberRoleRow[]
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
  static async getAllMembers(): Promise<MemberWithRoles[]> {
    const isAvailable = await this.isSupabaseAvailable()
    if (!isAvailable) {
      console.warn('Supabase não disponível, usando modo demo')
      return MembersDemoService.getAllMembers()
    }

    const { data, error } = await supabase
      .from('members')
      .select(`
        *,
        member_roles (*)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Erro ao buscar membros: ${error.message}`)
    }

    return data || []
  }

  // Buscar membro por ID
  static async getMemberById(id: string): Promise<MemberWithRoles | null> {
    const isAvailable = await this.isSupabaseAvailable()
    if (!isAvailable) {
      return MembersDemoService.getMemberById(id)
    }

    const { data, error } = await supabase
      .from('members')
      .select(`
        *,
        member_roles (*)
      `)
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
  static async getMemberByEmail(email: string): Promise<MemberWithRoles | null> {
    const isAvailable = await this.isSupabaseAvailable()
    if (!isAvailable) {
      return MembersDemoService.getMemberByEmail(email)
    }

    const { data, error } = await supabase
      .from('members')
      .select(`
        *,
        member_roles (*)
      `)
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

  // Criar novo membro
  static async createMember(memberData: MemberInsert): Promise<Member> {
    const isAvailable = await this.isSupabaseAvailable()
    if (!isAvailable) {
      return MembersDemoService.createMember(memberData)
    }

    const { data: user } = await supabase.auth.getUser()
    
    const newMember: MemberInsert = {
      ...memberData,
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
  }): Promise<MemberWithRoles[]> {
    const isAvailable = await this.isSupabaseAvailable()
    if (!isAvailable) {
      return MembersDemoService.searchMembers(filters)
    }

    let query = supabase
      .from('members')
      .select(`
        *,
        member_roles (*)
      `)

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
    page: number
    pageSize: number
  }): Promise<{ data: MemberWithRoles[], count: number }> {
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

    // Build the query
    let query = supabase
      .from('members')
      .select(`
        *,
        member_roles (*)
      `, { count: 'exact' })

    if (filters.search) {
      query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
    }

    if (filters.status) {
      query = query.eq('membership_status', filters.status)
    }

    if (filters.type) {
      query = query.eq('membership_type', filters.type)
    }

    // Apply pagination
    const from = (filters.page - 1) * filters.pageSize
    const to = from + filters.pageSize - 1
    
    query = query
      .range(from, to)
      .order('created_at', { ascending: false })

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Erro ao pesquisar membros: ${error.message}`)
    }

    return {
      data: data || [],
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
  static async getMemberStats() {
    const isAvailable = await this.isSupabaseAvailable()
    if (!isAvailable) {
      return MembersDemoService.getMemberStats()
    }

    const { count: totalMembers } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true })

    const { count: activeMembers } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
      .eq('membership_status', 'active')

    const { count: newThisMonth } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())

    return {
      total: totalMembers || 0,
      active: activeMembers || 0,
      newThisMonth: newThisMonth || 0,
      inactive: (totalMembers || 0) - (activeMembers || 0)
    }
  }
}
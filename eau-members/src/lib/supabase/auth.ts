import { supabase } from './client'
import type { UserRole } from '../../types/permissions'
import { fetchUserRoles, fetchUserRolesByEmail } from '../../services/roleService'

export interface AuthUser {
  id: string
  email: string
  roles: UserRole[]
}

export class AuthService {
  // Mapear roles do banco para roles do sistema
  private static mapDatabaseRoleToSystemRole(dbRole: string): UserRole[] {
    const roleMapping: Record<string, UserRole[]> = {
      'member': ['Members'],
      'admin': ['Admin', 'Members'], // Admin também deve ter acesso de membro
      'super_admin': ['AdminSuper', 'Admin', 'Members'], // Super admin tem todos os acessos
      'moderator': ['Admin', 'Members'],
      'instructor': ['Members', 'MemberColleges']
    }
    
    return roleMapping[dbRole] || ['Members']
  }

  // Buscar roles do usuário - USA NOVO roleService
  static async getUserRoles(userId: string): Promise<UserRole[]> {
    try {
      // Use the roleService to get proper roles from database
      const roles = await fetchUserRoles(userId)
      console.log('Roles fetched for user:', userId, roles)
      return roles
    } catch (error) {
      console.warn('Error fetching roles:', error)
      return ['Members'] // Always return default role
    }
  }

  // Criar membro automaticamente após signup
  static async createMemberAfterSignup(userId: string, email: string): Promise<void> {
    try {
      // Verificar se já existe um membro para este usuário
      const { data: existingMember } = await supabase
        .from('members')
        .select('id')
        .eq('email', email)
        .single()

      if (existingMember) {
        return
      }

      // Criar novo membro
      const { error: memberError } = await supabase
        .from('members')
        .insert({
          email,
          first_name: email.split('@')[0], // Nome temporário
          last_name: 'User',
          membership_status: 'active',
          membership_type: 'standard',
          created_by: userId,
          updated_by: userId
        })

      if (memberError) {
        return
      }

      // Buscar o ID do membro criado
      const { data: newMember } = await supabase
        .from('members')
        .select('id')
        .eq('email', email)
        .single()

      if (newMember) {
        // Adicionar role padrão
        await supabase
          .from('member_roles')
          .insert({
            member_id: newMember.id,
            role: 'member'
          })
      }
    } catch (error) {
      // Silent error handling
    }
  }

  // Login com roles
  static async signInWithRoles(email: string, password: string) {
    try {
      // Fazer login
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError || !authData.user) {
        return { user: null, roles: [], error: authError }
      }

      // Buscar roles
      const roles = await this.getUserRoles(authData.user.id)

      return {
        user: authData.user,
        roles,
        error: null
      }
    } catch (error) {
      return {
        user: null,
        roles: [],
        error: error as Error
      }
    }
  }
}

export const auth = {
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  },

  signUp: async (email: string, password: string, fullName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })
    return { data, error }
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  resetPassword: async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { data, error }
  },

  updatePassword: async (newPassword: string) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    })
    return { data, error }
  },

  getSession: async () => {
    const { data, error } = await supabase.auth.getSession()
    return { data, error }
  },

  getUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },

  onAuthStateChange: (callback: (event: any, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback)
  },
}
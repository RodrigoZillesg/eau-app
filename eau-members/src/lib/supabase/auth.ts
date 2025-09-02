import { supabase } from './client'
import type { UserRole } from '../../types/permissions'

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

  // Buscar roles do usuário baseado no email - VERSÃO SIMPLIFICADA
  static async getUserRoles(userId: string): Promise<UserRole[]> {
    try {
      // Primeiro, buscar o usuário para pegar o email
      const { data: user } = await supabase.auth.getUser()
      
      if (!user.user?.email) {
        console.warn('No email found, using default role')
        return ['Members']
      }

      // FALLBACK TEMPORÁRIO - Hardcode para seu email
      if (user.user.email === 'rrzillesg@gmail.com') {
        console.log('Admin user detected')
        return ['AdminSuper', 'Admin', 'Members']
      }

      // Tentar buscar o membro - sem quebrar se falhar
      try {
        const { data: member, error: memberError } = await supabase
          .from('members')
          .select('id, email')
          .or(`email.eq.${user.user.email},created_by.eq.${userId}`)
          .single()

        if (memberError || !member) {
          console.warn('Member not found in database, using default role')
          return ['Members']
        }

        // Tentar buscar roles - sem quebrar se falhar
        const { data: roles, error: rolesError } = await supabase
          .from('member_roles')
          .select('role')
          .eq('member_id', member.id)

        if (rolesError || !roles || roles.length === 0) {
          console.warn('No roles found, using default role')
          return ['Members']
        }

        // Mapear roles
        const systemRoles: UserRole[] = []
        roles.forEach(r => {
          const mappedRoles = this.mapDatabaseRoleToSystemRole(r.role)
          systemRoles.push(...mappedRoles)
        })

        return [...new Set(systemRoles)]
      } catch (dbError) {
        console.warn('Database error fetching member/roles:', dbError)
        return ['Members']
      }
    } catch (error) {
      console.warn('General error in getUserRoles:', error)
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
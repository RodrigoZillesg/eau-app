import { createClient } from '@supabase/supabase-js'
import type { Database } from '../../types/supabase'

// Cliente administrativo para operações que requerem service role
// NOTA: Este cliente deve ser usado APENAS em funções administrativas protegidas
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://english-australia-eau-supabase.lkobs5.easypanel.host'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q'

export const supabaseAdmin = createClient<Database>(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Função helper para criar usuários com autenticação
export const createUserWithAuth = async (
  email: string,
  password: string,
  metadata: any
) => {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirma o email
      user_metadata: metadata
    })
    
    if (error) throw error
    return data.user
  } catch (error) {
    console.error('Error creating user:', error)
    throw error
  }
}
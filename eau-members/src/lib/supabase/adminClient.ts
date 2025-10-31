import { createClient } from '@supabase/supabase-js'
import type { Database } from '../../types/supabase'

// Cliente administrativo para operações que requerem service role
// NOTA: Este cliente deve ser usado APENAS em funções administrativas protegidas

// IMPORTANTE: Usando Supabase Cloud agora (migração em 24/01/2025)
const supabaseUrl = 'https://ypsvoxelitgceclohxfu.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlwc3ZveGVsaXRnY2VjbG9oeGZ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODcwMTc1NSwiZXhwIjoyMDc0Mjc3NzU1fQ.y_k4b4TlAev9R4TTFqHA08EjdZA-7Ymm5V1zMl-CYhA'

export const supabaseAdmin = createClient<Database>(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Alias para compatibilidade
export const adminClient = supabaseAdmin

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
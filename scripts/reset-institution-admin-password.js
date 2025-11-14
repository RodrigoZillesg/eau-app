/**
 * Script para resetar senha de Institution Admin para testes
 *
 * IMPORTANTE: Este script usa o Service Role Key do Supabase
 * para ter permissão administrativa de alterar senhas.
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ypsvoxelitgceclohxfu.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlwc3ZveGVsaXRnY2VjbG9oeGZ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODcwMTc1NSwiZXhwIjoyMDc0Mjc3NzU1fQ.y_k4b4TlAev9R4TTFqHA08EjdZA-7Ymm5V1zMl-CYhA'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function resetPassword() {
  console.log('🔄 Resetando senha do Institution Admin...\n')

  const email = 'simon.winetroube@curtin.edu.au'
  const temporaryPassword = 'Test123!@#Institution'

  try {
    // Usa o admin API para atualizar a senha do usuário
    const { data, error } = await supabase.auth.admin.updateUserById(
      'c8bf4ff3-e7e9-4460-a925-a8d6381dee4a', // user_id do Simon Winetroube
      { password: temporaryPassword }
    )

    if (error) {
      console.error('❌ Erro ao resetar senha:', error.message)
      process.exit(1)
    }

    console.log('✅ Senha resetada com sucesso!\n')
    console.log('📋 CREDENCIAIS DE ACESSO:\n')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('👤 Nome: Simon Winetroube')
    console.log('🏢 Instituição: Curtin English')
    console.log('🔑 User Type: institution_admin')
    console.log('📧 Email:', email)
    console.log('🔒 Senha:', temporaryPassword)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    console.log('⚠️  IMPORTANTE: Troque esta senha após o primeiro login!\n')

  } catch (error) {
    console.error('❌ Erro inesperado:', error)
    process.exit(1)
  }
}

resetPassword()

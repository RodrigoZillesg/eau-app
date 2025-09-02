const { createClient } = require('@supabase/supabase-js')

// Supabase configuration
const supabaseUrl = 'https://english-australia-eau-supabase.lkobs5.easypanel.host'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q'

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function verifyInterestGroupField() {
  try {
    console.log('🔍 Verificando se o campo interest_group foi criado...\n')

    // 1. Tentar selecionar o campo interest_group
    const { data: testData, error: testError } = await supabase
      .from('members')
      .select('id, first_name, last_name, interest_group')
      .limit(5)

    if (testError) {
      console.log('❌ Erro ao acessar campo interest_group:', testError.message)
      return false
    }

    console.log('✅ Campo interest_group existe na tabela members!')
    
    if (testData && testData.length > 0) {
      console.log('\n📊 Amostra de dados:')
      testData.forEach(member => {
        console.log(`   - ${member.first_name} ${member.last_name}: ${member.interest_group || 'não definido'}`)
      })
    }

    // 2. Verificar tabela interest_groups
    console.log('\n🔍 Verificando tabela interest_groups...')
    const { data: groups, error: groupError } = await supabase
      .from('interest_groups')
      .select('*')

    if (groupError) {
      console.log('❌ Erro ao acessar tabela interest_groups:', groupError.message)
    } else if (groups) {
      console.log(`✅ Tabela interest_groups existe com ${groups.length} registros:`)
      groups.forEach(g => {
        console.log(`   - ${g.name}: ${g.description?.substring(0, 50)}...`)
      })
    }

    // 3. Contar membros por grupo
    console.log('\n📊 Estatísticas de membros por grupo:')
    const membershipTypes = ['standard', 'premium', 'student', 'corporate']
    
    for (const type of membershipTypes) {
      const { count } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('membership_type', type)
      
      console.log(`   - ${type}: ${count || 0} membros`)
    }

    // 4. Verificar membros com interest_group preenchido
    const { count: withGroup } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
      .not('interest_group', 'is', null)

    const { count: total } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true })

    console.log(`\n✅ Resumo: ${withGroup || 0} de ${total || 0} membros têm interest_group definido`)

    return true

  } catch (error) {
    console.error('❌ Erro geral:', error)
    return false
  }
}

// Execute a verificação
verifyInterestGroupField().then(success => {
  if (success) {
    console.log('\n🎉 Todas as alterações foram aplicadas com sucesso!')
  } else {
    console.log('\n⚠️  Algumas alterações podem não ter sido aplicadas completamente.')
  }
})
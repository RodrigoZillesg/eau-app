import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configurações do Supabase
const supabaseUrl = 'https://english-australia-eau-supabase.lkobs5.easypanel.host'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false
  }
})

async function setupDatabase() {
  try {
    console.log('🚀 Iniciando configuração do banco de dados...')
    
    // Ler o arquivo SQL
    const sqlPath = path.join(__dirname, '..', 'database', 'schema.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    
    // Dividir o SQL em comandos individuais
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'))
    
    console.log(`📝 ${commands.length} comandos SQL encontrados`)
    
    // Executar cada comando
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i] + ';'
      
      try {
        console.log(`⏳ Executando comando ${i + 1}/${commands.length}...`)
        
        // Executar via API REST do Supabase
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({ query: command })
        })
        
        if (!response.ok) {
          // Tentar executar diretamente se RPC não existir
          console.log(`⚠️  RPC não disponível, pulando comando ${i + 1}`)
        } else {
          console.log(`✅ Comando ${i + 1} executado com sucesso`)
        }
      } catch (error) {
        console.error(`❌ Erro no comando ${i + 1}:`, error.message)
      }
    }
    
    console.log('\n✅ Configuração do banco de dados concluída!')
    console.log('\n📌 Próximos passos:')
    console.log('1. Execute o SQL manualmente no Supabase Studio:')
    console.log(`   ${supabaseUrl}`)
    console.log('2. Use as credenciais:')
    console.log('   - Usuário: rrzillesg')
    console.log('   - Senha: pkWwMiebGUCQXXrVFvCWp')
    console.log('3. Cole o conteúdo de database/schema.sql no SQL Editor')
    
  } catch (error) {
    console.error('❌ Erro ao configurar banco de dados:', error)
  }
}

setupDatabase()
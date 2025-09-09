const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://english-australia-eau-supabase.lkobs5.easypanel.host';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createReminderJobsTable() {
  console.log('🔧 Criando tabela event_reminder_jobs...\n');

  try {
    // Ler o arquivo SQL
    const sql = fs.readFileSync('create-reminder-jobs-table.sql', 'utf8');
    
    // Executar o SQL via RPC (se disponível) ou criar manualmente
    // Como o Supabase JS não tem método direto para executar SQL bruto,
    // vamos criar a tabela usando operações disponíveis
    
    // Primeiro, verificar se a tabela já existe
    const { data: existingTable } = await supabase
      .from('event_reminder_jobs')
      .select('id')
      .limit(1);
    
    if (!existingTable) {
      console.log('❌ A tabela event_reminder_jobs não existe.');
      console.log('Por favor, execute o seguinte SQL no Supabase Studio:\n');
      console.log('=====================================');
      console.log(sql);
      console.log('=====================================\n');
      console.log('Acesse: https://english-australia-eau-supabase.lkobs5.easypanel.host');
      console.log('Vá em SQL Editor e cole o código acima.\n');
      
      // Como alternativa, vamos tentar criar alguns registros de teste
      console.log('Tentando criar registros de teste...');
      
      const testData = {
        event_id: 'db92e695-d2ba-459f-8fb9-3497e0074bd2',
        user_id: 'f707f068-4e77-4f82-af47-7a5a66a4b561',
        reminder_type: 'test',
        scheduled_for: new Date().toISOString(),
        status: 'pending'
      };
      
      const { error: insertError } = await supabase
        .from('event_reminder_jobs')
        .insert(testData);
      
      if (insertError) {
        console.log('Confirmaão: A tabela realmente não existe.');
        console.log('Erro:', insertError.message);
      }
    } else {
      console.log('✅ A tabela event_reminder_jobs já existe!');
      
      // Verificar estrutura
      const { data: testRecord } = await supabase
        .from('event_reminder_jobs')
        .select('*')
        .limit(1);
      
      if (testRecord && testRecord.length > 0) {
        console.log('\nColunas existentes:');
        Object.keys(testRecord[0]).forEach(col => {
          console.log(`- ${col}`);
        });
      }
      
      // Limpar registros antigos de teste
      console.log('\nLimpando registros antigos de teste...');
      const { error: deleteError } = await supabase
        .from('event_reminder_jobs')
        .delete()
        .like('reminder_type', '%test%');
      
      if (!deleteError) {
        console.log('✅ Registros de teste limpos.');
      }
    }
    
  } catch (error) {
    console.error('Erro:', error);
  }
}

createReminderJobsTable();
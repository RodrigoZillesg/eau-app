const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://english-australia-eau-supabase.lkobs5.easypanel.host';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTable() {
  console.log('Verificando estrutura da tabela event_registrations...\n');
  
  // Buscar um registro para ver as colunas
  const { data, error } = await supabase
    .from('event_registrations')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('Erro:', error);
    return;
  }
  
  if (data && data.length > 0) {
    console.log('Colunas disponíveis na tabela event_registrations:');
    console.log('=====================================');
    Object.keys(data[0]).forEach(col => {
      console.log(`- ${col}: ${typeof data[0][col]}`);
    });
  } else {
    console.log('Nenhum registro encontrado, criando registro teste...');
    
    // Tentar criar um registro minimal para descobrir colunas obrigatórias
    const { data: events } = await supabase
      .from('events')
      .select('id')
      .limit(1);
    
    if (events && events.length > 0) {
      const { data: reg, error: regError } = await supabase
        .from('event_registrations')
        .insert({
          event_id: events[0].id,
          user_id: 'f707f068-4e77-4f82-af47-7a5a66a4b561',
          status: 'confirmed'
        })
        .select();
      
      if (regError) {
        console.log('Erro ao criar registro teste:', regError.message);
        console.log('Detalhes:', regError);
      } else if (reg && reg.length > 0) {
        console.log('Registro criado! Colunas:');
        Object.keys(reg[0]).forEach(col => {
          console.log(`- ${col}: ${typeof reg[0][col]}`);
        });
      }
    }
  }
}

checkTable();
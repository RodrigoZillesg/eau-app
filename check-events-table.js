const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://english-australia-eau-supabase.lkobs5.easypanel.host';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkEventTable() {
  console.log('Verificando estrutura da tabela events...\n');
  
  // Buscar um evento para ver as colunas
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('Erro:', error);
    return;
  }
  
  if (data && data.length > 0) {
    console.log('Colunas disponíveis na tabela events:');
    console.log('=====================================');
    Object.keys(data[0]).forEach(col => {
      console.log(`- ${col}: ${typeof data[0][col]}`);
    });
  } else {
    console.log('Nenhum evento encontrado. Vamos listar as colunas via RPC...');
    
    // Tentar via query SQL direta
    const { data: columns, error: colError } = await supabase.rpc('get_table_columns', {
      table_name: 'events'
    }).catch(() => null);
    
    if (columns) {
      console.log('Colunas:', columns);
    } else {
      console.log('Não foi possível obter a estrutura da tabela.');
    }
  }
}

checkEventTable();
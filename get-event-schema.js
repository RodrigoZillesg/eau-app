const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://english-australia-eau-supabase.lkobs5.easypanel.host',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q'
);

async function getEventSchema() {
  console.log('🔍 Verificando schema da tabela events...\n');
  
  // Get one existing event to see the fields
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .limit(1);

  if (error) {
    console.log('❌ Erro:', error.message);
  } else if (data && data.length > 0) {
    console.log('📋 CAMPOS DISPONÍVEIS NA TABELA EVENTS:');
    Object.keys(data[0]).forEach(field => {
      console.log(`   - ${field}: ${typeof data[0][field]} ${data[0][field] === null ? '(null)' : ''}`);
    });
    
    console.log('\n📅 EXEMPLO DE EVENTO EXISTENTE:');
    console.log(`   Title: ${data[0].title}`);
    console.log(`   Start: ${data[0].start_date}`);
    console.log(`   End: ${data[0].end_date}`);
  } else {
    console.log('❌ Nenhum evento encontrado');
  }
}

getEventSchema().catch(console.error);
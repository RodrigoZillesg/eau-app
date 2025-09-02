const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://english-australia-eau-supabase.lkobs5.easypanel.host',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q'
);

async function debugSMTPQuery() {
  console.log('🔍 DEBUG: Verificando queries SMTP...\n');
  
  // 1. Get all records
  console.log('1. Buscando TODOS os registros:');
  const { data: allData, error: allError } = await supabase
    .from('smtp_settings')
    .select('*');
    
  if (allError) {
    console.log('❌ Erro:', allError.message);
  } else {
    console.log(`📊 Total de registros: ${allData.length}`);
    allData.forEach((record, index) => {
      console.log(`   ${index + 1}. ID: ${record.id}, enabled: ${record.enabled}`);
    });
  }
  
  // 2. Get only enabled
  console.log('\n2. Buscando apenas ENABLED = true:');
  const { data: enabledData, error: enabledError } = await supabase
    .from('smtp_settings')
    .select('*')
    .eq('enabled', true);
    
  if (enabledError) {
    console.log('❌ Erro:', enabledError.message);
  } else {
    console.log(`📊 Registros enabled: ${enabledData.length}`);
    enabledData.forEach((record, index) => {
      console.log(`   ${index + 1}. ID: ${record.id}, Host: ${record.smtp_host}`);
    });
  }
  
  // 3. Try single query like the test script
  console.log('\n3. Teste da query exata do test script (.single()):');
  const { data: singleData, error: singleError } = await supabase
    .from('smtp_settings')
    .select('*')
    .eq('enabled', true)
    .single();
    
  if (singleError) {
    console.log('❌ Erro:', singleError.message);
  } else {
    console.log('✅ Sucesso:', singleData ? 'Configuração encontrada' : 'Nenhum dado');
    if (singleData) {
      console.log(`   Host: ${singleData.smtp_host}`);
      console.log(`   Username: ${singleData.smtp_username}`);
    }
  }
}

debugSMTPQuery().catch(console.error);
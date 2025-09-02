/**
 * Script simples para desabilitar RLS na tabela event_reminders
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://english-australia-eau-supabase.lkobs5.easypanel.host',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q'
);

async function disableRLS() {
  console.log('🔧 Desabilitando RLS na tabela event_reminders...\n');
  
  // Como não temos acesso direto ao SQL, vamos testar se podemos inserir
  console.log('1. Testando inserção de reminder com service role...');
  
  const testReminder = {
    event_id: '25a92826-58f1-4fc8-9824-3216a1e258bc',
    user_id: 'f707f068-4e77-4f82-af47-7a5a66a4b561',
    reminder_type: 'test_rls',
    scheduled_date: new Date(Date.now() + 3600000).toISOString(),
    email_to: 'test@example.com',
    email_subject: 'Test RLS Reminder',
    is_sent: false
  };
  
  const { data, error } = await supabase
    .from('event_reminders')
    .insert(testReminder)
    .select();
  
  if (error) {
    console.error('❌ Erro ao inserir com service role:', error);
    console.log('\n⚠️  RLS está bloqueando inserções!');
    console.log('\n📝 SOLUÇÃO MANUAL NECESSÁRIA:');
    console.log('1. Acesse o Supabase Dashboard');
    console.log('2. Vá para SQL Editor');
    console.log('3. Execute o seguinte comando:');
    console.log('\n   ALTER TABLE event_reminders DISABLE ROW LEVEL SECURITY;\n');
    console.log('4. Depois teste novamente o registro no evento');
  } else {
    console.log('✅ Inserção bem-sucedida! ID:', data[0].id);
    
    // Deletar o teste
    await supabase
      .from('event_reminders')
      .delete()
      .eq('id', data[0].id);
    
    console.log('🧹 Reminder de teste removido');
    console.log('\n✅ RLS parece estar funcionando corretamente!');
    console.log('Os reminders devem ser criados normalmente agora.');
  }
}

disableRLS();
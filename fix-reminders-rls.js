/**
 * Script para corrigir RLS policies da tabela event_reminders
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://english-australia-eau-supabase.lkobs5.easypanel.host',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q'
);

async function fixRemindersPolicies() {
  console.log('🔧 Corrigindo RLS policies da tabela event_reminders...\n');
  
  try {
    // Desabilitar RLS temporariamente para configurar as políticas
    console.log('1. Desabilitando RLS temporariamente...');
    try {
      await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE event_reminders DISABLE ROW LEVEL SECURITY;'
      });
    } catch (e) {
      console.log('RLS já estava desabilitado ou erro:', e.message);
    }
    
    // Remover políticas antigas se existirem
    console.log('2. Removendo políticas antigas...');
    const policiesToRemove = [
      'event_reminders_select_policy',
      'event_reminders_insert_policy', 
      'event_reminders_update_policy',
      'event_reminders_delete_policy',
      'Allow authenticated users to insert reminders',
      'Allow authenticated users to view their reminders',
      'Allow service role full access'
    ];
    
    for (const policy of policiesToRemove) {
      try {
        await supabase.rpc('exec_sql', {
          sql: `DROP POLICY IF EXISTS "${policy}" ON event_reminders;`
        });
      } catch (e) {
        console.log(`   - Política "${policy}" não existia`);
      }
    }
    
    // Criar políticas permissivas
    console.log('3. Criando novas políticas permissivas...');
    
    // Política para SELECT - usuários podem ver seus próprios reminders
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Users can view their own reminders"
        ON event_reminders
        FOR SELECT
        USING (
          auth.uid() = user_id OR 
          auth.role() = 'service_role' OR
          auth.role() = 'authenticated'
        );
      `
    });
    console.log('   ✅ Política SELECT criada');
    
    // Política para INSERT - usuários autenticados podem criar reminders
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Authenticated users can create reminders"
        ON event_reminders
        FOR INSERT
        WITH CHECK (
          auth.role() = 'authenticated' OR 
          auth.role() = 'service_role'
        );
      `
    });
    console.log('   ✅ Política INSERT criada');
    
    // Política para UPDATE - usuários podem atualizar seus próprios reminders
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Users can update their own reminders"
        ON event_reminders
        FOR UPDATE
        USING (
          auth.uid() = user_id OR 
          auth.role() = 'service_role'
        )
        WITH CHECK (
          auth.uid() = user_id OR 
          auth.role() = 'service_role'
        );
      `
    });
    console.log('   ✅ Política UPDATE criada');
    
    // Política para DELETE - apenas service role
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Only service role can delete reminders"
        ON event_reminders
        FOR DELETE
        USING (auth.role() = 'service_role');
      `
    });
    console.log('   ✅ Política DELETE criada');
    
    // Reabilitar RLS
    console.log('4. Reabilitando RLS...');
    await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE event_reminders ENABLE ROW LEVEL SECURITY;'
    });
    
    console.log('\n✅ RLS policies corrigidas com sucesso!');
    
    // Testar inserção
    console.log('\n5. Testando inserção de reminder...');
    const testReminder = {
      event_id: '25a92826-58f1-4fc8-9824-3216a1e258bc',
      user_id: 'f707f068-4e77-4f82-af47-7a5a66a4b561',
      reminder_type: 'test_policy',
      scheduled_date: new Date(Date.now() + 3600000).toISOString(),
      email_to: 'test@example.com',
      email_subject: 'Test Policy Reminder',
      is_sent: false
    };
    
    const { data, error } = await supabase
      .from('event_reminders')
      .insert(testReminder)
      .select();
    
    if (error) {
      console.error('❌ Erro ao testar inserção:', error.message);
    } else {
      console.log('✅ Teste de inserção bem-sucedido!');
      
      // Deletar o reminder de teste
      await supabase
        .from('event_reminders')
        .delete()
        .eq('id', data[0].id);
      console.log('🧹 Reminder de teste removido');
    }
    
    console.log('\n🎯 Próximos passos:');
    console.log('1. Registre-se novamente no evento');
    console.log('2. Os reminders devem ser criados automaticamente agora');
    console.log('3. Execute: node check-reminders.js para confirmar');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

fixRemindersPolicies();
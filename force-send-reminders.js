/**
 * Script para forçar envio de reminders pendentes
 * Define todos os reminders pendentes como "vencidos" para envio imediato
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://english-australia-eau-supabase.lkobs5.easypanel.host',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q'
);

async function forceReminders() {
  console.log('🔄 Forçando envio de ALGUNS reminders para teste...\n');
  
  try {
    // Buscar reminders não enviados
    const { data: reminders, error: fetchError } = await supabase
      .from('event_reminders')
      .select('*')
      .eq('is_sent', false)
      .limit(3); // Pegar apenas 3 para teste
    
    if (fetchError) {
      console.error('Erro ao buscar reminders:', fetchError);
      return;
    }
    
    if (!reminders || reminders.length === 0) {
      console.log('Nenhum reminder pendente encontrado');
      return;
    }
    
    console.log(`Forçando ${reminders.length} reminders para teste`);
    console.log('Atualizando datas para envio imediato...\n');
    
    // Atualizar para data passada (1 minuto atrás)
    const pastDate = new Date(Date.now() - 60000).toISOString();
    
    for (const reminder of reminders) {
      const { error: updateError } = await supabase
        .from('event_reminders')
        .update({ scheduled_date: pastDate })
        .eq('id', reminder.id);
      
      if (updateError) {
        console.error(`Erro ao atualizar reminder ${reminder.id}:`, updateError);
      } else {
        console.log(`✅ Reminder ${reminder.reminder_type} marcado para envio imediato`);
      }
    }
    
    console.log('\n✨ Pronto! O worker processará estes reminders em até 60 segundos.');
    console.log('📧 Verifique o dashboard em http://localhost:3001');
    
  } catch (error) {
    console.error('Erro:', error);
  }
}

forceReminders();
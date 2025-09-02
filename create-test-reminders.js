/**
 * Script para criar reminders de teste para validar o sistema
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://english-australia-eau-supabase.lkobs5.easypanel.host',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q'
);

async function createTestReminders() {
  console.log('🧪 Criando reminders de teste para validação...\n');
  
  try {
    // Buscar um evento futuro
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .gte('start_date', new Date().toISOString())
      .limit(1);
    
    if (!events || events.length === 0) {
      console.log('❌ Nenhum evento futuro encontrado para teste');
      return;
    }
    
    const event = events[0];
    console.log(`📅 Usando evento: ${event.title}`);
    console.log(`📆 Data do evento: ${new Date(event.start_date).toLocaleString()}`);
    
    // Criar reminders de teste com datas passadas (para envio imediato)
    const testReminders = [
      {
        event_id: event.id,
        user_id: '00000000-0000-0000-0000-000000000000',
        reminder_type: '7_days_before',
        scheduled_date: new Date(Date.now() - 60000).toISOString(), // 1 minuto atrás
        email_to: 'rrzillesg@gmail.com',
        email_subject: `TEST: Event in 1 Week: ${event.title}`,
        is_sent: false
      },
      {
        event_id: event.id,
        user_id: '00000000-0000-0000-0000-000000000000',
        reminder_type: '3_days_before',
        scheduled_date: new Date(Date.now() - 30000).toISOString(), // 30 segundos atrás
        email_to: 'rrzillesg@gmail.com',
        email_subject: `TEST: Event in 3 Days: ${event.title}`,
        is_sent: false
      },
      {
        event_id: event.id,
        user_id: '00000000-0000-0000-0000-000000000000',
        reminder_type: '1_day_before',
        scheduled_date: new Date(Date.now() - 10000).toISOString(), // 10 segundos atrás
        email_to: 'rrzillesg@gmail.com',
        email_subject: `TEST: Tomorrow: ${event.title}`,
        is_sent: false
      }
    ];
    
    console.log('\n📝 Criando reminders de teste...');
    
    for (const reminder of testReminders) {
      const { error } = await supabase
        .from('event_reminders')
        .insert(reminder);
      
      if (error) {
        console.error(`❌ Erro ao criar reminder ${reminder.reminder_type}:`, error);
      } else {
        console.log(`✅ Reminder ${reminder.reminder_type} criado (${reminder.scheduled_date})`);
      }
    }
    
    console.log('\n🎯 Reminders de teste criados!');
    console.log('\n📧 Execute agora o worker para testar:');
    console.log('   node production-reminder-worker.js');
    console.log('\n⚠️  IMPORTANTE: Configure o provedor de email no production-reminder-worker.js');
    console.log('   - Para teste rápido: use EMAIL_PROVIDER=local (servidor na porta 3001)');
    console.log('   - Para produção: use EMAIL_PROVIDER=resend e configure RESEND_API_KEY');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

createTestReminders();
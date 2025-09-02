/**
 * Script para criar reminders de teste usando dados reais
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://english-australia-eau-supabase.lkobs5.easypanel.host',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q'
);

async function createFinalTestReminders() {
  console.log('🧪 Criando reminders de teste finais...\n');
  
  try {
    // Buscar uma inscrição existente para usar como base
    const { data: registrations, error: regError } = await supabase
      .from('event_registrations')
      .select(`
        *,
        events (*)
      `)
      .limit(1);
    
    if (!registrations || registrations.length === 0) {
      console.log('❌ Nenhuma inscrição encontrada');
      return;
    }
    
    const registration = registrations[0];
    const event = registration.events;
    
    console.log(`📅 Evento: ${event.title}`);
    console.log(`👤 User ID: ${registration.user_id}`);
    console.log(`📆 Data do evento: ${new Date(event.start_date).toLocaleString()}`);
    
    // Criar reminders de teste com dados reais
    const testReminders = [
      {
        event_id: event.id,
        registration_id: registration.id,
        user_id: registration.user_id,
        reminder_type: '7_days_before',
        scheduled_date: new Date(Date.now() - 60000).toISOString(), // 1 minuto atrás
        email_to: 'rrzillesg@gmail.com',
        email_subject: `TEST: Event in 1 Week: ${event.title}`,
        is_sent: false
      },
      {
        event_id: event.id,
        registration_id: registration.id,
        user_id: registration.user_id,
        reminder_type: '30_min_before',
        scheduled_date: new Date(Date.now() - 30000).toISOString(), // 30 segundos atrás
        email_to: 'rrzillesg@gmail.com',
        email_subject: `TEST: Starting Soon: ${event.title}`,
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
        console.log(`✅ Reminder ${reminder.reminder_type} criado`);
      }
    }
    
    console.log('\n🎯 Reminders de teste criados com sucesso!');
    console.log('\n🚀 PRÓXIMOS PASSOS:');
    console.log('1. Verifique se o email server está rodando (porta 3001)');
    console.log('2. Execute: node production-reminder-worker.js');
    console.log('3. Verifique sua caixa de entrada (rrzillesg@gmail.com)');
    
    // Verificar status atual
    const { data: allReminders } = await supabase
      .from('event_reminders')
      .select('*')
      .eq('is_sent', false);
    
    console.log(`\n📊 Status: ${allReminders?.length || 0} reminders pendentes no total`);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

createFinalTestReminders();
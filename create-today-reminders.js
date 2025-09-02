/**
 * Script para criar reminders para o evento de hoje
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://english-australia-eau-supabase.lkobs5.easypanel.host',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q'
);

async function createTodayReminders() {
  console.log('🧪 Criando reminders para o evento de hoje...\n');
  
  try {
    // Buscar o evento de teste de hoje
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('title', 'Test Event - Reminder System')
      .single();
    
    if (eventError) {
      console.error('❌ Erro ao buscar evento:', eventError);
      return;
    }
    
    console.log('📅 Evento encontrado:', event.title);
    console.log('📆 Data do evento:', new Date(event.start_date).toLocaleString('pt-BR'));
    
    // Buscar a inscrição mais recente para este evento
    const { data: registration, error: regError } = await supabase
      .from('event_registrations')
      .select('*')
      .eq('event_id', event.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (regError) {
      console.error('❌ Erro ao buscar inscrição:', regError);
      return;
    }
    
    console.log('👤 Inscrição encontrada:', registration.id.substring(0, 8));
    
    // Criar reminders com horários que já passaram (para envio imediato)
    const now = new Date();
    const testReminders = [
      {
        event_id: event.id,
        registration_id: registration.id,
        user_id: registration.user_id,
        reminder_type: '30_min_before',
        scheduled_date: new Date(now.getTime() - 60000).toISOString(), // 1 minuto atrás
        email_to: 'rrzillesg@gmail.com',
        email_subject: `TEST: Starting in 30 minutes: ${event.title}`,
        is_sent: false
      },
      {
        event_id: event.id,
        registration_id: registration.id,
        user_id: registration.user_id,
        reminder_type: 'event_live',
        scheduled_date: new Date(now.getTime() - 30000).toISOString(), // 30 segundos atrás
        email_to: 'rrzillesg@gmail.com',
        email_subject: `TEST: Live Now: ${event.title}`,
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
    console.log('\n🚀 PRÓXIMOS PASSOS:');
    console.log('1. Verifique se o email server está rodando (porta 3001)');
    console.log('2. Execute: node production-reminder-worker.js');
    console.log('3. Verifique sua caixa de entrada (rrzillesg@gmail.com)');
    
    // Verificar status atual
    const { data: pendingReminders } = await supabase
      .from('event_reminders')
      .select('*')
      .eq('event_id', event.id)
      .eq('is_sent', false);
    
    console.log(`\n📊 Status: ${pendingReminders?.length || 0} reminders pendentes para este evento`);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

createTodayReminders();
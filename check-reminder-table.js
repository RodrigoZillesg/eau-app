const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://english-australia-eau-supabase.lkobs5.easypanel.host';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkReminderTables() {
  console.log('Verificando tabelas de reminders...\n');
  
  // Tentar event_reminder_jobs
  console.log('1. Tentando event_reminder_jobs:');
  const { data: jobs, error: jobsError } = await supabase
    .from('event_reminder_jobs')
    .select('*')
    .limit(1);
  
  if (jobsError) {
    console.log('   ❌ Erro:', jobsError.message);
  } else {
    console.log('   ✅ Tabela existe!');
    if (jobs && jobs.length > 0) {
      console.log('   Colunas:', Object.keys(jobs[0]));
    }
  }

  // Tentar event_reminders
  console.log('\n2. Tentando event_reminders:');
  const { data: reminders, error: remindersError } = await supabase
    .from('event_reminders')
    .select('*')
    .limit(1);
  
  if (remindersError) {
    console.log('   ❌ Erro:', remindersError.message);
  } else {
    console.log('   ✅ Tabela existe!');
    if (reminders && reminders.length > 0) {
      console.log('   Colunas:', Object.keys(reminders[0]));
    }
  }

  // Tentar criar um reminder de teste
  console.log('\n3. Tentando criar reminder de teste em event_reminders:');
  const { data: newReminder, error: createError } = await supabase
    .from('event_reminders')
    .insert({
      event_id: 'db92e695-d2ba-459f-8fb9-3497e0074bd2', // ID de evento existente
      user_id: 'f707f068-4e77-4f82-af47-7a5a66a4b561',
      reminder_type: '1_day',
      scheduled_for: new Date().toISOString(),
      status: 'pending'
    })
    .select()
    .single();

  if (createError) {
    console.log('   ❌ Erro ao criar:', createError.message);
    console.log('   Detalhes:', createError);
  } else {
    console.log('   ✅ Reminder criado com sucesso!');
    console.log('   ID:', newReminder.id);
    
    // Limpar
    await supabase
      .from('event_reminders')
      .delete()
      .eq('id', newReminder.id);
  }
}

checkReminderTables();
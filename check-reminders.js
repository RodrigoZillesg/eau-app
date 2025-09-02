/**
 * Script para verificar reminders no banco de dados
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://english-australia-eau-supabase.lkobs5.easypanel.host',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q'
);

async function checkReminders() {
  console.log('📊 Verificando reminders no banco de dados...\n');
  
  try {
    // Buscar TODOS os reminders
    const { data: allReminders, error: allError } = await supabase
      .from('event_reminders')
      .select('*')
      .order('scheduled_date', { ascending: true });
    
    if (allError) {
      console.error('Erro ao buscar reminders:', allError);
      
      // Tentar criar a tabela se não existir
      console.log('\n⚠️  Tabela event_reminders pode não existir. Criando...');
      
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS event_reminders (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            event_id UUID REFERENCES events(id) ON DELETE CASCADE,
            registration_id UUID,
            user_id UUID,
            reminder_type VARCHAR(50),
            scheduled_date TIMESTAMP WITH TIME ZONE,
            email_to VARCHAR(255),
            email_subject TEXT,
            is_sent BOOLEAN DEFAULT false,
            sent_date TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });
      
      if (createError) {
        console.error('Erro ao criar tabela:', createError);
      } else {
        console.log('✅ Tabela criada com sucesso!');
      }
      
      return;
    }
    
    console.log(`Total de reminders: ${allReminders?.length || 0}`);
    
    if (allReminders && allReminders.length > 0) {
      // Separar por status
      const pending = allReminders.filter(r => !r.is_sent);
      const sent = allReminders.filter(r => r.is_sent);
      
      console.log(`📬 Enviados: ${sent.length}`);
      console.log(`⏳ Pendentes: ${pending.length}\n`);
      
      if (pending.length > 0) {
        console.log('Reminders pendentes:');
        console.log('=' .repeat(60));
        
        for (const reminder of pending) {
          const scheduledDate = new Date(reminder.scheduled_date);
          const now = new Date();
          const isPast = scheduledDate < now;
          
          console.log(`Type: ${reminder.reminder_type}`);
          console.log(`Email: ${reminder.email_to}`);
          console.log(`Scheduled: ${scheduledDate.toLocaleString()}`);
          console.log(`Status: ${isPast ? '⚠️ VENCIDO (deveria ter sido enviado)' : '⏰ Aguardando'}`);
          console.log('-'.repeat(60));
        }
      }
      
      // Verificar últimas inscrições
      console.log('\n📝 Últimas inscrições:');
      const { data: registrations, error: regError } = await supabase
        .from('event_registrations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (registrations) {
        console.log(`Encontradas ${registrations.length} inscrições recentes`);
        for (const reg of registrations) {
          console.log(`- Inscrição ${reg.id.substring(0, 8)} criada em ${new Date(reg.created_at).toLocaleString()}`);
        }
      }
      
    } else {
      console.log('❌ Nenhum reminder encontrado no banco!');
      console.log('\nPossíveis causas:');
      console.log('1. Os reminders não estão sendo criados ao fazer inscrição');
      console.log('2. A tabela event_reminders não existe');
      console.log('3. Há um erro no código que cria os reminders');
    }
    
  } catch (error) {
    console.error('Erro:', error);
  }
}

checkReminders();
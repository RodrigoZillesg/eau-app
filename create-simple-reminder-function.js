/**
 * Criar função simples para processar reminders
 * Abordagem mais direta sem usar exec_sql
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://english-australia-eau-supabase.lkobs5.easypanel.host',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q'
);

async function createSimpleFunction() {
  console.log('🔧 Criando função simples para processar reminders...\n');
  
  try {
    // Vamos simular o processamento fazendo tudo via JavaScript/Supabase client
    console.log('📊 Verificando reminders pendentes...');
    
    // Buscar reminders que deveriam ter sido enviados
    const { data: overdueReminders, error } = await supabase
      .from('event_reminders')
      .select(`
        *,
        events (*)
      `)
      .eq('is_sent', false)
      .lte('scheduled_date', new Date().toISOString())
      .limit(5);
    
    if (error) {
      console.error('❌ Erro ao buscar reminders:', error);
      return;
    }
    
    if (!overdueReminders || overdueReminders.length === 0) {
      console.log('📬 Nenhum reminder vencido encontrado');
      return;
    }
    
    console.log(`📧 Encontrados ${overdueReminders.length} reminders para processar`);
    
    // Processar cada reminder
    for (const reminder of overdueReminders) {
      try {
        console.log(`\n🔄 Processando: ${reminder.reminder_type} para ${reminder.email_to}`);
        
        const event = reminder.events;
        if (!event) {
          console.log('⚠️  Evento não encontrado');
          continue;
        }
        
        // Formatar dados do evento
        const eventDate = new Date(event.start_date).toLocaleDateString('en-US', { 
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
        });
        const eventTime = new Date(event.start_date).toLocaleTimeString('en-US', { 
          hour: 'numeric', minute: '2-digit', hour12: true 
        });
        const eventLocation = event.location_type === 'virtual' ? 'Online Event' : event.venue_name || 'TBA';
        
        // Preparar subject baseado no tipo
        const subject = {
          '7_days_before': `Event in 1 Week: ${event.title}`,
          '3_days_before': `Event in 3 Days: ${event.title}`,
          '1_day_before': `Tomorrow: ${event.title}`,
          '30_min_before': `Starting Soon: ${event.title}`,
          'event_live': `🔴 LIVE NOW: ${event.title}`
        }[reminder.reminder_type] || `Event Reminder: ${event.title}`;
        
        // AQUI: Em produção real, você enviaria o email via SendGrid/Resend
        // Por enquanto, vamos apenas simular e marcar como enviado
        
        console.log(`   📝 Subject: ${subject}`);
        console.log(`   📅 Event: ${event.title}`);
        console.log(`   📆 Date: ${eventDate} at ${eventTime}`);
        console.log(`   📍 Location: ${eventLocation}`);
        
        // Simular envio de email (success)
        const emailSent = true; // Em produção: resultado da API do provedor de email
        
        if (emailSent) {
          // Marcar como enviado
          const { error: updateError } = await supabase
            .from('event_reminders')
            .update({ 
              is_sent: true, 
              sent_date: new Date().toISOString() 
            })
            .eq('id', reminder.id);
          
          if (updateError) {
            console.log(`   ❌ Erro ao marcar como enviado:`, updateError);
          } else {
            console.log(`   ✅ Marcado como enviado com sucesso`);
          }
        }
        
      } catch (reminderError) {
        console.error(`❌ Erro ao processar reminder ${reminder.id}:`, reminderError);
      }
    }
    
    console.log('\n✨ Processamento concluído!');
    
    // Verificar status geral
    const { data: allReminders } = await supabase
      .from('event_reminders')
      .select('is_sent');
    
    if (allReminders) {
      const sent = allReminders.filter(r => r.is_sent).length;
      const pending = allReminders.filter(r => !r.is_sent).length;
      
      console.log(`\n📊 Status geral:`);
      console.log(`   ✅ Enviados: ${sent}`);
      console.log(`   ⏳ Pendentes: ${pending}`);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

createSimpleFunction();
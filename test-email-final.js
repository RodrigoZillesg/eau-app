/**
 * TESTE FINAL DO SISTEMA DE EMAILS COM REMINDERS
 * Usando a estrutura correta da tabela event_reminders
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://english-australia-eau-supabase.lkobs5.easypanel.host';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const YOUR_USER_ID = 'f707f068-4e77-4f82-af47-7a5a66a4b561';
const YOUR_EMAIL = 'rrzillesg@gmail.com';

// Cores para o console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, type = 'info') {
  const types = {
    success: `${colors.green}✅`,
    error: `${colors.red}❌`,
    warning: `${colors.yellow}⚠️`,
    info: `${colors.blue}ℹ️`,
    step: `${colors.cyan}▶️`
  };
  
  console.log(`${types[type]} ${message}${colors.reset}`);
}

async function testCompleteEmailSystem() {
  console.log(`${colors.bright}${colors.cyan}
╔══════════════════════════════════════════════════════════╗
║          TESTE FINAL - SISTEMA DE EMAILS                ║
╚══════════════════════════════════════════════════════════╝
${colors.reset}`);

  try {
    // 1. Ativar Test Mode
    log('Ativando Test Mode...', 'step');
    const { data: smtpSettings } = await supabase
      .from('smtp_settings')
      .select('*')
      .limit(1);

    if (smtpSettings && smtpSettings.length > 0) {
      await supabase
        .from('smtp_settings')
        .update({
          test_mode: true,
          test_email: YOUR_EMAIL
        })
        .eq('id', smtpSettings[0].id);
      
      log(`Test Mode ativado! Emails serão enviados para: ${YOUR_EMAIL}`, 'success');
    }

    // 2. Criar evento de teste
    log('Criando evento de teste...', 'step');
    
    const eventData = {
      title: '🎯 TESTE FINAL - ' + new Date().toLocaleString('pt-BR'),
      slug: 'teste-final-' + Date.now(),
      description: '<h2>Evento de Teste Final</h2><p>Testando sistema completo de emails com reminders.</p>',
      start_date: new Date(Date.now() + 3600000).toISOString(), // +1 hora
      end_date: new Date(Date.now() + 7200000).toISOString(), // +2 horas
      location_type: 'virtual',
      venue_name: 'Online',
      virtual_link: 'https://zoom.us/test',
      status: 'published',
      visibility: 'public',
      capacity: 100,
      cpd_points: 2,
      cpd_category: 'professional_development',
      member_price_cents: 0,
      non_member_price_cents: 0,
      waitlist_enabled: false,
      allow_guests: false,
      max_guests_per_registration: 0,
      requires_approval: false,
      show_attendee_list: false
    };

    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert(eventData)
      .select()
      .single();

    if (eventError) {
      log('Erro ao criar evento: ' + eventError.message, 'error');
      return;
    }

    log(`Evento criado: ${event.title}`, 'success');

    // 3. Criar inscrição
    log('Criando inscrição no evento...', 'step');
    
    // Limpar inscrições anteriores
    await supabase
      .from('event_registrations')
      .delete()
      .eq('event_id', event.id)
      .eq('user_id', YOUR_USER_ID);

    const { data: registration, error: regError } = await supabase
      .from('event_registrations')
      .insert({
        event_id: event.id,
        user_id: YOUR_USER_ID,
        status: 'registered', // Usar valor válido
        registration_type: 'standard',
        payment_status: 'completed',
        payment_amount: 0,
        is_guest: false,
        attended: false,
        checked_in: false,
        certificate_issued: false,
        cpd_activity_created: false,
        reminder_email_sent: false
      })
      .select()
      .single();

    if (regError) {
      log('Erro ao criar inscrição: ' + regError.message, 'error');
      console.log('Detalhes:', regError);
      return;
    }

    log('Inscrição criada com sucesso!', 'success');
    log('📧 Você deve receber o EMAIL DE CONFIRMAÇÃO em breve...', 'info');

    // 4. Criar reminders usando estrutura correta
    log('Criando reminders para teste...', 'step');
    
    // Limpar reminders antigos
    await supabase
      .from('event_reminders')
      .delete()
      .eq('event_id', event.id)
      .eq('user_id', YOUR_USER_ID);

    const now = new Date();
    const reminders = [
      {
        event_id: event.id,
        registration_id: registration.id,
        user_id: YOUR_USER_ID,
        reminder_type: '7_days',
        scheduled_date: now.toISOString(), // Imediato
        is_sent: false
      },
      {
        event_id: event.id,
        registration_id: registration.id,
        user_id: YOUR_USER_ID,
        reminder_type: '3_days',
        scheduled_date: new Date(now.getTime() + 10000).toISOString(), // +10s
        is_sent: false
      },
      {
        event_id: event.id,
        registration_id: registration.id,
        user_id: YOUR_USER_ID,
        reminder_type: '1_day',
        scheduled_date: new Date(now.getTime() + 20000).toISOString(), // +20s
        is_sent: false
      },
      {
        event_id: event.id,
        registration_id: registration.id,
        user_id: YOUR_USER_ID,
        reminder_type: '30_min',
        scheduled_date: new Date(now.getTime() + 30000).toISOString(), // +30s
        is_sent: false
      },
      {
        event_id: event.id,
        registration_id: registration.id,
        user_id: YOUR_USER_ID,
        reminder_type: 'live',
        scheduled_date: new Date(now.getTime() + 40000).toISOString(), // +40s
        is_sent: false
      }
    ];

    const { data: createdReminders, error: reminderError } = await supabase
      .from('event_reminders')
      .insert(reminders)
      .select();

    if (reminderError) {
      log('Erro ao criar reminders: ' + reminderError.message, 'error');
      console.log('Detalhes:', reminderError);
    } else {
      log(`${createdReminders.length} reminders criados com sucesso!`, 'success');
    }

    // 5. Mostrar cronograma
    console.log(`\n${colors.bright}📅 CRONOGRAMA DE EMAILS:${colors.reset}`);
    console.log('================================');
    console.log('📧 Confirmação - IMEDIATO');
    console.log('📧 Reminder 7 dias - IMEDIATO');
    console.log('📧 Reminder 3 dias - em 10 segundos');
    console.log('📧 Reminder 1 dia - em 20 segundos');
    console.log('📧 Reminder 30 min - em 30 segundos');
    console.log('📧 Reminder LIVE - em 40 segundos');
    console.log('================================\n');

    // 6. Monitorar status
    log('Monitorando envio de emails por 90 segundos...', 'info');
    
    let checkCount = 0;
    const maxChecks = 18; // 90 segundos (18 x 5)
    
    const checkInterval = setInterval(async () => {
      checkCount++;
      
      const { data: reminderStatus } = await supabase
        .from('event_reminders')
        .select('reminder_type, is_sent, sent_date')
        .eq('event_id', event.id)
        .order('scheduled_date');

      const sent = reminderStatus?.filter(r => r.is_sent).length || 0;
      const total = reminderStatus?.length || 0;
      
      // Status inline
      process.stdout.write(`\r[${checkCount * 5}s] Status: ${sent}/${total} reminders enviados`);

      // Se todos enviados ou tempo esgotado
      if (sent === total || checkCount >= maxChecks) {
        clearInterval(checkInterval);
        
        console.log('\n');
        if (sent === total && total > 0) {
          log(`SUCESSO! Todos os ${total} reminders foram enviados!`, 'success');
        } else if (sent > 0) {
          log(`${sent} de ${total} reminders foram enviados`, 'warning');
        }

        // Mostrar status detalhado
        console.log(`\n${colors.bright}📊 STATUS FINAL:${colors.reset}`);
        reminderStatus?.forEach(r => {
          const icon = r.is_sent ? '✅' : '⏳';
          const time = r.sent_date ? ` (${new Date(r.sent_date).toLocaleTimeString('pt-BR')})` : '';
          console.log(`${icon} ${r.reminder_type}${time}`);
        });

        // Instruções de limpeza
        console.log(`\n${colors.yellow}🧹 Para limpar os dados de teste:${colors.reset}`);
        console.log(`DELETE FROM event_reminders WHERE event_id = '${event.id}';`);
        console.log(`DELETE FROM event_registrations WHERE event_id = '${event.id}';`);
        console.log(`DELETE FROM events WHERE id = '${event.id}';`);
        console.log(`UPDATE smtp_settings SET test_mode = false;`);
        
        process.exit(0);
      }
    }, 5000); // Verificar a cada 5 segundos

  } catch (error) {
    log('Erro geral: ' + error.message, 'error');
    console.error(error);
  }
}

// Executar teste
testCompleteEmailSystem();
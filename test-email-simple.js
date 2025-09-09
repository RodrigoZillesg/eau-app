/**
 * TESTE SIMPLIFICADO DO SISTEMA DE EMAILS
 * Cria apenas o necessário para testar o envio
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://english-australia-eau-supabase.lkobs5.easypanel.host';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const YOUR_USER_ID = 'f707f068-4e77-4f82-af47-7a5a66a4b561';
const YOUR_EMAIL = 'rrzillesg@gmail.com';

async function testEmailSystem() {
  console.log('🚀 TESTE SIMPLIFICADO DO SISTEMA DE EMAILS\n');

  try {
    // 1. Ativar Test Mode
    console.log('1️⃣ Ativando Test Mode...');
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
      
      console.log('✅ Test Mode ativado!\n');
    }

    // 2. Buscar um evento existente ou criar um simples
    console.log('2️⃣ Buscando evento existente...');
    let { data: events } = await supabase
      .from('events')
      .select('id, title')
      .limit(1);

    let eventId;
    let eventTitle;

    if (!events || events.length === 0) {
      console.log('Nenhum evento encontrado. Criando evento simples...');
      
      const eventData = {
        title: 'Teste Email - ' + new Date().toISOString(),
        slug: 'teste-' + Date.now(),
        description: 'Evento de teste',
        start_date: new Date(Date.now() + 3600000).toISOString(),
        end_date: new Date(Date.now() + 7200000).toISOString(),
        location_type: 'virtual',
        venue_name: 'Online',
        status: 'published',
        visibility: 'public',
        capacity: 100,
        cpd_points: 1,
        cpd_category: 'professional_development',
        member_price_cents: 0,
        non_member_price_cents: 0
      };

      const { data: newEvent, error } = await supabase
        .from('events')
        .insert(eventData)
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar evento:', error);
        return;
      }

      eventId = newEvent.id;
      eventTitle = newEvent.title;
    } else {
      eventId = events[0].id;
      eventTitle = events[0].title;
    }

    console.log(`✅ Usando evento: ${eventTitle}\n`);

    // 3. Criar uma inscrição simples
    console.log('3️⃣ Criando inscrição...');
    
    // Primeiro, limpar inscrições anteriores para evitar duplicatas
    await supabase
      .from('event_registrations')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', YOUR_USER_ID);

    const { data: registration, error: regError } = await supabase
      .from('event_registrations')
      .insert({
        event_id: eventId,
        user_id: YOUR_USER_ID
        // Deixar o banco usar os valores padrão para o resto
      })
      .select()
      .single();

    if (regError) {
      console.error('❌ Erro ao criar inscrição:', regError);
      return;
    }

    console.log('✅ Inscrição criada! ID:', registration.id);
    console.log('📧 Você deve receber o EMAIL DE CONFIRMAÇÃO em breve...\n');

    // 4. Criar reminders simples
    console.log('4️⃣ Criando reminders para teste...');
    
    // Limpar reminders antigos
    await supabase
      .from('event_reminder_jobs')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', YOUR_USER_ID);

    const now = new Date();
    const reminders = [
      {
        registration_id: registration.id,
        event_id: eventId,
        user_id: YOUR_USER_ID,
        reminder_type: '7_days',
        scheduled_for: now.toISOString(),
        status: 'pending'
      },
      {
        registration_id: registration.id,
        event_id: eventId,
        user_id: YOUR_USER_ID,
        reminder_type: '1_day',
        scheduled_for: new Date(now.getTime() + 10000).toISOString(),
        status: 'pending'
      },
      {
        registration_id: registration.id,
        event_id: eventId,
        user_id: YOUR_USER_ID,
        reminder_type: 'live',
        scheduled_for: new Date(now.getTime() + 20000).toISOString(),
        status: 'pending'
      }
    ];

    const { error: reminderError } = await supabase
      .from('event_reminder_jobs')
      .insert(reminders);

    if (reminderError) {
      console.error('❌ Erro ao criar reminders:', reminderError);
      return;
    }

    console.log('✅ 3 reminders criados!');
    console.log('\n📬 EMAILS QUE VOCÊ RECEBERÁ:');
    console.log('================================');
    console.log('1. Confirmação de inscrição (imediato)');
    console.log('2. Reminder "7 dias" (processamento imediato)');
    console.log('3. Reminder "1 dia" (em ~10 segundos)');
    console.log('4. Reminder "LIVE" (em ~20 segundos)');
    console.log('================================\n');

    // 5. Monitorar por 1 minuto
    console.log('⏰ Monitorando por 60 segundos...\n');
    
    let checkCount = 0;
    const checkInterval = setInterval(async () => {
      checkCount++;
      
      const { data: jobs } = await supabase
        .from('event_reminder_jobs')
        .select('reminder_type, status')
        .eq('event_id', eventId)
        .eq('user_id', YOUR_USER_ID);

      const sent = jobs?.filter(j => j.status === 'sent').length || 0;
      const total = jobs?.length || 0;
      
      process.stdout.write(`\r[${checkCount * 5}s] Status: ${sent}/${total} reminders enviados`);

      if (checkCount >= 12 || sent === total) {
        clearInterval(checkInterval);
        console.log('\n\n✅ Teste concluído!');
        
        if (sent === total) {
          console.log('Todos os reminders foram enviados com sucesso!');
        }
        
        console.log('\n🧹 Para limpar os dados de teste:');
        console.log(`DELETE FROM event_reminder_jobs WHERE event_id = '${eventId}';`);
        console.log(`DELETE FROM event_registrations WHERE event_id = '${eventId}';`);
        
        process.exit(0);
      }
    }, 5000);

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

// Executar
testEmailSystem();
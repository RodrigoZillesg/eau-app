/**
 * SCRIPT DE TESTE COMPLETO DO SISTEMA DE EMAILS
 * 
 * Este script vai:
 * 1. Criar um evento de teste que começa em 10 minutos
 * 2. Criar reminders para AGORA (simulando todos os tipos)
 * 3. Você receberá 6 emails em sequência
 */

const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const supabaseUrl = 'https://english-australia-eau-supabase.lkobs5.easypanel.host';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// SEU USER ID - pegue do seu login
const YOUR_USER_ID = 'f707f068-4e77-4f82-af47-7a5a66a4b561'; // Substitua pelo seu ID real
const YOUR_EMAIL = 'rrzillesg@gmail.com'; // Seu email

async function runEmailTest() {
  console.log('🚀 INICIANDO TESTE COMPLETO DO SISTEMA DE EMAILS');
  console.log('================================================\n');

  try {
    // 1. PRIMEIRO, VAMOS ATIVAR O TEST MODE
    console.log('1️⃣ Ativando Test Mode para que todos emails vão para você...');
    
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
      
      console.log('✅ Test Mode ativado! Todos emails serão enviados para:', YOUR_EMAIL);
    }

    // 2. CRIAR UM EVENTO DE TESTE
    console.log('\n2️⃣ Criando evento de teste que "começa" em 10 minutos...');
    
    const eventStartTime = new Date();
    eventStartTime.setMinutes(eventStartTime.getMinutes() + 10);
    
    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert({
        title: '🧪 TESTE SISTEMA DE EMAILS - ' + new Date().toISOString(),
        slug: 'teste-emails-' + Date.now(),
        description: 'Evento criado para testar o sistema de emails',
        start_date: eventStartTime.toISOString(),
        end_date: new Date(eventStartTime.getTime() + 3600000).toISOString(), // +1 hora
        location_type: 'virtual',
        venue_name: 'Online Test Event',
        virtual_link: 'https://zoom.us/test',
        capacity: 100,
        status: 'published',
        visibility: 'public',
        featured: false,
        cpd_points: 2,
        cpd_category: 'professional_development',
        member_price_cents: 0,
        non_member_price_cents: 0,
        waitlist_enabled: false,
        allow_guests: false,
        max_guests_per_registration: 0,
        requires_approval: false,
        show_attendee_list: false,
        created_by: YOUR_USER_ID
      })
      .select()
      .single();

    if (eventError) {
      console.error('❌ Erro ao criar evento:', eventError);
      return;
    }

    console.log('✅ Evento de teste criado:', event.title);

    // 3. CRIAR UMA INSCRIÇÃO PARA VOCÊ
    console.log('\n3️⃣ Criando inscrição no evento...');
    
    const { data: registration, error: regError } = await supabase
      .from('event_registrations')
      .insert({
        event_id: event.id,
        user_id: YOUR_USER_ID,
        status: 'confirmed',
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
      console.error('❌ Erro ao criar inscrição:', regError);
      return;
    }

    console.log('✅ Inscrição criada com sucesso!');
    console.log('📧 Você deve receber o EMAIL DE CONFIRMAÇÃO em breve...\n');

    // 4. CRIAR REMINDERS PARA SEREM PROCESSADOS IMEDIATAMENTE
    console.log('4️⃣ Criando reminders para processamento imediato...');
    
    const now = new Date();
    const reminders = [
      {
        registration_id: registration.id,
        event_id: event.id,
        user_id: YOUR_USER_ID,
        reminder_type: '7_days',
        scheduled_for: now.toISOString(), // Agora!
        status: 'pending'
      },
      {
        registration_id: registration.id,
        event_id: event.id,
        user_id: YOUR_USER_ID,
        reminder_type: '3_days',
        scheduled_for: new Date(now.getTime() + 5000).toISOString(), // +5 segundos
        status: 'pending'
      },
      {
        registration_id: registration.id,
        event_id: event.id,
        user_id: YOUR_USER_ID,
        reminder_type: '1_day',
        scheduled_for: new Date(now.getTime() + 10000).toISOString(), // +10 segundos
        status: 'pending'
      },
      {
        registration_id: registration.id,
        event_id: event.id,
        user_id: YOUR_USER_ID,
        reminder_type: '30_min',
        scheduled_for: new Date(now.getTime() + 15000).toISOString(), // +15 segundos
        status: 'pending'
      },
      {
        registration_id: registration.id,
        event_id: event.id,
        user_id: YOUR_USER_ID,
        reminder_type: 'live',
        scheduled_for: new Date(now.getTime() + 20000).toISOString(), // +20 segundos
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

    console.log('✅ 5 reminders criados e agendados!');
    console.log('\n📬 SEQUÊNCIA DE EMAILS QUE VOCÊ RECEBERÁ:');
    console.log('================================================');
    console.log('1. EMAIL DE CONFIRMAÇÃO - Imediatamente');
    console.log('2. Reminder "7 dias antes" - Em alguns segundos');
    console.log('3. Reminder "3 dias antes" - Em ~5 segundos');
    console.log('4. Reminder "1 dia antes" - Em ~10 segundos');
    console.log('5. Reminder "30 minutos antes" - Em ~15 segundos');
    console.log('6. Reminder "WE\'RE LIVE!" - Em ~20 segundos');
    console.log('================================================\n');

    console.log('⏰ O backend processará os reminders automaticamente a cada minuto.');
    console.log('📧 Todos os emails terão [TEST MODE] no assunto.');
    console.log('\n✅ TESTE INICIADO COM SUCESSO!');
    console.log('Aguarde os emails chegarem em sua caixa de entrada...');

    // 5. OPCIONAL: Verificar status dos reminders
    console.log('\n5️⃣ Aguardando 30 segundos e verificando status...');
    
    setTimeout(async () => {
      const { data: jobStatus } = await supabase
        .from('event_reminder_jobs')
        .select('reminder_type, status, sent_at')
        .eq('event_id', event.id)
        .order('scheduled_for');

      console.log('\n📊 STATUS DOS REMINDERS:');
      console.log('========================');
      jobStatus.forEach(job => {
        const status = job.status === 'sent' ? '✅' : job.status === 'failed' ? '❌' : '⏳';
        console.log(`${status} ${job.reminder_type}: ${job.status} ${job.sent_at ? `(enviado em ${job.sent_at})` : ''}`);
      });

      // 6. LIMPAR DADOS DE TESTE
      console.log('\n6️⃣ Deseja limpar os dados de teste? (Mantenha se quiser verificar logs)');
      console.log('Para limpar manualmente depois, execute:');
      console.log(`DELETE FROM event_reminder_jobs WHERE event_id = '${event.id}';`);
      console.log(`DELETE FROM event_registrations WHERE event_id = '${event.id}';`);
      console.log(`DELETE FROM events WHERE id = '${event.id}';`);
      
    }, 30000); // Verificar após 30 segundos

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// EXECUTAR O TESTE
runEmailTest();

console.log('\n💡 DICA: Mantenha este script rodando por 1 minuto para ver todos os resultados.');
console.log('Pressione Ctrl+C para sair quando todos emails forem recebidos.');
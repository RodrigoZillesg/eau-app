/**
 * TESTE FINAL - REMINDERS COM BACKEND
 * Cria reminders pendentes para o backend processar automaticamente
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://english-australia-eau-supabase.lkobs5.easypanel.host';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const YOUR_USER_ID = 'f707f068-4e77-4f82-af47-7a5a66a4b561';
const YOUR_EMAIL = 'rrzillesg@gmail.com';

async function createPendingReminders() {
  console.log('🚀 CRIANDO REMINDERS PARA O BACKEND PROCESSAR\n');

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
      
      console.log('✅ Test Mode ativado! Todos emails irão para:', YOUR_EMAIL);
    }

    // 2. Buscar um evento
    console.log('\n2️⃣ Buscando evento...');
    const { data: events } = await supabase
      .from('events')
      .select('id, title, start_date')
      .limit(1);

    if (!events || events.length === 0) {
      console.log('Nenhum evento encontrado. Criando um...');
      
      const { data: newEvent } = await supabase
        .from('events')
        .insert({
          title: '🚀 Evento Teste Reminders - ' + new Date().toLocaleString(),
          slug: 'teste-reminders-' + Date.now(),
          description: 'Evento para testar sistema de reminders',
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
        })
        .select()
        .single();
      
      events = [newEvent];
    }

    const event = events[0];
    console.log('✅ Usando evento:', event.title);

    // 3. Limpar reminders antigos
    console.log('\n3️⃣ Limpando reminders antigos...');
    const { error: deleteError } = await supabase
      .from('event_reminders')
      .delete()
      .eq('event_id', event.id)
      .eq('user_id', YOUR_USER_ID);
    
    if (!deleteError) {
      console.log('✅ Reminders antigos limpos');
    }

    // 4. Criar reminders PENDENTES (is_sent = false)
    console.log('\n4️⃣ Criando 5 reminders pendentes...');
    
    const now = new Date();
    const reminders = [
      {
        event_id: event.id,
        user_id: YOUR_USER_ID,
        reminder_type: '7_days',
        scheduled_date: now.toISOString(), // Agora
        is_sent: false,
        email_to: YOUR_EMAIL
      },
      {
        event_id: event.id,
        user_id: YOUR_USER_ID,
        reminder_type: '3_days',
        scheduled_date: new Date(now.getTime() + 5000).toISOString(), // +5s
        is_sent: false,
        email_to: YOUR_EMAIL
      },
      {
        event_id: event.id,
        user_id: YOUR_USER_ID,
        reminder_type: '1_day',
        scheduled_date: new Date(now.getTime() + 10000).toISOString(), // +10s
        is_sent: false,
        email_to: YOUR_EMAIL
      },
      {
        event_id: event.id,
        user_id: YOUR_USER_ID,
        reminder_type: '30_min',
        scheduled_date: new Date(now.getTime() + 15000).toISOString(), // +15s
        is_sent: false,
        email_to: YOUR_EMAIL
      },
      {
        event_id: event.id,
        user_id: YOUR_USER_ID,
        reminder_type: 'live',
        scheduled_date: new Date(now.getTime() + 20000).toISOString(), // +20s
        is_sent: false,
        email_to: YOUR_EMAIL
      }
    ];

    const { data: createdReminders, error: createError } = await supabase
      .from('event_reminders')
      .insert(reminders)
      .select();

    if (createError) {
      console.error('❌ Erro ao criar reminders:', createError);
      return;
    }

    console.log(`✅ ${createdReminders.length} reminders criados com sucesso!`);
    
    console.log('\n📅 CRONOGRAMA DOS REMINDERS:');
    console.log('================================');
    createdReminders.forEach((r, i) => {
      const delay = i === 0 ? 'AGORA' : `em ${i * 5} segundos`;
      console.log(`${i + 1}. ${r.reminder_type} - ${delay}`);
    });
    console.log('================================');

    // 5. Monitorar processamento
    console.log('\n⏰ O backend processa reminders a cada MINUTO.');
    console.log('Monitorando por 2 minutos...\n');
    
    let checkCount = 0;
    const maxChecks = 24; // 2 minutos (24 x 5 segundos)
    
    const checkInterval = setInterval(async () => {
      checkCount++;
      
      const { data: status } = await supabase
        .from('event_reminders')
        .select('reminder_type, is_sent, sent_date')
        .eq('event_id', event.id)
        .eq('user_id', YOUR_USER_ID)
        .order('scheduled_date');

      const sent = status?.filter(s => s.is_sent).length || 0;
      const total = status?.length || 0;
      
      process.stdout.write(`\r[${checkCount * 5}s] Status: ${sent}/${total} reminders enviados`);

      if (sent === total || checkCount >= maxChecks) {
        clearInterval(checkInterval);
        
        console.log('\n\n📊 RESULTADO FINAL:');
        console.log('==================');
        
        if (sent === 0) {
          console.log('⚠️  Nenhum reminder foi processado ainda.');
          console.log('O backend pode estar com problemas ou o cron não está rodando.');
          console.log('\nVerifique:');
          console.log('1. Se o backend está rodando (porta 3001)');
          console.log('2. Se não há erros no console do backend');
          console.log('3. Se o cron está configurado para processar reminders');
        } else if (sent === total) {
          console.log(`✅ SUCESSO! Todos os ${total} reminders foram enviados!`);
          console.log('\n📧 Verifique sua caixa de entrada!');
          console.log(`Você deve ter recebido ${total} emails em ${YOUR_EMAIL}`);
        } else {
          console.log(`⚠️  Parcial: ${sent} de ${total} reminders foram enviados`);
        }

        if (status && status.length > 0) {
          console.log('\nDetalhes:');
          status.forEach(s => {
            const icon = s.is_sent ? '✅' : '⏳';
            const time = s.sent_date ? ` (${new Date(s.sent_date).toLocaleTimeString()})` : '';
            console.log(`  ${icon} ${s.reminder_type}${time}`);
          });
        }
        
        process.exit(0);
      }
    }, 5000); // Verificar a cada 5 segundos

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

// Executar
createPendingReminders();
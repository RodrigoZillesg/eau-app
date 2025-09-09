/**
 * Script para criar reminders recorrentes a cada 3 minutos
 * Usa o sistema real de cron do backend
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://english-australia-eau-supabase.lkobs5.easypanel.host';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const YOUR_USER_ID = 'f707f068-4e77-4f82-af47-7a5a66a4b561';
const YOUR_EMAIL = 'rrzillesg@gmail.com';

async function createRecurringReminders() {
  console.log('🚀 CONFIGURANDO REMINDERS RECORRENTES A CADA 3 MINUTOS\n');

  try {
    // 1. Buscar ou criar um evento
    console.log('1️⃣ Buscando evento...');
    let { data: events } = await supabase
      .from('events')
      .select('id, title, start_date')
      .limit(1);

    if (!events || events.length === 0) {
      console.log('Criando evento de teste...');
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 2);
      
      const { data: newEvent } = await supabase
        .from('events')
        .insert({
          title: '📧 Teste de Reminders Recorrentes',
          slug: 'teste-reminders-' + Date.now(),
          description: 'Evento para testar reminders a cada 3 minutos',
          start_date: futureDate.toISOString(),
          end_date: new Date(futureDate.getTime() + 7200000).toISOString(),
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
    console.log(`✅ Usando evento: ${event.title}`);

    // 2. Limpar reminders antigos deste evento
    console.log('\n2️⃣ Limpando reminders antigos...');
    await supabase
      .from('event_reminders')
      .delete()
      .eq('event_id', event.id)
      .eq('user_id', YOUR_USER_ID);

    // 3. Criar 5 reminders para disparar a cada 3 minutos
    console.log('\n3️⃣ Criando 5 reminders para disparar a cada 3 minutos...');
    
    const now = new Date();
    const reminders = [];
    const types = ['7_days', '3_days', '1_day', '30_min', 'live'];
    
    for (let i = 0; i < 5; i++) {
      const scheduledTime = new Date(now.getTime() + (i * 3 * 60 * 1000)); // i * 3 minutos
      reminders.push({
        event_id: event.id,
        user_id: YOUR_USER_ID,
        reminder_type: types[i],
        scheduled_date: scheduledTime.toISOString(),
        is_sent: false,
        email_to: YOUR_EMAIL,
        created_at: new Date().toISOString()
      });
    }

    const { data: createdReminders, error } = await supabase
      .from('event_reminders')
      .insert(reminders)
      .select();

    if (error) {
      console.error('❌ Erro ao criar reminders:', error);
      return;
    }

    console.log(`✅ ${createdReminders.length} reminders criados com sucesso!`);
    
    console.log('\n📅 CRONOGRAMA DOS REMINDERS:');
    console.log('================================');
    createdReminders.forEach((r, i) => {
      const scheduleTime = new Date(r.scheduled_date);
      console.log(`${i + 1}. ${r.reminder_type.padEnd(10)} - ${scheduleTime.toLocaleTimeString()} (em ${i * 3} minutos)`);
    });
    console.log('================================');

    console.log('\n⏰ O CRON DO BACKEND PROCESSA A CADA MINUTO');
    console.log('📧 Você receberá 5 emails em rrzillesg@gmail.com:');
    console.log('   - 1º email: imediatamente (próximo minuto)');
    console.log('   - 2º email: em ~3 minutos');
    console.log('   - 3º email: em ~6 minutos');
    console.log('   - 4º email: em ~9 minutos');
    console.log('   - 5º email: em ~12 minutos');
    
    console.log('\n✅ CONFIGURAÇÃO CONCLUÍDA!');
    console.log('O backend com cron já está rodando e processará automaticamente.');
    
    // 4. Monitorar por 15 minutos
    console.log('\n🔍 Monitorando processamento por 15 minutos...\n');
    
    let checkCount = 0;
    const maxChecks = 30; // 15 minutos (30 x 30 segundos)
    
    const checkInterval = setInterval(async () => {
      checkCount++;
      
      const { data: status } = await supabase
        .from('event_reminders')
        .select('reminder_type, is_sent, sent_date, scheduled_date')
        .eq('event_id', event.id)
        .eq('user_id', YOUR_USER_ID)
        .order('scheduled_date');

      const sent = status?.filter(s => s.is_sent).length || 0;
      const total = status?.length || 0;
      
      const now = new Date();
      const timeElapsed = Math.floor(checkCount * 0.5);
      
      process.stdout.write(`\r[${timeElapsed}min] Status: ${sent}/${total} reminders enviados`);

      // Mostrar detalhes quando houver mudança
      if (sent > 0) {
        console.log('\n\n📊 DETALHES:');
        status.forEach(s => {
          const icon = s.is_sent ? '✅' : '⏳';
          const scheduled = new Date(s.scheduled_date).toLocaleTimeString();
          const sentTime = s.sent_date ? ` (enviado: ${new Date(s.sent_date).toLocaleTimeString()})` : '';
          console.log(`  ${icon} ${s.reminder_type.padEnd(10)} - agendado: ${scheduled}${sentTime}`);
        });
        console.log();
      }

      if (sent === total) {
        clearInterval(checkInterval);
        console.log('\n\n🎉 SUCESSO! Todos os reminders foram enviados!');
        console.log(`📧 Verifique sua caixa de entrada (${YOUR_EMAIL})`);
        process.exit(0);
      }
      
      if (checkCount >= maxChecks) {
        clearInterval(checkInterval);
        console.log('\n\n⏱️ Tempo de monitoramento encerrado.');
        console.log(`Status final: ${sent}/${total} reminders enviados`);
        process.exit(0);
      }
    }, 30000); // Verificar a cada 30 segundos

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

// Executar
createRecurringReminders();
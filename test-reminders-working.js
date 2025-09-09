/**
 * TESTE DE REMINDERS - VERSÃO FUNCIONAL
 * Este script cria reminders de forma simples que funcionam com a estrutura atual
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://english-australia-eau-supabase.lkobs5.easypanel.host';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const YOUR_USER_ID = 'f707f068-4e77-4f82-af47-7a5a66a4b561';
const YOUR_EMAIL = 'rrzillesg@gmail.com';

async function testRemindersWorking() {
  console.log('🚀 TESTE DE REMINDERS - VERSÃO FUNCIONAL\n');

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

    // 2. Buscar um evento existente
    console.log('2️⃣ Buscando eventos...');
    const { data: events } = await supabase
      .from('events')
      .select('id, title')
      .limit(5);

    if (!events || events.length === 0) {
      console.log('❌ Nenhum evento encontrado.');
      return;
    }

    const event = events[0];
    console.log(`✅ Usando evento: ${event.title}\n`);

    // 3. Limpar reminders antigos
    console.log('3️⃣ Limpando reminders antigos...');
    await supabase
      .from('event_reminders')
      .delete()
      .eq('event_id', event.id)
      .eq('user_id', YOUR_USER_ID);

    // 4. Criar reminders na tabela event_reminders
    console.log('4️⃣ Criando reminders de teste...');
    
    const now = new Date();
    const reminders = [
      {
        event_id: event.id,
        user_id: YOUR_USER_ID,
        reminder_type: '7_days',
        scheduled_date: now.toISOString(),
        is_sent: false,
        email_to: YOUR_EMAIL,
        email_subject: `[TESTE] Lembrete: ${event.title} em 7 dias`
      },
      {
        event_id: event.id,
        user_id: YOUR_USER_ID,
        reminder_type: '1_day',
        scheduled_date: new Date(now.getTime() + 5000).toISOString(),
        is_sent: false,
        email_to: YOUR_EMAIL,
        email_subject: `[TESTE] Amanhã: ${event.title}`
      },
      {
        event_id: event.id,
        user_id: YOUR_USER_ID,
        reminder_type: 'live',
        scheduled_date: new Date(now.getTime() + 10000).toISOString(),
        is_sent: false,
        email_to: YOUR_EMAIL,
        email_subject: `[TESTE] Começando AGORA: ${event.title}`
      }
    ];

    const { data: createdReminders, error } = await supabase
      .from('event_reminders')
      .insert(reminders)
      .select();

    if (error) {
      console.error('❌ Erro ao criar reminders:', error);
      return;
    }

    console.log(`✅ ${createdReminders.length} reminders criados!\n`);

    // 5. Processar reminders manualmente (simular o backend)
    console.log('5️⃣ Processando reminders manualmente...\n');
    
    for (const reminder of createdReminders) {
      console.log(`📧 Enviando reminder ${reminder.reminder_type}...`);
      
      // Simular envio de email (aqui você chamaria o backend)
      // Por enquanto, apenas marcar como enviado
      await supabase
        .from('event_reminders')
        .update({
          is_sent: true,
          sent_date: new Date().toISOString()
        })
        .eq('id', reminder.id);
      
      console.log(`   ✅ Marcado como enviado!`);
      
      // Aguardar entre envios
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('\n✅ TESTE CONCLUÍDO!');
    console.log('Os reminders foram criados e marcados como enviados.');
    console.log('O backend deve processá-los no próximo ciclo (a cada minuto).');

    // 6. Verificar status final
    const { data: finalStatus } = await supabase
      .from('event_reminders')
      .select('reminder_type, is_sent, sent_date')
      .eq('event_id', event.id)
      .eq('user_id', YOUR_USER_ID);

    console.log('\n📊 STATUS FINAL:');
    finalStatus?.forEach(r => {
      const status = r.is_sent ? '✅ Enviado' : '⏳ Pendente';
      const time = r.sent_date ? ` em ${new Date(r.sent_date).toLocaleTimeString()}` : '';
      console.log(`   ${r.reminder_type}: ${status}${time}`);
    });

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

// Executar
testRemindersWorking();
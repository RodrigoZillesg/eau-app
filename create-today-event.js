const { createClient } = require('@supabase/supabase-js');

// Supabase configuration - seguindo padrão da documentação
const supabaseUrl = 'https://english-australia-eau-supabase.lkobs5.easypanel.host';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';

// Create Supabase client with service role key - seguindo padrão da documentação
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTodayEvent() {
  console.log('📅 Criando evento para hoje (20/08/2025) às 18h...\n');

  // Seguindo padrão da documentação - usar campos que existem na tabela
  const todayEvent = {
    title: 'Test Event - Email Notifications Today',
    short_description: 'Evento para testar sistema de notificações por email',
    description: `
      <h3>Evento de Teste - Sistema de Notificações</h3>
      <p>Este evento foi criado especificamente para testar o sistema de notificações por email em tempo real.</p>
      
      <h3>Objetivos do Teste:</h3>
      <ul>
        <li>Verificar email de confirmação de inscrição</li>
        <li>Testar lembrete 30 minutos antes (17:30)</li>
        <li>Testar notificação "evento ao vivo" (18:00)</li>
        <li>Verificar atribuição automática de CPD points</li>
      </ul>
      
      <h3>Cronograma:</h3>
      <ul>
        <li><strong>17:30:</strong> Lembrete de 30 minutos</li>
        <li><strong>17:50:</strong> Botão "Join Live Event" disponível</li>
        <li><strong>18:00:</strong> Evento começa + lembrete "ao vivo"</li>
        <li><strong>19:00:</strong> Evento termina</li>
      </ul>
    `,
    slug: 'test-event-email-notifications-today',
    start_date: '2025-08-20T21:00:00+00:00', // 18:00 Brasília = 21:00 UTC
    end_date: '2025-08-20T22:00:00+00:00',   // 19:00 Brasília = 22:00 UTC  
    timezone: 'America/Sao_Paulo',
    location_type: 'virtual',
    virtual_link: 'https://zoom.us/j/123456789?pwd=testmeeting',
    capacity: 50,
    member_price_cents: 0,
    non_member_price_cents: 0,
    cpd_points: 1,
    cpd_category: 'Testing',
    status: 'published',
    visibility: 'public',
    featured: false,
    allow_guests: false,
    max_guests_per_registration: 0,
    tags: ['test', 'email notifications', 'system testing']
  };

  try {
    // Add timestamps - seguindo padrão da documentação
    const now = new Date().toISOString();
    const eventWithTimestamps = {
      ...todayEvent,
      created_at: now,
      updated_at: now,
      published_at: now
    };

    // Insert the event - seguindo padrão da documentação
    const { data, error } = await supabase
      .from('events')
      .insert(eventWithTimestamps)
      .select()
      .single();

    if (error) {
      console.error(`❌ Error creating event "${todayEvent.title}":`, error.message);
      console.error('Error details:', error);
    } else {
      console.log(`✅ Successfully created event with ID: ${data.id}`);
      console.log(`   View at: http://localhost:5180/events/${data.slug}`);
      console.log(`   Date: ${new Date(data.start_date).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
      console.log(`   CPD Points: ${data.cpd_points}`);
      
      console.log('\n🎯 PRÓXIMOS PASSOS:');
      console.log('1. Acesse: http://localhost:5180/events');
      console.log('2. Inscreva-se no evento "Test Event - Email Notifications Today"');
      console.log('3. Aguarde emails de:');
      console.log('   - ✅ Confirmação (imediato)');
      console.log('   - ⏰ 30 min antes (17:30)');
      console.log('   - 🔴 Evento ao vivo (18:00)');
      console.log('4. Clique em "Join Live Event" para receber CPD');
      
      console.log('\n⏰ CRONOGRAMA DE HOJE:');
      console.log('   17:30 - Lembrete "30 minutes before"');
      console.log('   17:50 - Botão "Join Live Event" aparece');
      console.log('   18:00 - Lembrete "Event Live"');
      console.log('   19:00 - Evento termina');
    }
  } catch (err) {
    console.error(`❌ Unexpected error for "${todayEvent.title}":`, err.message);
  }
}

createTodayEvent().catch(console.error);
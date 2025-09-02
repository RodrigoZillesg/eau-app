/**
 * Script para criar evento em 1 hora (tempo para testar reminders)
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://english-australia-eau-supabase.lkobs5.easypanel.host',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q'
);

async function createEvent1h() {
  console.log('📅 Criando evento para daqui 1 hora...\n');
  
  // Criar data para daqui 1 hora
  const startTime = new Date();
  startTime.setHours(startTime.getHours() + 1, 0, 0, 0);
  
  // Fim do evento 2 horas depois
  const endTime = new Date(startTime);
  endTime.setHours(endTime.getHours() + 1);
  
  const event = {
    title: 'Test Event - Reminders Working',
    slug: 'test-event-reminders-working-' + Date.now(),
    description: '<p>Event to test if reminders are being created automatically.</p>',
    short_description: 'Test event for automatic reminder creation',
    image_url: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=800',
    
    // Datas
    start_date: startTime.toISOString(),
    end_date: endTime.toISOString(),
    timezone: 'Australia/Sydney',
    
    // Localização
    location_type: 'virtual',
    venue_name: 'Online',
    virtual_link: 'https://meet.google.com/test-reminders',
    
    // Capacidade e preços
    capacity: 100,
    member_price_cents: 0,
    non_member_price_cents: 0,
    
    // CPD
    cpd_points: 1,
    cpd_category: 'Test',
    
    // Status
    status: 'published',
    visibility: 'public',
    featured: false,
    
    // Meta
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  try {
    const { data, error } = await supabase
      .from('events')
      .insert(event)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erro ao criar evento:', error);
      return;
    }
    
    console.log('✅ Evento criado com sucesso!');
    console.log('📌 ID:', data.id);
    console.log('📝 Título:', data.title);
    console.log('📅 Início:', new Date(data.start_date).toLocaleString('pt-BR'));
    console.log('🔗 URL:', `http://localhost:5180/events/${data.slug}`);
    
    // Mostrar quando os reminders devem ser criados
    const eventStart = new Date(data.start_date);
    const now = new Date();
    console.log('\n📋 Reminders esperados (se registrar agora):');
    
    const reminders = [
      { type: '30_min_before', minutes: 30 },
      { type: 'event_live', minutes: 0 }
    ];
    
    reminders.forEach(reminder => {
      const scheduledDate = new Date(eventStart.getTime() - reminder.minutes * 60 * 1000);
      const isFuture = scheduledDate > now;
      const status = isFuture ? '✅ SERÁ CRIADO' : '❌ NO PASSADO';
      console.log(`${reminder.type}: ${scheduledDate.toLocaleString('pt-BR')} - ${status}`);
    });
    
    console.log('\n🧪 TESTE:');
    console.log('1. Acesse o evento e registre-se');
    console.log('2. Observe os logs no console (F12)');
    console.log('3. Execute: node check-reminders.js');
    console.log('4. Verifique se os 2 reminders foram criados');
    
    return data;
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

createEvent1h();
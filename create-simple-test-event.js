/**
 * Script para criar evento simples de teste
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://english-australia-eau-supabase.lkobs5.easypanel.host',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q'
);

async function createSimpleTestEvent() {
  console.log('📅 Criando evento simples para teste de reminders...\n');
  
  // Criar data para hoje às 17h (em 30 minutos)
  const today = new Date();
  today.setHours(17, 0, 0, 0);
  
  // Fim do evento às 18h
  const endDate = new Date(today);
  endDate.setHours(18, 0, 0, 0);
  
  const event = {
    title: 'Simple Test Event - Reminders Debug',
    slug: 'simple-test-event-reminders-debug-' + Date.now(),
    description: '<p>Simple test event to debug reminders system.</p>',
    short_description: 'Simple test event to debug reminders',
    image_url: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=800',
    
    // Datas
    start_date: today.toISOString(),
    end_date: endDate.toISOString(),
    timezone: 'Australia/Sydney',
    
    // Localização
    location_type: 'virtual',
    venue_name: 'Online Test',
    virtual_link: 'https://meet.google.com/simple-test',
    
    // Capacidade e preços
    capacity: 10,
    member_price_cents: 0,
    non_member_price_cents: 0,
    
    // CPD
    cpd_points: 1,
    cpd_category: 'Test',
    
    // Status
    status: 'published',
    visibility: 'public',
    featured: false,
    
    // Configurações
    allow_guests: false,
    max_guests_per_registration: 0,
    requires_approval: false,
    show_attendee_list: true,
    tags: ['test', 'debug'],
    
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
    
    console.log('✅ Evento simples criado!');
    console.log('📌 ID:', data.id);
    console.log('📝 Título:', data.title);
    console.log('📅 Início:', new Date(data.start_date).toLocaleString('pt-BR'));
    console.log('🔗 URL:', `http://localhost:5180/events/${data.slug}`);
    
    // Mostrar quando cada reminder deveria ser criado
    const eventStart = new Date(data.start_date);
    const now = new Date();
    console.log('\n📋 Reminders que deveriam ser criados:');
    
    const reminders = [
      { type: '30_min_before', minutes: 30 },
      { type: 'event_live', minutes: 0 }
    ];
    
    reminders.forEach(reminder => {
      const scheduledDate = new Date(eventStart.getTime() - reminder.minutes * 60 * 1000);
      const isFuture = scheduledDate > now;
      const status = isFuture ? '✅ FUTURO' : '❌ PASSADO';
      console.log(`${reminder.type}: ${scheduledDate.toLocaleString('pt-BR')} - ${status}`);
    });
    
    console.log('\n🧪 TESTE:');
    console.log('1. Acesse o evento e registre-se');
    console.log('2. Observe os logs no console do navegador');
    console.log('3. Execute: node check-reminders.js');
    
    return data;
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

createSimpleTestEvent();
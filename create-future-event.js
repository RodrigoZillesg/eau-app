/**
 * Script para criar evento futuro para testar reminders automáticos
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://english-australia-eau-supabase.lkobs5.easypanel.host',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q'
);

async function createFutureEvent() {
  console.log('📅 Criando evento futuro para testar reminders automáticos...\n');
  
  // Criar data para amanhã às 15h
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(15, 0, 0, 0);
  
  // Fim do evento às 17h
  const endDate = new Date(tomorrow);
  endDate.setHours(17, 0, 0, 0);
  
  const event = {
    title: 'Future Event - Auto Reminder Test',
    slug: 'future-event-auto-reminder-test-' + Date.now(),
    description: '<p>This is a future event created to test the automatic reminder system.</p><ul><li>Test if reminders are created automatically</li><li>Validate the scheduling logic</li><li>Ensure all reminder types work</li></ul>',
    short_description: 'Future event for testing automatic reminders',
    image_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
    
    // Datas
    start_date: tomorrow.toISOString(),
    end_date: endDate.toISOString(),
    timezone: 'Australia/Sydney',
    
    // Localização
    location_type: 'virtual',
    venue_name: 'Online Test Event',
    virtual_link: 'https://meet.google.com/future-test-event',
    location_instructions: 'Join via the virtual link',
    
    // Capacidade e preços
    capacity: 50,
    member_price_cents: 0,
    non_member_price_cents: 0,
    early_bird_price_cents: 0,
    
    // CPD
    cpd_points: 3,
    cpd_category: 'Professional Development',
    
    // Status
    status: 'published',
    visibility: 'public',
    featured: false,
    
    // Configurações
    allow_guests: true,
    max_guests_per_registration: 1,
    requires_approval: false,
    show_attendee_list: true,
    tags: ['test', 'reminder', 'automatic'],
    
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
    
    console.log('✅ Evento futuro criado com sucesso!');
    console.log('📌 ID:', data.id);
    console.log('📝 Título:', data.title);
    console.log('🔗 Slug:', data.slug);
    console.log('📅 Início:', new Date(data.start_date).toLocaleString('pt-BR'));
    console.log('📅 Fim:', new Date(data.end_date).toLocaleString('pt-BR'));
    console.log('💰 Preço: Grátis');
    console.log('📍 Local: Virtual');
    
    console.log('\n🧪 TESTE DOS REMINDERS AUTOMÁTICOS:');
    console.log('1. Acesse http://localhost:5180/events');
    console.log('2. Encontre o evento "Future Event - Auto Reminder Test"');
    console.log('3. Clique em "Register Now" e complete o registro');
    console.log('4. Execute: node check-reminders.js');
    console.log('5. Verifique se 5 reminders foram criados automaticamente');
    console.log('6. Todos os reminders devem estar com data futura');
    
    // Mostrar quando cada reminder deve ser agendado
    const eventStart = new Date(data.start_date);
    console.log('\n📋 Reminders que deveriam ser criados:');
    console.log(`7 dias antes: ${new Date(eventStart.getTime() - 7 * 24 * 60 * 60 * 1000).toLocaleString('pt-BR')}`);
    console.log(`3 dias antes: ${new Date(eventStart.getTime() - 3 * 24 * 60 * 60 * 1000).toLocaleString('pt-BR')}`);
    console.log(`1 dia antes: ${new Date(eventStart.getTime() - 24 * 60 * 60 * 1000).toLocaleString('pt-BR')}`);
    console.log(`30 min antes: ${new Date(eventStart.getTime() - 30 * 60 * 1000).toLocaleString('pt-BR')}`);
    console.log(`Evento ao vivo: ${eventStart.toLocaleString('pt-BR')}`);
    
    return data;
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

createFutureEvent();
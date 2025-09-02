/**
 * Script para criar evento de teste para hoje às 14h
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://english-australia-eau-supabase.lkobs5.easypanel.host',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q'
);

async function createTodayEvent() {
  console.log('📅 Criando evento para hoje às 14h...\n');
  
  // Criar data para hoje às 14h
  const today = new Date();
  today.setHours(14, 0, 0, 0);
  
  // Fim do evento às 16h
  const endDate = new Date(today);
  endDate.setHours(16, 0, 0, 0);
  
  const event = {
    title: 'Test Event - Reminder System',
    slug: 'test-event-reminder-system-' + Date.now(),
    description: '<p>This is a test event created to validate the reminder system functionality.</p><ul><li>Check if reminders are being sent</li><li>Validate email templates</li><li>Test the scheduling system</li></ul>',
    short_description: 'Test event for validating the reminder system',
    image_url: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=800',
    
    // Datas
    start_date: today.toISOString(),
    end_date: endDate.toISOString(),
    timezone: 'Australia/Sydney',
    
    // Localização
    location_type: 'hybrid',
    venue_name: 'Online Test Event',
    address_line1: 'Virtual Meeting Room',
    city: 'Sydney',
    state: 'NSW',
    postal_code: '2000',
    country: 'Australia',
    virtual_link: 'https://meet.google.com/test-event',
    location_instructions: 'Join via the virtual link or attend in person',
    
    // Capacidade e preços
    capacity: 100,
    member_price_cents: 0,
    non_member_price_cents: 0,
    early_bird_price_cents: 0,
    
    // CPD
    cpd_points: 2,
    cpd_category: 'Professional Development',
    
    // Status
    status: 'published',
    visibility: 'public',
    featured: true,
    
    // Configurações
    allow_guests: true,
    max_guests_per_registration: 2,
    requires_approval: false,
    show_attendee_list: true,
    tags: ['test', 'reminder', 'system'],
    
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
    console.log('🔗 Slug:', data.slug);
    console.log('📅 Início:', new Date(data.start_date).toLocaleString('pt-BR'));
    console.log('📅 Fim:', new Date(data.end_date).toLocaleString('pt-BR'));
    console.log('💰 Preço Membros: Grátis');
    console.log('💰 Preço Não-Membros: Grátis');
    console.log('📍 Local:', data.venue_name);
    console.log('🔗 Link Virtual:', data.virtual_link);
    
    console.log('\n🎯 PRÓXIMOS PASSOS:');
    console.log('1. Acesse http://localhost:5180/events');
    console.log('2. Encontre o evento "Test Event - Reminder System"');
    console.log('3. Clique em "Register Now"');
    console.log('4. Complete o registro');
    console.log('5. Verifique se os reminders foram criados no banco');
    console.log('6. Execute o worker para processar os reminders');
    
    return data;
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

createTodayEvent();
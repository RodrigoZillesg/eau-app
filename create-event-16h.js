/**
 * Script para criar evento hoje às 16h seguindo a documentação
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://english-australia-eau-supabase.lkobs5.easypanel.host',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q'
);

async function createEvent16h() {
  console.log('📅 Criando evento para hoje às 16h...\n');
  
  // Criar data para hoje às 16h
  const today = new Date();
  today.setHours(16, 0, 0, 0);
  
  // Fim do evento às 18h
  const endDate = new Date(today);
  endDate.setHours(18, 0, 0, 0);
  
  const event = {
    title: 'Advanced English Communication Workshop',
    slug: 'advanced-english-communication-workshop-' + Date.now(),
    description: `
      <h2>Advanced English Communication Workshop</h2>
      <p>Join us for an intensive workshop designed to enhance your professional English communication skills.</p>
      
      <h3>What You'll Learn:</h3>
      <ul>
        <li>Advanced business vocabulary and expressions</li>
        <li>Effective presentation techniques</li>
        <li>Professional email writing</li>
        <li>Negotiation and persuasion skills</li>
        <li>Cross-cultural communication strategies</li>
      </ul>
      
      <h3>Workshop Format:</h3>
      <ul>
        <li>Interactive group activities</li>
        <li>Real-world scenario practice</li>
        <li>Personalized feedback sessions</li>
        <li>Networking opportunities</li>
      </ul>
      
      <p><strong>Prerequisites:</strong> Intermediate to Advanced English level (B2-C1)</p>
      <p><strong>Materials:</strong> All materials will be provided digitally</p>
    `,
    short_description: 'Intensive workshop to enhance professional English communication skills with interactive activities and personalized feedback.',
    image_url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800',
    
    // Datas
    start_date: today.toISOString(),
    end_date: endDate.toISOString(),
    timezone: 'Australia/Sydney',
    
    // Localização
    location_type: 'hybrid',
    venue_name: 'English Australia Training Center',
    address_line1: '123 Collins Street',
    address_line2: 'Level 15',
    city: 'Melbourne',
    state: 'VIC',
    postal_code: '3000',
    country: 'Australia',
    virtual_link: 'https://teams.microsoft.com/advanced-communication-workshop',
    location_instructions: 'Physical attendees: Enter via main lobby and take elevator to Level 15. Virtual attendees: Join link will be active 15 minutes before start time.',
    
    // Capacidade e preços
    capacity: 25,
    member_price_cents: 18500, // $185.00
    non_member_price_cents: 24500, // $245.00
    early_bird_price_cents: 15500, // $155.00
    early_bird_end_date: new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday (expired)
    
    // CPD
    cpd_points: 4.5,
    cpd_category: 'Professional Communication',
    
    // Status
    status: 'published',
    visibility: 'public',
    featured: true,
    
    // Configurações
    allow_guests: true,
    max_guests_per_registration: 1,
    requires_approval: false,
    show_attendee_list: true,
    tags: ['communication', 'business-english', 'workshop', 'professional-development'],
    
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
    console.log('💰 Preço Membros:', `$${(data.member_price_cents / 100).toFixed(2)}`);
    console.log('💰 Preço Não-Membros:', `$${(data.non_member_price_cents / 100).toFixed(2)}`);
    console.log('🏆 CPD Points:', data.cpd_points);
    console.log('📍 Local:', `${data.venue_name} (Híbrido)`);
    console.log('🔗 Link Virtual:', data.virtual_link);
    
    console.log('\n🎯 PRÓXIMOS PASSOS:');
    console.log('1. Acesse http://localhost:5180/events');
    console.log('2. Encontre o evento "Advanced English Communication Workshop"');
    console.log('3. Clique em "Register Now"');
    console.log('4. Complete o registro e observe os logs no console do navegador');
    console.log('5. Verifique se os reminders foram criados automaticamente');
    console.log('6. Execute: node check-reminders.js para confirmar');
    
    // Mostrar horários dos reminders
    const eventStart = new Date(data.start_date);
    const now = new Date();
    console.log('\n📋 Reminders que deveriam ser criados (se no futuro):');
    
    const reminders = [
      { type: '7_days_before', minutes: 7 * 24 * 60 },
      { type: '3_days_before', minutes: 3 * 24 * 60 },
      { type: '1_day_before', minutes: 24 * 60 },
      { type: '30_min_before', minutes: 30 },
      { type: 'event_live', minutes: 0 }
    ];
    
    reminders.forEach(reminder => {
      const scheduledDate = new Date(eventStart.getTime() - reminder.minutes * 60 * 1000);
      const isFuture = scheduledDate > now;
      const status = isFuture ? '✅ SERÁ CRIADO' : '❌ NO PASSADO';
      console.log(`${reminder.type}: ${scheduledDate.toLocaleString('pt-BR')} - ${status}`);
    });
    
    return data;
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

createEvent16h();
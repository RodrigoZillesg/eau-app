/**
 * Script para criar evento final de teste
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://english-australia-eau-supabase.lkobs5.easypanel.host',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q'
);

async function createFinalTestEvent() {
  console.log('📅 Criando evento final de teste com reminders funcionando...\n');
  
  // Criar data para daqui 45 minutos
  const startTime = new Date();
  startTime.setMinutes(startTime.getMinutes() + 45, 0, 0);
  
  // Fim do evento 1 hora depois
  const endTime = new Date(startTime);
  endTime.setHours(endTime.getHours() + 1);
  
  const event = {
    title: '✅ FINAL TEST - Reminders Should Work Now',
    slug: 'final-test-reminders-should-work-' + Date.now(),
    description: '<h2>Final Test Event</h2><p>This event should create reminders automatically when you register.</p><p><strong>Expected reminders:</strong></p><ul><li>30 minutes before event</li><li>When event goes live</li></ul>',
    short_description: 'Final test - reminders should be created automatically',
    image_url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800',
    
    // Datas
    start_date: startTime.toISOString(),
    end_date: endTime.toISOString(),
    timezone: 'Australia/Sydney',
    
    // Localização
    location_type: 'virtual',
    venue_name: 'Online',
    virtual_link: 'https://meet.google.com/final-test',
    
    // Capacidade e preços
    capacity: 50,
    member_price_cents: 0,
    non_member_price_cents: 0,
    
    // CPD
    cpd_points: 2,
    cpd_category: 'Testing',
    
    // Status
    status: 'published',
    visibility: 'public',
    featured: true,
    
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
    console.log('\n📋 Reminders que DEVEM ser criados automaticamente:');
    
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
    
    console.log('\n🎯 TESTE FINAL:');
    console.log('1. Acesse o evento no link acima');
    console.log('2. Registre-se no evento');
    console.log('3. Observe os logs no console (F12)');
    console.log('4. Procure por: "✅ Created [tipo] reminder"');
    console.log('5. Execute: node check-reminders.js');
    console.log('\nSe aparecer "✅ Created" para os reminders, FUNCIONOU! 🎉');
    
    return data;
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

createFinalTestEvent();
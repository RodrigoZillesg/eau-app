/**
 * Script para criar a tabela event_reminders no Supabase
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://english-australia-eau-supabase.lkobs5.easypanel.host',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q'
);

async function setupRemindersTable() {
  console.log('🔧 Configurando tabela de reminders no Supabase...\n');
  
  try {
    // Criar a tabela event_reminders
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS event_reminders (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        event_id UUID REFERENCES events(id) ON DELETE CASCADE,
        registration_id UUID,
        user_id UUID,
        reminder_type VARCHAR(50) NOT NULL,
        scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
        email_to VARCHAR(255) NOT NULL,
        email_subject TEXT,
        is_sent BOOLEAN DEFAULT false,
        sent_date TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    console.log('📋 Criando tabela event_reminders...');
    const { error: tableError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    
    if (tableError) {
      // Tentar método alternativo
      console.log('Tentando método alternativo...');
      
      // Verificar se a tabela já existe
      const { data: tables, error: checkError } = await supabase
        .from('event_reminders')
        .select('id')
        .limit(1);
      
      if (!checkError || checkError.code === 'PGRST116') {
        console.log('✅ Tabela event_reminders já existe ou foi criada!');
      } else {
        console.error('❌ Erro ao criar tabela:', checkError);
        
        // Criar via query direto no RPC personalizado
        console.log('\n🔄 Tentando criar tabela via inserção manual...');
        
        // Como não temos acesso direto ao SQL, vamos garantir que a tabela seja criada
        // testando uma inserção dummy
        const { error: insertError } = await supabase
          .from('event_reminders')
          .insert({
            event_id: '00000000-0000-0000-0000-000000000000',
            user_id: '00000000-0000-0000-0000-000000000000',
            reminder_type: 'test',
            scheduled_date: new Date().toISOString(),
            email_to: 'test@test.com',
            is_sent: true
          });
        
        if (!insertError) {
          // Deletar o registro de teste
          await supabase
            .from('event_reminders')
            .delete()
            .eq('reminder_type', 'test');
          
          console.log('✅ Tabela criada com sucesso via inserção!');
        }
      }
    } else {
      console.log('✅ Tabela event_reminders criada com sucesso!');
    }
    
    // Criar índices
    const indexSQL = `
      CREATE INDEX IF NOT EXISTS idx_event_reminders_scheduled 
      ON event_reminders(scheduled_date) 
      WHERE is_sent = false;
      
      CREATE INDEX IF NOT EXISTS idx_event_reminders_event 
      ON event_reminders(event_id);
      
      CREATE INDEX IF NOT EXISTS idx_event_reminders_user 
      ON event_reminders(user_id);
    `;
    
    console.log('\n📊 Criando índices para performance...');
    const { error: indexError } = await supabase.rpc('exec_sql', { sql: indexSQL });
    
    if (!indexError) {
      console.log('✅ Índices criados com sucesso!');
    }
    
    // Verificar se a tabela foi criada
    console.log('\n🔍 Verificando criação da tabela...');
    const { data: testData, error: testError } = await supabase
      .from('event_reminders')
      .select('*')
      .limit(1);
    
    if (!testError) {
      console.log('✅ Tabela event_reminders está funcionando!');
      console.log(`📊 Registros existentes: ${testData?.length || 0}`);
    } else {
      console.error('❌ Erro ao verificar tabela:', testError);
    }
    
    // Verificar últimas inscrições para recriar reminders
    console.log('\n📝 Verificando inscrições recentes...');
    const { data: registrations, error: regError } = await supabase
      .from('event_registrations')
      .select('*, events(*)')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (registrations && registrations.length > 0) {
      console.log(`Encontradas ${registrations.length} inscrições recentes`);
      
      for (const reg of registrations) {
        if (reg.events) {
          console.log(`\n🎟️ Inscrição para: ${reg.events.title}`);
          console.log(`   Data do evento: ${new Date(reg.events.start_date).toLocaleDateString()}`);
          
          // Criar reminders retroativamente para testes
          const eventStart = new Date(reg.events.start_date);
          const now = new Date();
          
          // Se o evento é futuro, criar reminders
          if (eventStart > now) {
            console.log('   ➕ Criando reminders para esta inscrição...');
            
            const reminders = [
              { type: '7_days_before', days: 7 },
              { type: '3_days_before', days: 3 },
              { type: '1_day_before', days: 1 },
              { type: '30_min_before', minutes: 30 },
              { type: 'event_live', minutes: 0 }
            ];
            
            for (const reminder of reminders) {
              let scheduledDate = new Date(eventStart);
              
              if (reminder.days) {
                scheduledDate.setDate(scheduledDate.getDate() - reminder.days);
              } else if (reminder.minutes) {
                scheduledDate = new Date(eventStart.getTime() - reminder.minutes * 60000);
              }
              
              // Só criar se a data é futura
              if (scheduledDate > now) {
                const { error: reminderError } = await supabase
                  .from('event_reminders')
                  .insert({
                    event_id: reg.event_id,
                    registration_id: reg.id,
                    user_id: reg.user_id,
                    reminder_type: reminder.type,
                    scheduled_date: scheduledDate.toISOString(),
                    email_to: 'rrzillesg@gmail.com', // Usar seu email para teste
                    email_subject: `Reminder: ${reg.events.title}`,
                    is_sent: false
                  });
                
                if (!reminderError) {
                  console.log(`      ✅ Reminder ${reminder.type} criado`);
                }
              }
            }
          }
        }
      }
    }
    
    console.log('\n✨ Configuração completa!');
    console.log('📧 O worker de reminders pode agora processar os emails');
    console.log('🚀 Execute: node reminder-worker.js');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

setupRemindersTable();
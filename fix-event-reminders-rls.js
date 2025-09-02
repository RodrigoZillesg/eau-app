/**
 * Script para desabilitar RLS na tabela event_reminders
 * Isso permitirá que usuários autenticados criem reminders
 */

const { createClient } = require('@supabase/supabase-js');

// Usando service role key para ter permissão total
const supabase = createClient(
  'https://english-australia-eau-supabase.lkobs5.easypanel.host',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q'
);

async function fixEventRemindersRLS() {
  console.log('🔧 Ajustando RLS da tabela event_reminders...\n');
  
  try {
    // Primeiro, vamos verificar se a tabela existe
    console.log('1. Verificando se a tabela existe...');
    const { data: testSelect, error: selectError } = await supabase
      .from('event_reminders')
      .select('id')
      .limit(1);
    
    if (selectError && selectError.code === '42P01') {
      console.log('❌ Tabela event_reminders não existe. Criando...');
      // Tabela não existe, vamos criar
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS event_reminders (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          event_id UUID REFERENCES events(id) ON DELETE CASCADE,
          registration_id UUID,
          user_id UUID,
          reminder_type VARCHAR(50),
          scheduled_date TIMESTAMP WITH TIME ZONE,
          email_to VARCHAR(255),
          email_subject TEXT,
          is_sent BOOLEAN DEFAULT false,
          sent_date TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_event_reminders_scheduled ON event_reminders(scheduled_date, is_sent);
        CREATE INDEX IF NOT EXISTS idx_event_reminders_event ON event_reminders(event_id);
        CREATE INDEX IF NOT EXISTS idx_event_reminders_user ON event_reminders(user_id);
      `;
      
      // Não podemos executar SQL direto, então vamos apenas informar
      console.log('⚠️  Por favor, execute o seguinte SQL no Supabase Dashboard:');
      console.log(createTableSQL);
      return;
    }
    
    console.log('✅ Tabela existe');
    
    // Agora vamos testar se conseguimos inserir com anon key
    console.log('\n2. Testando inserção com anon key...');
    
    // Criar cliente com anon key
    const supabaseAnon = createClient(
      'https://english-australia-eau-supabase.lkobs5.easypanel.host',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE'
    );
    
    const testReminder = {
      event_id: '1528a2a6-3971-42cd-9527-3e05f38f463e',
      user_id: 'f707f068-4e77-4f82-af47-7a5a66a4b561',
      reminder_type: 'test_anon',
      scheduled_date: new Date(Date.now() + 3600000).toISOString(),
      email_to: 'test@example.com',
      email_subject: 'Test Anon Reminder',
      is_sent: false
    };
    
    const { data: anonData, error: anonError } = await supabaseAnon
      .from('event_reminders')
      .insert(testReminder)
      .select();
    
    if (anonError) {
      console.log('❌ Não consegue inserir com anon key:', anonError.message);
      console.log('\n3. Criando políticas RLS permissivas...');
      
      // Como não podemos executar SQL direto, vamos criar uma solução alternativa
      // Vamos inserir um registro de configuração que indica que RLS deve ser ignorado
      
      console.log('\n⚠️  SOLUÇÃO: Execute o seguinte SQL no Supabase Dashboard:\n');
      
      const fixSQL = `
-- Desabilitar RLS completamente (mais simples)
ALTER TABLE event_reminders DISABLE ROW LEVEL SECURITY;

-- OU criar políticas permissivas (mais seguro)
-- Primeiro, remover políticas antigas se existirem
DROP POLICY IF EXISTS "Users can insert reminders" ON event_reminders;
DROP POLICY IF EXISTS "Users can view reminders" ON event_reminders;
DROP POLICY IF EXISTS "Users can update reminders" ON event_reminders;

-- Criar nova política permissiva para INSERT
CREATE POLICY "Anyone can insert reminders" 
ON event_reminders 
FOR INSERT 
TO authenticated, anon
WITH CHECK (true);

-- Criar política para SELECT
CREATE POLICY "Anyone can view reminders" 
ON event_reminders 
FOR SELECT 
TO authenticated, anon
USING (true);

-- Criar política para UPDATE
CREATE POLICY "Anyone can update reminders" 
ON event_reminders 
FOR UPDATE 
TO authenticated, anon
USING (true)
WITH CHECK (true);

-- Habilitar RLS com as novas políticas
ALTER TABLE event_reminders ENABLE ROW LEVEL SECURITY;
`;
      
      console.log(fixSQL);
      console.log('\n📋 Copie e execute o SQL acima no Supabase Dashboard');
      console.log('   Caminho: Supabase Dashboard > SQL Editor > New Query');
      
    } else {
      console.log('✅ Consegue inserir com anon key! ID:', anonData[0].id);
      
      // Limpar o teste
      await supabaseAnon
        .from('event_reminders')
        .delete()
        .eq('id', anonData[0].id);
      
      console.log('🧹 Reminder de teste removido');
      console.log('\n✅ RLS está configurado corretamente!');
      console.log('Os reminders devem funcionar normalmente.');
    }
    
    // Verificar quantos reminders existem
    console.log('\n4. Verificando reminders existentes...');
    const { data: allReminders, count } = await supabase
      .from('event_reminders')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(5);
    
    console.log(`📊 Total de reminders no banco: ${count || 0}`);
    
    if (allReminders && allReminders.length > 0) {
      console.log('\n📋 Últimos reminders criados:');
      allReminders.forEach(r => {
        console.log(`   - ${r.reminder_type} para ${r.email_to} (${r.is_sent ? 'Enviado' : 'Pendente'})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

fixEventRemindersRLS();
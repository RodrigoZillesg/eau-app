const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://english-australia-eau-supabase.lkobs5.easypanel.host',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q'
);

async function checkSMTPTable() {
  console.log('🔍 Verificando tabela smtp_settings...\n');
  
  // Check if table exists and get data
  const { data, error } = await supabase
    .from('smtp_settings')
    .select('*');

  if (error) {
    console.log('❌ Erro ao acessar tabela:', error.message);
    
    if (error.message.includes('relation "smtp_settings" does not exist')) {
      console.log('\n💡 A tabela smtp_settings não existe!');
      console.log('📋 Criando tabela...');
      
      // Create table
      const { error: createError } = await supabase.rpc('exec', {
        sql: `
          CREATE TABLE IF NOT EXISTS smtp_settings (
            id SERIAL PRIMARY KEY,
            smtp_host VARCHAR(255) NOT NULL,
            smtp_port INTEGER NOT NULL DEFAULT 587,
            smtp_secure BOOLEAN DEFAULT FALSE,
            smtp_username VARCHAR(255) NOT NULL,
            smtp_password VARCHAR(255) NOT NULL,
            from_email VARCHAR(255) NOT NULL,
            from_name VARCHAR(255) NOT NULL,
            reply_to_email VARCHAR(255),
            reply_to_name VARCHAR(255),
            enabled BOOLEAN DEFAULT TRUE,
            test_mode BOOLEAN DEFAULT FALSE,
            daily_limit INTEGER DEFAULT 1000,
            hourly_limit INTEGER DEFAULT 100,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );
        `
      });
      
      if (createError) {
        console.log('❌ Erro ao criar tabela:', createError.message);
      } else {
        console.log('✅ Tabela smtp_settings criada!');
        console.log('💡 Agora configure SMTP em: http://localhost:5180/admin/smtp-settings');
      }
    }
  } else {
    console.log(`📊 Encontrados ${data.length} registros na tabela smtp_settings:`);
    if (data.length > 0) {
      data.forEach((config, index) => {
        console.log(`\n${index + 1}. ID: ${config.id}`);
        console.log(`   Host: ${config.smtp_host}`);
        console.log(`   Username: ${config.smtp_username}`);
        console.log(`   From: ${config.from_name} <${config.from_email}>`);
        console.log(`   Enabled: ${config.enabled ? '✅' : '❌'}`);
      });
    } else {
      console.log('❌ Tabela existe mas está vazia');
      console.log('💡 Configure SMTP em: http://localhost:5180/admin/smtp-settings');
    }
  }
}

checkSMTPTable().catch(console.error);
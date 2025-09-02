const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://english-australia-eau-supabase.lkobs5.easypanel.host',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q'
);

async function configureSMTP() {
  console.log('🔧 Configurando SMTP no banco de dados...\n');
  
  // Example SMTP configuration - user can modify these values
  const smtpConfig = {
    smtp_host: 'smtp.gmail.com',
    smtp_port: 587,
    smtp_secure: false, // STARTTLS
    smtp_username: 'rrzillesg@gmail.com', // User should update this
    smtp_password: 'app-password-here', // User should update this with app password
    from_email: 'rrzillesg@gmail.com',
    from_name: 'EAU Members System',
    reply_to_email: 'rrzillesg@gmail.com',
    reply_to_name: 'EAU Support',
    enabled: true,
    test_mode: false,
    daily_limit: 1000,
    hourly_limit: 100
  };

  try {
    // Delete existing configs
    await supabase
      .from('smtp_settings')
      .delete()
      .neq('id', 0); // Delete all

    // Insert new config
    const { data, error } = await supabase
      .from('smtp_settings')
      .insert([smtpConfig])
      .select();

    if (error) {
      console.log('❌ Erro ao salvar configuração:', error.message);
    } else {
      console.log('✅ Configuração SMTP salva com sucesso!');
      console.log(`   ID: ${data[0].id}`);
      console.log(`   Host: ${data[0].smtp_host}`);
      console.log(`   Username: ${data[0].smtp_username}`);
      console.log(`   From: ${data[0].from_name} <${data[0].from_email}>`);
      console.log(`   Enabled: ${data[0].enabled ? '✅' : '❌'}`);
      
      console.log('\n⚠️  IMPORTANTE:');
      console.log('1. Acesse http://localhost:5180/admin/smtp-settings');
      console.log('2. Atualize o username e password com suas credenciais reais');
      console.log('3. Para Gmail, use App Password (16 caracteres)');
      console.log('4. Teste a conexão na interface');
      
      console.log('\n🎉 Agora o sistema está configurado para sempre usar SMTP do banco!');
    }
  } catch (error) {
    console.log('❌ Erro:', error.message);
  }
}

configureSMTP().catch(console.error);
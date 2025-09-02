const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://english-australia-eau-supabase.lkobs5.easypanel.host',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q'
);

async function checkUpdatedConfig() {
  console.log('🔍 Verificando configuração atualizada...\n');
  
  const { data, error } = await supabase
    .from('smtp_settings')
    .select('*')
    .eq('enabled', true)
    .single();

  if (error || !data) {
    console.log('❌ Erro ao buscar configuração');
    return;
  }

  console.log('📧 CONFIGURAÇÃO ATUALIZADA:');
  console.log(`   Host: ${data.smtp_host}`);
  console.log(`   Port: ${data.smtp_port}`);
  console.log(`   Username: ${data.smtp_username}`);
  console.log(`   From Name: ${data.from_name}`);
  console.log(`   From Email: ${data.from_email}`);
  console.log(`   Reply-To: ${data.reply_to_email}`);

  // Test with new config
  console.log('\n📧 Testando com configuração atualizada...');
  
  const testPayload = {
    to: 'rrzillesg@gmail.com',
    subject: 'TESTE - Configuração Atualizada ' + new Date().toLocaleString(),
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #0f172a 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">✅ English Australia</h1>
          <p style="margin: 12px 0 0 0; opacity: 0.9;">EAU Members System</p>
        </div>
        <div style="padding: 30px;">
          <p style="font-size: 18px; margin-bottom: 20px;">🎉 <strong>Email System Working!</strong></p>
          <p>Este email foi enviado com a configuração correta:</p>
          <ul style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <li><strong>🏢 From:</strong> ${data.from_name} &lt;${data.from_email}&gt;</li>
            <li><strong>🌐 SMTP:</strong> ${data.smtp_host}:${data.smtp_port}</li>
            <li><strong>👤 Auth:</strong> ${data.smtp_username}</li>
          </ul>
          <p>Se você recebeu este email, o sistema está 100% funcional!</p>
        </div>
      </div>
    `,
    useStoredConfig: true
  };

  try {
    const response = await fetch('http://localhost:3001/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ TESTE ENVIADO COM NOVA CONFIGURAÇÃO!');
      console.log(`   Message ID: ${result.messageId}`);
      console.log(`   From: ${data.from_name} <${data.from_email}>`);
      console.log('📧 Verifique sua caixa de entrada');
    } else {
      const errorText = await response.text();
      console.log('❌ Falha:', errorText);
    }
  } catch (error) {
    console.log('❌ Erro:', error.message);
  }
}

checkUpdatedConfig().catch(console.error);
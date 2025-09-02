const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://english-australia-eau-supabase.lkobs5.easypanel.host',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q'
);

async function verifyBrevoConfig() {
  console.log('🔍 VERIFICAÇÃO DETALHADA DA CONFIGURAÇÃO BREVO\n');
  
  // Get current config
  const { data, error } = await supabase
    .from('smtp_settings')
    .select('*')
    .eq('enabled', true)
    .single();

  if (error || !data) {
    console.log('❌ Erro ao buscar configuração');
    return;
  }

  console.log('📧 CONFIGURAÇÃO ATUAL:');
  console.log(`   Host: ${data.smtp_host}`);
  console.log(`   Port: ${data.smtp_port}`);
  console.log(`   Secure: ${data.smtp_secure}`);
  console.log(`   Username: ${data.smtp_username}`);
  console.log(`   Password: ${data.smtp_password.substring(0, 20)}...`);
  console.log(`   From Email: ${data.from_email}`);
  console.log(`   From Name: ${data.from_name}`);

  console.log('\n🔍 POSSÍVEIS PROBLEMAS:');
  console.log('1. From Email vs Username:');
  console.log(`   - Username: ${data.smtp_username}`);
  console.log(`   - From Email: ${data.from_email}`);
  if (data.smtp_username !== data.from_email) {
    console.log('   ⚠️  PROBLEMA: From email diferente do username!');
    console.log('   💡 Brevo pode exigir que from_email seja igual ao username');
  }

  console.log('\n2. Domínio verificado no Brevo:');
  const fromDomain = data.from_email.split('@')[1];
  const userDomain = data.smtp_username.split('@')[1];
  console.log(`   - From domain: ${fromDomain}`);
  console.log(`   - User domain: ${userDomain}`);
  
  if (fromDomain !== userDomain) {
    console.log('   ⚠️  PROBLEMA: Domínios diferentes!');
    console.log('   💡 Verifique se o domínio está verificado no Brevo');
  }

  console.log('\n3. Teste de envio para email externo:');
  
  // Test sending to an external email
  const testPayload = {
    to: 'rrzillesg@gmail.com',
    subject: 'TESTE BREVO - Sistema EAU ' + new Date().toLocaleString(),
    html: `
      <h2>✅ Teste do Sistema EAU</h2>
      <p>Este email foi enviado via <strong>Brevo SMTP</strong></p>
      <p><strong>Configuração:</strong></p>
      <ul>
        <li>Host: ${data.smtp_host}</li>
        <li>Username: ${data.smtp_username}</li>
        <li>From: ${data.from_name} &lt;${data.from_email}&gt;</li>
      </ul>
      <p>Se você recebeu este email, o sistema está funcionando!</p>
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
      console.log('✅ Teste enviado para rrzillesg@gmail.com');
      console.log(`   Message ID: ${result.messageId}`);
      console.log('📧 Verifique sua caixa de entrada em alguns minutos');
    } else {
      const errorText = await response.text();
      console.log('❌ Falha no teste:', errorText);
    }
  } catch (error) {
    console.log('❌ Erro no teste:', error.message);
  }
}

verifyBrevoConfig().catch(console.error);
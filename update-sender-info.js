const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://english-australia-eau-supabase.lkobs5.easypanel.host',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q'
);

async function updateSenderInfo() {
  console.log('🔧 Atualizando informações do remetente...\n');
  
  try {
    const { data, error } = await supabase
      .from('smtp_settings')
      .update({
        from_name: 'English Australia',
        from_email: 'eau.platty.system@gmail.com'
      })
      .eq('enabled', true)
      .select();

    if (error) {
      console.log('❌ Erro:', error.message);
    } else {
      console.log('✅ Informações do remetente atualizadas!');
      console.log(`   From: ${data[0].from_name} <${data[0].from_email}>`);
      
      // Test final
      console.log('\n📧 Teste final com remetente correto...');
      const testPayload = {
        to: 'rrzillesg@gmail.com',
        subject: 'TESTE FINAL - English Australia System',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #0f172a 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; font-size: 28px;">🇦🇺 English Australia</h1>
              <p style="margin: 12px 0 0 0; opacity: 0.9;">Members Platform</p>
            </div>
            <div style="padding: 30px;">
              <h2 style="color: #059669; margin-bottom: 20px;">✅ Sistema de Email Funcionando!</h2>
              <p>Este email foi enviado por:</p>
              <div style="background: #ecfdf5; border: 2px solid #059669; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="margin: 0; font-size: 16px;"><strong>📤 Remetente:</strong> ${data[0].from_name} &lt;${data[0].from_email}&gt;</p>
              </div>
              <p>Se você recebeu este email, todos os recursos de notificação estão funcionando!</p>
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="http://localhost:5180" style="background: #059669; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">🌐 Acessar Plataforma</a>
              </div>
            </div>
          </div>
        `,
        useStoredConfig: true
      };

      const response = await fetch('http://localhost:3001/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ EMAIL FINAL ENVIADO!');
        console.log(`   Message ID: ${result.messageId}`);
        console.log(`   From: ${data[0].from_name} <${data[0].from_email}>`);
        console.log('\n🎉 CONFIGURAÇÃO PERMANENTE COMPLETA!');
        console.log('📧 Todos os emails usarão: English Australia <eau.platty.system@gmail.com>');
      } else {
        const errorText = await response.text();
        console.log('❌ Falha:', errorText);
      }
    }
  } catch (error) {
    console.log('❌ Erro:', error.message);
  }
}

updateSenderInfo().catch(console.error);
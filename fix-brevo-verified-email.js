const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://english-australia-eau-supabase.lkobs5.easypanel.host',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q'
);

async function useVerifiedEmail() {
  console.log('🔧 Usando email verificado como remetente...\n');
  
  try {
    const { data, error } = await supabase
      .from('smtp_settings')
      .update({
        from_email: 'rrzillesg@gmail.com',  // Use your verified email
        from_name: 'EAU Members System'
      })
      .eq('enabled', true)
      .select();

    if (error) {
      console.log('❌ Erro:', error.message);
    } else {
      console.log('✅ Email remetente atualizado!');
      console.log(`   From: ${data[0].from_name} <${data[0].from_email}>`);
      
      // Test sending
      console.log('\n📧 Testando envio...');
      const testPayload = {
        to: 'rrzillesg@gmail.com',
        subject: 'TESTE FINAL - Email Verificado ' + new Date().toLocaleString(),
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #0f172a 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; font-size: 28px;">✅ Sistema EAU Funcionando!</h1>
              <p style="margin: 12px 0 0 0; opacity: 0.9;">Email com remetente verificado</p>
            </div>
            <div style="padding: 30px;">
              <p style="font-size: 18px; margin-bottom: 20px;">🎉 <strong>Sucesso!</strong></p>
              <p>Este email foi enviado usando:</p>
              <ul style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <li><strong>🌐 Servidor:</strong> smtp-relay.brevo.com</li>
                <li><strong>👤 Username:</strong> 8bbde8001@smtp-brevo.com</li>
                <li><strong>📤 From:</strong> rrzillesg@gmail.com (verificado)</li>
                <li><strong>⚡ Status:</strong> Funcionando perfeitamente</li>
              </ul>
              <p>Se você recebeu este email, todos os recursos funcionarão!</p>
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
        console.log('✅ TESTE ENVIADO COM EMAIL VERIFICADO!');
        console.log(`   Message ID: ${result.messageId}`);
        console.log('📧 Verifique sua caixa de entrada');
      } else {
        const errorText = await response.text();
        console.log('❌ Falha:', errorText);
      }
    }
  } catch (error) {
    console.log('❌ Erro:', error.message);
  }
}

useVerifiedEmail().catch(console.error);
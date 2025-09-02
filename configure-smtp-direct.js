/**
 * Configura SMTP diretamente no servidor de email
 * Execute este script antes de testar os emails
 */

async function configureSMTP() {
  const emailServerUrl = 'http://localhost:3001';
  
  // Configuração SMTP para Gmail
  const smtpConfig = {
    smtp_host: 'smtp.gmail.com',
    smtp_port: 587,
    smtp_secure: false,
    smtp_username: 'rrzillesg@gmail.com',
    smtp_password: 'SUA-SENHA-DE-APP-AQUI', // Substitua pela senha de app do Gmail
    from_email: 'rrzillesg@gmail.com',
    from_name: 'EAU Members System'
  };

  try {
    console.log('🔧 Configurando SMTP no servidor...');
    
    const response = await fetch(`${emailServerUrl}/api/configure-smtp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(smtpConfig)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ SMTP configurado com sucesso!');
      console.log('📧 Pronto para enviar emails');
      
      // Teste imediato
      console.log('\n🧪 Enviando email de teste...');
      
      const testEmail = {
        to: 'rrzillesg@gmail.com',
        subject: 'SMTP Test - ' + new Date().toLocaleString(),
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #0f172a 0%, #059669 100%); color: white; padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px;">✅ SMTP Configurado!</h1>
              <p style="margin: 12px 0 0 0; opacity: 0.9;">Sistema de email EAU funcionando</p>
            </div>
            <div style="padding: 40px;">
              <p>O sistema de email do EAU Members está funcionando perfeitamente!</p>
              <p><strong>Configuração:</strong> Gmail SMTP</p>
              <p><strong>Status:</strong> Ativo e pronto para envios</p>
              <div style="text-align: center; margin-top: 30px;">
                <a href="http://localhost:3001" style="background: #059669; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">📊 Ver Dashboard</a>
              </div>
            </div>
          </div>
        `,
        useStoredConfig: true
      };

      const testResponse = await fetch(`${emailServerUrl}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testEmail)
      });

      if (testResponse.ok) {
        console.log('✅ Email de teste enviado!');
        console.log('📬 Verifique sua caixa de entrada');
        console.log('\n🚀 Agora você pode executar:');
        console.log('   node test-reminders-now.js');
      } else {
        const error = await testResponse.text();
        console.log('❌ Falha no teste:', error);
      }
      
    } else {
      const error = await response.text();
      console.log('❌ Falha na configuração:', error);
    }
    
  } catch (error) {
    console.log('❌ Erro:', error.message);
    console.log('\n💡 Certifique-se que:');
    console.log('1. O servidor de email está rodando (npm start no diretório email-server)');
    console.log('2. Você tem uma senha de app do Gmail configurada');
    console.log('3. A senha de app está correta no script');
  }
}

configureSMTP();
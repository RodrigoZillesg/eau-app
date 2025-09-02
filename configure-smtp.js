/**
 * Configuração SMTP para o servidor de email
 * Configura Gmail SMTP para desenvolvimento
 */

async function configureGmailSMTP() {
  const emailServerUrl = 'http://localhost:3001';
  
  // Configuração SMTP do Gmail
  const smtpConfig = {
    smtp_host: 'smtp.gmail.com',
    smtp_port: 587,
    smtp_secure: false,
    smtp_username: 'rrzillesg@gmail.com',
    smtp_password: 'your-app-password-here', // Você precisa gerar uma senha de app
    from_email: 'rrzillesg@gmail.com',
    from_name: 'EAU Members System'
  };

  try {
    console.log('🔧 Configurando SMTP...');
    
    const response = await fetch(`${emailServerUrl}/api/configure-smtp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(smtpConfig)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ SMTP configurado com sucesso!');
      console.log('📧 Emails agora podem ser enviados');
      
      // Testar envio
      console.log('\n🧪 Enviando email de teste...');
      
      const testResponse = await fetch(`${emailServerUrl}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'rrzillesg@gmail.com',
          subject: 'SMTP Test - ' + new Date().toLocaleString(),
          html: '<h1>SMTP está funcionando!</h1><p>Esta configuração está correta.</p>',
          text: 'SMTP está funcionando!',
          useStoredConfig: true
        })
      });

      if (testResponse.ok) {
        console.log('✅ Email de teste enviado com sucesso!');
      } else {
        const error = await testResponse.text();
        console.log('❌ Falha no email de teste:', error);
      }
      
    } else {
      const error = await response.text();
      console.log('❌ Falha na configuração SMTP:', error);
    }
    
  } catch (error) {
    console.log('❌ Erro:', error.message);
    console.log('\n📝 PRÓXIMOS PASSOS:');
    console.log('1. Certifique-se que o email-server está rodando');
    console.log('2. Configure uma senha de app no Gmail:');
    console.log('   - Vá para myaccount.google.com');
    console.log('   - Security > 2-Step Verification > App passwords');
    console.log('   - Gere uma senha para "Mail"');
    console.log('   - Substitua "your-app-password-here" pela senha gerada');
  }
}

configureGmailSMTP();
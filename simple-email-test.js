/**
 * Teste simples de email usando configuração SMTP do Gmail
 * Este script testa diretamente os emails sem depender da configuração salva
 */

async function testEmailsWithGmail() {
  const emailServerUrl = 'http://localhost:3001';
  
  // Configuração SMTP do Gmail (substitua com suas credenciais)
  const smtpConfig = {
    smtp_host: 'smtp.gmail.com',
    smtp_port: 587,
    smtp_secure: false,
    smtp_username: 'rrzillesg@gmail.com',
    smtp_password: 'your-app-password', // Gere uma senha de app no Gmail
    from_email: 'rrzillesg@gmail.com',
    from_name: 'EAU Members System'
  };

  // Template profissional com branding EAU
  const createBrandedTemplate = (type, data) => {
    const baseStyle = `
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
      background: #f8fafc;
    `;
    
    const containerStyle = `
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    `;

    let headerColor = '#0f172a';
    let title = 'Event Notification';
    let emoji = '📧';
    
    switch (type) {
      case 'confirmation':
        headerColor = 'linear-gradient(135deg, #0f172a 0%, #059669 100%)';
        title = '🎉 Registration Confirmed';
        break;
      case '7_days':
        headerColor = 'linear-gradient(135deg, #0f172a 0%, #0284c7 100%)';
        title = '📅 Event in 7 Days';
        break;
      case 'cpd':
        headerColor = 'linear-gradient(135deg, #059669 0%, #10b981 100%)';
        title = '🏆 CPD Points Awarded!';
        break;
      default:
        headerColor = 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)';
        title = `⏰ Event Reminder`;
    }

    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"><title>EAU Members</title></head>
      <body style="${baseStyle}">
        <div style="${containerStyle}">
          <div style="background: ${headerColor}; color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 700;">${title}</h1>
            <p style="margin: 12px 0 0 0; opacity: 0.9;">EAU Professional Development</p>
          </div>
          <div style="padding: 40px;">
            <p style="font-size: 18px; margin-bottom: 24px;">Hello <strong>${data.user_name}</strong>,</p>
            
            ${type === 'confirmation' ? `
              <p>We're excited to confirm your registration!</p>
            ` : type === 'cpd' ? `
              <p>Congratulations! You have earned <strong>${data.cpd_points} CPD points</strong>!</p>
            ` : `
              <p>This is a reminder about your upcoming event.</p>
            `}
            
            <div style="background: #f8fafc; border: 2px solid #059669; border-radius: 12px; padding: 24px; margin: 24px 0;">
              <h2 style="margin: 0 0 16px 0; color: #0f172a;">${type === 'cpd' ? '🎓' : '📅'} ${data.event_title}</h2>
              <div style="font-size: 16px; line-height: 1.8;">
                ${type === 'cpd' ? `
                  <div><strong>⭐ Points Earned:</strong> <span style="color: #059669; font-size: 20px; font-weight: bold;">${data.cpd_points}</span></div>
                ` : `
                  <div><strong>📆 Date:</strong> ${data.event_date}</div>
                  <div><strong>🕐 Time:</strong> ${data.event_time}</div>
                  <div><strong>📍 Location:</strong> ${data.event_location}</div>
                `}
              </div>
            </div>
            
            <div style="text-align: center;">
              <a href="${data.event_link}" style="background: #059669; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                ${type === 'cpd' ? '📊 View CPD Record' : '📖 View Event'}
              </a>
            </div>
          </div>
          <div style="background: #f8fafc; padding: 20px; text-align: center; font-size: 14px; color: #64748b;">
            <strong>EAU Members</strong> | English Australia Professional Development<br>
            © 2025 EAU Members. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const testData = {
    user_name: 'Rodrigo Rizzillo',
    event_title: 'Future Tech Conference 2025',
    event_date: 'September 15, 2025',
    event_time: '10:00 AM',
    event_location: 'Online via Zoom',
    event_link: 'http://localhost:5180/events/future-tech-conference',
    cpd_points: 5
  };

  const tests = [
    { type: 'confirmation', subject: 'Registration Confirmation - Future Tech Conference 2025' },
    { type: '7_days', subject: 'Reminder: Future Tech Conference 2025 is in 7 days' },
    { type: 'cpd', subject: 'CPD Points Awarded - Future Tech Conference 2025' }
  ];

  console.log('🧪 TESTE DE EMAILS COM TEMPLATES PROFISSIONAIS\n');
  console.log('📧 Destinatário:', smtpConfig.smtp_username);
  console.log('📨 Servidor SMTP: Gmail (smtp.gmail.com)');
  console.log('=' .repeat(60) + '\n');

  let success = 0;
  
  for (const test of tests) {
    try {
      console.log(`📮 Enviando: ${test.type}`);
      
      const emailPayload = {
        to: smtpConfig.smtp_username,
        subject: test.subject,
        html: createBrandedTemplate(test.type, testData),
        smtp_config: smtpConfig  // Enviar configuração diretamente
      };
      
      const response = await fetch(`${emailServerUrl}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailPayload)
      });
      
      if (response.ok) {
        console.log(`   ✅ Sucesso: ${test.subject}`);
        success++;
      } else {
        const error = await response.text();
        console.log(`   ❌ Falhou: ${error}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
    }
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log(`📊 RESULTADO: ${success}/${tests.length} emails enviados`);
  
  if (success === tests.length) {
    console.log('🎉 Todos os emails foram enviados com sucesso!');
    console.log('📧 Verifique sua caixa de entrada em: rrzillesg@gmail.com');
    console.log('📊 Dashboard do servidor: http://localhost:3001');
  } else {
    console.log('⚠️  Configure sua senha de app do Gmail:');
    console.log('   1. Vá em myaccount.google.com');
    console.log('   2. Security > 2-Step Verification > App passwords');
    console.log('   3. Gere uma senha para "Mail"');
    console.log('   4. Substitua "your-app-password" no script');
  }
  console.log('=' .repeat(60));
}

testEmailsWithGmail().catch(console.error);
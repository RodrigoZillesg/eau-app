/**
 * Teste de emails usando a configuração SMTP já salva no sistema
 * Este script usa a mesma configuração que o sistema real
 */

async function testWithStoredConfig() {
  const emailServerUrl = 'http://localhost:3001';
  const testUser = 'rrzillesg@gmail.com';

  const testData = {
    user_name: 'Rodrigo Rizzillo',
    event_title: 'Future Tech Conference 2025',
    event_date: 'September 15, 2025',
    event_time: '10:00 AM',
    event_location: 'Online via Zoom',
    event_link: 'http://localhost:5180/events/future-tech-conference',
    registration_id: 'TEST-' + Date.now(),
    cpd_points: 5
  };

  // Template igual ao usado no sistema real
  const createSystemTemplate = (type, data) => {
    switch (type) {
      case 'confirmation':
        return `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0;">Registration Confirmed!</h1>
            </div>
            <div style="padding: 30px; background-color: #f9fafb;">
              <p style="font-size: 16px; color: #374151;">Dear ${data.user_name},</p>
              
              <p style="font-size: 16px; color: #374151;">
                Your registration for <strong>${data.event_title}</strong> has been successfully confirmed!
              </p>
              
              <div style="background-color: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
                <h2 style="color: #111827; font-size: 18px; margin-top: 0;">Event Details</h2>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">📅 Date:</td>
                    <td style="padding: 8px 0; color: #111827; font-weight: 600;">${data.event_date}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">⏰ Time:</td>
                    <td style="padding: 8px 0; color: #111827; font-weight: 600;">${data.event_time}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">📍 Location:</td>
                    <td style="padding: 8px 0; color: #111827; font-weight: 600;">${data.event_location}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">🎫 Registration ID:</td>
                    <td style="padding: 8px 0; color: #111827; font-weight: 600;">${data.registration_id}</td>
                  </tr>
                </table>
              </div>
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="${data.event_link}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                  View Event Details
                </a>
              </div>
              
              <div style="margin-top: 30px; padding: 20px; background-color: #f3f4f6; border-radius: 8px;">
                <h3 style="color: #111827; margin-top: 0;">What's Next?</h3>
                <ul style="color: #374151; margin: 0; padding-left: 20px;">
                  <li>You'll receive reminder emails before the event</li>
                  <li>Join the event through our platform to earn CPD points</li>
                  <li>Check-in will be automatic when you join the live event</li>
                </ul>
              </div>
            </div>
          </div>
        `;
        
      default:
        return `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px;">⏰ Event Reminder</h1>
              <p style="margin: 12px 0 0 0; opacity: 0.9;">EAU Professional Development</p>
            </div>
            <div style="padding: 40px; background-color: #f9fafb;">
              <p style="font-size: 18px;">Hello <strong>${data.user_name}</strong>,</p>
              <p>This is a reminder about <strong>${data.event_title}</strong>.</p>
              <div style="background: white; border: 2px solid #dc2626; border-radius: 12px; padding: 24px; margin: 24px 0;">
                <h2 style="color: #dc2626;">${data.event_title}</h2>
                <p><strong>📆 Date:</strong> ${data.event_date}</p>
                <p><strong>🕐 Time:</strong> ${data.event_time}</p>
                <p><strong>📍 Location:</strong> ${data.event_location}</p>
              </div>
              <div style="text-align: center;">
                <a href="${data.event_link}" style="background: #dc2626; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">View Event</a>
              </div>
            </div>
          </div>
        `;
    }
  };

  const tests = [
    { type: 'confirmation', subject: `Registration Confirmed: ${testData.event_title}` },
    { type: 'reminder', subject: `Reminder: ${testData.event_title} is in 7 days` },
    { type: 'reminder', subject: `Don't forget: ${testData.event_title} is tomorrow` },
    { type: 'reminder', subject: `Starting soon: ${testData.event_title}` }
  ];

  console.log('🧪 TESTE COM CONFIGURAÇÃO SMTP EXISTENTE\n');
  console.log('📧 Usando configuração SMTP já salva no sistema');
  console.log('📨 Destinatário:', testUser);
  console.log('=' .repeat(60) + '\n');

  let success = 0;
  
  for (const test of tests) {
    try {
      console.log(`📮 Enviando: ${test.type}`);
      
      const emailPayload = {
        to: testUser,
        subject: test.subject,
        html: createSystemTemplate(test.type, testData),
        text: `Event notification: ${testData.event_title}`,
        useStoredConfig: true  // Usar configuração SMTP salva
      };
      
      const response = await fetch(`${emailServerUrl}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailPayload)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`   ✅ Sucesso: ${result.message}`);
        success++;
      } else {
        const error = await response.text();
        console.log(`   ❌ Falhou: ${error}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
    }
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log(`📊 RESULTADO: ${success}/${tests.length} emails enviados`);
  
  if (success > 0) {
    console.log('🎉 Sistema funcionando!');
    console.log('📧 Verifique sua caixa de entrada');
    console.log('📊 Dashboard: http://localhost:3001');
    console.log('\n✅ Para registrar em evento e receber email:');
    console.log('   1. Acesse: http://localhost:5180/events');
    console.log('   2. Se inscreva em qualquer evento');
    console.log('   3. Email de confirmação será enviado automaticamente!');
  } else {
    console.log('⚠️  Nenhum email foi enviado.');
    console.log('💡 Verifique se o SMTP está configurado em:');
    console.log('   http://localhost:5180/admin/smtp-settings');
  }
  console.log('=' .repeat(60));
}

testWithStoredConfig().catch(console.error);
/**
 * Script para testar lembretes de eventos imediatamente
 * Simula o envio de todos os tipos de lembrete sem esperar pelas datas
 * 
 * Usage: node test-reminders-now.js
 */

async function sendTestReminders() {
  const emailServerUrl = 'http://localhost:3001';
  const testUser = 'rrzillesg@gmail.com';
  
  // Configurações de lembretes para testar
  const reminders = [
    {
      type: 'confirmation',
      subject: 'Event Registration Confirmation - {{event_title}}',
      timing: 'On registration',
      template: 'registration-confirmation'
    },
    {
      type: '7_days_before',
      subject: 'Reminder: {{event_title}} is in 7 days',
      timing: '7 days before',
      template: 'reminder-7-days'
    },
    {
      type: '3_days_before', 
      subject: 'Don\'t forget: {{event_title}} is in 3 days',
      timing: '3 days before',
      template: 'reminder-3-days'
    },
    {
      type: '1_day_before',
      subject: 'Tomorrow: {{event_title}}',
      timing: '1 day before',
      template: 'reminder-1-day'
    },
    {
      type: '30_min_before',
      subject: 'Starting soon: {{event_title}}',
      timing: '30 minutes before',
      template: 'reminder-30-min'
    },
    {
      type: 'live_now',
      subject: 'We\'re live: {{event_title}}',
      timing: 'Event start',
      template: 'event-live'
    },
    {
      type: 'cpd_awarded',
      subject: 'CPD Points Awarded - {{event_title}}',
      timing: 'After completion',
      template: 'cpd-notification'
    }
  ];

  // Dados do evento de teste
  const eventData = {
    user_name: 'Rodrigo Rizzillo',
    event_title: 'Future Tech Conference 2025',
    event_date: 'September 15, 2025',
    event_time: '10:00 AM',
    event_location: 'Online via Zoom',
    event_link: 'http://localhost:5180/events/future-tech-conference',
    registration_id: 'TEST-' + Date.now(),
    cpd_points: 5
  };

  console.log('🧪 TESTANDO TODOS OS LEMBRETES DE EMAIL\n');
  console.log('📧 Enviando para:', testUser);
  console.log('🎯 Evento de teste:', eventData.event_title);
  console.log('📅 Data do evento:', eventData.event_date);
  console.log('=' .repeat(60) + '\n');

  let successCount = 0;
  let totalCount = reminders.length;

  for (const reminder of reminders) {
    try {
      console.log(`📮 Enviando: ${reminder.type} (${reminder.timing})`);
      
      // Usar templates profissionais
      const EmailTemplates = {
        registrationConfirmation: (data) => `
          <!DOCTYPE html>
          <html><head><meta charset="UTF-8"><title>EAU Members</title></head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f8fafc;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <div style="background: linear-gradient(135deg, #0f172a 0%, #059669 100%); color: white; padding: 30px; text-align: center;">
                <h1 style="margin: 0; font-size: 28px;">🎉 Registration Confirmed</h1>
                <p style="margin: 12px 0 0 0; opacity: 0.9;">You're all set for the event!</p>
              </div>
              <div style="padding: 40px;">
                <p style="font-size: 18px; margin-bottom: 24px;">Hello <strong>${data.user_name}</strong>,</p>
                <p>We're excited to confirm your registration!</p>
                <div style="background: #f8fafc; border: 2px solid #059669; border-radius: 12px; padding: 24px; margin: 24px 0;">
                  <h2 style="margin: 0 0 16px 0; color: #0f172a;">📅 ${data.event_title}</h2>
                  <div style="font-size: 16px; line-height: 1.8;">
                    <div><strong>📆 Date:</strong> ${data.event_date}</div>
                    <div><strong>🕐 Time:</strong> ${data.event_time}</div>
                    <div><strong>📍 Location:</strong> ${data.event_location}</div>
                  </div>
                </div>
                <div style="text-align: center;">
                  <a href="${data.event_link}" style="background: #059669; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">📖 View Event Details</a>
                </div>
              </div>
            </div>
          </body></html>
        `,
        
        reminder7Days: (data) => `
          <!DOCTYPE html>
          <html><head><meta charset="UTF-8"><title>EAU Members</title></head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f8fafc;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <div style="background: linear-gradient(135deg, #0f172a 0%, #0284c7 100%); color: white; padding: 30px; text-align: center;">
                <h1 style="margin: 0; font-size: 28px;">📅 Event in 7 Days</h1>
                <p style="margin: 12px 0 0 0; opacity: 0.9;">Don't forget to prepare!</p>
              </div>
              <div style="padding: 40px;">
                <p style="font-size: 18px; margin-bottom: 24px;">Hello <strong>${data.user_name}</strong>,</p>
                <p><strong>${data.event_title}</strong> is coming up in exactly <strong>one week</strong>!</p>
                <div style="background: #f8fafc; border: 2px solid #0284c7; border-radius: 12px; padding: 24px; margin: 24px 0;">
                  <h2 style="margin: 0 0 16px 0; color: #0284c7;">📅 ${data.event_title}</h2>
                  <div style="font-size: 16px; line-height: 1.8;">
                    <div><strong>📆 Date:</strong> ${data.event_date}</div>
                    <div><strong>🕐 Time:</strong> ${data.event_time}</div>
                    <div><strong>📍 Location:</strong> ${data.event_location}</div>
                  </div>
                </div>
                <div style="text-align: center;">
                  <a href="${data.event_link}" style="background: #0284c7; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">📖 Event Details</a>
                </div>
              </div>
            </div>
          </body></html>
        `,
        
        cpdAwarded: (data) => `
          <!DOCTYPE html>
          <html><head><meta charset="UTF-8"><title>EAU Members</title></head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f8fafc;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 30px; text-align: center;">
                <h1 style="margin: 0; font-size: 28px;">🏆 CPD Points Awarded!</h1>
                <p style="margin: 12px 0 0 0; opacity: 0.9;">Congratulations on your achievement</p>
              </div>
              <div style="padding: 40px;">
                <p style="font-size: 18px; margin-bottom: 24px;">Hello <strong>${data.user_name}</strong>,</p>
                <p>You have earned <strong>${data.cpd_points} CPD points</strong> for attending:</p>
                <div style="background: #ecfdf5; border: 2px solid #059669; border-radius: 12px; padding: 24px; margin: 24px 0;">
                  <h2 style="margin: 0 0 16px 0; color: #059669;">🎓 ${data.event_title}</h2>
                  <div style="font-size: 16px; line-height: 1.8;">
                    <div><strong>⭐ Points Earned:</strong> <span style="color: #059669; font-size: 20px; font-weight: bold;">${data.cpd_points}</span></div>
                    <div><strong>📆 Date:</strong> ${data.event_date}</div>
                  </div>
                </div>
                <div style="text-align: center;">
                  <a href="http://localhost:5180/cpd" style="background: #059669; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">📊 View My CPD Record</a>
                </div>
              </div>
            </div>
          </body></html>
        `
      };
      
      let htmlContent = '';
      
      switch (reminder.type) {
        case 'confirmation':
          htmlContent = EmailTemplates.registrationConfirmation(eventData);
          break;
        case '7_days_before':
          htmlContent = EmailTemplates.reminder7Days(eventData);
          break;
        case 'cpd_awarded':
          htmlContent = EmailTemplates.cpdAwarded(eventData);
          break;
        default:
          htmlContent = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <div style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; padding: 30px; text-align: center;">
                <h1 style="margin: 0; font-size: 28px;">⏰ Event Reminder</h1>
                <p style="margin: 12px 0 0 0; opacity: 0.9;">${reminder.timing}</p>
              </div>
              <div style="padding: 40px;">
                <p style="font-size: 18px; margin-bottom: 24px;">Hello <strong>${eventData.user_name}</strong>,</p>
                <p>Reminder about <strong>${eventData.event_title}</strong>.</p>
                <div style="background: #f8fafc; border: 2px solid #dc2626; border-radius: 12px; padding: 24px; margin: 24px 0;">
                  <h2 style="margin: 0 0 16px 0; color: #dc2626;">${eventData.event_title}</h2>
                  <div style="font-size: 16px; line-height: 1.8;">
                    <div><strong>📆 Date:</strong> ${eventData.event_date}</div>
                    <div><strong>🕐 Time:</strong> ${eventData.event_time}</div>
                  </div>
                </div>
                <div style="text-align: center;">
                  <a href="${eventData.event_link}" style="background: #dc2626; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">Join Event</a>
                </div>
              </div>
            </div>
          `;
      }
      
      const emailPayload = {
        to: testUser,
        subject: reminder.subject.replace(/\{\{([^}]+)\}\}/g, (match, key) => eventData[key] || match),
        html: htmlContent,
        text: `Event reminder: ${eventData.event_title} on ${eventData.event_date} at ${eventData.event_time}`,
        useStoredConfig: true  // Use SMTP configuration from admin panel
      };
      
      const response = await fetch(`${emailServerUrl}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailPayload)
      });
      
      if (response.ok) {
        console.log(`   ✅ Enviado: ${reminder.subject.split(' - ')[0]}`);
        successCount++;
      } else {
        const error = await response.text();
        console.log(`   ❌ Falhou: ${error}`);
      }
      
      // Pequeno delay entre emails
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
    }
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log(`📊 RESULTADO: ${successCount}/${totalCount} emails enviados`);
  console.log(`📧 Dashboard: http://localhost:3001`);
  console.log('=' .repeat(60));
  
  if (successCount === totalCount) {
    console.log('🎉 Todos os lembretes foram enviados com sucesso!');
  } else {
    console.log('⚠️  Alguns lembretes falharam. Verifique os logs acima.');
  }
}

sendTestReminders().catch(console.error);
/**
 * Worker de Reminders para Produção
 * Versão completa com envio real de emails e agendamento externo
 * 
 * COMO USAR EM PRODUÇÃO:
 * 1. Configure as variáveis de ambiente (RESEND_API_KEY, etc.)
 * 2. Execute: node production-reminder-worker.js
 * 3. Ou use PM2: pm2 start production-reminder-worker.js --name "reminders"
 * 4. Ou configure com cron externo para executar a cada 5 minutos
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://english-australia-eau-supabase.lkobs5.easypanel.host',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q'
);

// Configurações de email (configure suas chaves aqui ou via variáveis de ambiente)
const EMAIL_CONFIG = {
  // Opção 1: Resend (recomendado)
  RESEND_API_KEY: process.env.RESEND_API_KEY || 'sua-chave-resend-aqui',
  
  // Opção 2: SendGrid
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY || 'sua-chave-sendgrid-aqui',
  
  // Opção 3: Seu servidor SMTP local (se estiver rodando)
  LOCAL_EMAIL_SERVER: process.env.EMAIL_SERVER_URL || 'http://localhost:3001',
  
  // Configurações gerais
  FROM_EMAIL: 'English Australia <noreply@englishaustralia.com.au>',
  FROM_NAME: 'English Australia',
  
  // Qual provedor usar (resend, sendgrid, local)
  PROVIDER: process.env.EMAIL_PROVIDER || 'local'
};

// Templates de email
const EMAIL_TEMPLATES = {
  '7_days_before': (data) => ({
    subject: `Event in 1 Week: ${data.event_title}`,
    html: `
      <!DOCTYPE html>
      <html><head><meta charset="UTF-8"><title>English Australia</title></head>
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
          <div style="background: #f8fafc; padding: 20px; text-align: center; font-size: 14px; color: #64748b;">
            <strong>English Australia</strong> | Professional Development<br>
            Sent at ${new Date().toLocaleString()}
          </div>
        </div>
      </body></html>
    `
  }),
  
  '3_days_before': (data) => ({
    subject: `Event in 3 Days: ${data.event_title}`,
    html: `
      <!DOCTYPE html>
      <html><head><meta charset="UTF-8"><title>English Australia</title></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #0f172a 0%, #f59e0b 100%); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">📅 Event in 3 Days</h1>
            <p style="margin: 12px 0 0 0; opacity: 0.9;">Get ready!</p>
          </div>
          <div style="padding: 40px;">
            <p style="font-size: 18px; margin-bottom: 24px;">Hello <strong>${data.user_name}</strong>,</p>
            <p>Just a friendly reminder that <strong>${data.event_title}</strong> is happening in <strong>3 days</strong>!</p>
            <div style="background: #fffbeb; border: 2px solid #f59e0b; border-radius: 12px; padding: 24px; margin: 24px 0;">
              <h2 style="margin: 0 0 16px 0; color: #d97706;">📅 ${data.event_title}</h2>
              <div style="font-size: 16px; line-height: 1.8;">
                <div><strong>📆 Date:</strong> ${data.event_date}</div>
                <div><strong>🕐 Time:</strong> ${data.event_time}</div>
                <div><strong>📍 Location:</strong> ${data.event_location}</div>
              </div>
            </div>
            <div style="text-align: center;">
              <a href="${data.event_link}" style="background: #f59e0b; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">📖 Event Details</a>
            </div>
          </div>
        </div>
      </body></html>
    `
  }),
  
  '1_day_before': (data) => ({
    subject: `Tomorrow: ${data.event_title}`,
    html: `
      <!DOCTYPE html>
      <html><head><meta charset="UTF-8"><title>English Australia</title></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #0f172a 0%, #dc2626 100%); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">🔔 Event Tomorrow!</h1>
            <p style="margin: 12px 0 0 0; opacity: 0.9;">Don't miss it!</p>
          </div>
          <div style="padding: 40px;">
            <p style="font-size: 18px; margin-bottom: 24px;">Hello <strong>${data.user_name}</strong>,</p>
            <p>This is your final reminder! <strong>${data.event_title}</strong> is <strong>tomorrow</strong>!</p>
            <div style="background: #fef2f2; border: 2px solid #dc2626; border-radius: 12px; padding: 24px; margin: 24px 0;">
              <h2 style="margin: 0 0 16px 0; color: #b91c1c;">📅 ${data.event_title}</h2>
              <div style="font-size: 16px; line-height: 1.8;">
                <div><strong>📆 Date:</strong> ${data.event_date}</div>
                <div><strong>🕐 Time:</strong> ${data.event_time}</div>
                <div><strong>📍 Location:</strong> ${data.event_location}</div>
              </div>
            </div>
            <div style="text-align: center;">
              <a href="${data.event_link}" style="background: #dc2626; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">📖 Event Details</a>
            </div>
          </div>
        </div>
      </body></html>
    `
  }),
  
  '30_min_before': (data) => ({
    subject: `Starting Soon: ${data.event_title}`,
    html: `
      <!DOCTYPE html>
      <html><head><meta charset="UTF-8"><title>English Australia</title></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">⏰ Starting in 30 Minutes!</h1>
            <p style="margin: 12px 0 0 0; opacity: 0.9;">Get ready to join!</p>
          </div>
          <div style="padding: 40px;">
            <p style="font-size: 18px; margin-bottom: 24px;">Hello <strong>${data.user_name}</strong>,</p>
            <p><strong>${data.event_title}</strong> starts in just <strong>30 minutes</strong>!</p>
            <div style="background: #fef2f2; border: 2px solid #ef4444; border-radius: 12px; padding: 24px; margin: 24px 0;">
              <h2 style="margin: 0 0 16px 0; color: #dc2626;">🔴 ${data.event_title}</h2>
              <div style="font-size: 16px; line-height: 1.8;">
                <div><strong>🕐 Time:</strong> ${data.event_time}</div>
                <div><strong>📍 Location:</strong> ${data.event_location}</div>
                ${data.event_location.includes('Online') ? '<div><strong>💡 Tip:</strong> Join button will be available 10 minutes before start</div>' : ''}
              </div>
            </div>
            <div style="text-align: center;">
              <a href="${data.event_link}" style="background: #ef4444; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">🚀 Join Event</a>
            </div>
          </div>
        </div>
      </body></html>
    `
  }),
  
  'event_live': (data) => ({
    subject: `🔴 LIVE NOW: ${data.event_title}`,
    html: `
      <!DOCTYPE html>
      <html><head><meta charset="UTF-8"><title>English Australia</title></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">🔴 EVENT IS LIVE NOW!</h1>
            <p style="margin: 12px 0 0 0; opacity: 0.9;">Join immediately!</p>
          </div>
          <div style="padding: 40px;">
            <p style="font-size: 18px; margin-bottom: 24px;">Hello <strong>${data.user_name}</strong>,</p>
            <p><strong>${data.event_title}</strong> has just started! Join now!</p>
            <div style="background: #fef2f2; border: 3px solid #dc2626; border-radius: 12px; padding: 24px; margin: 24px 0;">
              <h2 style="margin: 0 0 16px 0; color: #dc2626;">🔴 LIVE: ${data.event_title}</h2>
              <div style="font-size: 16px; line-height: 1.8;">
                <div><strong>📍 Location:</strong> ${data.event_location}</div>
                <div style="color: #dc2626; font-weight: bold;">The event has started!</div>
              </div>
            </div>
            <div style="text-align: center;">
              <a href="${data.event_link}" style="background: #dc2626; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 18px;">🔴 JOIN NOW</a>
            </div>
          </div>
        </div>
      </body></html>
    `
  })
};

// Função para enviar email
async function sendEmail(to, subject, html) {
  try {
    switch (EMAIL_CONFIG.PROVIDER) {
      case 'resend':
        return await sendViaResend(to, subject, html);
      case 'sendgrid':
        return await sendViaSendGrid(to, subject, html);
      case 'local':
      default:
        return await sendViaLocalServer(to, subject, html);
    }
  } catch (error) {
    console.error(`❌ Error sending email to ${to}:`, error.message);
    return false;
  }
}

// Envio via Resend
async function sendViaResend(to, subject, html) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${EMAIL_CONFIG.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: EMAIL_CONFIG.FROM_EMAIL,
      to: [to],
      subject: subject,
      html: html,
    }),
  });
  
  return response.ok;
}

// Envio via SendGrid
async function sendViaSendGrid(to, subject, html) {
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${EMAIL_CONFIG.SENDGRID_API_KEY}`,
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: EMAIL_CONFIG.FROM_EMAIL.match(/<(.+)>/)?.[1] || EMAIL_CONFIG.FROM_EMAIL, name: EMAIL_CONFIG.FROM_NAME },
      subject: subject,
      content: [{ type: 'text/html', value: html }],
    }),
  });
  
  return response.ok;
}

// Envio via servidor local
async function sendViaLocalServer(to, subject, html) {
  const response = await fetch(`${EMAIL_CONFIG.LOCAL_EMAIL_SERVER}/api/send-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: to,
      subject: subject,
      html: html,
      text: subject,
      useStoredConfig: true
    })
  });
  
  return response.ok;
}

// Função principal para processar reminders
async function processReminders() {
  const startTime = new Date();
  console.log(`\n🔄 [${startTime.toLocaleTimeString()}] Processing reminders...`);
  
  try {
    // Buscar reminders pendentes
    const { data: reminders, error } = await supabase
      .from('event_reminders')
      .select(`
        *,
        events (*)
      `)
      .eq('is_sent', false)
      .lte('scheduled_date', new Date().toISOString())
      .limit(10);
    
    if (error) {
      console.error('❌ Error fetching reminders:', error);
      return;
    }
    
    if (!reminders || reminders.length === 0) {
      console.log('📭 No pending reminders found');
      return;
    }
    
    console.log(`📧 Found ${reminders.length} reminders to process`);
    
    let successCount = 0;
    
    for (const reminder of reminders) {
      try {
        const event = reminder.events;
        if (!event) {
          console.log(`⚠️  Event not found for reminder ${reminder.id}`);
          continue;
        }
        
        // Preparar dados do email
        const emailData = {
          user_name: 'Member', // Você pode buscar o nome real do usuário se necessário
          event_title: event.title,
          event_date: new Date(event.start_date).toLocaleDateString('en-US', { 
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
          }),
          event_time: new Date(event.start_date).toLocaleTimeString('en-US', { 
            hour: 'numeric', minute: '2-digit', hour12: true 
          }),
          event_location: event.location_type === 'virtual' ? 'Online Event' : event.venue_name || 'TBA',
          event_link: `https://your-domain.com/events/${event.slug}` // Substitua pela sua URL real
        };
        
        // Obter template
        const template = EMAIL_TEMPLATES[reminder.reminder_type];
        if (!template) {
          console.log(`⚠️  No template found for ${reminder.reminder_type}`);
          continue;
        }
        
        const emailContent = template(emailData);
        
        // Enviar email
        console.log(`📤 Sending ${reminder.reminder_type} to ${reminder.email_to}...`);
        const emailSent = await sendEmail(reminder.email_to, emailContent.subject, emailContent.html);
        
        if (emailSent) {
          // Marcar como enviado
          await supabase
            .from('event_reminders')
            .update({ 
              is_sent: true, 
              sent_date: new Date().toISOString() 
            })
            .eq('id', reminder.id);
          
          console.log(`   ✅ Successfully sent to ${reminder.email_to}`);
          successCount++;
        } else {
          console.log(`   ❌ Failed to send to ${reminder.email_to}`);
        }
        
      } catch (reminderError) {
        console.error(`❌ Error processing reminder ${reminder.id}:`, reminderError);
      }
    }
    
    const endTime = new Date();
    const duration = endTime - startTime;
    console.log(`✨ Processing completed in ${duration}ms. Success: ${successCount}/${reminders.length}`);
    
  } catch (error) {
    console.error('❌ Error in processReminders:', error);
  }
}

// Configuração para execução
const RUN_MODE = process.env.RUN_MODE || 'once'; // 'once', 'continuous', 'cron'

if (RUN_MODE === 'continuous') {
  console.log('🚀 Starting reminder worker in continuous mode...');
  console.log(`📧 Email provider: ${EMAIL_CONFIG.PROVIDER}`);
  console.log('⏰ Checking every 5 minutes...');
  console.log('📊 Use Ctrl+C to stop\n');
  
  // Processar imediatamente
  processReminders();
  
  // Depois a cada 5 minutos
  setInterval(processReminders, 5 * 60 * 1000);
} else {
  console.log('🔄 Running reminder worker once...');
  processReminders().then(() => {
    console.log('✅ Done. Exiting...');
    process.exit(0);
  });
}

// Tratamento de erros
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('💥 Unhandled Rejection:', error);
});

// Exportar para uso externo
module.exports = { processReminders, sendEmail };
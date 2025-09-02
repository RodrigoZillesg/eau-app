/**
 * Event Reminder Worker
 * Processa reminders agendados e envia emails no momento certo
 * 
 * Rode este script em background: node reminder-worker.js
 */

const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Configuração do Supabase
const supabase = createClient(
  'https://english-australia-eau-supabase.lkobs5.easypanel.host',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q'
);

// Email server
const EMAIL_SERVER_URL = 'http://localhost:3001';

// Intervalo de verificação (1 minuto)
const CHECK_INTERVAL = 60 * 1000; // 60 segundos

// Templates de email
const EmailTemplates = {
  '7_days_before': (data) => ({
    subject: `Event in 1 Week: ${data.event_title}`,
    html: `
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
    `
  }),
  
  '3_days_before': (data) => ({
    subject: `Event in 3 Days: ${data.event_title}`,
    html: `
      <!DOCTYPE html>
      <html><head><meta charset="UTF-8"><title>EAU Members</title></head>
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
      <html><head><meta charset="UTF-8"><title>EAU Members</title></head>
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
      <html><head><meta charset="UTF-8"><title>EAU Members</title></head>
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
      <html><head><meta charset="UTF-8"><title>EAU Members</title></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">🔴 EVENT IS LIVE NOW!</h1>
            <p style="margin: 12px 0 0 0; opacity: 0.9;">Join immediately!</p>
          </div>
          <div style="padding: 40px;">
            <p style="font-size: 18px; margin-bottom: 24px;">Hello <strong>${data.user_name}</strong>,</p>
            <p><strong>${data.event_title}</strong> has just started! Join now!</p>
            <div style="background: #fef2f2; border: 3px solid #dc2626; border-radius: 12px; padding: 24px; margin: 24px 0; animation: pulse 2s infinite;">
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

// Formatar data
function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

// Formatar hora
function formatTime(date) {
  return new Date(date).toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
}

// Processar reminders pendentes
async function processReminders() {
  try {
    console.log(`[${new Date().toLocaleTimeString()}] Checking for pending reminders...`);
    
    // Buscar reminders pendentes cuja data já passou
    const { data: reminders, error } = await supabase
      .from('event_reminders')
      .select('*')
      .eq('is_sent', false)
      .lte('scheduled_date', new Date().toISOString())
      .limit(10); // Processar 10 por vez
    
    if (error) {
      console.error('Error fetching reminders:', error);
      return;
    }
    
    if (!reminders || reminders.length === 0) {
      return; // Nada para processar
    }
    
    console.log(`Found ${reminders.length} reminders to process`);
    
    for (const reminder of reminders) {
      try {
        // Buscar dados do evento
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('*')
          .eq('id', reminder.event_id)
          .single();
        
        if (!eventData) {
          console.error(`Event not found for reminder ${reminder.id}`);
          continue;
        }
        
        // Buscar dados do usuário
        const { data: userData, error: userError } = await supabase
          .from('auth.users')
          .select('email, raw_user_meta_data')
          .eq('id', reminder.user_id)
          .single();
        
        const userEmail = reminder.email_to || userData?.email;
        const userName = userData?.raw_user_meta_data?.full_name || 
                        userData?.email?.split('@')[0] || 
                        'Member';
        
        if (!userEmail) {
          console.error(`No email for reminder ${reminder.id}`);
          continue;
        }
        
        // Preparar dados do email
        const emailData = {
          user_name: userName,
          event_title: eventData.title || 'Event',
          event_date: formatDate(eventData.start_date),
          event_time: formatTime(eventData.start_date),
          event_location: eventData.location_type === 'virtual' 
            ? 'Online Event' 
            : eventData.venue_name || 'TBA',
          event_link: `http://localhost:5180/events/${eventData.slug}`
        };
        
        // Obter template apropriado
        const template = EmailTemplates[reminder.reminder_type];
        if (!template) {
          console.error(`No template for reminder type: ${reminder.reminder_type}`);
          continue;
        }
        
        const emailContent = template(emailData);
        
        // Enviar email
        console.log(`Sending ${reminder.reminder_type} reminder to ${userEmail}...`);
        
        const response = await fetch(`${EMAIL_SERVER_URL}/api/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: userEmail,
            subject: emailContent.subject,
            html: emailContent.html,
            text: emailContent.subject,
            useStoredConfig: true
          })
        });
        
        if (response.ok) {
          // Marcar como enviado
          await supabase
            .from('event_reminders')
            .update({ 
              is_sent: true,
              sent_date: new Date().toISOString()
            })
            .eq('id', reminder.id);
          
          console.log(`✅ Sent ${reminder.reminder_type} reminder to ${userEmail}`);
        } else {
          const errorText = await response.text();
          console.error(`❌ Failed to send reminder ${reminder.id}: ${errorText}`);
        }
        
      } catch (error) {
        console.error(`Error processing reminder ${reminder.id}:`, error);
      }
    }
    
  } catch (error) {
    console.error('Error in processReminders:', error);
  }
}

// Iniciar worker
async function startWorker() {
  console.log('🚀 Event Reminder Worker Started');
  console.log('📧 Email Server:', EMAIL_SERVER_URL);
  console.log('⏰ Check Interval:', CHECK_INTERVAL / 1000, 'seconds');
  console.log('=' .repeat(60));
  
  // Processar imediatamente
  await processReminders();
  
  // Configurar intervalo
  setInterval(processReminders, CHECK_INTERVAL);
}

// Tratamento de erros
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
});

// Iniciar
startWorker();
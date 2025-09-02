/**
 * Teste direto de envio de reminder
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://english-australia-eau-supabase.lkobs5.easypanel.host',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q'
);

async function testSendReminder() {
  console.log('📧 Teste de envio de reminder\n');
  
  try {
    // Buscar um reminder pendente
    const { data: reminders, error } = await supabase
      .from('event_reminders')
      .select('*')
      .eq('is_sent', false)
      .limit(1);
    
    if (error) {
      console.error('Erro ao buscar reminder:', error);
      return;
    }
    
    if (!reminders || reminders.length === 0) {
      console.log('Nenhum reminder pendente');
      return;
    }
    
    const reminder = reminders[0];
    console.log('Reminder encontrado:', reminder.reminder_type);
    console.log('Para:', reminder.email_to);
    
    // Buscar dados do evento
    const { data: event } = await supabase
      .from('events')
      .select('*')
      .eq('id', reminder.event_id)
      .single();
    
    if (!event) {
      console.log('Evento não encontrado');
      return;
    }
    
    console.log('Evento:', event.title);
    console.log('\nEnviando email de teste...');
    
    // Preparar email
    const emailData = {
      to: reminder.email_to,
      subject: `[TESTE] Reminder: ${event.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #0f172a 0%, #059669 100%); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0;">🧪 Teste de Reminder</h1>
          </div>
          <div style="padding: 40px;">
            <h2>Sistema de Reminders Funcionando!</h2>
            <p>Este é um teste do sistema de reminders.</p>
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <strong>Evento:</strong> ${event.title}<br>
              <strong>Data:</strong> ${new Date(event.start_date).toLocaleDateString()}<br>
              <strong>Tipo de Reminder:</strong> ${reminder.reminder_type}
            </div>
            <p>Se você recebeu este email, o sistema de reminders está funcionando corretamente!</p>
          </div>
        </body>
        </html>
      `,
      text: `Teste de reminder para ${event.title}`,
      useStoredConfig: true
    };
    
    // Enviar via servidor de email
    const response = await fetch('http://localhost:3001/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emailData)
    });
    
    if (response.ok) {
      console.log('✅ Email enviado com sucesso!');
      
      // Marcar como enviado
      await supabase
        .from('event_reminders')
        .update({ 
          is_sent: true,
          sent_date: new Date().toISOString()
        })
        .eq('id', reminder.id);
      
      console.log('✅ Reminder marcado como enviado');
      console.log('\n📧 Verifique sua caixa de entrada!');
    } else {
      const error = await response.text();
      console.error('❌ Erro ao enviar email:', error);
      console.log('\n⚠️  Certifique-se que o servidor de email está rodando:');
      console.log('cd email-server && npm start');
    }
    
  } catch (error) {
    console.error('Erro:', error);
  }
}

testSendReminder();
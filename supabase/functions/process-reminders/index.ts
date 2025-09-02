// Supabase Edge Function para processar reminders
// Deploy: supabase functions deploy process-reminders

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Templates de email (versão simplificada para Edge Function)
const getEmailTemplate = (type: string, data: any) => {
  const templates = {
    '7_days_before': {
      subject: `Event in 1 Week: ${data.event_title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #0f172a 0%, #0284c7 100%); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0;">📅 Event in 7 Days</h1>
          </div>
          <div style="padding: 40px;">
            <p>Hello <strong>${data.user_name}</strong>,</p>
            <p><strong>${data.event_title}</strong> is coming up in exactly one week!</p>
            <div style="background: #f8fafc; border: 2px solid #0284c7; border-radius: 12px; padding: 24px; margin: 24px 0;">
              <h2 style="color: #0284c7;">📅 ${data.event_title}</h2>
              <div style="font-size: 16px; line-height: 1.8;">
                <div><strong>📆 Date:</strong> ${data.event_date}</div>
                <div><strong>🕐 Time:</strong> ${data.event_time}</div>
                <div><strong>📍 Location:</strong> ${data.event_location}</div>
              </div>
            </div>
            <div style="text-align: center;">
              <a href="${data.event_link}" style="background: #0284c7; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px;">View Event</a>
            </div>
          </div>
        </div>
      `
    },
    '3_days_before': {
      subject: `Event in 3 Days: ${data.event_title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #0f172a 0%, #f59e0b 100%); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0;">📅 Event in 3 Days</h1>
          </div>
          <div style="padding: 40px;">
            <p>Hello <strong>${data.user_name}</strong>,</p>
            <p><strong>${data.event_title}</strong> is happening in 3 days!</p>
            <div style="background: #fffbeb; border: 2px solid #f59e0b; border-radius: 12px; padding: 24px; margin: 24px 0;">
              <h2 style="color: #d97706;">📅 ${data.event_title}</h2>
              <div style="font-size: 16px; line-height: 1.8;">
                <div><strong>📆 Date:</strong> ${data.event_date}</div>
                <div><strong>🕐 Time:</strong> ${data.event_time}</div>
                <div><strong>📍 Location:</strong> ${data.event_location}</div>
              </div>
            </div>
          </div>
        </div>
      `
    },
    '1_day_before': {
      subject: `Tomorrow: ${data.event_title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #0f172a 0%, #dc2626 100%); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0;">🔔 Event Tomorrow!</h1>
          </div>
          <div style="padding: 40px;">
            <p>Hello <strong>${data.user_name}</strong>,</p>
            <p><strong>${data.event_title}</strong> is tomorrow!</p>
            <div style="background: #fef2f2; border: 2px solid #dc2626; border-radius: 12px; padding: 24px; margin: 24px 0;">
              <h2 style="color: #b91c1c;">📅 ${data.event_title}</h2>
              <div style="font-size: 16px; line-height: 1.8;">
                <div><strong>📆 Date:</strong> ${data.event_date}</div>
                <div><strong>🕐 Time:</strong> ${data.event_time}</div>
                <div><strong>📍 Location:</strong> ${data.event_location}</div>
              </div>
            </div>
          </div>
        </div>
      `
    },
    '30_min_before': {
      subject: `Starting Soon: ${data.event_title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0;">⏰ Starting in 30 Minutes!</h1>
          </div>
          <div style="padding: 40px;">
            <p>Hello <strong>${data.user_name}</strong>,</p>
            <p><strong>${data.event_title}</strong> starts in 30 minutes!</p>
            <div style="background: #fef2f2; border: 2px solid #ef4444; border-radius: 12px; padding: 24px; margin: 24px 0;">
              <h2 style="color: #dc2626;">🔴 ${data.event_title}</h2>
              <div style="font-size: 16px; line-height: 1.8;">
                <div><strong>🕐 Time:</strong> ${data.event_time}</div>
                <div><strong>📍 Location:</strong> ${data.event_location}</div>
              </div>
            </div>
            <div style="text-align: center;">
              <a href="${data.event_link}" style="background: #ef4444; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px;">🚀 Join Event</a>
            </div>
          </div>
        </div>
      `
    },
    'event_live': {
      subject: `🔴 LIVE NOW: ${data.event_title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0;">🔴 EVENT IS LIVE!</h1>
          </div>
          <div style="padding: 40px;">
            <p>Hello <strong>${data.user_name}</strong>,</p>
            <p><strong>${data.event_title}</strong> has started! Join now!</p>
            <div style="background: #fef2f2; border: 3px solid #dc2626; border-radius: 12px; padding: 24px; margin: 24px 0;">
              <h2 style="color: #dc2626;">🔴 LIVE: ${data.event_title}</h2>
              <div style="color: #dc2626; font-weight: bold;">The event has started!</div>
            </div>
            <div style="text-align: center;">
              <a href="${data.event_link}" style="background: #dc2626; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-size: 18px;">🔴 JOIN NOW</a>
            </div>
          </div>
        </div>
      `
    }
  };
  
  return templates[type as keyof typeof templates] || templates['event_live'];
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Criar cliente Supabase com service role
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('🔍 Checking for pending reminders...')

    // Buscar reminders pendentes
    const { data: reminders, error: remindersError } = await supabaseClient
      .from('event_reminders')
      .select('*')
      .eq('is_sent', false)
      .lte('scheduled_date', new Date().toISOString())
      .limit(10)

    if (remindersError) {
      console.error('Error fetching reminders:', remindersError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch reminders', details: remindersError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!reminders || reminders.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No pending reminders found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`📧 Processing ${reminders.length} reminders`)

    const results = []

    for (const reminder of reminders) {
      try {
        // Buscar dados do evento
        const { data: event } = await supabaseClient
          .from('events')
          .select('*')
          .eq('id', reminder.event_id)
          .single()

        if (!event) {
          console.error(`Event not found for reminder ${reminder.id}`)
          continue
        }

        // Preparar dados do email
        const emailData = {
          user_name: 'Member', // Fallback
          event_title: event.title,
          event_date: new Date(event.start_date).toLocaleDateString('en-US', { 
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
          }),
          event_time: new Date(event.start_date).toLocaleTimeString('en-US', { 
            hour: 'numeric', minute: '2-digit', hour12: true 
          }),
          event_location: event.location_type === 'virtual' ? 'Online Event' : event.venue_name || 'TBA',
          event_link: `https://your-domain.com/events/${event.slug}`
        }

        const template = getEmailTemplate(reminder.reminder_type, emailData)

        // Enviar email via API externa (usando fetch direto)
        // Aqui usamos um serviço de email como SendGrid, Resend, ou similar
        
        // Por enquanto, vamos simular o envio e usar a API do servidor local
        // Em produção, você substituiria por SendGrid/Resend/etc
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`, // Configure sua chave da Resend
          },
          body: JSON.stringify({
            from: 'English Australia <noreply@englishaustralia.com.au>',
            to: reminder.email_to,
            subject: template.subject,
            html: template.html,
          })
        })

        if (emailResponse.ok) {
          // Marcar como enviado
          await supabaseClient
            .from('event_reminders')
            .update({ 
              is_sent: true,
              sent_date: new Date().toISOString()
            })
            .eq('id', reminder.id)

          results.push({
            reminder_id: reminder.id,
            type: reminder.reminder_type,
            status: 'sent',
            email: reminder.email_to
          })

          console.log(`✅ Sent ${reminder.reminder_type} to ${reminder.email_to}`)
        } else {
          console.error(`❌ Failed to send reminder ${reminder.id}`)
          results.push({
            reminder_id: reminder.id,
            type: reminder.reminder_type,
            status: 'failed',
            email: reminder.email_to
          })
        }

      } catch (error) {
        console.error(`Error processing reminder ${reminder.id}:`, error)
        results.push({
          reminder_id: reminder.id,
          status: 'error',
          error: error.message
        })
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        processed: reminders.length,
        results: results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in process-reminders function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
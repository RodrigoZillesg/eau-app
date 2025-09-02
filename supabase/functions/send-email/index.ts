// Supabase Edge Function for sending emails
// Deploy with: supabase functions deploy send-email

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  to: string
  subject: string
  html: string
  text?: string
  testMode?: boolean
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get SMTP settings from database
    const { data: smtpSettings, error: smtpError } = await supabaseClient
      .from('smtp_settings')
      .select('*')
      .eq('enabled', true)
      .single()

    if (smtpError || !smtpSettings) {
      return new Response(
        JSON.stringify({ 
          error: 'SMTP not configured',
          details: 'Please configure SMTP settings in the admin panel'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const { to, subject, html, text, testMode } = await req.json() as EmailRequest

    // If test mode, override recipient
    const recipient = testMode && smtpSettings.test_email ? smtpSettings.test_email : to

    // Here we would use a real email service
    // For now, we'll use Resend API as an example (you can switch to any provider)
    
    // Option 1: Use Resend (recommended for production)
    if (Deno.env.get('RESEND_API_KEY')) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        },
        body: JSON.stringify({
          from: `${smtpSettings.from_name} <${smtpSettings.from_email}>`,
          to: recipient,
          subject: subject,
          html: html,
          text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
          reply_to: smtpSettings.reply_to_email || smtpSettings.from_email,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Email service error: ${error}`)
      }

      const result = await response.json()
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Email sent to ${recipient}`,
          id: result.id 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Option 2: Use SendGrid
    if (Deno.env.get('SENDGRID_API_KEY')) {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SENDGRID_API_KEY')}`,
        },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email: recipient }],
          }],
          from: {
            email: smtpSettings.from_email,
            name: smtpSettings.from_name,
          },
          subject: subject,
          content: [
            { type: 'text/html', value: html },
            { type: 'text/plain', value: text || html.replace(/<[^>]*>/g, '') },
          ],
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`SendGrid error: ${error}`)
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Email sent to ${recipient}`
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Option 3: Use SMTP2GO
    if (Deno.env.get('SMTP2GO_API_KEY')) {
      const response = await fetch('https://api.smtp2go.com/v3/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Smtp2go-Api-Key': Deno.env.get('SMTP2GO_API_KEY')!,
        },
        body: JSON.stringify({
          sender: `${smtpSettings.from_name} <${smtpSettings.from_email}>`,
          to: [recipient],
          subject: subject,
          html_body: html,
          text_body: text || html.replace(/<[^>]*>/g, ''),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`SMTP2GO error: ${JSON.stringify(error)}`)
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Email sent to ${recipient}`
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // No email service configured
    return new Response(
      JSON.stringify({ 
        error: 'No email service configured',
        details: 'Please set one of these environment variables: RESEND_API_KEY, SENDGRID_API_KEY, or SMTP2GO_API_KEY'
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error sending email:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send email',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
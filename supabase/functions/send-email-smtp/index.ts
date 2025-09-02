// Supabase Edge Function for sending emails via SMTP (Brevo/Sendinblue)
// Deploy with: supabase functions deploy send-email-smtp

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    
    const supabaseClient = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! },
      },
    })

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
      // Try localStorage fallback
      return new Response(
        JSON.stringify({ 
          error: 'SMTP not configured in database',
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

    try {
      // Configure SMTP client for Brevo/Sendinblue
      const client = new SMTPClient({
        connection: {
          hostname: smtpSettings.smtp_host,
          port: smtpSettings.smtp_port,
          tls: smtpSettings.smtp_secure,
          auth: {
            username: smtpSettings.smtp_username,
            password: smtpSettings.smtp_password,
          },
        },
      });

      // Send email
      await client.send({
        from: `${smtpSettings.from_name} <${smtpSettings.from_email}>`,
        to: recipient,
        subject: subject,
        content: text || html.replace(/<[^>]*>/g, ''),
        html: html,
        headers: {
          "Reply-To": smtpSettings.reply_to_email || smtpSettings.from_email,
        },
      });

      await client.close();

      // Log success
      console.log(`Email sent successfully to ${recipient} via ${smtpSettings.smtp_host}`)

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Email sent successfully to ${recipient}`,
          provider: 'SMTP (Brevo)'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    } catch (smtpError: any) {
      console.error('SMTP Error:', smtpError)
      
      // If SMTP fails, try Brevo API as fallback
      const brevoApiKey = Deno.env.get('BREVO_API_KEY')
      
      if (brevoApiKey) {
        try {
          const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
              'accept': 'application/json',
              'api-key': brevoApiKey,
              'content-type': 'application/json'
            },
            body: JSON.stringify({
              sender: {
                name: smtpSettings.from_name,
                email: smtpSettings.from_email
              },
              to: [{
                email: recipient,
                name: recipient.split('@')[0]
              }],
              subject: subject,
              htmlContent: html,
              textContent: text || html.replace(/<[^>]*>/g, ''),
              replyTo: {
                email: smtpSettings.reply_to_email || smtpSettings.from_email,
                name: smtpSettings.reply_to_name || smtpSettings.from_name
              }
            })
          });

          if (!response.ok) {
            const error = await response.text()
            throw new Error(`Brevo API error: ${error}`)
          }

          const result = await response.json()
          
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: `Email sent successfully to ${recipient}`,
              messageId: result.messageId,
              provider: 'Brevo API (fallback)'
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        } catch (apiError: any) {
          console.error('Brevo API Error:', apiError)
          throw smtpError // Throw original SMTP error if API also fails
        }
      }
      
      // Return SMTP error details
      return new Response(
        JSON.stringify({ 
          error: 'SMTP connection failed',
          details: smtpError.message,
          host: smtpSettings.smtp_host,
          port: smtpSettings.smtp_port,
          suggestion: 'Please verify your SMTP credentials and settings'
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

  } catch (error: any) {
    console.error('Error in send-email-smtp function:', error)
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
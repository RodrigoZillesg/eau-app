import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateRemindersRequest {
  registrationId: string
  eventId: string
  userId: string
  event: {
    id: string
    title: string
    start_date: string
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { registrationId, eventId, userId, event } = await req.json() as CreateRemindersRequest

    console.log('🔍 Creating reminders for event:', event.title)
    
    // Get user email
    const { data: { user }, error: userError } = await supabaseClient.auth.admin.getUserById(userId)
    
    if (userError || !user?.email) {
      throw new Error(`Failed to get user email: ${userError?.message}`)
    }

    const email = user.email
    const eventStart = new Date(event.start_date)
    
    // Default reminder schedule
    const reminderSchedule = [
      { type: '7_days_before', minutes: 7 * 24 * 60, subject: 'Event in 1 Week' },
      { type: '3_days_before', minutes: 3 * 24 * 60, subject: 'Event in 3 Days' },
      { type: '1_day_before', minutes: 24 * 60, subject: 'Event Tomorrow' },
      { type: '30_min_before', minutes: 30, subject: 'Event Starting Soon' },
      { type: 'event_live', minutes: 0, subject: 'Event is Live Now!' }
    ]

    const reminders = []
    
    for (const reminder of reminderSchedule) {
      const scheduledDate = new Date(eventStart.getTime() - reminder.minutes * 60 * 1000)
      const now = new Date()
      
      // Only schedule if the reminder date is in the future
      if (scheduledDate > now) {
        reminders.push({
          event_id: eventId,
          registration_id: registrationId,
          user_id: userId,
          reminder_type: reminder.type,
          scheduled_date: scheduledDate.toISOString(),
          email_to: email,
          email_subject: `${reminder.subject}: ${event.title}`,
          is_sent: false
        })
      }
    }
    
    if (reminders.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No future reminders needed',
          created: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Insert reminders using service role (bypasses RLS)
    const { data, error } = await supabaseClient
      .from('event_reminders')
      .insert(reminders)

    if (error) {
      throw error
    }

    console.log(`✅ Successfully created ${reminders.length} reminders`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Created ${reminders.length} reminders`,
        created: reminders.length,
        reminders: reminders.map(r => ({ type: r.reminder_type, scheduled: r.scheduled_date }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Error creating reminders:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
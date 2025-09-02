import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UserImportData {
  userId: string
  firstName: string
  lastName: string
  email: string
  activities: string
  points: string
  goalStatus: string
  tempPassword?: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role (has admin privileges)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the authorization header to verify the request is from an admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Verify the user is an admin
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check if user is admin (adjust this check based on your admin identification)
    if (user.email !== 'rrzillesg@gmail.com') {
      // You can also check roles table here
      const { data: roles } = await supabaseAdmin
        .from('user_roles')
        .select('role_name')
        .eq('user_id', user.id)
        .in('role_name', ['Admin', 'AdminSuper'])
        .single()

      if (!roles) {
        return new Response(
          JSON.stringify({ error: 'Not authorized to import users' }),
          { 
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
    }

    // Parse the request body
    const { users, createAuth }: { users: UserImportData[], createAuth: boolean } = await req.json()

    if (!users || !Array.isArray(users)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const results = {
      total: users.length,
      successful: 0,
      failed: 0,
      existing: 0,
      errors: [] as any[]
    }

    // Process each user
    for (const userData of users) {
      try {
        // Check if member already exists
        const { data: existingMember } = await supabaseAdmin
          .from('members')
          .select('id')
          .eq('email', userData.email.toLowerCase())
          .maybeSingle()

        if (existingMember) {
          results.existing++
          continue
        }

        let authUserId = null

        // Create auth account if requested
        if (createAuth) {
          const tempPassword = userData.tempPassword || `Eau2025!${userData.userId}`
          
          // Use admin API to create user without email confirmation
          const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: userData.email.toLowerCase(),
            password: tempPassword,
            email_confirm: true, // Auto-confirm email
            user_metadata: {
              first_name: userData.firstName,
              last_name: userData.lastName,
              legacy_user_id: userData.userId
            }
          })

          if (authError) {
            console.error('Auth creation error for', userData.email, ':', authError)
            results.errors.push({
              email: userData.email,
              error: authError.message
            })
            results.failed++
            continue
          }

          authUserId = authData.user?.id
        }

        // Parse goal status
        const goalParts = userData.goalStatus.split('/')
        const goalAchieved = parseFloat(goalParts[0]?.trim() || '0')
        const goalTarget = parseFloat(goalParts[1]?.trim() || '0')

        // Create member record
        const { error: memberError } = await supabaseAdmin
          .from('members')
          .insert({
            user_id: authUserId,
            legacy_user_id: parseInt(userData.userId),
            first_name: userData.firstName,
            last_name: userData.lastName,
            display_name: `${userData.firstName} ${userData.lastName}`,
            email: userData.email.toLowerCase(),
            cpd_activities_count: parseInt(userData.activities || '0'),
            cpd_points_total: parseFloat(userData.points || '0'),
            cpd_goal_achieved: goalAchieved,
            cpd_goal_target: goalTarget,
            membership_status: 'active',
            membership_type: 'standard',
            receive_newsletters: true,
            receive_event_notifications: true
          })

        if (memberError) {
          console.error('Member creation error for', userData.email, ':', memberError)
          results.errors.push({
            email: userData.email,
            error: memberError.message
          })
          results.failed++
        } else {
          results.successful++
        }
      } catch (error) {
        console.error('Error processing user', userData.email, ':', error)
        results.errors.push({
          email: userData.email,
          error: error.message
        })
        results.failed++
      }
    }

    return new Response(
      JSON.stringify(results),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
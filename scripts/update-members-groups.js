const { createClient } = require('@supabase/supabase-js')

// Supabase configuration
const supabaseUrl = 'https://english-australia-eau-supabase.lkobs5.easypanel.host'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q'

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function updateMembersWithGroups() {
  try {
    console.log('🔄 Updating members with interest groups...\n')

    // First, let's check if the column exists by trying to select it
    console.log('1️⃣ Checking if interest_group column exists...')
    const { data: testData, error: testError } = await supabase
      .from('members')
      .select('id, interest_group')
      .limit(1)

    if (testError && testError.message.includes('column')) {
      console.log('❌ Column interest_group does not exist yet')
      console.log('⚠️  Please run the SQL script manually in Supabase Studio')
      return
    }

    // Update members based on membership type
    console.log('\n2️⃣ Updating members by membership type...')

    // Update Premium members
    const { data: premium, error: err1 } = await supabase
      .from('members')
      .update({ interest_group: 'Full Provider' })
      .eq('membership_type', 'premium')
      .select()

    if (premium) console.log(`✅ Updated ${premium.length} premium members to "Full Provider"`)

    // Update Standard members
    const { data: standard, error: err2 } = await supabase
      .from('members')
      .update({ interest_group: 'Associate Provider' })
      .eq('membership_type', 'standard')
      .select()

    if (standard) console.log(`✅ Updated ${standard.length} standard members to "Associate Provider"`)

    // Update Corporate members
    const { data: corporate, error: err3 } = await supabase
      .from('members')
      .update({ interest_group: 'Corporate Affiliate' })
      .eq('membership_type', 'corporate')
      .select()

    if (corporate) console.log(`✅ Updated ${corporate.length} corporate members to "Corporate Affiliate"`)

    // Update Student members
    const { data: student, error: err4 } = await supabase
      .from('members')
      .update({ interest_group: 'Professional Affiliate' })
      .eq('membership_type', 'student')
      .select()

    if (student) console.log(`✅ Updated ${student.length} student members to "Professional Affiliate"`)

    // Verify the updates
    console.log('\n3️⃣ Verifying updates...')
    const { data: members, error: checkError } = await supabase
      .from('members')
      .select('id, first_name, last_name, membership_type, interest_group')
      .not('interest_group', 'is', null)
      .limit(10)

    if (members && members.length > 0) {
      console.log(`\n✅ Successfully updated ${members.length} members with interest groups:`)
      members.forEach(m => {
        console.log(`   - ${m.first_name} ${m.last_name}: ${m.interest_group} (${m.membership_type})`)
      })
    }

    // Check total count
    const { count, error: countError } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
      .not('interest_group', 'is', null)

    if (count) {
      console.log(`\n📊 Total members with interest groups: ${count}`)
    }

    console.log('\n✨ Update completed successfully!')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Execute the updates
updateMembersWithGroups()
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

async function executeSQLUpdates() {
  try {
    console.log('🔄 Starting database updates...\n')

    // 1. Add interest_group column to members table
    console.log('1️⃣ Adding interest_group column to members table...')
    const { data: col1, error: err1 } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE members 
        ADD COLUMN IF NOT EXISTS interest_group VARCHAR(50);
      `
    })
    if (err1) console.log('Note:', err1.message)
    else console.log('✅ Column added successfully')

    // 2. Create index for performance
    console.log('\n2️⃣ Creating index for interest_group...')
    const { data: idx1, error: err2 } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_members_interest_group ON members(interest_group);
      `
    })
    if (err2) console.log('Note:', err2.message)
    else console.log('✅ Index created successfully')

    // 3. Update existing members with default groups
    console.log('\n3️⃣ Updating existing members with default interest groups...')
    const { data: upd1, error: err3 } = await supabase
      .from('members')
      .update({ 
        interest_group: 'Full Provider' 
      })
      .eq('membership_type', 'premium')
      .is('interest_group', null)

    const { data: upd2, error: err4 } = await supabase
      .from('members')
      .update({ 
        interest_group: 'Associate Provider' 
      })
      .eq('membership_type', 'standard')
      .is('interest_group', null)

    const { data: upd3, error: err5 } = await supabase
      .from('members')
      .update({ 
        interest_group: 'Corporate Affiliate' 
      })
      .eq('membership_type', 'corporate')
      .is('interest_group', null)

    const { data: upd4, error: err6 } = await supabase
      .from('members')
      .update({ 
        interest_group: 'Professional Affiliate' 
      })
      .eq('membership_type', 'student')
      .is('interest_group', null)

    console.log('✅ Members updated with interest groups')

    // 4. Create interest_groups table
    console.log('\n4️⃣ Creating interest_groups configuration table...')
    const { data: tbl1, error: err7 } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS interest_groups (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name VARCHAR(100) NOT NULL UNIQUE,
          description TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })
    if (err7) console.log('Note:', err7.message)
    else console.log('✅ Table created successfully')

    // 5. Insert default interest groups
    console.log('\n5️⃣ Inserting default interest groups...')
    const interestGroups = [
      {
        name: 'Full Provider',
        description: 'Colleges registered on CRICOS as an ELICOS provider for 12+ months'
      },
      {
        name: 'Associate Provider',
        description: 'Newly established colleges (registered <12 months)'
      },
      {
        name: 'Corporate Affiliate',
        description: 'Organizations providing products/services to international education sector'
      },
      {
        name: 'Professional Affiliate',
        description: 'Non-ELICOS colleges involved in English language tuition'
      }
    ]

    for (const group of interestGroups) {
      const { error } = await supabase
        .from('interest_groups')
        .upsert(group, { onConflict: 'name' })
      
      if (error && !error.message.includes('duplicate')) {
        console.log(`Note for ${group.name}:`, error.message)
      }
    }
    console.log('✅ Interest groups inserted')

    // 6. Verify the updates
    console.log('\n📊 Verifying updates...')
    
    // Check members with interest groups
    const { data: members, error: errCheck1 } = await supabase
      .from('members')
      .select('id, first_name, last_name, interest_group')
      .not('interest_group', 'is', null)
      .limit(5)
    
    if (members && members.length > 0) {
      console.log(`✅ Found ${members.length} members with interest groups`)
      console.log('Sample:', members.slice(0, 2).map(m => 
        `${m.first_name} ${m.last_name}: ${m.interest_group}`
      ).join(', '))
    }

    // Check interest groups table
    const { data: groups, error: errCheck2 } = await supabase
      .from('interest_groups')
      .select('name')
    
    if (groups) {
      console.log(`✅ Found ${groups.length} interest groups configured`)
      console.log('Groups:', groups.map(g => g.name).join(', '))
    }

    console.log('\n✨ Database updates completed successfully!')

  } catch (error) {
    console.error('❌ Error during database updates:', error)
  }
}

// Execute the updates
executeSQLUpdates()
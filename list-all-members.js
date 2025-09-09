const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://english-australia-eau-supabase.lkobs5.easypanel.host';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listAllMembers() {
  console.log('Listing all members with role "Members"...\n');
  
  try {
    // Get all members
    const { data: members, error } = await supabase
      .from('members')
      .select('id, user_id, email, first_name, last_name')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching members:', error);
      return;
    }
    
    console.log(`Found ${members.length} members:\n`);
    
    // Show members that can be impersonated (non-admin)
    for (const member of members) {
      // Check if this member has admin roles
      const { data: roles, error: roleError } = await supabase
        .from('members_roles')
        .select('role')
        .eq('member_id', member.id);
      
      const hasAdminRole = roles && roles.some(r => 
        r.role === 'Super Admin' || 
        r.role === 'Institution Admin' || 
        r.role === 'Staff'
      );
      
      if (!hasAdminRole) {
        console.log(`✅ Member (can impersonate):`);
        console.log(`   ID: ${member.id}`);
        console.log(`   User ID: ${member.user_id || 'NO USER_ID'}`);
        console.log(`   Name: ${member.first_name} ${member.last_name}`);
        console.log(`   Email: ${member.email}`);
        console.log('');
      }
    }
    
    // Also check auth.users table
    console.log('\nChecking auth.users table...');
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('Error fetching users:', usersError);
    } else {
      console.log(`Found ${users.length} users in auth.users`);
      
      // Find users without member records
      for (const user of users) {
        const hasMember = members.some(m => m.user_id === user.id);
        if (!hasMember) {
          console.log(`\n⚠️ User without member record:`);
          console.log(`   Auth User ID: ${user.id}`);
          console.log(`   Email: ${user.email}`);
        }
      }
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

listAllMembers();
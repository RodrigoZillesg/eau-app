const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://english-australia-eau-supabase.lkobs5.easypanel.host';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRolesStructure() {
  console.log('Checking roles structure in database...\n');
  
  // Check if member_roles table exists
  console.log('1. Checking member_roles table:');
  const { data: rolesData, error: rolesError } = await supabase
    .from('member_roles')
    .select('*')
    .limit(1);
  
  if (rolesError) {
    console.log('❌ member_roles table error:', rolesError.message);
  } else {
    console.log('✅ member_roles table exists');
    if (rolesData && rolesData.length > 0) {
      console.log('   Sample data:', rolesData[0]);
    }
  }
  
  // Check members table structure
  console.log('\n2. Checking members table columns:');
  const { data: memberData, error: memberError } = await supabase
    .from('members')
    .select('*')
    .limit(1);
  
  if (memberError) {
    console.log('❌ Error:', memberError.message);
  } else if (memberData && memberData.length > 0) {
    const columns = Object.keys(memberData[0]);
    console.log('✅ Members table columns:');
    
    // Check for role-related columns
    const roleColumns = columns.filter(col => 
      col.toLowerCase().includes('role') || 
      col.toLowerCase().includes('admin') ||
      col.toLowerCase().includes('permission')
    );
    
    if (roleColumns.length > 0) {
      console.log('   Role-related columns found:', roleColumns);
    } else {
      console.log('   No role-related columns found');
    }
    
    // Show all columns for reference
    console.log('\n   All columns:', columns.join(', '));
  }
  
  // Check for roles table
  console.log('\n3. Checking for roles table:');
  const { data: rolesTableData, error: rolesTableError } = await supabase
    .from('roles')
    .select('*')
    .limit(1);
  
  if (rolesTableError) {
    if (rolesTableError.message.includes('relation')) {
      console.log('❌ roles table does not exist');
    } else {
      console.log('❌ Error:', rolesTableError.message);
    }
  } else {
    console.log('✅ roles table exists');
    if (rolesTableData && rolesTableData.length > 0) {
      console.log('   Sample data:', rolesTableData[0]);
    }
  }
  
  // Check member permissions
  console.log('\n4. Checking how permissions are stored:');
  const { data: sampleMember } = await supabase
    .from('members')
    .select('id, email, membership_type, membership_status')
    .eq('email', 'rrzillesg@gmail.com')
    .single();
  
  if (sampleMember) {
    console.log('   Admin member found:', sampleMember);
    
    // Check if there's a user_roles or similar table
    const tables = [
      'user_roles',
      'member_permissions',
      'auth.users',
      'user_permissions'
    ];
    
    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (!error) {
        console.log(`   ✅ Table ${table} exists`);
      }
    }
  }
}

checkRolesStructure().catch(console.error);
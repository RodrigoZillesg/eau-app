const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://english-australia-eau-supabase.lkobs5.easypanel.host';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTables() {
  console.log('Checking OpenLearning tables...\n');
  
  const tables = [
    'openlearning_courses',
    'openlearning_sso_sessions', 
    'openlearning_api_logs'
  ];
  
  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(0);
    
    if (error) {
      if (error.message.includes('relation') || error.message.includes('does not exist')) {
        console.log(`❌ Table ${table} does not exist`);
        console.log(`   Error: ${error.message}`);
      } else {
        console.log(`⚠️ Table ${table} - Other error: ${error.message}`);
      }
    } else {
      console.log(`✅ Table ${table} exists`);
    }
  }
  
  // Also check members table columns
  console.log('\nChecking members table columns...');
  const { data: member, error: memberError } = await supabase
    .from('members')
    .select('id, openlearning_user_id, openlearning_external_id, openlearning_sync_enabled')
    .limit(1);
  
  if (memberError) {
    console.log(`❌ Error checking members columns: ${memberError.message}`);
  } else {
    console.log('✅ OpenLearning columns exist in members table');
  }
}

checkTables().catch(console.error);
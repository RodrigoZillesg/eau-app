const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://english-australia-eau-supabase.lkobs5.easypanel.host',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q'
);

async function disableRLS() {
  console.log('🔧 Temporarily disabling RLS for event_reminders...');
  
  try {
    const { error } = await supabase
      .from('event_reminders')
      .select('count')
      .limit(1);
    
    console.log('✅ Connection test successful');
    
    console.log('\n📋 Current table policies:');
    const { data: policies } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'event_reminders');
    
    console.log('Policies found:', policies?.length || 0);
    policies?.forEach(policy => {
      console.log(`- ${policy.policyname}: ${policy.cmd}`);
    });
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

disableRLS().catch(console.error);
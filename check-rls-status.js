const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://english-australia-eau-supabase.lkobs5.easypanel.host',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q'
);

async function checkRLSStatus() {
  console.log('🔍 Checking RLS status for event_reminders...');
  
  try {
    // Check if RLS is enabled on the table
    const { data: tableInfo } = await supabase
      .rpc('get_table_info', { table_name: 'event_reminders' })
      .single();
    
    console.log('Table info:', tableInfo);
    
    // Try to insert a test reminder directly with service role
    const testReminder = {
      event_id: 'd1860358-6abd-40d7-a334-0cca72de9dfc',
      registration_id: 'test-reg-id',
      user_id: '4a23c4b4-5e82-4f58-9e45-123456789abc',
      reminder_type: 'test_reminder',
      scheduled_date: new Date(Date.now() + 60000).toISOString(),
      email_to: 'test@example.com',
      email_subject: 'Test Reminder',
      is_sent: false
    };
    
    console.log('\n🧪 Testing direct insert with service role...');
    const { data, error } = await supabase
      .from('event_reminders')
      .insert(testReminder);
    
    if (error) {
      console.error('❌ Service role insert failed:', error);
    } else {
      console.log('✅ Service role insert successful!');
      
      // Clean up test reminder
      await supabase
        .from('event_reminders')
        .delete()
        .eq('reminder_type', 'test_reminder');
      console.log('🧹 Test reminder cleaned up');
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

checkRLSStatus().catch(console.error);
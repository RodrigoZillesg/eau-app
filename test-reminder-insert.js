const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://english-australia-eau-supabase.lkobs5.easypanel.host',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q'
);

// Generate UUID v4
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function testReminderInsert() {
  console.log('🔧 Testing reminder insert with valid UUIDs...');
  
  // Get a real user ID from the auth system
  console.log('1️⃣ Getting real user ID...');
  const { data: users } = await supabase.auth.admin.listUsers();
  const realUserId = users?.users?.[0]?.id;
  
  if (!realUserId) {
    console.error('❌ No users found');
    return;
  }
  
  console.log('👤 Using user ID:', realUserId);
  
  // Get a real event ID
  console.log('2️⃣ Getting real event ID...');
  const { data: events } = await supabase
    .from('events')
    .select('id')
    .limit(1);
  
  const realEventId = events?.[0]?.id;
  if (!realEventId) {
    console.error('❌ No events found');
    return;
  }
  
  console.log('📅 Using event ID:', realEventId);
  
  const testReminder = {
    event_id: realEventId,
    registration_id: generateUUID(),
    user_id: realUserId,
    reminder_type: 'test_reminder_' + Date.now(),
    scheduled_date: new Date(Date.now() + 60000).toISOString(),
    email_to: 'test@example.com',
    email_subject: 'Test Reminder',
    is_sent: false
  };
  
  console.log('\n🧪 Testing insert with service role...');
  const { data, error } = await supabase
    .from('event_reminders')
    .insert(testReminder);
  
  if (error) {
    console.error('❌ Service role insert failed:', error);
    
    // Try to check RLS status
    console.log('\n🔍 Checking if RLS is enabled...');
    const { data: rlsStatus } = await supabase
      .rpc('get_table_rls_status', { table_name: 'event_reminders' });
    console.log('RLS Status:', rlsStatus);
    
  } else {
    console.log('✅ Service role insert successful!', data);
    
    // Clean up test reminder
    await supabase
      .from('event_reminders')
      .delete()
      .eq('reminder_type', testReminder.reminder_type);
    console.log('🧹 Test reminder cleaned up');
  }
}

testReminderInsert().catch(console.error);
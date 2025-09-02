const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://english-australia-eau-supabase.lkobs5.easypanel.host',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q'
);

async function monitorReminders() {
  console.log('📊 Reminder System Status Report');
  console.log('================================\n');
  
  // Total reminders
  const { count: totalReminders } = await supabase
    .from('event_reminders')
    .select('*', { count: 'exact', head: true });
  
  // Sent reminders
  const { count: sentReminders } = await supabase
    .from('event_reminders')
    .select('*', { count: 'exact', head: true })
    .eq('is_sent', true);
  
  // Pending reminders due now
  const { count: dueNow } = await supabase
    .from('event_reminders')
    .select('*', { count: 'exact', head: true })
    .eq('is_sent', false)
    .lte('scheduled_date', new Date().toISOString());
  
  // Pending future reminders
  const { count: futurePending } = await supabase
    .from('event_reminders')
    .select('*', { count: 'exact', head: true })
    .eq('is_sent', false)
    .gt('scheduled_date', new Date().toISOString());
  
  // Recent registrations (last 24h)
  const { count: recentRegistrations } = await supabase
    .from('event_registrations')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', new Date(Date.now() - 24*60*60*1000).toISOString());
  
  console.log(`📧 Total Reminders: ${totalReminders}`);
  console.log(`✅ Sent: ${sentReminders}`);
  console.log(`🔴 Due Now: ${dueNow}`);
  console.log(`⏰ Future Pending: ${futurePending}`);
  console.log(`👥 Registrations (24h): ${recentRegistrations}`);
  
  if (dueNow > 0) {
    console.log(`\n🚨 ACTION NEEDED: ${dueNow} reminders are ready to be sent!`);
    console.log(`Run: node production-reminder-worker.js`);
  } else {
    console.log('\n✨ All scheduled reminders have been sent');
  }
  
  // Success rate
  const successRate = totalReminders > 0 ? (sentReminders / totalReminders * 100).toFixed(1) : '0';
  console.log(`\n📈 Success Rate: ${successRate}%`);
  
  if (parseFloat(successRate) < 80) {
    console.log('⚠️  Low success rate - check email server logs');
  }
}

monitorReminders().catch(console.error);
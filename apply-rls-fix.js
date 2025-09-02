const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://english-australia-eau-supabase.lkobs5.easypanel.host',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q'
);

async function fixRLS() {
  console.log('🔧 Fixing RLS policies for event_reminders...');
  
  const sqlCommands = [
    // Remove existing policies
    `DROP POLICY IF EXISTS "Users can insert reminders" ON event_reminders;`,
    `DROP POLICY IF EXISTS "Users can view reminders" ON event_reminders;`,
    `DROP POLICY IF EXISTS "Users can update reminders" ON event_reminders;`,
    `DROP POLICY IF EXISTS "Authenticated can insert reminders" ON event_reminders;`,
    `DROP POLICY IF EXISTS "Users can view own reminders" ON event_reminders;`,
    `DROP POLICY IF EXISTS "Allow authenticated to insert reminders" ON event_reminders;`,
    `DROP POLICY IF EXISTS "Allow users to view own reminders" ON event_reminders;`,
    `DROP POLICY IF EXISTS "Allow service role full access" ON event_reminders;`,
    
    // Create new permissive policies
    `CREATE POLICY "Allow authenticated to insert reminders" 
     ON event_reminders FOR INSERT 
     TO authenticated 
     WITH CHECK (true);`,
    
    `CREATE POLICY "Allow users to view own reminders" 
     ON event_reminders FOR SELECT 
     TO authenticated 
     USING (auth.uid() = user_id);`,
    
    `CREATE POLICY "Allow service role full access" 
     ON event_reminders FOR ALL 
     TO service_role 
     USING (true)
     WITH CHECK (true);`,
    
    // Ensure RLS is enabled
    `ALTER TABLE event_reminders ENABLE ROW LEVEL SECURITY;`,
    
    // Grant permissions
    `GRANT ALL ON event_reminders TO authenticated;`,
    `GRANT ALL ON event_reminders TO service_role;`
  ];
  
  for (const sql of sqlCommands) {
    try {
      console.log(`Executing: ${sql.substring(0, 50)}...`);
      const { error } = await supabase.rpc('exec_sql', { query: sql });
      
      if (error) {
        console.log(`⚠️  Warning on: ${sql.substring(0, 50)}...:`, error.message);
      } else {
        console.log(`✅ Success`);
      }
    } catch (err) {
      console.log(`⚠️  Error on: ${sql.substring(0, 50)}...:`, err.message);
    }
  }
  
  console.log('\n🎉 RLS fix completed!');
  console.log('🧪 Now test by registering for an event');
}

fixRLS().catch(console.error);
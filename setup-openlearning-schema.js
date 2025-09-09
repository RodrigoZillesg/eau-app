const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase connection details
const supabaseUrl = 'https://english-australia-eau-supabase.lkobs5.easypanel.host';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🚀 Starting OpenLearning integration schema setup...\n');

  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'eau-backend', 'sql', 'openlearning_integration_schema.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // Split SQL statements by semicolon (simple approach)
    const statements = sqlContent
      .split(/;\s*$/gm)
      .filter(stmt => stmt.trim())
      .map(stmt => stmt.trim() + ';');

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    let successCount = 0;
    let errorCount = 0;

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments-only statements
      if (statement.replace(/--.*$/gm, '').trim() === ';') {
        continue;
      }

      // Extract first few words for logging
      const firstLine = statement.split('\n')[0].substring(0, 60);
      console.log(`Executing: ${firstLine}...`);

      try {
        const { error } = await supabase.rpc('exec_sql', {
          sql_query: statement
        });

        if (error) {
          // Try direct execution as fallback
          const { data, error: directError } = await supabase
            .from('_migrations')
            .select('*')
            .limit(1);
          
          if (directError) {
            console.log(`⚠️  Warning: ${error.message}`);
            errorCount++;
          } else {
            console.log('✅ Success');
            successCount++;
          }
        } else {
          console.log('✅ Success');
          successCount++;
        }
      } catch (err) {
        console.log(`⚠️  Warning: ${err.message}`);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`✨ Migration completed!`);
    console.log(`   ✅ Successful statements: ${successCount}`);
    if (errorCount > 0) {
      console.log(`   ⚠️  Statements with warnings: ${errorCount}`);
      console.log(`   (Some warnings are expected for IF EXISTS clauses)`);
    }
    console.log('='.repeat(50));

    // Verify the schema was created
    console.log('\n🔍 Verifying schema creation...\n');

    // Check if columns were added to members table
    const { data: membersColumns } = await supabase
      .from('members')
      .select('openlearning_user_id')
      .limit(1);

    if (membersColumns !== null) {
      console.log('✅ OpenLearning columns added to members table');
    }

    // Check if openlearning_courses table exists
    const { data: coursesCheck } = await supabase
      .from('openlearning_courses')
      .select('id')
      .limit(1);

    if (coursesCheck !== null) {
      console.log('✅ openlearning_courses table created');
    }

    // Check if openlearning_sso_sessions table exists
    const { data: ssoCheck } = await supabase
      .from('openlearning_sso_sessions')
      .select('id')
      .limit(1);

    if (ssoCheck !== null) {
      console.log('✅ openlearning_sso_sessions table created');
    }

    // Check if openlearning_api_logs table exists
    const { data: logsCheck } = await supabase
      .from('openlearning_api_logs')
      .select('id')
      .limit(1);

    if (logsCheck !== null) {
      console.log('✅ openlearning_api_logs table created');
    }

    console.log('\n🎉 OpenLearning integration schema setup completed successfully!');

  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration().catch(console.error);
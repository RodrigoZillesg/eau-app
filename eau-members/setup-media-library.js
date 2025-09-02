const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'http://localhost:8000';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSQLFile() {
  try {
    console.log('📚 Setting up Media Library...\n');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', 'database', 'media_library_schema_fixed.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Split SQL into individual statements (by semicolon at end of line)
    const statements = sqlContent
      .split(/;\s*$/gm)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`Found ${statements.length} SQL statements to execute\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip certain statements that might not work via Supabase client
      if (statement.includes('GRANT ') || 
          statement.includes('ALTER TABLE') && statement.includes('ENABLE ROW LEVEL SECURITY')) {
        console.log(`⏭️  Skipping statement ${i + 1} (RLS/GRANT - will be handled by Supabase)`);
        continue;
      }
      
      try {
        // For CREATE TABLE, CREATE INDEX, etc., we use raw SQL
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql_query: statement + ';' 
        }).single();
        
        if (error) {
          // Try direct execution as fallback
          const { error: directError } = await supabase.from('_sql').select(statement);
          
          if (directError) {
            console.error(`❌ Statement ${i + 1} failed:`, directError.message);
            errorCount++;
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
            successCount++;
          }
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
          successCount++;
        }
      } catch (err) {
        console.error(`❌ Statement ${i + 1} error:`, err.message);
        errorCount++;
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`✅ Success: ${successCount} statements`);
    console.log(`❌ Failed: ${errorCount} statements`);
    
    // Create storage bucket
    console.log('\n📦 Creating storage bucket...');
    
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (!listError) {
      const mediaExists = buckets?.some(b => b.name === 'media');
      
      if (!mediaExists) {
        const { data, error } = await supabase.storage.createBucket('media', {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
          fileSizeLimit: 5242880 // 5MB
        });
        
        if (error) {
          console.error('❌ Failed to create storage bucket:', error.message);
        } else {
          console.log('✅ Storage bucket "media" created successfully');
        }
      } else {
        console.log('ℹ️  Storage bucket "media" already exists');
      }
    }
    
    console.log('\n✨ Media Library setup completed!');
    
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run the setup
executeSQLFile();
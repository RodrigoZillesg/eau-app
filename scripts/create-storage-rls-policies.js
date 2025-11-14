const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://english-australia-eau-supabase.lkobs5.easypanel.host';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createStorageRLSPolicies() {
  console.log('🔧 Creating RLS policies for storage.objects...\n');

  try {
    // Construct complete SQL to execute all policies
    const sql = `
-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own avatars" ON storage.objects;

-- Policy 1: Allow authenticated users to upload files to profiles bucket
CREATE POLICY "Allow authenticated users to upload avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profiles');

-- Policy 2: Allow public read access
CREATE POLICY "Allow public read access to avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profiles');

-- Policy 3: Allow users to update their own files
CREATE POLICY "Allow users to update their own avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'profiles' AND auth.uid()::text = owner)
WITH CHECK (bucket_id = 'profiles');

-- Policy 4: Allow users to delete their own files
CREATE POLICY "Allow users to delete their own avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'profiles' AND auth.uid()::text = owner);
    `;

    console.log('Executing SQL to create all policies...\n');

    // Use the Supabase REST API to execute SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      const error = await response.text();
      console.log('⚠️  Note: Using direct database connection may be required');
      console.log(`Response: ${error}`);

      // Try alternative method using pg client if available
      console.log('\nAttempting alternative method...');
      const { Client } = require('pg');

      const client = new Client({
        connectionString: process.env.DATABASE_URL ||
          'postgresql://postgres:this_password_is_insecure_and_should_be_updated@english-australia-eau-supabase.lkobs5.easypanel.host:5432/postgres'
      });

      await client.connect();
      await client.query(sql);
      await client.end();

      console.log('✅ Policies created successfully via direct connection');
    } else {
      console.log('✅ Policies created successfully via API');
    }

    // Verify policies were created
    console.log('\n📋 Verifying policies...');
    const { data: policies, error: verifyError } = await supabase
      .from('pg_policies')
      .select('policyname, cmd')
      .eq('schemaname', 'storage')
      .eq('tablename', 'objects');

    if (verifyError) {
      console.log(`Note: Could not verify via pg_policies view`);
    } else if (policies && policies.length > 0) {
      console.log(`\n✅ Found ${policies.length} policies:`);
      policies.forEach(policy => {
        console.log(`   - ${policy.policyname} (${policy.cmd})`);
      });
    }

    console.log('\n🎉 Storage RLS policies setup complete!');
    console.log('\n📝 Next: Test avatar upload via frontend');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Solution: Execute SQL manually in Supabase Studio SQL Editor:');
    console.log('   URL: https://english-australia-eau-supabase.lkobs5.easypanel.host/');
    console.log('   Username: supabase');
    console.log('   Password: this_password_is_insecure_and_should_be_updated');
    console.log('\n   Then go to SQL Editor and run the policies from the script comments above.');
    process.exit(1);
  }
}

createStorageRLSPolicies();

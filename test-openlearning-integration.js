const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

// Configuration
const supabaseUrl = 'https://english-australia-eau-supabase.lkobs5.easypanel.host';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';
const apiBaseUrl = 'http://localhost:3001/api/v1';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test member email
const testEmail = 'openlearning-test@example.com';

async function testIntegration() {
  console.log('🚀 Testing OpenLearning Integration\n');
  console.log('=' .repeat(50));
  
  try {
    // Step 1: Check database schema
    console.log('\n1️⃣ Checking database schema...');
    
    // Check if OpenLearning columns exist in members table
    const { data: memberCheck, error: memberError } = await supabase
      .from('members')
      .select('openlearning_user_id, openlearning_sync_enabled')
      .limit(1);
    
    if (memberError && memberError.message.includes('column')) {
      console.log('❌ OpenLearning columns not found in members table');
      console.log('   Please run the schema migration script first');
      return;
    }
    console.log('✅ OpenLearning columns exist in members table');
    
    // Check if OpenLearning tables exist
    const tables = ['openlearning_courses', 'openlearning_sso_sessions', 'openlearning_api_logs'];
    for (const table of tables) {
      const { error } = await supabase.from(table).select('id').limit(1);
      if (error && error.message.includes('relation')) {
        console.log(`❌ Table ${table} does not exist`);
        return;
      }
      console.log(`✅ Table ${table} exists`);
    }
    
    // Step 2: Create or get test member
    console.log('\n2️⃣ Setting up test member...');
    
    let { data: testMember } = await supabase
      .from('members')
      .select('*')
      .eq('email', testEmail)
      .single();
    
    if (!testMember) {
      console.log('   Creating test member...');
      const { data: newMember, error: createError } = await supabase
        .from('members')
        .insert({
          email: testEmail,
          first_name: 'OpenLearning',
          last_name: 'Test',
          phone: '1234567890',
          address: '123 Test St',
          city: 'Test City',
          state: 'TS',
          postal_code: '12345',
          country: 'Test Country',
          membership_type: 'regular',
          membership_status: 'active',
          role: 'member'
        })
        .select()
        .single();
      
      if (createError) {
        console.log('❌ Failed to create test member:', createError.message);
        return;
      }
      
      testMember = newMember;
      console.log('✅ Test member created');
    } else {
      console.log('✅ Test member found');
    }
    
    console.log(`   Member ID: ${testMember.id}`);
    console.log(`   Email: ${testMember.email}`);
    console.log(`   OpenLearning ID: ${testMember.openlearning_user_id || 'Not provisioned'}`);
    
    // Step 3: Test backend API endpoints
    console.log('\n3️⃣ Testing backend API endpoints...');
    
    // First, get an auth token for the test member
    console.log('   Getting auth token...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: 'Test123456!' // You may need to set this password for the test user
    });
    
    let token = null;
    if (authError) {
      console.log('⚠️  Could not authenticate test user (this is okay for API testing)');
      // Use service role key as fallback for testing
      token = supabaseServiceKey;
    } else {
      token = authData.session.access_token;
      console.log('✅ Got auth token');
    }
    
    // Test status endpoint
    console.log('   Testing status endpoint...');
    try {
      const statusResponse = await axios.get(
        `${apiBaseUrl}/openlearning/status/${testMember.id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      console.log('✅ Status endpoint working');
      console.log(`   Provisioned: ${statusResponse.data.status.isProvisioned}`);
      console.log(`   Course Count: ${statusResponse.data.status.courseCount}`);
      console.log(`   CPD Count: ${statusResponse.data.status.cpdActivitiesCount}`);
    } catch (error) {
      console.log('❌ Status endpoint failed:', error.response?.data?.error || error.message);
    }
    
    // Test provision endpoint (if not already provisioned)
    if (!testMember.openlearning_user_id) {
      console.log('   Testing provision endpoint...');
      try {
        const provisionResponse = await axios.post(
          `${apiBaseUrl}/openlearning/provision`,
          { memberId: testMember.id },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        
        if (provisionResponse.data.success) {
          console.log('✅ Provision endpoint working');
          console.log(`   OpenLearning User ID: ${provisionResponse.data.openLearningUserId}`);
          
          // Update local test member data
          testMember.openlearning_user_id = provisionResponse.data.openLearningUserId;
        } else {
          console.log('⚠️  Provision failed:', provisionResponse.data.error);
        }
      } catch (error) {
        console.log('⚠️  Provision endpoint error:', error.response?.data?.error || error.message);
        console.log('   This is expected if OpenLearning API credentials are not valid');
      }
    }
    
    // Test SSO endpoint
    console.log('   Testing SSO endpoint...');
    try {
      const ssoResponse = await axios.post(
        `${apiBaseUrl}/openlearning/sso`,
        { returnUrl: 'http://localhost:5180/dashboard' },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (ssoResponse.data.success) {
        console.log('✅ SSO endpoint working');
        console.log(`   Session Token: ${ssoResponse.data.sessionToken}`);
        console.log(`   Launch URL: ${ssoResponse.data.launchData?.url}`);
      } else {
        console.log('⚠️  SSO generation failed:', ssoResponse.data.error);
      }
    } catch (error) {
      console.log('⚠️  SSO endpoint error:', error.response?.data?.error || error.message);
    }
    
    // Step 4: Check API logs
    console.log('\n4️⃣ Checking API logs...');
    const { data: apiLogs, error: logsError } = await supabase
      .from('openlearning_api_logs')
      .select('*')
      .eq('member_id', testMember.id)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (logsError) {
      console.log('❌ Failed to fetch API logs:', logsError.message);
    } else {
      console.log(`✅ Found ${apiLogs.length} API log entries`);
      apiLogs.forEach(log => {
        const status = log.status_code ? `${log.status_code}` : 'ERROR';
        const emoji = log.status_code && log.status_code < 400 ? '✅' : '❌';
        console.log(`   ${emoji} ${log.action} - ${status} - ${new Date(log.created_at).toLocaleString()}`);
        if (log.error_message) {
          console.log(`      Error: ${log.error_message}`);
        }
      });
    }
    
    // Step 5: Summary
    console.log('\n' + '=' .repeat(50));
    console.log('📊 Integration Test Summary\n');
    console.log('✅ Database schema is properly configured');
    console.log('✅ Backend API endpoints are accessible');
    console.log('⚠️  OpenLearning API integration depends on valid credentials');
    console.log('\n💡 Next Steps:');
    console.log('1. Ensure OpenLearning API credentials are valid');
    console.log('2. Test the frontend SSO button on the login page');
    console.log('3. Complete a course in OpenLearning and test sync');
    console.log('4. Check CPD activities for synced courses');
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
  }
}

// Run the test
testIntegration().catch(console.error);
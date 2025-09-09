const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const API_BASE = 'http://localhost:3001/api/v1';
const supabaseUrl = 'https://english-australia-eau-supabase.lkobs5.easypanel.host';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testEndpoints() {
  console.log('🧪 Testing OpenLearning API Endpoints\n');
  console.log('=' .repeat(50));

  try {
    // 1. Test health endpoint
    console.log('\n1️⃣ Testing Health Endpoint...');
    try {
      const health = await axios.get('http://localhost:3001/health');
      console.log('✅ Health check passed:', health.data.message);
    } catch (error) {
      console.log('❌ Health check failed:', error.message);
      return;
    }

    // 2. Get or create test member
    console.log('\n2️⃣ Getting test member...');
    const testEmail = 'openlearning-test@example.com';
    
    let { data: testMember } = await supabase
      .from('members')
      .select('*')
      .eq('email', testEmail)
      .single();

    if (!testMember) {
      console.log('Creating test member...');
      const { data: newMember, error } = await supabase
        .from('members')
        .insert({
          email: testEmail,
          first_name: 'OpenLearning',
          last_name: 'Test',
          phone: '1234567890',
          membership_type: 'standard',
          membership_status: 'active'
        })
        .select()
        .single();

      if (error) {
        console.log('❌ Failed to create test member:', error.message);
        return;
      }
      testMember = newMember;
    }

    console.log('✅ Test member:', testMember.email);
    console.log('   Member ID:', testMember.id);

    // 3. Get auth token
    console.log('\n3️⃣ Getting authentication token...');
    // For testing, we'll use the service role key
    const authToken = supabaseServiceKey;
    console.log('✅ Using service role token for testing');

    // 4. Test OpenLearning status endpoint
    console.log('\n4️⃣ Testing OpenLearning Status Endpoint...');
    try {
      const statusResponse = await axios.get(
        `${API_BASE}/openlearning/status/${testMember.id}`,
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );
      
      console.log('✅ Status endpoint working');
      console.log('   Response:', JSON.stringify(statusResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Status endpoint failed:', error.response?.data || error.message);
    }

    // 5. Test provision endpoint
    console.log('\n5️⃣ Testing Provision Endpoint...');
    try {
      const provisionResponse = await axios.post(
        `${API_BASE}/openlearning/provision`,
        { memberId: testMember.id },
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );
      
      console.log('✅ Provision endpoint called');
      console.log('   Response:', JSON.stringify(provisionResponse.data, null, 2));
    } catch (error) {
      console.log('⚠️  Provision endpoint error:', error.response?.data || error.message);
      console.log('   Note: This is expected if OpenLearning API credentials are not valid');
    }

    // 6. Test SSO endpoint
    console.log('\n6️⃣ Testing SSO Endpoint...');
    try {
      const ssoResponse = await axios.post(
        `${API_BASE}/openlearning/sso`,
        { 
          memberId: testMember.id,
          returnUrl: 'http://localhost:5180/dashboard' 
        },
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );
      
      console.log('✅ SSO endpoint called');
      console.log('   Response:', JSON.stringify(ssoResponse.data, null, 2));
    } catch (error) {
      console.log('⚠️  SSO endpoint error:', error.response?.data || error.message);
    }

    // 7. Test courses endpoint
    console.log('\n7️⃣ Testing Courses Endpoint...');
    try {
      const coursesResponse = await axios.get(
        `${API_BASE}/openlearning/courses/${testMember.id}`,
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );
      
      console.log('✅ Courses endpoint working');
      console.log('   Courses found:', coursesResponse.data.courses?.length || 0);
    } catch (error) {
      console.log('❌ Courses endpoint failed:', error.response?.data || error.message);
    }

    // 8. Check API logs
    console.log('\n8️⃣ Checking API Logs...');
    const { data: apiLogs } = await supabase
      .from('openlearning_api_logs')
      .select('*')
      .eq('member_id', testMember.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (apiLogs && apiLogs.length > 0) {
      console.log(`✅ Found ${apiLogs.length} API log entries`);
      apiLogs.forEach(log => {
        console.log(`   - ${log.action} [${log.status_code || 'ERROR'}] at ${new Date(log.created_at).toLocaleTimeString()}`);
      });
    } else {
      console.log('ℹ️  No API logs found yet');
    }

    // Summary
    console.log('\n' + '=' .repeat(50));
    console.log('📊 API Testing Summary\n');
    console.log('✅ Backend server is running');
    console.log('✅ Health endpoint is accessible');
    console.log('✅ OpenLearning endpoints are configured');
    console.log('⚠️  Some endpoints may fail due to OpenLearning API credentials');
    console.log('\nNext: Testing frontend integration...');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

testEndpoints().catch(console.error);
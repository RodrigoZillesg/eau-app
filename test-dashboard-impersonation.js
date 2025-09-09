const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://english-australia-eau-supabase.lkobs5.easypanel.host';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testDashboardQueries() {
  // Use the same member ID we've been testing with
  const testMemberId = '5d992cb3-7770-4713-af75-7467e57f6b09'; // Elisabetta Vannozzi
  
  console.log('Testing Dashboard queries for member:', testMemberId);
  console.log('========================================\n');
  
  try {
    // 1. Query using member_id directly (as in impersonation mode)
    console.log('1. Query CPD activities using member_id directly:');
    const { data: activitiesByMember, error: error1 } = await supabase
      .from('cpd_activities')
      .select('*')
      .eq('member_id', testMemberId)
      .eq('status', 'approved')
      .order('date_completed', { ascending: false })
      .limit(5);
    
    if (error1) {
      console.error('   Error:', error1);
    } else {
      console.log(`   ✅ Found ${activitiesByMember.length} activities`);
      if (activitiesByMember.length > 0) {
        console.log('   Recent activities:');
        activitiesByMember.forEach(act => {
          console.log(`   - ${act.activity_title} (${act.points} points, ${act.date_completed})`);
        });
        
        // Calculate stats
        const currentYear = new Date().getFullYear();
        let totalPoints = 0;
        let thisYearPoints = 0;
        
        activitiesByMember.forEach(activity => {
          const points = activity.points || 0;
          totalPoints += points;
          
          const activityYear = new Date(activity.date_completed).getFullYear();
          if (activityYear === currentYear) {
            thisYearPoints += points;
          }
        });
        
        console.log('\n   Statistics:');
        console.log(`   - Total Points: ${totalPoints}`);
        console.log(`   - Total Activities: ${activitiesByMember.length}`);
        console.log(`   - Points This Year (${currentYear}): ${thisYearPoints}`);
      }
    }
    
    console.log('\n========================================');
    
    // 2. Query using user_id (would fail for impersonated members)
    console.log('\n2. Query CPD activities using user_id (would fail for impersonated):');
    const { data: activitiesByUser, error: error2 } = await supabase
      .from('cpd_activities')
      .select('*')
      .eq('user_id', testMemberId)
      .eq('status', 'approved');
    
    if (error2) {
      console.error('   Error:', error2);
    } else {
      console.log(`   Found ${activitiesByUser.length} activities (should be 0 for impersonated members)`);
    }
    
    console.log('\n========================================');
    
    // 3. Check member record
    console.log('\n3. Member record details:');
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id, email, first_name, last_name, user_id')
      .eq('id', testMemberId)
      .single();
    
    if (memberError) {
      console.error('   Error:', memberError);
    } else {
      console.log('   Member:', member);
      console.log(`   Has user_id? ${member.user_id ? 'Yes' : 'No (impersonation will use member_id directly)'}`);
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testDashboardQueries();
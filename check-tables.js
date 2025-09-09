const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://english-australia-eau-supabase.lkobs5.easypanel.host';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTables() {
  const userId = 'f707f068-4e77-4f82-af47-7a5a66a4b561';
  
  try {
    console.log('Checking members table...');
    
    // Try to fetch all members
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('*')
      .limit(5);
    
    if (membersError) {
      console.error('Error fetching members:', membersError);
    } else {
      console.log('Sample members:', JSON.stringify(members, null, 2));
      console.log('Members count:', members?.length || 0);
      
      // Check if our user exists in members
      const adminMember = members?.find(m => m.user_id === userId);
      if (adminMember) {
        console.log('\nAdmin member found:', adminMember);
      } else {
        console.log('\nAdmin member NOT found with user_id:', userId);
      }
    }
    
    console.log('\n---\nChecking cpd_activities table...');
    
    // Check cpd_activities
    const { data: activities, error: activitiesError } = await supabase
      .from('cpd_activities')
      .select('*')
      .limit(5);
    
    if (activitiesError) {
      console.error('Error fetching activities:', activitiesError);
    } else {
      console.log('Sample activities:', JSON.stringify(activities, null, 2));
      console.log('Activities count:', activities?.length || 0);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkTables();
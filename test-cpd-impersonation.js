const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://english-australia-eau-supabase.lkobs5.easypanel.host';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testCPDInsertion() {
  // Use a known member ID from the list we saw earlier
  const testMemberId = '5d992cb3-7770-4713-af75-7467e57f6b09'; // Elisabetta Vannozzi
  
  console.log('Testing CPD activity insertion for member:', testMemberId);
  
  try {
    // First verify the member exists
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id, email, first_name, last_name, user_id')
      .eq('id', testMemberId)
      .single();
    
    if (memberError) {
      console.error('Error fetching member:', memberError);
      return;
    }
    
    console.log('Member found:', member);
    console.log('Member has user_id?', member.user_id ? 'Yes' : 'No');
    
    // Create test CPD activity WITHOUT user_id fields
    const activityData = {
      member_id: testMemberId,
      category_id: 14,
      category_name: 'Attend English Australia PD event',
      activity_title: 'Test Activity - Impersonation Mode',
      description: 'Testing CPD activity creation in impersonation mode',
      provider: 'Test Provider',
      date_completed: new Date().toISOString().split('T')[0],
      hours: 2,
      minutes: 30,
      points: 2.5,
      status: 'approved',
      approved_at: new Date().toISOString()
      // Note: NO user_id, NO created_by, NO approved_by
    };
    
    console.log('\nAttempting to insert activity with data:', activityData);
    
    const { data: newActivity, error: insertError } = await supabase
      .from('cpd_activities')
      .insert([activityData])
      .select()
      .single();
    
    if (insertError) {
      console.error('\n❌ Error inserting activity:', insertError);
      console.error('Error details:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint
      });
    } else {
      console.log('\n✅ Activity created successfully!');
      console.log('New activity:', newActivity);
      
      // Clean up - delete the test activity
      const { error: deleteError } = await supabase
        .from('cpd_activities')
        .delete()
        .eq('id', newActivity.id);
      
      if (deleteError) {
        console.error('Error deleting test activity:', deleteError);
      } else {
        console.log('Test activity cleaned up successfully');
      }
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testCPDInsertion();
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://english-australia-eau-supabase.lkobs5.easypanel.host';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAdminMember() {
  const userId = 'f707f068-4e77-4f82-af47-7a5a66a4b561';
  const email = 'rrzillesg@gmail.com';
  
  try {
    // Check by email
    const { data: memberByEmail, error: emailError } = await supabase
      .from('members')
      .select('*')
      .eq('email', email)
      .single();
    
    if (memberByEmail) {
      console.log('Member found by email:', {
        id: memberByEmail.id,
        email: memberByEmail.email,
        user_id: memberByEmail.user_id,
        name: memberByEmail.first_name + ' ' + memberByEmail.last_name
      });
      
      // Update the user_id if needed
      if (memberByEmail.user_id !== userId) {
        console.log('Updating user_id from', memberByEmail.user_id, 'to', userId);
        
        const { error: updateError } = await supabase
          .from('members')
          .update({ user_id: userId })
          .eq('id', memberByEmail.id);
        
        if (updateError) {
          console.error('Error updating user_id:', updateError);
        } else {
          console.log('Successfully updated user_id');
        }
      }
      
      // Update CPD activities to use this member_id
      const { error: updateActivitiesError } = await supabase
        .from('cpd_activities')
        .update({ member_id: memberByEmail.id })
        .eq('user_id', userId)
        .is('member_id', null);
      
      if (updateActivitiesError) {
        console.error('Error updating activities:', updateActivitiesError);
      } else {
        console.log('Updated CPD activities with member_id:', memberByEmail.id);
      }
    } else {
      console.log('No member found with email:', email);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkAdminMember();
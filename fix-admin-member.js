const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://english-australia-eau-supabase.lkobs5.easypanel.host';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixAdminMember() {
  const userId = 'f707f068-4e77-4f82-af47-7a5a66a4b561';
  const email = 'rrzillesg@gmail.com';
  
  try {
    // First check if member already exists
    const { data: existingMembers, error: checkError } = await supabase
      .from('members')
      .select('*')
      .eq('user_id', userId);
    
    if (existingMembers && existingMembers.length > 0) {
      console.log('Member already exists:', existingMembers[0]);
      return;
    }
    
    // Get a sample member to see the structure
    const { data: sampleMember } = await supabase
      .from('members')
      .select('*')
      .limit(1)
      .single();
    
    console.log('Sample member columns:', Object.keys(sampleMember));
    
    // Create member record with all required fields based on sample
    const newMemberData = {
      user_id: userId,
      email: email,
      first_name: 'Admin',
      last_name: 'User',
      membership_status: 'active',
      membership_type: 'standard',
      country: 'Australia',
      receive_newsletters: true,
      receive_event_notifications: true,
      display_name: 'Admin User',
      username: email,
      groups: 'Super Admin',
      is_test_member: false,
      is_editable_address: true,
      membership_start_date: '2025-01-01',
      member_created_date: new Date().toISOString()
    };
    
    // Remove any fields that don't exist in the sample
    const validFields = Object.keys(sampleMember);
    const filteredData = {};
    for (const key in newMemberData) {
      if (validFields.includes(key)) {
        filteredData[key] = newMemberData[key];
      }
    }
    
    console.log('Attempting to insert with data:', filteredData);
    
    const { data: newMember, error: createError } = await supabase
      .from('members')
      .insert(filteredData)
      .select()
      .single();
    
    if (createError) {
      console.error('Error creating member:', createError);
      return;
    }
    
    console.log('Successfully created member:', newMember);
    
    // Now update existing CPD activities to use the new member_id
    const { data: updatedActivities, error: updateError } = await supabase
      .from('cpd_activities')
      .update({ member_id: newMember.id })
      .eq('user_id', userId)
      .is('member_id', null);
    
    if (updateError) {
      console.error('Error updating activities:', updateError);
    } else {
      console.log('Updated existing CPD activities with new member_id');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

fixAdminMember();
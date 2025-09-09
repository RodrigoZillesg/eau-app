const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://english-australia-eau-supabase.lkobs5.easypanel.host';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixMemberIssue() {
  const userId = 'f707f068-4e77-4f82-af47-7a5a66a4b561';
  const email = 'rrzillesg@gmail.com';
  
  try {
    // First check if member already exists
    const { data: existingMember, error: checkError } = await supabase
      .from('members')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (existingMember) {
      console.log('Member already exists:', existingMember);
      return;
    }
    
    // If not exists, create member record
    const { data: newMember, error: createError } = await supabase
      .from('members')
      .insert({
        user_id: userId,
        email: email,
        first_name: 'Admin',
        last_name: 'User',
        institution_id: null, // Admin doesn't need institution
        membership_status: 'active',
        membership_type: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (createError) {
      console.error('Error creating member:', createError);
      return;
    }
    
    console.log('Successfully created member:', newMember);
  } catch (error) {
    console.error('Error:', error);
  }
}

fixMemberIssue();
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://english-australia-eau-supabase.lkobs5.easypanel.host';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAndFixMember() {
  const impersonatedUserId = '5d992cb3-7770-4713-af75-7467e57f6b09';
  
  console.log('Checking for member record with user_id:', impersonatedUserId);
  
  try {
    // First check if member exists
    const { data: existingMember, error: checkError } = await supabase
      .from('members')
      .select('*')
      .eq('user_id', impersonatedUserId)
      .single();
    
    if (checkError && checkError.code === 'PGRST116') {
      console.log('❌ Member record NOT found for user_id:', impersonatedUserId);
      
      // Get user details from auth.users
      const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(impersonatedUserId);
      
      if (userError) {
        console.error('Error fetching user from auth:', userError);
        return;
      }
      
      if (!user) {
        console.error('User not found in auth.users table');
        return;
      }
      
      console.log('Found user in auth.users:', {
        id: user.id,
        email: user.email,
        raw_user_meta_data: user.raw_user_meta_data
      });
      
      // Create member record
      const memberData = {
        user_id: user.id,
        email: user.email || user.raw_user_meta_data?.email || 'unknown@example.com',
        first_name: user.raw_user_meta_data?.first_name || 'Test',
        last_name: user.raw_user_meta_data?.last_name || 'Member',
        membership_number: `TEST-${Date.now()}`,
        membership_status: 'active',
        membership_type: 'standard',
        institution_id: null, // Will be set if needed
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('Creating member record with data:', memberData);
      
      const { data: newMember, error: createError } = await supabase
        .from('members')
        .insert([memberData])
        .select()
        .single();
      
      if (createError) {
        console.error('Error creating member:', createError);
      } else {
        console.log('✅ Member record created successfully:', newMember);
      }
      
    } else if (existingMember) {
      console.log('✅ Member record already exists:', existingMember);
    } else if (checkError) {
      console.error('Error checking member:', checkError);
    }
    
    // Now verify the member exists
    const { data: finalCheck, error: finalError } = await supabase
      .from('members')
      .select('id, user_id, email, first_name, last_name')
      .eq('user_id', impersonatedUserId)
      .single();
    
    if (finalCheck) {
      console.log('\n✅ FINAL VERIFICATION - Member exists:', finalCheck);
    } else {
      console.log('\n❌ FINAL VERIFICATION - Member still not found:', finalError);
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkAndFixMember();
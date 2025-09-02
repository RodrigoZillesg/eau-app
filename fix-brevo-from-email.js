const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://english-australia-eau-supabase.lkobs5.easypanel.host',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q'
);

async function fixBrevoFromEmail() {
  console.log('🔧 Corrigindo from_email para ser compatível com Brevo...\n');
  
  try {
    // Update from_email to use the Brevo username
    const { data, error } = await supabase
      .from('smtp_settings')
      .update({
        from_email: '8bbde8001@smtp-brevo.com', // Use Brevo email as from
        reply_to_email: 'rrzillesg@gmail.com'   // Keep Gmail as reply-to
      })
      .eq('enabled', true)
      .select();

    if (error) {
      console.log('❌ Erro ao atualizar:', error.message);
    } else {
      console.log('✅ From email corrigido!');
      console.log(`   From: ${data[0].from_name} <${data[0].from_email}>`);
      console.log(`   Reply-To: ${data[0].reply_to_name} <${data[0].reply_to_email}>`);
      console.log('\n🎉 Agora o sistema está 100% configurado para Brevo!');
    }
  } catch (error) {
    console.log('❌ Erro:', error.message);
  }
}

fixBrevoFromEmail().catch(console.error);
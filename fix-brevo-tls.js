const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const supabaseUrl = 'https://english-australia-eau-supabase.lkobs5.easypanel.host';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixTLSSettings() {
  try {
    // Buscar configuração existente
    const { data: existing, error: fetchError } = await supabase
      .from('smtp_settings')
      .select('*')
      .limit(1);

    if (fetchError || !existing || existing.length === 0) {
      console.error('Erro ao buscar configurações:', fetchError);
      return;
    }

    // Atualizar para usar STARTTLS (false para secure na porta 587)
    console.log('Ajustando configuração TLS para porta 587...');
    const { error: updateError } = await supabase
      .from('smtp_settings')
      .update({ 
        smtp_secure: false  // Porta 587 usa STARTTLS, não SSL direto
      })
      .eq('id', existing[0].id);

    if (updateError) {
      console.error('Erro ao atualizar:', updateError);
    } else {
      console.log('✅ Configuração TLS ajustada!');
      console.log('Porta 587 agora usando STARTTLS (smtp_secure: false)');
    }

  } catch (error) {
    console.error('Erro:', error);
  }
}

fixTLSSettings();

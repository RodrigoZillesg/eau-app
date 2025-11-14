/**
 * Script de teste para verificar geração automática de certificado após check-in
 *
 * Este script testa se o método checkInUser() gera automaticamente:
 * 1. CPD activity
 * 2. Certificado
 *
 * Após executar, verificar no banco:
 * - event_registrations.attended = TRUE
 * - event_registrations.certificate_issued = TRUE
 * - event_registrations.certificate_number != NULL
 * - event_certificates deve ter um registro
 */

import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://ypsvoxelitgceclohxfu.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlwc3ZveGVsaXRnY2VjbG9oeGZ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODcwMTc1NSwiZXhwIjoyMDc0Mjc3NzU1fQ.y_k4b4TlAev9R4TTFqHA08EjdZA-7Ymm5V1zMl-CYhA';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Registration ID para teste
const REGISTRATION_ID = 'ed599494-5348-4f69-b0b5-31f7488d6937';

async function testCheckIn() {
  console.log('🧪 Iniciando teste de check-in com geração automática de certificado...\n');

  // 1. Verificar estado ANTES
  console.log('📋 Estado ANTES do check-in:');
  const { data: before } = await supabase
    .from('event_registrations')
    .select('*, events(*)')
    .eq('id', REGISTRATION_ID)
    .single();

  console.log('  - Attended:', before.attended);
  console.log('  - Certificate Issued:', before.certificate_issued);
  console.log('  - Certificate Number:', before.certificate_number);
  console.log('  - CPD Created:', before.cpd_activity_created);
  console.log('  - Event:', before.events?.title);
  console.log('  - CPD Points:', before.events?.cpd_points);
  console.log('');

  // 2. Fazer check-in (simular)
  console.log('✅ Executando check-in...');
  const { error: updateError } = await supabase
    .from('event_registrations')
    .update({
      status: 'attended',
      attended: true,
      attendance_date: new Date().toISOString(),
      checked_in: true,
      check_in_date: new Date().toISOString(),
      check_in_method: 'manual'
    })
    .eq('id', REGISTRATION_ID);

  if (updateError) {
    console.error('❌ Erro ao fazer check-in:', updateError);
    return;
  }

  console.log('✅ Check-in realizado com sucesso!\n');

  // NOTA: A geração automática de certificado acontece no código TypeScript
  // do EventRegistrationService.checkInUser() que não podemos chamar daqui.
  // Este script apenas simula o check-in para que possamos testar depois via UI.

  // 3. Aguardar um pouco (para processos assíncronos)
  console.log('⏳ Aguardando 3 segundos para processos assíncronos...\n');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // 4. Verificar estado DEPOIS
  console.log('📋 Estado DEPOIS do check-in:');
  const { data: after } = await supabase
    .from('event_registrations')
    .select('*, events(*)')
    .eq('id', REGISTRATION_ID)
    .single();

  console.log('  - Attended:', after.attended);
  console.log('  - Certificate Issued:', after.certificate_issued);
  console.log('  - Certificate Number:', after.certificate_number);
  console.log('  - CPD Created:', after.cpd_activity_created);
  console.log('  - CPD Activity ID:', after.cpd_activity_id);
  console.log('');

  // 5. Verificar se certificado foi criado
  const { data: certificates } = await supabase
    .from('event_certificates')
    .select('*')
    .eq('registration_id', REGISTRATION_ID);

  console.log('📜 Certificados encontrados:', certificates?.length || 0);
  if (certificates && certificates.length > 0) {
    console.log('  - Certificate Number:', certificates[0].certificate_number);
    console.log('  - Issue Date:', certificates[0].issue_date);
    console.log('  - PDF Generated:', certificates[0].pdf_generated);
  }
  console.log('');

  // 6. Verificar se CPD foi criada
  const { data: cpdActivities } = await supabase
    .from('cpd_activities')
    .select('*')
    .eq('event_id', before.event_id)
    .eq('user_id', before.user_id);

  console.log('📚 Atividades CPD encontradas:', cpdActivities?.length || 0);
  if (cpdActivities && cpdActivities.length > 0) {
    console.log('  - Activity Title:', cpdActivities[0].activity_title);
    console.log('  - Status:', cpdActivities[0].status);
    console.log('  - Points:', cpdActivities[0].points);
  }
  console.log('');

  // 7. Resultado do teste
  console.log('🎯 RESULTADO DO TESTE:');
  console.log('');
  console.log('⚠️  IMPORTANTE: Este script apenas marca presença.');
  console.log('    A geração automática de certificado acontece no código TypeScript.');
  console.log('    Para testar completamente, é necessário usar a UI do sistema.');
  console.log('');
  console.log('📝 Próximos passos:');
  console.log('   1. Fazer login no sistema como admin');
  console.log('   2. Usar função de check-in via UI (ou console.log no código)');
  console.log('   3. Verificar se certificado foi gerado automaticamente');
}

// Executar teste
testCheckIn()
  .then(() => {
    console.log('✅ Teste concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro no teste:', error);
    process.exit(1);
  });

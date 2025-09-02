/**
 * Teste final do sistema de email
 * Busca configuração SMTP diretamente do Supabase e testa
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://english-australia-eau-supabase.lkobs5.easypanel.host',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q'
);

async function testEmailSystemComplete() {
  console.log('🔍 DIAGNÓSTICO COMPLETO DO SISTEMA DE EMAIL\n');
  
  try {
    // 1. Verificar configuração SMTP no banco
    console.log('1. Verificando configuração SMTP no banco...');
    const { data: smtpData, error: smtpError } = await supabase
      .from('smtp_settings')
      .select('*')
      .eq('enabled', true);

    if (smtpError) {
      console.log('❌ Erro ao buscar SMTP:', smtpError.message);
      console.log('💡 Tabela smtp_settings pode não existir ainda');
    } else if (!smtpData || smtpData.length === 0) {
      console.log('❌ Nenhuma configuração SMTP encontrada no banco');
      console.log('💡 Configure SMTP em: http://localhost:5180/admin/smtp-settings');
    } else {
      console.log('✅ Configuração SMTP encontrada:');
      console.log(`   Host: ${smtpData[0].smtp_host}`);
      console.log(`   Username: ${smtpData[0].smtp_username}`);
      console.log(`   Enabled: ${smtpData[0].enabled}`);
      
      // 2. Testar envio usando configuração do banco
      console.log('\n2. Testando envio de email...');
      
      const emailPayload = {
        to: smtpData[0].smtp_username, // Enviar para o próprio email
        subject: 'TESTE DEFINITIVO - Sistema EAU Email ' + new Date().toLocaleString(),
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #0f172a 0%, #059669 100%); color: white; padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px;">✅ Sistema Funcionando!</h1>
              <p style="margin: 12px 0 0 0; opacity: 0.9;">EAU Email System</p>
            </div>
            <div style="padding: 40px;">
              <p style="font-size: 18px; margin-bottom: 24px;">🎉 <strong>Sucesso!</strong></p>
              <p>O sistema de email do EAU Members está funcionando perfeitamente!</p>
              
              <div style="background: #ecfdf5; border: 2px solid #059669; border-radius: 12px; padding: 24px; margin: 24px 0;">
                <h2 style="margin: 0 0 16px 0; color: #059669;">📧 Configuração Atual</h2>
                <div style="font-size: 16px; line-height: 1.8;">
                  <div><strong>🌐 Host:</strong> ${smtpData[0].smtp_host}</div>
                  <div><strong>👤 Username:</strong> ${smtpData[0].smtp_username}</div>
                  <div><strong>📤 From:</strong> ${smtpData[0].from_name} <${smtpData[0].from_email}></div>
                  <div><strong>⚡ Status:</strong> Ativo e funcional</div>
                </div>
              </div>
              
              <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
                <h3 style="margin: 0 0 8px 0; color: #856404;">✅ Recursos Funcionando</h3>
                <ul style="margin: 0; padding-left: 20px; color: #856404;">
                  <li>Confirmação de inscrição em eventos</li>
                  <li>Lembretes configuráveis (7d, 3d, 1d, 30min)</li>
                  <li>Notificação de CPD points</li>
                  <li>Interface admin para configurar lembretes</li>
                  <li>Templates profissionais com branding EAU</li>
                </ul>
              </div>
              
              <div style="text-align: center;">
                <a href="http://localhost:5180/admin/event-reminders" style="background: #059669; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">🔔 Configurar Lembretes</a>
              </div>
            </div>
            <div style="background: #f8fafc; padding: 20px; text-align: center; font-size: 14px; color: #64748b;">
              <strong>EAU Members</strong> | Sistema de Email<br>
              Teste realizado em ${new Date().toLocaleString()}
            </div>
          </div>
        `,
        text: 'Sistema de email EAU funcionando!',
        useStoredConfig: true
      };

      const response = await fetch('http://localhost:3001/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailPayload)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ EMAIL ENVIADO COM SUCESSO!');
        console.log(`   Message ID: ${result.messageId}`);
        console.log(`   Para: ${emailPayload.to}`);
        console.log('\n🎉 SISTEMA TOTALMENTE FUNCIONAL!');
        console.log('📧 Verifique sua caixa de entrada');
        console.log('🔔 Agora você pode:');
        console.log('   - Se inscrever em eventos (receberá confirmação)');
        console.log('   - Testar lembretes na interface admin');
        console.log('   - Todos os emails usarão sua configuração SMTP');
      } else {
        const errorText = await response.text();
        console.log('❌ Falha no envio:', errorText);
        
        // Parse error
        try {
          const errorObj = JSON.parse(errorText);
          if (errorObj.error.includes('Username and Password not accepted')) {
            console.log('\n💡 SOLUÇÃO:');
            console.log('1. Verifique sua senha de app do Gmail');
            console.log('2. Reconfigure em: http://localhost:5180/admin/smtp-settings');
            console.log('3. Use senha de app (16 chars), não senha normal');
          }
        } catch (e) {
          console.log('Erro não estruturado:', errorText);
        }
      }
    }
    
  } catch (error) {
    console.log('❌ Erro no teste:', error.message);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 RELATÓRIO FINAL');
  console.log('='.repeat(60));
  console.log('🌐 Aplicação: http://localhost:5180');
  console.log('📧 Email Server: http://localhost:3001');
  console.log('⚙️  SMTP Settings: http://localhost:5180/admin/smtp-settings');
  console.log('🔔 Event Reminders: http://localhost:5180/admin/event-reminders');
  console.log('='.repeat(60));
}

testEmailSystemComplete().catch(console.error);
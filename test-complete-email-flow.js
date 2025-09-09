/**
 * TESTE COMPLETO DO SISTEMA DE EMAILS - FLUXO REALISTA
 * 
 * Este script simula um fluxo real de eventos e emails:
 * 1. Cria um evento que começa em 1 hora
 * 2. Registra você no evento (dispara email de confirmação)
 * 3. Cria reminders com horários realistas mas processamento imediato
 * 4. Monitora o status de envio de todos os emails
 * 
 * ANTES DE EXECUTAR:
 * 1. Certifique-se que o backend está rodando (porta 3001)
 * 2. Substitua YOUR_USER_ID pelo seu ID real do Supabase
 * 3. Substitua YOUR_EMAIL pelo seu email real
 */

const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

// Configurações
const SUPABASE_URL = 'https://english-australia-eau-supabase.lkobs5.easypanel.host';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';
const BACKEND_URL = 'http://localhost:3001';

// CONFIGURAR AQUI - Pegue seu User ID do Supabase
const YOUR_USER_ID = 'f707f068-4e77-4f82-af47-7a5a66a4b561'; // Substitua pelo seu ID
const YOUR_EMAIL = 'rrzillesg@gmail.com'; // Seu email real

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Cores para o console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const types = {
    success: `${colors.green}✅`,
    error: `${colors.red}❌`,
    warning: `${colors.yellow}⚠️`,
    info: `${colors.blue}ℹ️`,
    step: `${colors.cyan}▶️`,
    email: `${colors.magenta}📧`
  };
  
  console.log(`${types[type]} ${colors.bright}[${timestamp}]${colors.reset} ${message}`);
}

function section(title) {
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.bright}${colors.cyan}${title}${colors.reset}`);
  console.log('='.repeat(60));
}

async function checkBackendHealth() {
  try {
    const response = await axios.get(`${BACKEND_URL}/health`);
    return response.data.status === 'healthy';
  } catch (error) {
    return false;
  }
}

async function cleanup(eventId = null) {
  log('Limpando dados de teste anteriores...', 'info');
  
  try {
    // Limpar eventos de teste antigos
    const { data: oldEvents } = await supabase
      .from('events')
      .select('id')
      .like('slug', 'teste-emails-%');
    
    if (oldEvents && oldEvents.length > 0) {
      for (const event of oldEvents) {
        // Limpar reminders
        await supabase
          .from('event_reminder_jobs')
          .delete()
          .eq('event_id', event.id);
        
        // Limpar registrations
        await supabase
          .from('event_registrations')
          .delete()
          .eq('event_id', event.id);
        
        // Limpar evento
        await supabase
          .from('events')
          .delete()
          .eq('id', event.id);
      }
      log(`${oldEvents.length} eventos de teste antigos removidos`, 'success');
    }
  } catch (error) {
    log('Erro ao limpar dados antigos: ' + error.message, 'warning');
  }
}

async function runCompleteEmailTest() {
  section('TESTE COMPLETO DO SISTEMA DE EMAILS');
  
  try {
    // 1. VERIFICAR BACKEND
    log('Verificando se o backend está rodando...', 'step');
    const backendHealthy = await checkBackendHealth();
    
    if (!backendHealthy) {
      log('Backend não está respondendo em http://localhost:3001', 'error');
      log('Por favor, inicie o backend com: cd eau-backend && npm run dev', 'warning');
      process.exit(1);
    }
    log('Backend está rodando!', 'success');

    // 2. LIMPAR DADOS ANTIGOS
    await cleanup();

    // 3. ATIVAR TEST MODE
    section('CONFIGURAÇÃO DO TEST MODE');
    log('Ativando Test Mode para redirecionar emails...', 'step');
    
    const { data: smtpSettings } = await supabase
      .from('smtp_settings')
      .select('*')
      .limit(1);

    if (!smtpSettings || smtpSettings.length === 0) {
      log('Configurações SMTP não encontradas!', 'error');
      process.exit(1);
    }

    await supabase
      .from('smtp_settings')
      .update({
        test_mode: true,
        test_email: YOUR_EMAIL
      })
      .eq('id', smtpSettings[0].id);
    
    log(`Test Mode ATIVADO! Todos emails serão enviados para: ${YOUR_EMAIL}`, 'success');

    // 4. CRIAR EVENTO DE TESTE
    section('CRIANDO EVENTO DE TESTE');
    
    const eventStartTime = new Date();
    eventStartTime.setHours(eventStartTime.getHours() + 1); // Evento em 1 hora
    
    const eventData = {
      title: `🧪 TESTE COMPLETO - ${new Date().toLocaleString('pt-BR')}`,
      slug: 'teste-emails-' + Date.now(),
      description: `
        <h2>Evento de Teste do Sistema de Emails</h2>
        <p>Este é um evento criado automaticamente para testar o sistema completo de emails.</p>
        <ul>
          <li>Email de confirmação de inscrição</li>
          <li>Reminder de 7 dias</li>
          <li>Reminder de 3 dias</li>
          <li>Reminder de 1 dia</li>
          <li>Reminder de 30 minutos</li>
          <li>Reminder de evento ao vivo</li>
        </ul>
      `,
      start_date: eventStartTime.toISOString(),
      end_date: new Date(eventStartTime.getTime() + 7200000).toISOString(), // +2 horas
      location_type: 'hybrid',
      venue_name: 'Centro de Convenções Virtual',
      address_line1: '123 Test Street',
      city: 'Sydney',
      state: 'NSW',
      postal_code: '2000',
      country: 'Australia',
      virtual_link: 'https://zoom.us/j/123456789',
      capacity: 100,
      status: 'published',
      visibility: 'public',
      featured: false,
      cpd_points: 2,
      cpd_category: 'professional_development',
      member_price_cents: 0,
      non_member_price_cents: 0,
      waitlist_enabled: false,
      allow_guests: false,
      max_guests_per_registration: 0,
      requires_approval: false,
      show_attendee_list: false,
      created_by: YOUR_USER_ID
    };

    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert(eventData)
      .select()
      .single();

    if (eventError) {
      log('Erro ao criar evento: ' + eventError.message, 'error');
      process.exit(1);
    }

    log(`Evento criado: "${event.title}"`, 'success');
    log(`ID do evento: ${event.id}`, 'info');
    log(`Horário de início: ${new Date(event.start_date).toLocaleString('pt-BR')}`, 'info');

    // 5. CRIAR INSCRIÇÃO
    section('CRIANDO INSCRIÇÃO NO EVENTO');
    
    const { data: registration, error: regError } = await supabase
      .from('event_registrations')
      .insert({
        event_id: event.id,
        user_id: YOUR_USER_ID,
        status: 'confirmed',
        registration_type: 'standard',
        payment_status: 'completed',
        payment_amount: 0,
        is_guest: false,
        attended: false,
        checked_in: false,
        certificate_issued: false,
        cpd_activity_created: false,
        reminder_email_sent: false
      })
      .select()
      .single();

    if (regError) {
      log('Erro ao criar inscrição: ' + regError.message, 'error');
      await cleanup(event.id);
      process.exit(1);
    }

    log('Inscrição criada com sucesso!', 'success');
    log('📧 EMAIL #1: Você deve receber o EMAIL DE CONFIRMAÇÃO em breve...', 'email');

    // 6. CRIAR REMINDERS ESCALONADOS
    section('CRIANDO REMINDERS PARA TESTE');
    
    const now = new Date();
    const reminders = [
      {
        registration_id: registration.id,
        event_id: event.id,
        user_id: YOUR_USER_ID,
        reminder_type: '7_days',
        scheduled_for: new Date(now.getTime() + 10000).toISOString(), // +10 segundos
        status: 'pending',
        attempts: 0
      },
      {
        registration_id: registration.id,
        event_id: event.id,
        user_id: YOUR_USER_ID,
        reminder_type: '3_days',
        scheduled_for: new Date(now.getTime() + 20000).toISOString(), // +20 segundos
        status: 'pending',
        attempts: 0
      },
      {
        registration_id: registration.id,
        event_id: event.id,
        user_id: YOUR_USER_ID,
        reminder_type: '1_day',
        scheduled_for: new Date(now.getTime() + 30000).toISOString(), // +30 segundos
        status: 'pending',
        attempts: 0
      },
      {
        registration_id: registration.id,
        event_id: event.id,
        user_id: YOUR_USER_ID,
        reminder_type: '30_min',
        scheduled_for: new Date(now.getTime() + 40000).toISOString(), // +40 segundos
        status: 'pending',
        attempts: 0
      },
      {
        registration_id: registration.id,
        event_id: event.id,
        user_id: YOUR_USER_ID,
        reminder_type: 'live',
        scheduled_for: new Date(now.getTime() + 50000).toISOString(), // +50 segundos
        status: 'pending',
        attempts: 0
      }
    ];

    const { error: reminderError } = await supabase
      .from('event_reminder_jobs')
      .insert(reminders);

    if (reminderError) {
      log('Erro ao criar reminders: ' + reminderError.message, 'error');
      await cleanup(event.id);
      process.exit(1);
    }

    log('5 reminders criados e agendados!', 'success');

    // 7. MOSTRAR CRONOGRAMA
    section('📅 CRONOGRAMA DE EMAILS');
    console.log(`
    ${colors.bright}Sequência de emails que você receberá:${colors.reset}
    
    ${colors.green}IMEDIATO${colors.reset}
    └─ 📧 Email de confirmação de inscrição
    
    ${colors.yellow}EM 10 SEGUNDOS${colors.reset}
    └─ 📧 Reminder "7 dias antes"
    
    ${colors.yellow}EM 20 SEGUNDOS${colors.reset}
    └─ 📧 Reminder "3 dias antes"
    
    ${colors.yellow}EM 30 SEGUNDOS${colors.reset}
    └─ 📧 Reminder "1 dia antes"
    
    ${colors.yellow}EM 40 SEGUNDOS${colors.reset}
    └─ 📧 Reminder "30 minutos antes"
    
    ${colors.red}EM 50 SEGUNDOS${colors.reset}
    └─ 📧 Reminder "WE'RE LIVE!"
    `);

    // 8. MONITORAR STATUS
    section('MONITORANDO ENVIO DOS EMAILS');
    log('O backend processará os reminders a cada minuto...', 'info');
    log('Aguardando processamento dos emails...', 'step');

    // Monitorar por 2 minutos
    let checkCount = 0;
    const maxChecks = 24; // 2 minutos (24 x 5 segundos)
    
    const monitorInterval = setInterval(async () => {
      checkCount++;
      
      const { data: jobStatus } = await supabase
        .from('event_reminder_jobs')
        .select('reminder_type, status, sent_at')
        .eq('event_id', event.id)
        .order('scheduled_for');

      const { data: emailLogs } = await supabase
        .from('email_logs')
        .select('subject, status, created_at')
        .or(`subject.ilike.%${event.title}%,subject.ilike.%TEST MODE%`)
        .order('created_at', { ascending: false })
        .limit(10);

      // Limpar console e mostrar status atualizado
      console.clear();
      section('📊 STATUS EM TEMPO REAL');
      
      console.log(`${colors.bright}Reminders:${colors.reset}`);
      jobStatus.forEach(job => {
        const icon = job.status === 'sent' ? '✅' : job.status === 'failed' ? '❌' : '⏳';
        const color = job.status === 'sent' ? colors.green : job.status === 'failed' ? colors.red : colors.yellow;
        console.log(`  ${icon} ${color}${job.reminder_type}${colors.reset}: ${job.status} ${job.sent_at ? `(${new Date(job.sent_at).toLocaleTimeString('pt-BR')})` : ''}`);
      });

      console.log(`\n${colors.bright}Últimos Emails Enviados:${colors.reset}`);
      if (emailLogs && emailLogs.length > 0) {
        emailLogs.slice(0, 6).forEach(log => {
          const icon = log.status === 'sent' ? '📧' : '❌';
          const time = new Date(log.created_at).toLocaleTimeString('pt-BR');
          console.log(`  ${icon} [${time}] ${log.subject.substring(0, 50)}...`);
        });
      } else {
        console.log('  Aguardando emails...');
      }

      // Verificar se todos foram enviados
      const allSent = jobStatus.filter(j => j.status === 'sent').length;
      const total = jobStatus.length;
      
      console.log(`\n${colors.bright}Progresso: ${allSent}/${total} reminders enviados${colors.reset}`);
      console.log(`${colors.cyan}Tempo decorrido: ${checkCount * 5} segundos${colors.reset}`);

      if (allSent === total && total > 0) {
        clearInterval(monitorInterval);
        section('✅ TESTE COMPLETO!');
        log(`Todos os ${total} reminders foram enviados com sucesso!`, 'success');
        log(`Total de emails esperados: ${total + 1} (incluindo confirmação)`, 'info');
        
        // Mostrar comandos SQL para limpeza
        section('LIMPEZA (OPCIONAL)');
        console.log('Para limpar os dados de teste, execute estes comandos SQL no Supabase:\n');
        console.log(`${colors.yellow}-- Limpar reminders${colors.reset}`);
        console.log(`DELETE FROM event_reminder_jobs WHERE event_id = '${event.id}';`);
        console.log(`${colors.yellow}-- Limpar inscrições${colors.reset}`);
        console.log(`DELETE FROM event_registrations WHERE event_id = '${event.id}';`);
        console.log(`${colors.yellow}-- Limpar evento${colors.reset}`);
        console.log(`DELETE FROM events WHERE id = '${event.id}';`);
        console.log(`${colors.yellow}-- Desativar Test Mode${colors.reset}`);
        console.log(`UPDATE smtp_settings SET test_mode = false WHERE id = '${smtpSettings[0].id}';`);
        
        process.exit(0);
      }

      if (checkCount >= maxChecks) {
        clearInterval(monitorInterval);
        log('Tempo limite atingido. Verifique o backend e os logs.', 'warning');
        process.exit(1);
      }
    }, 5000); // Verificar a cada 5 segundos

  } catch (error) {
    log('Erro geral: ' + error.message, 'error');
    console.error(error);
    process.exit(1);
  }
}

// EXECUTAR O TESTE
console.clear();
console.log(`${colors.bright}${colors.cyan}
╔══════════════════════════════════════════════════════════╗
║         TESTE COMPLETO DO SISTEMA DE EMAILS             ║
║                                                          ║
║  Este script irá:                                        ║
║  • Ativar o Test Mode                                   ║
║  • Criar um evento de teste                             ║
║  • Registrar você no evento                             ║
║  • Criar 5 reminders escalonados                        ║
║  • Monitorar o envio em tempo real                      ║
║                                                          ║
║  REQUISITOS:                                             ║
║  • Backend rodando em http://localhost:3001             ║
║  • Configurações SMTP válidas no banco                  ║
║  • User ID e email configurados no script               ║
╚══════════════════════════════════════════════════════════╝
${colors.reset}`);

console.log(`\n${colors.yellow}Configurado para enviar emails para: ${YOUR_EMAIL}${colors.reset}`);
console.log(`${colors.yellow}User ID: ${YOUR_USER_ID}${colors.reset}\n`);

// Aguardar confirmação
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

readline.question(`${colors.bright}Pressione ENTER para iniciar o teste ou CTRL+C para cancelar...${colors.reset}`, () => {
  readline.close();
  runCompleteEmailTest();
});
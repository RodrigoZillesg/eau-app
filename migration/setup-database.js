const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

// Configurações do Supabase
const SUPABASE_URL = 'https://ypsvoxelitgceclohxfu.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlwc3ZveGVsaXRnY2VjbG9oeGZ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODcwMTc1NSwiZXhwIjoyMDc0Mjc3NzU1fQ.y_k4b4TlAev9R4TTFqHA08EjdZA-7Ymm5V1zMl-CYhA';

// Criar cliente Supabase com service role (tem permissão total)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  db: {
    schema: 'public'
  },
  auth: {
    persistSession: false
  }
});

async function executeSqlFile(filename) {
  try {
    console.log(`\n📄 Executando ${filename}...`);

    // Ler o arquivo SQL
    const sqlContent = await fs.readFile(path.join(__dirname, filename), 'utf8');

    // Dividir em comandos individuais (separados por ponto e vírgula)
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;

    for (const command of commands) {
      try {
        // Pular comandos vazios ou apenas com comentários
        if (!command || command.startsWith('--')) continue;

        // Executar comando
        const { data, error } = await supabase.rpc('exec_sql', {
          query: command + ';'
        }).single();

        if (error) {
          // Tentar executar diretamente se RPC falhar
          const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'apikey': SUPABASE_SERVICE_KEY,
              'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: command + ';' })
          });

          if (!response.ok) {
            console.error(`❌ Erro: ${command.substring(0, 50)}...`);
            errorCount++;
          } else {
            successCount++;
            process.stdout.write('.');
          }
        } else {
          successCount++;
          process.stdout.write('.');
        }
      } catch (err) {
        console.error(`❌ Erro no comando: ${command.substring(0, 50)}...`);
        console.error(err.message);
        errorCount++;
      }
    }

    console.log(`\n✅ ${filename}: ${successCount} comandos executados com sucesso, ${errorCount} erros`);
    return { success: successCount, errors: errorCount };

  } catch (error) {
    console.error(`❌ Erro ao ler arquivo ${filename}:`, error.message);
    return { success: 0, errors: 1 };
  }
}

async function setupDatabase() {
  console.log('🚀 Iniciando configuração do banco de dados Supabase Cloud...\n');

  const files = [
    '01_create_tables.sql',
    '02_create_rls_policies.sql',
    '03_create_storage_buckets.sql'
  ];

  let totalSuccess = 0;
  let totalErrors = 0;

  for (const file of files) {
    const result = await executeSqlFile(file);
    totalSuccess += result.success;
    totalErrors += result.errors;
  }

  console.log('\n========================================');
  console.log('📊 RESUMO DA MIGRAÇÃO');
  console.log('========================================');
  console.log(`✅ Comandos executados com sucesso: ${totalSuccess}`);
  console.log(`❌ Erros encontrados: ${totalErrors}`);

  if (totalErrors === 0) {
    console.log('\n🎉 Migração concluída com sucesso!');
    console.log('\n📝 Próximos passos:');
    console.log('1. Criar usuário admin no Dashboard do Supabase');
    console.log('2. Criar storage buckets no Dashboard');
    console.log('3. Atualizar variáveis de ambiente');
    console.log('4. Testar a aplicação');
  } else {
    console.log('\n⚠️ Migração concluída com alguns erros.');
    console.log('Verifique os erros acima e execute correções manualmente se necessário.');
  }
}

// Executar
setupDatabase().catch(console.error);
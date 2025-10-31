import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const TestLogin: React.FC = () => {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testDirectLogin = async () => {
    setLoading(true);
    setResult('');

    try {
      // Conectar diretamente ao Supabase Cloud
      const CLOUD_URL = 'https://ypsvoxelitgceclohxfu.supabase.co';
      const CLOUD_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlwc3ZveGVsaXRnY2VjbG9oeGZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MDE3NTUsImV4cCI6MjA3NDI3Nzc1NX0.-NO0-hrp4GajpOK9WnryqIeyEtS9iUiv03qkp9ScL9w';

      const supabase = createClient(CLOUD_URL, CLOUD_ANON_KEY);

      setResult('🔍 Conectando ao Supabase Cloud...\n');

      // Fazer login
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'dev@platty.tech',
        password: 'wSZ72i-M7X[bV)Hdu%Qi0V03hf8f%6'
      });

      if (authError) {
        setResult(prev => prev + `❌ Erro no login: ${authError.message}\n`);
        return;
      }

      setResult(prev => prev + `✅ Login funcionou!\n`);
      setResult(prev => prev + `   User: ${authData.user?.email}\n`);
      setResult(prev => prev + `   ID: ${authData.user?.id}\n\n`);

      // Buscar dados do member
      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('*')
        .eq('email', 'dev@platty.tech')
        .single();

      if (memberError) {
        setResult(prev => prev + `⚠️ Erro ao buscar member: ${memberError.message}\n`);
      } else {
        setResult(prev => prev + `✅ Member encontrado:\n`);
        setResult(prev => prev + `   Nome: ${member.first_name} ${member.last_name}\n`);
        setResult(prev => prev + `   Tipo: ${member.user_type}\n`);
        setResult(prev => prev + `   Status: ${member.membership_status}\n\n`);
      }

      setResult(prev => prev + `🎉 MIGRAÇÃO PARA SUPABASE CLOUD FUNCIONOU!\n`);
      setResult(prev => prev + `\n🔧 Próximo passo: Depurar por que o sistema de login da aplicação não funciona.\n`);

      // Redirecionar para dashboard se tudo funcionou
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 3000);

    } catch (error: any) {
      setResult(prev => prev + `❌ Erro inesperado: ${error.message}\n`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-900">
          🧪 Teste de Login Direto
        </h1>
        <p className="text-sm text-gray-600 mb-6 text-center">
          Este é um teste para verificar se a migração para o Supabase Cloud funcionou.
        </p>

        <button
          onClick={testDirectLogin}
          disabled={loading}
          className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Testando...' : 'Testar Login Direto no Cloud'}
        </button>

        {result && (
          <div className="mt-6 p-4 bg-gray-100 rounded-md">
            <pre className="text-sm text-gray-800 whitespace-pre-wrap">
              {result}
            </pre>
          </div>
        )}

        <div className="mt-4 text-center">
          <a
            href="/login"
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            ← Voltar para login normal
          </a>
        </div>
      </div>
    </div>
  );
};

export default TestLogin;
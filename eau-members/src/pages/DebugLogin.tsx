import React, { useState } from 'react';
import { supabase } from '../lib/supabase/client';
import { AuthService } from '../lib/supabase/auth';

const DebugLogin: React.FC = () => {
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (msg: string) => {
    setResults(prev => [...prev, msg]);
    console.log(msg);
  };

  const runTests = async () => {
    setLoading(true);
    setResults([]);

    try {
      // Test 1: Verificar configuração do cliente
      addResult('🔍 Test 1: Verificando configuração do cliente Supabase...');
      const url = (supabase as any).supabaseUrl || 'URL não disponível';
      const key = (supabase as any).supabaseKey ? 'Key presente' : 'Key ausente';
      addResult(`   URL: ${url}`);
      addResult(`   Key: ${key}`);

      // Test 2: Tentar login direto com supabase
      addResult('\n🔍 Test 2: Login direto com supabase.auth.signInWithPassword...');
      const { data: directAuth, error: directError } = await supabase.auth.signInWithPassword({
        email: 'dev@platty.tech',
        password: 'wSZ72i-M7X[bV)Hdu%Qi0V03hf8f%6'
      });

      if (directError) {
        addResult(`   ❌ Erro: ${directError.message}`);
        addResult(`   Código: ${directError.code}`);
        addResult(`   Status: ${directError.status}`);
      } else if (directAuth?.user) {
        addResult(`   ✅ Login direto funcionou!`);
        addResult(`   User: ${directAuth.user.email}`);
      }

      // Test 3: Tentar com AuthService
      addResult('\n🔍 Test 3: Login via AuthService.signInWithRoles...');
      const result = await AuthService.signInWithRoles('dev@platty.tech', 'wSZ72i-M7X[bV)Hdu%Qi0V03hf8f%6');

      if (result.error) {
        addResult(`   ❌ Erro: ${result.error.message}`);
      } else if (result.user) {
        addResult(`   ✅ Login via AuthService funcionou!`);
        addResult(`   User: ${result.user.email}`);
        addResult(`   Roles: ${result.roles.join(', ')}`);
      }

      // Test 4: Verificar se há erro de CORS ou rede
      addResult('\n🔍 Test 4: Verificando conexão com Supabase Cloud...');
      const testUrl = 'https://ypsvoxelitgceclohxfu.supabase.co/auth/v1/health';
      try {
        const response = await fetch(testUrl);
        addResult(`   Status HTTP: ${response.status}`);
        if (response.ok) {
          addResult(`   ✅ Conexão com Supabase Cloud OK`);
        } else {
          addResult(`   ⚠️ Resposta inesperada do servidor`);
        }
      } catch (fetchError: any) {
        addResult(`   ❌ Erro de conexão: ${fetchError.message}`);
      }

      // Test 5: Verificar localStorage
      addResult('\n🔍 Test 5: Verificando localStorage...');
      const storageKeys = Object.keys(localStorage).filter(k => k.includes('supabase'));
      addResult(`   Chaves Supabase no localStorage: ${storageKeys.length}`);
      storageKeys.forEach(key => {
        addResult(`   - ${key}`);
      });

    } catch (error: any) {
      addResult(`\n❌ Erro inesperado: ${error.message}`);
    } finally {
      setLoading(false);
      addResult('\n✅ Testes concluídos');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold mb-6">🔧 Debug de Login</h1>

          <button
            onClick={runTests}
            disabled={loading}
            className="mb-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Executando testes...' : 'Executar Testes de Login'}
          </button>

          {results.length > 0 && (
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
              <pre className="whitespace-pre-wrap">
                {results.join('\n')}
              </pre>
            </div>
          )}

          <div className="mt-6 flex gap-4">
            <a href="/login" className="text-blue-600 hover:underline">
              ← Voltar para Login Normal
            </a>
            <a href="/test-login" className="text-blue-600 hover:underline">
              → Ir para Test Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugLogin;
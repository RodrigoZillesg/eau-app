import { createClient } from '@supabase/supabase-js'
import type { Database } from '../../types/supabase'

// FORÇANDO USO DO SUPABASE CLOUD - TEMPORÁRIO ATÉ LIMPAR CACHE DO VITE
const supabaseUrl = 'https://ypsvoxelitgceclohxfu.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlwc3ZveGVsaXRnY2VjbG9oeGZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MDE3NTUsImV4cCI6MjA3NDI3Nzc1NX0.-NO0-hrp4GajpOK9WnryqIeyEtS9iUiv03qkp9ScL9w'

// Production mode - using configured Supabase instance

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'sb-ypsvoxelitgceclohxfu-auth-token',
    storage: window.localStorage
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})
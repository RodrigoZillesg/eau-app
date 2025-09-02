-- Script para desabilitar RLS na tabela event_reminders
-- Execute este script no Supabase SQL Editor

-- Desabilitar RLS completamente para permitir todas as operações
ALTER TABLE event_reminders DISABLE ROW LEVEL SECURITY;

-- Mensagem de confirmação
SELECT 'RLS desabilitado para event_reminders. Todos os usuários autenticados podem agora criar reminders.' as message;
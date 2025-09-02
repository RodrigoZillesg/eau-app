-- Configurar pg_cron para processar reminders automaticamente
-- Execute este SQL no seu banco Supabase

-- 1. Primeiro, certifique-se que pg_cron está habilitado
-- (isso já vem habilitado no Supabase por padrão)

-- 2. Agendar o processamento de reminders a cada 5 minutos
SELECT cron.schedule(
  'process-event-reminders',        -- Nome do job
  '*/5 * * * *',                   -- A cada 5 minutos
  $$
    SELECT net.http_post(
      url := 'https://your-project-ref.supabase.co/functions/v1/process-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || 'YOUR_ANON_KEY'
      ),
      body := jsonb_build_object(
        'triggered_by', 'pg_cron',
        'timestamp', now()
      ),
      timeout_milliseconds := 30000  -- 30 segundos timeout
    ) as request_id;
  $$
);

-- 3. Verificar se o job foi criado
SELECT * FROM cron.job WHERE jobname = 'process-event-reminders';

-- 4. Para ver o histórico de execuções
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'process-event-reminders')
ORDER BY start_time DESC 
LIMIT 10;

-- 5. Para desabilitar o job (se necessário)
-- SELECT cron.unschedule('process-event-reminders');

-- 6. Para recriar com configurações diferentes, desabilite primeiro e recrie
-- SELECT cron.unschedule('process-event-reminders');
-- -- Depois execute novamente o comando SELECT cron.schedule acima

/* INSTRUÇÕES PARA PRODUÇÃO:

1. Substitua 'your-project-ref' pela sua URL real do Supabase
2. Substitua 'YOUR_ANON_KEY' pela sua chave anon real
3. Deploy da Edge Function: supabase functions deploy process-reminders
4. Execute este SQL no SQL Editor do dashboard Supabase
5. Teste com: SELECT cron.job_run_details para ver se está executando

VANTAGENS desta abordagem:
✅ Zero custos extras - usa infraestrutura Supabase
✅ Altamente confiável - pg_cron é enterprise-grade
✅ Auto-scaling - Edge Functions escalam automaticamente
✅ Monitoramento integrado - vê execuções no dashboard
✅ Zero manutenção de servidor

*/
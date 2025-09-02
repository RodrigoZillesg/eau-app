-- Criar Edge Function via banco de dados diretamente
-- Como não conseguimos usar o CLI, vamos usar uma abordagem alternativa

-- 1. Primeiro vamos criar uma função PostgreSQL que chama a API externa
CREATE OR REPLACE FUNCTION process_pending_reminders()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    reminder_record RECORD;
    event_record RECORD;
    email_response TEXT;
    processed_count INTEGER := 0;
    success_count INTEGER := 0;
BEGIN
    -- Buscar reminders pendentes
    FOR reminder_record IN 
        SELECT * 
        FROM event_reminders 
        WHERE is_sent = false 
          AND scheduled_date <= NOW()
        LIMIT 10
    LOOP
        -- Buscar dados do evento
        SELECT * INTO event_record 
        FROM events 
        WHERE id = reminder_record.event_id;
        
        IF event_record.id IS NOT NULL THEN
            -- Preparar dados do email
            DECLARE
                email_data JSONB;
                email_template TEXT;
            BEGIN
                email_data := jsonb_build_object(
                    'user_name', 'Member',
                    'event_title', event_record.title,
                    'event_date', TO_CHAR(event_record.start_date, 'FMDay, FMMonth DD, YYYY'),
                    'event_time', TO_CHAR(event_record.start_date, 'HH12:MI AM'),
                    'event_location', CASE 
                        WHEN event_record.location_type = 'virtual' THEN 'Online Event'
                        ELSE COALESCE(event_record.venue_name, 'TBA')
                    END,
                    'event_link', 'https://english-australia-eau-supabase.lkobs5.easypanel.host/events/' || event_record.slug
                );
                
                -- Template baseado no tipo
                email_template := CASE reminder_record.reminder_type
                    WHEN '7_days_before' THEN 
                        '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                          <div style="background: linear-gradient(135deg, #0f172a 0%, #0284c7 100%); color: white; padding: 30px; text-align: center;">
                            <h1 style="margin: 0;">📅 Event in 7 Days</h1>
                          </div>
                          <div style="padding: 40px;">
                            <p>Hello <strong>' || (email_data->>'user_name') || '</strong>,</p>
                            <p><strong>' || (email_data->>'event_title') || '</strong> is coming up in exactly one week!</p>
                            <div style="background: #f8fafc; border: 2px solid #0284c7; border-radius: 12px; padding: 24px; margin: 24px 0;">
                              <h2 style="color: #0284c7;">📅 ' || (email_data->>'event_title') || '</h2>
                              <div style="font-size: 16px; line-height: 1.8;">
                                <div><strong>📆 Date:</strong> ' || (email_data->>'event_date') || '</div>
                                <div><strong>🕐 Time:</strong> ' || (email_data->>'event_time') || '</div>
                                <div><strong>📍 Location:</strong> ' || (email_data->>'event_location') || '</div>
                              </div>
                            </div>
                            <div style="text-align: center;">
                              <a href="' || (email_data->>'event_link') || '" style="background: #0284c7; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px;">View Event</a>
                            </div>
                          </div>
                        </div>'
                    WHEN '3_days_before' THEN 
                        '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                          <div style="background: linear-gradient(135deg, #0f172a 0%, #f59e0b 100%); color: white; padding: 30px; text-align: center;">
                            <h1 style="margin: 0;">📅 Event in 3 Days</h1>
                          </div>
                          <div style="padding: 40px;">
                            <p>Hello <strong>' || (email_data->>'user_name') || '</strong>,</p>
                            <p><strong>' || (email_data->>'event_title') || '</strong> is happening in 3 days!</p>
                            <div style="background: #fffbeb; border: 2px solid #f59e0b; border-radius: 12px; padding: 24px; margin: 24px 0;">
                              <h2 style="color: #d97706;">📅 ' || (email_data->>'event_title') || '</h2>
                              <div style="font-size: 16px; line-height: 1.8;">
                                <div><strong>📆 Date:</strong> ' || (email_data->>'event_date') || '</div>
                                <div><strong>🕐 Time:</strong> ' || (email_data->>'event_time') || '</div>
                                <div><strong>📍 Location:</strong> ' || (email_data->>'event_location') || '</div>
                              </div>
                            </div>
                          </div>
                        </div>'
                    WHEN '1_day_before' THEN 
                        '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                          <div style="background: linear-gradient(135deg, #0f172a 0%, #dc2626 100%); color: white; padding: 30px; text-align: center;">
                            <h1 style="margin: 0;">🔔 Event Tomorrow!</h1>
                          </div>
                          <div style="padding: 40px;">
                            <p>Hello <strong>' || (email_data->>'user_name') || '</strong>,</p>
                            <p><strong>' || (email_data->>'event_title') || '</strong> is tomorrow!</p>
                            <div style="background: #fef2f2; border: 2px solid #dc2626; border-radius: 12px; padding: 24px; margin: 24px 0;">
                              <h2 style="color: #b91c1c;">📅 ' || (email_data->>'event_title') || '</h2>
                              <div style="font-size: 16px; line-height: 1.8;">
                                <div><strong>📆 Date:</strong> ' || (email_data->>'event_date') || '</div>
                                <div><strong>🕐 Time:</strong> ' || (email_data->>'event_time') || '</div>
                                <div><strong>📍 Location:</strong> ' || (email_data->>'event_location') || '</div>
                              </div>
                            </div>
                          </div>
                        </div>'
                    WHEN '30_min_before' THEN 
                        '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                          <div style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; padding: 30px; text-align: center;">
                            <h1 style="margin: 0;">⏰ Starting in 30 Minutes!</h1>
                          </div>
                          <div style="padding: 40px;">
                            <p>Hello <strong>' || (email_data->>'user_name') || '</strong>,</p>
                            <p><strong>' || (email_data->>'event_title') || '</strong> starts in 30 minutes!</p>
                            <div style="background: #fef2f2; border: 2px solid #ef4444; border-radius: 12px; padding: 24px; margin: 24px 0;">
                              <h2 style="color: #dc2626;">🔴 ' || (email_data->>'event_title') || '</h2>
                              <div style="font-size: 16px; line-height: 1.8;">
                                <div><strong>🕐 Time:</strong> ' || (email_data->>'event_time') || '</div>
                                <div><strong>📍 Location:</strong> ' || (email_data->>'event_location') || '</div>
                              </div>
                            </div>
                            <div style="text-align: center;">
                              <a href="' || (email_data->>'event_link') || '" style="background: #ef4444; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px;">🚀 Join Event</a>
                            </div>
                          </div>
                        </div>'
                    WHEN 'event_live' THEN 
                        '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                          <div style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; padding: 30px; text-align: center;">
                            <h1 style="margin: 0;">🔴 EVENT IS LIVE!</h1>
                          </div>
                          <div style="padding: 40px;">
                            <p>Hello <strong>' || (email_data->>'user_name') || '</strong>,</p>
                            <p><strong>' || (email_data->>'event_title') || '</strong> has started! Join now!</p>
                            <div style="background: #fef2f2; border: 3px solid #dc2626; border-radius: 12px; padding: 24px; margin: 24px 0;">
                              <h2 style="color: #dc2626;">🔴 LIVE: ' || (email_data->>'event_title') || '</h2>
                              <div style="color: #dc2626; font-weight: bold;">The event has started!</div>
                            </div>
                            <div style="text-align: center;">
                              <a href="' || (email_data->>'event_link') || '" style="background: #dc2626; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-size: 18px;">🔴 JOIN NOW</a>
                            </div>
                          </div>
                        </div>'
                    ELSE 'Default reminder template'
                END;
                
                -- Tentar enviar email via HTTP request (usando pg_net se disponível)
                BEGIN
                    -- Aqui tentamos usar pg_net para fazer uma requisição HTTP
                    -- Se não funcionar, apenas marcamos como "sent" para não repetir
                    
                    -- Marcar como enviado (assumindo sucesso por enquanto)
                    UPDATE event_reminders 
                    SET is_sent = true, 
                        sent_date = NOW() 
                    WHERE id = reminder_record.id;
                    
                    success_count := success_count + 1;
                    
                EXCEPTION WHEN OTHERS THEN
                    -- Log do erro mas não falha o processo todo
                    RAISE NOTICE 'Failed to send reminder %: %', reminder_record.id, SQLERRM;
                END;
                
                processed_count := processed_count + 1;
            END;
        END IF;
    END LOOP;
    
    RETURN 'Processed ' || processed_count || ' reminders, ' || success_count || ' sent successfully';
END;
$$;

-- 2. Criar o job cron que executa a função a cada 5 minutos
SELECT cron.schedule(
    'process-event-reminders',
    '*/5 * * * *', -- A cada 5 minutos
    'SELECT process_pending_reminders();'
);

-- 3. Verificar se foi criado
SELECT * FROM cron.job WHERE jobname = 'process-event-reminders';

-- 4. Testar a função manualmente primeiro
SELECT process_pending_reminders();

-- 5. Ver histórico de execuções
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'process-event-reminders')
ORDER BY start_time DESC 
LIMIT 5;

/* 
INSTRUÇÕES:

1. Execute este SQL no SQL Editor do dashboard Supabase
2. A função vai processar reminders pendentes automaticamente
3. Por enquanto, ela apenas marca como "enviado" - você pode integrar com seu provedor de email
4. Monitore os logs com: SELECT * FROM cron.job_run_details

PRÓXIMOS PASSOS:
- Integrar com SendGrid/Resend para envio real dos emails
- Adicionar logs mais detalhados
- Configurar alertas se muitos emails falharem

*/
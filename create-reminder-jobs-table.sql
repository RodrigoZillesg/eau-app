-- Criar tabela event_reminder_jobs para o sistema de reminders
-- Esta tabela será usada pelo backend Node.js para processar lembretes de eventos

-- Primeiro, remover tabela se existir (para testes)
DROP TABLE IF EXISTS event_reminder_jobs CASCADE;

-- Criar a tabela event_reminder_jobs
CREATE TABLE event_reminder_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL,
    registration_id UUID,
    user_id UUID NOT NULL,
    reminder_type VARCHAR(50) NOT NULL,
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    attempts INTEGER DEFAULT 0,
    sent_at TIMESTAMP WITH TIME ZONE,
    processed_at TIMESTAMP WITH TIME ZONE,
    email_message_id TEXT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX idx_reminder_jobs_status ON event_reminder_jobs(status);
CREATE INDEX idx_reminder_jobs_scheduled ON event_reminder_jobs(scheduled_for);
CREATE INDEX idx_reminder_jobs_event ON event_reminder_jobs(event_id);
CREATE INDEX idx_reminder_jobs_user ON event_reminder_jobs(user_id);

-- Comentários na tabela
COMMENT ON TABLE event_reminder_jobs IS 'Tabela para gerenciar jobs de lembretes de eventos processados pelo backend';
COMMENT ON COLUMN event_reminder_jobs.reminder_type IS 'Tipo do lembrete: 7_days, 3_days, 1_day, 30_min, live';
COMMENT ON COLUMN event_reminder_jobs.status IS 'Status do job: pending, sent, failed';
COMMENT ON COLUMN event_reminder_jobs.attempts IS 'Número de tentativas de envio';

-- Garantir que não existam duplicatas
CREATE UNIQUE INDEX idx_unique_reminder ON event_reminder_jobs(event_id, user_id, reminder_type)
WHERE status != 'failed';

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at
CREATE TRIGGER update_event_reminder_jobs_updated_at 
    BEFORE UPDATE ON event_reminder_jobs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Inserir alguns dados de teste (opcional - comente se não quiser)
/*
INSERT INTO event_reminder_jobs (event_id, user_id, reminder_type, scheduled_for, status)
VALUES 
    ('db92e695-d2ba-459f-8fb9-3497e0074bd2', 'f707f068-4e77-4f82-af47-7a5a66a4b561', '7_days', NOW(), 'pending'),
    ('db92e695-d2ba-459f-8fb9-3497e0074bd2', 'f707f068-4e77-4f82-af47-7a5a66a4b561', '1_day', NOW() + INTERVAL '10 seconds', 'pending');
*/

-- Verificar se a tabela foi criada
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'event_reminder_jobs'
ORDER BY ordinal_position;
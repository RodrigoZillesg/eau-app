-- Criar tabela para armazenar reminders de eventos
CREATE TABLE IF NOT EXISTS event_reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  registration_id UUID,
  user_id UUID,
  reminder_type VARCHAR(50) NOT NULL,
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  email_to VARCHAR(255) NOT NULL,
  email_subject TEXT,
  is_sent BOOLEAN DEFAULT false,
  sent_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_event_reminders_scheduled ON event_reminders(scheduled_date) WHERE is_sent = false;
CREATE INDEX idx_event_reminders_event ON event_reminders(event_id);
CREATE INDEX idx_event_reminders_user ON event_reminders(user_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_event_reminders_updated_at BEFORE UPDATE
  ON event_reminders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentários
COMMENT ON TABLE event_reminders IS 'Stores scheduled email reminders for event registrations';
COMMENT ON COLUMN event_reminders.reminder_type IS 'Type of reminder: 7_days_before, 3_days_before, 1_day_before, 30_min_before, event_live';
COMMENT ON COLUMN event_reminders.scheduled_date IS 'When this reminder should be sent';
COMMENT ON COLUMN event_reminders.is_sent IS 'Whether this reminder has been sent';
COMMENT ON COLUMN event_reminders.sent_date IS 'When this reminder was actually sent';
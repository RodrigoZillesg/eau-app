-- Insert default SMTP settings for testing
-- You should replace these with your actual SMTP credentials

INSERT INTO smtp_settings (
  smtp_host,
  smtp_port,
  smtp_secure,
  smtp_auth_type,
  smtp_username,
  smtp_password,
  from_email,
  from_name,
  reply_to_email,
  reply_to_name,
  enabled,
  test_mode,
  test_email,
  daily_limit,
  hourly_limit,
  emails_sent_today,
  emails_sent_this_hour,
  created_at,
  updated_at
) VALUES (
  'smtp.gmail.com',
  587,
  true,
  'LOGIN',
  'noreply@englishaustralia.com.au',
  'your-app-password-here', -- Replace with actual app password
  'noreply@englishaustralia.com.au',
  'English Australia',
  'info@englishaustralia.com.au',
  'English Australia Support',
  true,
  false,
  null,
  1000,
  100,
  0,
  0,
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;
-- Create emails table to store emails in Supabase
CREATE TABLE IF NOT EXISTS emails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id TEXT UNIQUE,
  from_email TEXT NOT NULL,
  from_name TEXT,
  to_email TEXT NOT NULL,
  subject TEXT,
  body_text TEXT,
  body_html TEXT,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  folder TEXT DEFAULT 'INBOX',
  is_read BOOLEAN DEFAULT FALSE,
  is_starred BOOLEAN DEFAULT FALSE,
  has_attachments BOOLEAN DEFAULT FALSE,
  attachments JSONB,
  headers JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_emails_date ON emails(date DESC);
CREATE INDEX idx_emails_folder ON emails(folder);
CREATE INDEX idx_emails_from ON emails(from_email);
CREATE INDEX idx_emails_is_read ON emails(is_read);

-- Create email_folders table
CREATE TABLE IF NOT EXISTS email_folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  icon TEXT,
  color TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default folders
INSERT INTO email_folders (name, icon, sort_order) VALUES
  ('INBOX', 'inbox', 1),
  ('Sent', 'send', 2),
  ('Drafts', 'drafts', 3),
  ('Trash', 'delete', 4),
  ('Spam', 'report', 5),
  ('Archive', 'archive', 6)
ON CONFLICT (name) DO NOTHING;

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
CREATE TRIGGER update_emails_updated_at BEFORE UPDATE
  ON emails FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS policies
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_folders ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (adjust based on your auth needs)
CREATE POLICY "Allow all operations on emails" ON emails
  FOR ALL USING (true);

CREATE POLICY "Allow read on email_folders" ON email_folders
  FOR SELECT USING (true);
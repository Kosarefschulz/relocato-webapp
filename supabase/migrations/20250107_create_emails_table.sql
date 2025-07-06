-- Create emails table for persistent email storage
CREATE TABLE IF NOT EXISTS public.emails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  uid TEXT NOT NULL,
  folder TEXT NOT NULL,
  from_address TEXT NOT NULL,
  from_name TEXT,
  to_addresses JSONB,
  cc_addresses JSONB,
  bcc_addresses JSONB,
  subject TEXT,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  flags TEXT[],
  text_content TEXT,
  html_content TEXT,
  attachments JSONB,
  raw_headers TEXT,
  size INTEGER,
  message_id TEXT,
  in_reply_to TEXT,
  references TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(uid, folder)
);

-- Create indexes for better performance
CREATE INDEX idx_emails_folder ON public.emails(folder);
CREATE INDEX idx_emails_date ON public.emails(date DESC);
CREATE INDEX idx_emails_from_address ON public.emails(from_address);
CREATE INDEX idx_emails_subject ON public.emails(subject);
CREATE INDEX idx_emails_flags ON public.emails USING GIN(flags);
CREATE INDEX idx_emails_message_id ON public.emails(message_id);

-- Enable RLS
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all emails" ON public.emails
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert emails" ON public.emails
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update emails" ON public.emails
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete emails" ON public.emails
  FOR DELETE
  TO authenticated
  USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_emails_updated_at BEFORE UPDATE ON public.emails 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- COMPLETE MIGRATIONS FOR EMAIL SYSTEM
-- Execute this in Supabase SQL Editor: https://supabase.com/dashboard/project/kmxipuaqierjqaikuimi/sql

-- 1. Create email_customer_links table
CREATE TABLE IF NOT EXISTS public.email_customer_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email_id TEXT NOT NULL,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  linked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  linked_by UUID REFERENCES auth.users(id),
  UNIQUE(email_id, customer_id)
);

CREATE INDEX IF NOT EXISTS idx_email_customer_links_email_id ON public.email_customer_links(email_id);
CREATE INDEX IF NOT EXISTS idx_email_customer_links_customer_id ON public.email_customer_links(customer_id);

ALTER TABLE public.email_customer_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all email-customer links" ON public.email_customer_links
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create email-customer links" ON public.email_customer_links
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can delete email-customer links" ON public.email_customer_links
  FOR DELETE TO authenticated USING (true);

-- 2. Create emails table
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

CREATE INDEX IF NOT EXISTS idx_emails_folder ON public.emails(folder);
CREATE INDEX IF NOT EXISTS idx_emails_date ON public.emails(date DESC);
CREATE INDEX IF NOT EXISTS idx_emails_from_address ON public.emails(from_address);
CREATE INDEX IF NOT EXISTS idx_emails_subject ON public.emails(subject);
CREATE INDEX IF NOT EXISTS idx_emails_flags ON public.emails USING GIN(flags);
CREATE INDEX IF NOT EXISTS idx_emails_message_id ON public.emails(message_id);

ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all emails" ON public.emails
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert emails" ON public.emails
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update emails" ON public.emails
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Users can delete emails" ON public.emails
  FOR DELETE TO authenticated USING (true);

-- 3. Create settings table
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, key)
);

CREATE INDEX IF NOT EXISTS idx_settings_user_id ON public.settings(user_id);
CREATE INDEX IF NOT EXISTS idx_settings_key ON public.settings(key);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own settings" ON public.settings
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can create their own settings" ON public.settings
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own settings" ON public.settings
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own settings" ON public.settings
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- 4. Create user_presence table
CREATE TABLE IF NOT EXISTS public.user_presence (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'offline',
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_presence_user_id ON public.user_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_status ON public.user_presence(status);
CREATE INDEX IF NOT EXISTS idx_user_presence_last_seen ON public.user_presence(last_seen);

ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all presence" ON public.user_presence
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert their own presence" ON public.user_presence
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own presence" ON public.user_presence
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- 5. Create update function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Create triggers
DROP TRIGGER IF EXISTS update_emails_updated_at ON public.emails;
CREATE TRIGGER update_emails_updated_at BEFORE UPDATE ON public.emails 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_settings_updated_at ON public.settings;
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_presence_updated_at ON public.user_presence;
CREATE TRIGGER update_user_presence_updated_at BEFORE UPDATE ON public.user_presence 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Grant permissions
GRANT ALL ON public.email_customer_links TO authenticated;
GRANT ALL ON public.emails TO authenticated;
GRANT ALL ON public.settings TO authenticated;
GRANT ALL ON public.user_presence TO authenticated;

-- Done! Your email system database is now ready.
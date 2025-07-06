-- Create settings table
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, key)
);

-- Create indexes
CREATE INDEX idx_settings_user_id ON public.settings(user_id);
CREATE INDEX idx_settings_key ON public.settings(key);

-- Enable RLS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own settings" ON public.settings
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own settings" ON public.settings
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own settings" ON public.settings
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own settings" ON public.settings
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create user_presence table
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

-- Create indexes
CREATE INDEX idx_user_presence_user_id ON public.user_presence(user_id);
CREATE INDEX idx_user_presence_status ON public.user_presence(status);
CREATE INDEX idx_user_presence_last_seen ON public.user_presence(last_seen);

-- Enable RLS
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all presence" ON public.user_presence
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own presence" ON public.user_presence
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own presence" ON public.user_presence
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_presence_updated_at BEFORE UPDATE ON public.user_presence 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
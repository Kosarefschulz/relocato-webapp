-- Create email_customer_links table
CREATE TABLE IF NOT EXISTS public.email_customer_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email_id TEXT NOT NULL,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  linked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  linked_by UUID REFERENCES auth.users(id),
  UNIQUE(email_id, customer_id)
);

-- Create indexes for better performance
CREATE INDEX idx_email_customer_links_email_id ON public.email_customer_links(email_id);
CREATE INDEX idx_email_customer_links_customer_id ON public.email_customer_links(customer_id);

-- Enable RLS
ALTER TABLE public.email_customer_links ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all email-customer links" ON public.email_customer_links
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create email-customer links" ON public.email_customer_links
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can delete email-customer links" ON public.email_customer_links
  FOR DELETE
  TO authenticated
  USING (true);
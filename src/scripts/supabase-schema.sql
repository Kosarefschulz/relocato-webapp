-- Supabase Database Schema for Umzugs-WebApp
-- This schema creates all necessary tables for the relocation management system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_number VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  from_address TEXT,
  to_address TEXT,
  moving_date DATE,
  apartment JSONB DEFAULT '{"rooms": 0, "area": 0, "floor": 0, "hasElevator": false}'::jsonb,
  services TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sales_status VARCHAR(50),
  status VARCHAR(50),
  cancelled_at TIMESTAMPTZ,
  notes TEXT,
  -- Additional fields from Firebase
  volume NUMERIC,
  distance NUMERIC,
  furniture_assembly_price NUMERIC DEFAULT 0,
  packing_service_price NUMERIC DEFAULT 0,
  storage_service_price NUMERIC DEFAULT 0,
  disposal_service_price NUMERIC DEFAULT 0,
  cleaning_service_price NUMERIC DEFAULT 0,
  bore_service_price NUMERIC DEFAULT 0,
  heavy_item_price NUMERIC DEFAULT 0,
  subtotal NUMERIC DEFAULT 0,
  tax NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  -- Fields for improved data integrity
  firebase_id VARCHAR(255) UNIQUE,
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Create index for customer search
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_customer_number ON customers(customer_number);
CREATE INDEX idx_customers_firebase_id ON customers(firebase_id);

-- Quotes table
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  customer_name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'confirmed', 'rejected', 'invoiced')),
  price NUMERIC NOT NULL,
  volume NUMERIC,
  distance NUMERIC,
  move_date DATE,
  move_from TEXT,
  move_to TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  confirmation_token VARCHAR(255) UNIQUE,
  confirmed_at TIMESTAMPTZ,
  confirmed_by VARCHAR(255),
  -- Additional fields
  comment TEXT,
  created_by VARCHAR(255),
  services JSONB DEFAULT '{}'::jsonb,
  -- Firebase reference
  firebase_id VARCHAR(255) UNIQUE,
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Create indexes for quotes
CREATE INDEX idx_quotes_customer_id ON quotes(customer_id);
CREATE INDEX idx_quotes_confirmation_token ON quotes(confirmation_token);
CREATE INDEX idx_quotes_firebase_id ON quotes(firebase_id);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  amount NUMERIC NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  due_date DATE NOT NULL,
  paid_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Additional fields
  items JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  -- Firebase reference
  firebase_id VARCHAR(255) UNIQUE,
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Create indexes for invoices
CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX idx_invoices_quote_id ON invoices(quote_id);
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_firebase_id ON invoices(firebase_id);

-- ShareLinks table (for employee links)
CREATE TABLE IF NOT EXISTS share_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES quotes(id),
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by VARCHAR(255),
  used_at TIMESTAMPTZ,
  arbeitsschein_html TEXT,
  arbeitsschein_data JSONB,
  -- Firebase reference
  firebase_id VARCHAR(255) UNIQUE,
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Create indexes for share_links
CREATE INDEX idx_share_links_token ON share_links(token);
CREATE INDEX idx_share_links_customer_id ON share_links(customer_id);
CREATE INDEX idx_share_links_firebase_id ON share_links(firebase_id);

-- ShareTokens table (for customer share links)
CREATE TABLE IF NOT EXISTS share_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  customer_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_by VARCHAR(255) NOT NULL,
  permissions JSONB DEFAULT '{"viewCustomer": true, "viewQuote": true, "viewInvoice": false, "viewPhotos": true}'::jsonb,
  access_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  -- Firebase reference
  firebase_id VARCHAR(255) UNIQUE,
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Create indexes for share_tokens
CREATE INDEX idx_share_tokens_customer_id ON share_tokens(customer_id);
CREATE INDEX idx_share_tokens_firebase_id ON share_tokens(firebase_id);

-- Email history table
CREATE TABLE IF NOT EXISTS email_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  recipient VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  type VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending')),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Additional fields
  body TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  error_message TEXT,
  -- Firebase reference
  firebase_id VARCHAR(255) UNIQUE,
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Create indexes for email_history
CREATE INDEX idx_email_history_customer_id ON email_history(customer_id);
CREATE INDEX idx_email_history_firebase_id ON email_history(firebase_id);

-- Calendar events table
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  type VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Additional fields
  location TEXT,
  attendees TEXT[],
  reminder_sent BOOLEAN DEFAULT FALSE,
  -- Firebase reference
  firebase_id VARCHAR(255) UNIQUE,
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Create indexes for calendar_events
CREATE INDEX idx_calendar_events_customer_id ON calendar_events(customer_id);
CREATE INDEX idx_calendar_events_start_date ON calendar_events(start_date);
CREATE INDEX idx_calendar_events_firebase_id ON calendar_events(firebase_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON quotes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON calendar_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
-- Enable RLS on all tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Create policies (for now, allow all authenticated users full access)
-- In production, you'd want more restrictive policies
CREATE POLICY "Allow all operations for authenticated users" ON customers
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON quotes
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON invoices
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON share_links
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON share_tokens
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON email_history
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON calendar_events
    FOR ALL USING (auth.role() = 'authenticated');

-- Create public read policies for share links/tokens
CREATE POLICY "Allow public read for valid tokens" ON share_links
    FOR SELECT USING (expires_at > NOW());

CREATE POLICY "Allow public read for valid tokens" ON share_tokens
    FOR SELECT USING (expires_at > NOW());

-- Migration tracking table
CREATE TABLE IF NOT EXISTS migration_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name VARCHAR(100) NOT NULL,
  records_migrated INTEGER DEFAULT 0,
  last_migrated_at TIMESTAMPTZ,
  status VARCHAR(50) DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial migration status
INSERT INTO migration_status (table_name, status) VALUES
  ('customers', 'pending'),
  ('quotes', 'pending'),
  ('invoices', 'pending'),
  ('share_links', 'pending'),
  ('share_tokens', 'pending'),
  ('email_history', 'pending'),
  ('calendar_events', 'pending')
ON CONFLICT DO NOTHING;
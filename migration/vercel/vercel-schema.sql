-- Vercel PostgreSQL Schema für Umzugs-WebApp
-- Optimiert für Serverless mit Connection Pooling

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables (for clean migration)
DROP TABLE IF EXISTS email_history CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS quotes CASCADE;
DROP TABLE IF EXISTS photos CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS email_templates CASCADE;
DROP TABLE IF EXISTS quote_templates CASCADE;

-- Users table (für Authentication)
CREATE TABLE users (
    id VARCHAR(128) PRIMARY KEY, -- Firebase UID beibehalten
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255), -- Für Email/Password Auth
    display_name VARCHAR(255),
    photo_url TEXT,
    role VARCHAR(50) DEFAULT 'user',
    email_access BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    auth_provider VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Customers table
CREATE TABLE customers (
    id VARCHAR(50) PRIMARY KEY, -- Behalte Firebase IDs
    customer_number VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(100),
    
    -- Adressdaten als JSONB für Flexibilität
    from_address JSONB DEFAULT '{}'::jsonb,
    to_address JSONB DEFAULT '{}'::jsonb,
    
    -- Zusätzliche Daten
    move_date DATE,
    notes TEXT,
    source VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active',
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(128) REFERENCES users(id),
    
    -- Indizes für Performance
    INDEX idx_customer_email (email),
    INDEX idx_customer_name (name),
    INDEX idx_customer_number (customer_number),
    INDEX idx_customer_created (created_at DESC)
);

-- Quotes table
CREATE TABLE quotes (
    id VARCHAR(50) PRIMARY KEY,
    customer_id VARCHAR(50) REFERENCES customers(id) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    
    -- Angebotsdaten
    price DECIMAL(10, 2),
    volume INTEGER,
    distance DECIMAL(10, 2),
    move_date DATE,
    
    -- Status
    status VARCHAR(50) DEFAULT 'draft',
    sent_date TIMESTAMP,
    accepted_date TIMESTAMP,
    
    -- Adressen
    from_address JSONB DEFAULT '{}'::jsonb,
    to_address JSONB DEFAULT '{}'::jsonb,
    
    -- Details
    services JSONB DEFAULT '[]'::jsonb,
    items JSONB DEFAULT '[]'::jsonb,
    comment TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(128) REFERENCES users(id),
    
    -- Indizes
    INDEX idx_quote_customer (customer_id),
    INDEX idx_quote_status (status),
    INDEX idx_quote_created (created_at DESC)
);

-- Invoices table
CREATE TABLE invoices (
    id VARCHAR(50) PRIMARY KEY,
    invoice_number VARCHAR(20) UNIQUE NOT NULL,
    customer_id VARCHAR(50) REFERENCES customers(id) ON DELETE CASCADE,
    quote_id VARCHAR(50) REFERENCES quotes(id),
    
    -- Rechnungsdaten
    amount DECIMAL(10, 2) NOT NULL,
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,
    
    -- Status
    status VARCHAR(50) DEFAULT 'draft',
    sent_date TIMESTAMP,
    paid_date TIMESTAMP,
    due_date DATE,
    
    -- Details
    items JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(128) REFERENCES users(id),
    
    -- Indizes
    INDEX idx_invoice_customer (customer_id),
    INDEX idx_invoice_number (invoice_number),
    INDEX idx_invoice_status (status),
    INDEX idx_invoice_created (created_at DESC)
);

-- Photos table (Referenzen zu Vercel Blob)
CREATE TABLE photos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id VARCHAR(50) REFERENCES customers(id) ON DELETE CASCADE,
    
    -- Datei-Info
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255),
    mime_type VARCHAR(100),
    file_size BIGINT,
    
    -- Vercel Blob Info
    blob_url TEXT NOT NULL,
    blob_pathname TEXT,
    blob_content_type VARCHAR(100),
    blob_uploaded_at TIMESTAMP,
    
    -- Kategorisierung
    category VARCHAR(100) DEFAULT 'general',
    description TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uploaded_by VARCHAR(128) REFERENCES users(id),
    
    -- Indizes
    INDEX idx_photo_customer (customer_id),
    INDEX idx_photo_category (category),
    INDEX idx_photo_uploaded (uploaded_at DESC)
);

-- Email History table
CREATE TABLE email_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id VARCHAR(50) REFERENCES customers(id) ON DELETE CASCADE,
    
    -- Email-Daten
    to_email VARCHAR(255) NOT NULL,
    from_email VARCHAR(255) DEFAULT 'bielefeld@relocato.de',
    subject VARCHAR(500),
    content TEXT,
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending',
    sent_at TIMESTAMP,
    opened_at TIMESTAMP,
    clicked_at TIMESTAMP,
    
    -- Tracking
    message_id VARCHAR(255),
    template_type VARCHAR(100),
    quote_id VARCHAR(50) REFERENCES quotes(id),
    invoice_id VARCHAR(50) REFERENCES invoices(id),
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(128) REFERENCES users(id),
    
    -- Indizes
    INDEX idx_email_customer (customer_id),
    INDEX idx_email_status (status),
    INDEX idx_email_created (created_at DESC)
);

-- Email Templates
CREATE TABLE email_templates (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(500),
    content TEXT,
    variables JSONB DEFAULT '[]'::jsonb,
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(128) REFERENCES users(id),
    
    -- Indizes
    INDEX idx_template_name (name),
    INDEX idx_template_category (category)
);

-- Quote Templates
CREATE TABLE quote_templates (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Template-Daten
    base_price DECIMAL(10, 2),
    price_per_cbm DECIMAL(10, 2),
    price_per_km DECIMAL(10, 2),
    services JSONB DEFAULT '[]'::jsonb,
    
    -- Einstellungen
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(128) REFERENCES users(id)
);

-- Trigger für updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON quotes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_quote_templates_updated_at BEFORE UPDATE ON quote_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Optimierungen für Vercel Serverless
-- Connection Pooling wird automatisch von Vercel gehandhabt

-- Erstelle optimierte Views für häufige Queries
CREATE VIEW customer_overview AS
SELECT 
    c.id,
    c.customer_number,
    c.name,
    c.email,
    c.phone,
    c.created_at,
    COUNT(DISTINCT q.id) as quote_count,
    COUNT(DISTINCT i.id) as invoice_count,
    COUNT(DISTINCT p.id) as photo_count,
    MAX(q.created_at) as last_quote_date,
    MAX(i.created_at) as last_invoice_date
FROM customers c
LEFT JOIN quotes q ON c.id = q.customer_id
LEFT JOIN invoices i ON c.id = i.customer_id
LEFT JOIN photos p ON c.id = p.customer_id
GROUP BY c.id;

-- Grants (falls nötig)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_user;

-- Initiale Daten
INSERT INTO users (id, email, display_name, role, email_access, auth_provider)
VALUES 
    ('system', 'system@relocato.de', 'System', 'admin', true, 'system'),
    ('import', 'import@relocato.de', 'Import Service', 'service', true, 'system')
ON CONFLICT (id) DO NOTHING;

-- Success Message
DO $$
BEGIN
    RAISE NOTICE 'Vercel PostgreSQL Schema erfolgreich erstellt!';
    RAISE NOTICE 'Tabellen: users, customers, quotes, invoices, photos, email_history, email_templates, quote_templates';
    RAISE NOTICE 'Views: customer_overview';
    RAISE NOTICE 'Trigger: Automatische updated_at für alle Tabellen';
END $$;
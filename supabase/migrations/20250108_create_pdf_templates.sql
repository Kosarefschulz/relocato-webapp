-- Create enum for template types
CREATE TYPE template_type AS ENUM ('quote', 'invoice', 'contract', 'receipt');

-- Create enum for content block types
CREATE TYPE content_block_type AS ENUM (
  'header',
  'footer',
  'logo',
  'company_info',
  'customer_info',
  'service_list',
  'pricing_table',
  'terms',
  'signature',
  'custom'
);

-- Create table for PDF templates
CREATE TABLE IF NOT EXISTS pdf_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_type VARCHAR(50) NOT NULL, -- References company type from app
  template_type template_type NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  page_settings JSONB DEFAULT '{
    "format": "A4",
    "orientation": "portrait",
    "margins": {
      "top": 25,
      "right": 25,
      "bottom": 25,
      "left": 25
    }
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(255),
  UNIQUE(company_type, template_type, name)
);

-- Create table for template content blocks
CREATE TABLE IF NOT EXISTS template_content_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES pdf_templates(id) ON DELETE CASCADE,
  block_type content_block_type NOT NULL,
  name VARCHAR(255) NOT NULL,
  position INTEGER NOT NULL,
  page_number INTEGER DEFAULT 1,
  x_position FLOAT,
  y_position FLOAT,
  width FLOAT,
  height FLOAT,
  settings JSONB DEFAULT '{}'::jsonb, -- Stores font, color, alignment, etc.
  content JSONB DEFAULT '{}'::jsonb, -- Stores actual content or content template
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for company branding
CREATE TABLE IF NOT EXISTS company_branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_type VARCHAR(50) NOT NULL UNIQUE,
  logo_url TEXT,
  letterhead_url TEXT,
  primary_color VARCHAR(7), -- Hex color
  secondary_color VARCHAR(7),
  accent_color VARCHAR(7),
  font_family VARCHAR(100) DEFAULT 'Helvetica',
  header_settings JSONB DEFAULT '{}'::jsonb,
  footer_settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for service catalog
CREATE TABLE IF NOT EXISTS service_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_type VARCHAR(50) NOT NULL,
  service_code VARCHAR(50) NOT NULL,
  service_name VARCHAR(255) NOT NULL,
  description TEXT,
  unit VARCHAR(50), -- e.g., 'hour', 'piece', 'sqm', 'cbm'
  base_price DECIMAL(10, 2),
  category VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}'::jsonb, -- Additional service-specific settings
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_type, service_code)
);

-- Create table for template variables
CREATE TABLE IF NOT EXISTS template_variables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES pdf_templates(id) ON DELETE CASCADE,
  variable_name VARCHAR(100) NOT NULL,
  variable_type VARCHAR(50) NOT NULL, -- 'text', 'number', 'date', 'boolean', 'list'
  default_value TEXT,
  is_required BOOLEAN DEFAULT false,
  validation_rules JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_pdf_templates_company_type ON pdf_templates(company_type);
CREATE INDEX idx_template_content_blocks_template_id ON template_content_blocks(template_id);
CREATE INDEX idx_template_content_blocks_position ON template_content_blocks(template_id, page_number, position);
CREATE INDEX idx_service_catalog_company_type ON service_catalog(company_type);
CREATE INDEX idx_template_variables_template_id ON template_variables(template_id);

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pdf_templates_updated_at BEFORE UPDATE ON pdf_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_template_content_blocks_updated_at BEFORE UPDATE ON template_content_blocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_branding_updated_at BEFORE UPDATE ON company_branding
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_catalog_updated_at BEFORE UPDATE ON service_catalog
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default branding for existing companies
INSERT INTO company_branding (company_type, primary_color, secondary_color, accent_color) VALUES
  ('relocato', '#8BC34A', '#555555', '#FF9800'),
  ('wertvoll', '#1976D2', '#424242', '#FFC107'),
  ('ruempelschmiede', '#D32F2F', '#616161', '#4CAF50')
ON CONFLICT (company_type) DO NOTHING;
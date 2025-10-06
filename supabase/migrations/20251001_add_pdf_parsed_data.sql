-- Migration: Add PDF parsed data fields to customers table
-- Date: 2025-10-01
-- Description: Adds fields to store parsed PDF data (services, prices, invoice info)

-- Add new columns to customers table
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS parsed_services JSONB,
ADD COLUMN IF NOT EXISTS estimated_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS invoice_number TEXT,
ADD COLUMN IF NOT EXISTS invoice_date DATE,
ADD COLUMN IF NOT EXISTS pdf_metadata JSONB;

-- Create index for faster queries on parsed services
CREATE INDEX IF NOT EXISTS idx_customers_parsed_services ON public.customers USING GIN (parsed_services);

-- Create index for estimated price queries
CREATE INDEX IF NOT EXISTS idx_customers_estimated_price ON public.customers(estimated_price);

-- Create index for invoice number
CREATE INDEX IF NOT EXISTS idx_customers_invoice_number ON public.customers(invoice_number);

-- Add comment to document the fields
COMMENT ON COLUMN public.customers.parsed_services IS 'JSON array of services extracted from PDF files';
COMMENT ON COLUMN public.customers.estimated_price IS 'Estimated or actual price from parsed PDF';
COMMENT ON COLUMN public.customers.invoice_number IS 'Invoice number extracted from PDF';
COMMENT ON COLUMN public.customers.invoice_date IS 'Invoice date extracted from PDF';
COMMENT ON COLUMN public.customers.pdf_metadata IS 'Additional metadata from PDF parsing (filename, date uploaded, etc.)';

-- Example structure for parsed_services:
-- [
--   {
--     "name": "Umzugsservice",
--     "description": "Kompletter Umzugsservice inkl. Transport",
--     "price": 850.00,
--     "quantity": 1
--   },
--   {
--     "name": "Verpackungsmaterial",
--     "description": "Kartons und Verpackungsmaterial",
--     "price": 150.00,
--     "quantity": 1
--   }
-- ]

-- Example structure for pdf_metadata:
-- {
--   "filename": "rechnung_2024_001.pdf",
--   "uploaded_at": "2025-10-01T12:00:00Z",
--   "parsed_at": "2025-10-01T12:00:05Z",
--   "raw_text_preview": "Rechnung Nr. 2024-001..."
-- }

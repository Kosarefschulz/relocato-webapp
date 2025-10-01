-- Update Migration: Add 'nachfassen' to customer_phase enum
-- Created: 2025-10-01

-- Add new value to existing enum type
ALTER TYPE customer_phase ADD VALUE 'nachfassen' AFTER 'angerufen';

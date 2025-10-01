-- Migration: Add customer_phase to customers table
-- Created: 2025-10-01

-- Create enum type for customer phases
CREATE TYPE customer_phase AS ENUM (
  'angerufen',
  'nachfassen',
  'angebot_erstellt',
  'besichtigung_geplant',
  'durchfuehrung',
  'rechnung',
  'bewertung',
  'archiviert'
);

-- Add current_phase column to customers table
ALTER TABLE customers
ADD COLUMN current_phase customer_phase DEFAULT 'angerufen';

-- Add index for better query performance
CREATE INDEX idx_customers_current_phase ON customers(current_phase);

-- Add phase_updated_at column to track when phase was last changed
ALTER TABLE customers
ADD COLUMN phase_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add phase_history column to track phase changes (JSONB array)
ALTER TABLE customers
ADD COLUMN phase_history JSONB DEFAULT '[]'::jsonb;

-- Create function to update phase_updated_at automatically
CREATE OR REPLACE FUNCTION update_phase_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.current_phase IS DISTINCT FROM OLD.current_phase THEN
    NEW.phase_updated_at = NOW();

    -- Add to phase history
    NEW.phase_history = COALESCE(OLD.phase_history, '[]'::jsonb) ||
      jsonb_build_object(
        'phase', NEW.current_phase,
        'changedAt', NOW(),
        'previousPhase', OLD.current_phase
      );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function
CREATE TRIGGER trigger_update_phase_timestamp
BEFORE UPDATE ON customers
FOR EACH ROW
EXECUTE FUNCTION update_phase_timestamp();

-- Comment on columns
COMMENT ON COLUMN customers.current_phase IS 'Aktuelle Phase des Kunden im Prozess';
COMMENT ON COLUMN customers.phase_updated_at IS 'Zeitpunkt der letzten Phasenänderung';
COMMENT ON COLUMN customers.phase_history IS 'Historie aller Phasenänderungen';

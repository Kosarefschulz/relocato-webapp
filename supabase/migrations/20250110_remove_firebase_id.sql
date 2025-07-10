-- =====================================================
-- MIGRATION: Entfernung aller Firebase-Referenzen
-- =====================================================
-- Dieses Skript entfernt alle firebase_id Spalten und Constraints
-- aus der Datenbank, da nur noch Supabase verwendet wird

-- =====================================================
-- SCHRITT 1: Entfernen von firebase_id aus customers Tabelle
-- =====================================================

-- Erst den UNIQUE constraint entfernen (falls vorhanden)
ALTER TABLE customers 
DROP CONSTRAINT IF EXISTS customers_firebase_id_key;

-- Dann die Spalte entfernen
ALTER TABLE customers 
DROP COLUMN IF EXISTS firebase_id;

-- =====================================================
-- SCHRITT 2: Entfernen von firebase_id aus quotes Tabelle
-- =====================================================

-- Erst den UNIQUE constraint entfernen (falls vorhanden)
ALTER TABLE quotes 
DROP CONSTRAINT IF EXISTS quotes_firebase_id_key;

-- Dann die Spalte entfernen
ALTER TABLE quotes 
DROP COLUMN IF EXISTS firebase_id;

-- =====================================================
-- SCHRITT 3: Entfernen von firebase_id aus invoices Tabelle
-- =====================================================

-- Erst den UNIQUE constraint entfernen (falls vorhanden)
ALTER TABLE invoices 
DROP CONSTRAINT IF EXISTS invoices_firebase_id_key;

-- Dann die Spalte entfernen
ALTER TABLE invoices 
DROP COLUMN IF EXISTS firebase_id;

-- =====================================================
-- SCHRITT 4: Entfernen von firebase_id aus users Tabelle
-- =====================================================

-- Erst den UNIQUE constraint entfernen (falls vorhanden)
ALTER TABLE users 
DROP CONSTRAINT IF EXISTS users_firebase_id_key;

-- Dann die Spalte entfernen
ALTER TABLE users 
DROP COLUMN IF EXISTS firebase_id;

-- =====================================================
-- SCHRITT 5: Entfernen von firebase_id aus anderen Tabellen
-- =====================================================

-- Calendar Events
ALTER TABLE calendar_events 
DROP COLUMN IF EXISTS firebase_id;

-- Share Links
ALTER TABLE share_links 
DROP COLUMN IF EXISTS firebase_id;

-- Email History
ALTER TABLE email_history 
DROP COLUMN IF EXISTS firebase_id;

-- =====================================================
-- SCHRITT 6: Kommentar hinzufügen
-- =====================================================
COMMENT ON TABLE customers IS 'Kundentabelle - Verwendet nur noch Supabase UUIDs, keine Firebase IDs mehr';
COMMENT ON TABLE quotes IS 'Angebote - Verwendet nur noch Supabase UUIDs, keine Firebase IDs mehr';
COMMENT ON TABLE invoices IS 'Rechnungen - Verwendet nur noch Supabase UUIDs, keine Firebase IDs mehr';
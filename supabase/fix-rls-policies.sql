-- TEMPORÄRE LÖSUNG: RLS-Policies für anonyme Benutzer aktivieren
-- WICHTIG: Dies ist nur eine temporäre Lösung für die Entwicklung!
-- Für die Produktion sollte eine richtige Authentifizierung implementiert werden.

-- ============================================
-- Option 1: RLS komplett deaktivieren (SCHNELLSTE LÖSUNG)
-- ============================================
-- Führen Sie diese Befehle aus, um RLS auf allen Tabellen zu deaktivieren:

ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE quotes DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE share_links DISABLE ROW LEVEL SECURITY;
ALTER TABLE share_tokens DISABLE ROW LEVEL SECURITY;
ALTER TABLE email_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE email_customer_links DISABLE ROW LEVEL SECURITY;
ALTER TABLE scanned_furniture DISABLE ROW LEVEL SECURITY;
ALTER TABLE scan_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE scan_photos DISABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE customer_interactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE sales_stats_cache DISABLE ROW LEVEL SECURITY;

-- ============================================
-- Option 2: RLS behalten, aber anonyme Zugriffe erlauben
-- ============================================
-- Alternative: Policies für anonyme Benutzer erstellen (sicherer als Option 1)

-- Customers Tabelle
CREATE POLICY "Allow anon full access to customers" ON customers
    FOR ALL USING (true);

-- Quotes Tabelle
CREATE POLICY "Allow anon full access to quotes" ON quotes
    FOR ALL USING (true);

-- Invoices Tabelle
CREATE POLICY "Allow anon full access to invoices" ON invoices
    FOR ALL USING (true);

-- Email History Tabelle
CREATE POLICY "Allow anon full access to email_history" ON email_history
    FOR ALL USING (true);

-- Calendar Events Tabelle
CREATE POLICY "Allow anon full access to calendar_events" ON calendar_events
    FOR ALL USING (true);

-- Scan Sessions Tabelle
CREATE POLICY "Allow anon full access to scan_sessions" ON scan_sessions
    FOR ALL USING (true);

-- Scanned Furniture Tabelle
CREATE POLICY "Allow anon full access to scanned_furniture" ON scanned_furniture
    FOR ALL USING (true);

-- PDF Templates Tabelle
CREATE POLICY "Allow anon full access to pdf_templates" ON pdf_templates
    FOR ALL USING (true);

-- ============================================
-- Option 3: Bestehende Policies anpassen (für anonyme UND authentifizierte Benutzer)
-- ============================================
-- Dies ist die sicherste Option, erfordert aber das Löschen der alten Policies

-- Beispiel für Customers:
/*
DROP POLICY IF EXISTS "Allow authenticated users to read customers" ON customers;
DROP POLICY IF EXISTS "Allow authenticated users to insert customers" ON customers;
DROP POLICY IF EXISTS "Allow authenticated users to update customers" ON customers;
DROP POLICY IF EXISTS "Allow authenticated users to delete customers" ON customers;

CREATE POLICY "Allow all users to read customers" ON customers
    FOR SELECT USING (true);
CREATE POLICY "Allow all users to insert customers" ON customers
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all users to update customers" ON customers
    FOR UPDATE USING (true);
CREATE POLICY "Allow all users to delete customers" ON customers
    FOR DELETE USING (true);
*/

-- ============================================
-- STORAGE POLICIES FIX
-- ============================================
-- Falls auch Storage-Probleme auftreten:

-- Furniture Scans Bucket - Anonyme Uploads erlauben
INSERT INTO storage.policies (bucket_id, name, definition, operation)
VALUES 
    ('furniture-scans', 'Allow anon uploads', 'true'::jsonb, 'INSERT'),
    ('furniture-scans', 'Allow anon updates', 'true'::jsonb, 'UPDATE'),
    ('furniture-scans', 'Allow anon deletes', 'true'::jsonb, 'DELETE')
ON CONFLICT (bucket_id, name) 
DO UPDATE SET definition = EXCLUDED.definition;

-- ============================================
-- EMPFEHLUNG
-- ============================================
-- Für die schnellste Lösung verwenden Sie Option 1 (RLS deaktivieren).
-- Führen Sie einfach alle ALTER TABLE ... DISABLE ROW LEVEL SECURITY Befehle aus.
-- 
-- Langfristig sollten Sie jedoch eine richtige Authentifizierung implementieren
-- oder zumindest Option 2 verwenden, um grundlegende Sicherheit zu gewährleisten.
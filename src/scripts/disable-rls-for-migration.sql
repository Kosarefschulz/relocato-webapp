-- Temporarily disable RLS for migration
-- Run this in Supabase SQL editor before migration

-- Drop existing policies
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON customers;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON quotes;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON invoices;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON share_links;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON share_tokens;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON email_history;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON calendar_events;
DROP POLICY IF EXISTS "Allow public read for valid tokens" ON share_links;
DROP POLICY IF EXISTS "Allow public read for valid tokens" ON share_tokens;

-- Create temporary policies that allow anonymous access for migration
CREATE POLICY "Allow anonymous insert for migration" ON customers
    FOR INSERT 
    TO anon
    WITH CHECK (true);

CREATE POLICY "Allow anonymous select for migration" ON customers
    FOR SELECT 
    TO anon
    USING (true);

CREATE POLICY "Allow anonymous update for migration" ON customers
    FOR UPDATE 
    TO anon
    USING (true);

CREATE POLICY "Allow anonymous delete for migration" ON customers
    FOR DELETE 
    TO anon
    USING (true);

-- Repeat for other tables
CREATE POLICY "Allow anonymous insert for migration" ON quotes
    FOR INSERT 
    TO anon
    WITH CHECK (true);

CREATE POLICY "Allow anonymous select for migration" ON quotes
    FOR SELECT 
    TO anon
    USING (true);

CREATE POLICY "Allow anonymous insert for migration" ON share_tokens
    FOR INSERT 
    TO anon
    WITH CHECK (true);

CREATE POLICY "Allow anonymous select for migration" ON share_tokens
    FOR SELECT 
    TO anon
    USING (true);

CREATE POLICY "Allow anonymous delete for migration" ON share_tokens
    FOR DELETE 
    TO anon
    USING (true);

-- Allow access to migration_status table
CREATE POLICY "Allow anonymous all for migration" ON migration_status
    FOR ALL 
    TO anon
    USING (true)
    WITH CHECK (true);

-- Note: After migration, run the restore-rls-after-migration.sql script
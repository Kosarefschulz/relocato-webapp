-- Restore RLS policies after migration
-- Run this in Supabase SQL editor after migration is complete

-- Drop temporary migration policies
DROP POLICY IF EXISTS "Allow anonymous insert for migration" ON customers;
DROP POLICY IF EXISTS "Allow anonymous select for migration" ON customers;
DROP POLICY IF EXISTS "Allow anonymous update for migration" ON customers;
DROP POLICY IF EXISTS "Allow anonymous delete for migration" ON customers;

DROP POLICY IF EXISTS "Allow anonymous insert for migration" ON quotes;
DROP POLICY IF EXISTS "Allow anonymous select for migration" ON quotes;

DROP POLICY IF EXISTS "Allow anonymous insert for migration" ON share_tokens;
DROP POLICY IF EXISTS "Allow anonymous select for migration" ON share_tokens;
DROP POLICY IF EXISTS "Allow anonymous delete for migration" ON share_tokens;

DROP POLICY IF EXISTS "Allow anonymous all for migration" ON migration_status;

-- Restore production policies
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

-- Allow public read access to customers/quotes when accessed through valid share tokens
CREATE POLICY "Allow public read with valid share token" ON customers
    FOR SELECT 
    TO anon
    USING (
        EXISTS (
            SELECT 1 FROM share_tokens 
            WHERE share_tokens.customer_id = customers.id 
            AND share_tokens.expires_at > NOW()
        ) OR 
        EXISTS (
            SELECT 1 FROM share_links 
            WHERE share_links.customer_id = customers.id 
            AND share_links.expires_at > NOW()
        )
    );

CREATE POLICY "Allow public read with valid share token" ON quotes
    FOR SELECT 
    TO anon
    USING (
        EXISTS (
            SELECT 1 FROM share_tokens st
            JOIN customers c ON c.id = st.customer_id
            WHERE c.id = quotes.customer_id
            AND st.expires_at > NOW()
        ) OR
        EXISTS (
            SELECT 1 FROM share_links sl
            WHERE sl.quote_id = quotes.id
            AND sl.expires_at > NOW()
        )
    );
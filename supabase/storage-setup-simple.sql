-- Einfaches SQL zum Erstellen des Storage Buckets
-- Führen Sie diese Befehle einzeln aus, falls Fehler auftreten

-- 1. Bucket erstellen
INSERT INTO storage.buckets (id, name, public)
VALUES ('furniture-scans', 'furniture-scans', true);

-- 2. Public Read Policy
CREATE POLICY "Allow public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'furniture-scans');

-- 3. Authenticated Upload Policy  
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'furniture-scans');

-- 4. Authenticated Update Policy
CREATE POLICY "Allow authenticated updates" ON storage.objects
FOR UPDATE USING (bucket_id = 'furniture-scans');

-- 5. Authenticated Delete Policy
CREATE POLICY "Allow authenticated deletes" ON storage.objects
FOR DELETE USING (bucket_id = 'furniture-scans');
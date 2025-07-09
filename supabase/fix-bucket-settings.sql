-- =====================================================
-- BUCKET EINSTELLUNGEN KORRIGIEREN
-- =====================================================

-- 1. Bucket-Einstellungen aktualisieren
UPDATE storage.buckets 
SET 
  file_size_limit = 10485760, -- 10MB
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']::text[],
  avif_autodetection = false
WHERE id = 'furniture-scans';

-- 2. Überprüfen
SELECT * FROM storage.buckets WHERE id = 'furniture-scans';

-- 3. RLS für storage.objects deaktivieren (temporär für Tests)
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- 4. Testen ob RLS deaktiviert ist
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM 
    pg_tables
WHERE 
    schemaname = 'storage' 
    AND tablename = 'objects';

-- 5. Alternative: Sehr permissive Policy erstellen
-- Falls RLS aktiviert bleiben soll
/*
DROP POLICY IF EXISTS "Allow all operations" ON storage.objects;
CREATE POLICY "Allow all operations" ON storage.objects
FOR ALL 
TO public
USING (true)
WITH CHECK (true);
*/

SELECT 'Bucket-Einstellungen aktualisiert!' as status;
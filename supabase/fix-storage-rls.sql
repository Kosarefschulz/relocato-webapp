-- =====================================================
-- STORAGE RLS POLICIES FIX
-- =====================================================
-- In Supabase werden Storage-Policies über RLS auf storage.objects verwaltet

-- 1. Prüfen ob der Bucket existiert
SELECT * FROM storage.buckets WHERE id = 'furniture-scans';

-- 2. RLS auf storage.objects aktivieren (falls noch nicht)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Bestehende Policies für storage.objects anzeigen
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects';

-- 4. Alle bestehenden Policies für furniture-scans löschen
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete" ON storage.objects;

-- 5. Neue permissive Policies erstellen (erlaubt ALLES für furniture-scans)
-- Diese Policies erlauben anonymen Zugriff für Tests

-- SELECT (Lesen/Anzeigen)
CREATE POLICY "Allow public access to furniture-scans" ON storage.objects
FOR SELECT USING (bucket_id = 'furniture-scans');

-- INSERT (Hochladen)
CREATE POLICY "Allow anyone to upload to furniture-scans" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'furniture-scans');

-- UPDATE (Aktualisieren)
CREATE POLICY "Allow anyone to update furniture-scans" ON storage.objects
FOR UPDATE USING (bucket_id = 'furniture-scans');

-- DELETE (Löschen)
CREATE POLICY "Allow anyone to delete from furniture-scans" ON storage.objects
FOR DELETE USING (bucket_id = 'furniture-scans');

-- 6. Bucket-Einstellungen aktualisieren
UPDATE storage.buckets 
SET 
  public = true,
  file_size_limit = 10485760, -- 10MB (erhöht von 5MB)
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']::text[]
WHERE id = 'furniture-scans';

-- 7. Überprüfen ob alles korrekt ist
SELECT 
  b.id as bucket_id,
  b.name as bucket_name,
  b.public,
  b.file_size_limit,
  b.allowed_mime_types,
  COUNT(p.policyname) as policy_count
FROM storage.buckets b
LEFT JOIN pg_policies p ON p.schemaname = 'storage' 
  AND p.tablename = 'objects' 
  AND p.qual LIKE '%furniture-scans%'
WHERE b.id = 'furniture-scans'
GROUP BY b.id, b.name, b.public, b.file_size_limit, b.allowed_mime_types;

-- 8. Test: Zeige alle Policies für storage.objects
SELECT 
  policyname,
  permissive,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND qual LIKE '%furniture-scans%';

-- =====================================================
-- ALTERNATIVE: Komplett offene Policies (NUR FÜR TESTS!)
-- =====================================================
-- Falls immer noch Probleme auftreten, können Sie temporär ALLE Beschränkungen aufheben:

/*
-- WARNUNG: Dies macht den Bucket komplett offen!
DROP POLICY IF EXISTS "Open Policy" ON storage.objects;
CREATE POLICY "Open Policy" ON storage.objects
FOR ALL USING (true) WITH CHECK (true);
*/

-- =====================================================
-- BUCKET NEU ERSTELLEN (falls alles andere fehlschlägt)
-- =====================================================
/*
-- 1. Alten Bucket löschen
DELETE FROM storage.buckets WHERE id = 'furniture-scans';

-- 2. Neuen Bucket erstellen
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'furniture-scans',
  'furniture-scans',
  true,
  10485760, -- 10MB
  NULL -- Alle MIME-Types erlauben
);

-- 3. Offene Policy erstellen
CREATE POLICY "Open Access" ON storage.objects
FOR ALL USING (bucket_id = 'furniture-scans') WITH CHECK (bucket_id = 'furniture-scans');
*/

SELECT 'Storage RLS Policies erfolgreich konfiguriert!' as status;
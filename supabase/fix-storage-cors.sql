-- =====================================================
-- STORAGE CORS FIX FÜR FOTO-UPLOAD
-- =====================================================

-- 1. Prüfen ob der Bucket existiert
SELECT * FROM storage.buckets WHERE id = 'furniture-scans';

-- 2. CORS-Einstellungen für den Bucket setzen
-- Dies erlaubt Uploads von Ihrer Domain
UPDATE storage.buckets 
SET 
  public = true,
  file_size_limit = 5242880, -- 5MB
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']::text[]
WHERE id = 'furniture-scans';

-- 3. Storage Policies überprüfen
SELECT * FROM storage.objects WHERE bucket_id = 'furniture-scans' LIMIT 5;

-- 4. Alle Policies für den Bucket anzeigen
SELECT 
  name,
  definition,
  operation
FROM storage.policies 
WHERE bucket_id = 'furniture-scans';

-- 5. Sicherstellen dass Public Access erlaubt ist
-- Falls die Policies fehlen, diese erstellen:
DO $$ 
BEGIN
    -- Check if policy exists before creating
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE bucket_id = 'furniture-scans' 
        AND name = 'Public Access'
        AND operation = 'SELECT'
    ) THEN
        INSERT INTO storage.policies (bucket_id, name, definition, operation)
        VALUES ('furniture-scans', 'Public Access', 'true'::jsonb, 'SELECT');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE bucket_id = 'furniture-scans' 
        AND name = 'Public Upload'
        AND operation = 'INSERT'
    ) THEN
        INSERT INTO storage.policies (bucket_id, name, definition, operation)
        VALUES ('furniture-scans', 'Public Upload', 'true'::jsonb, 'INSERT');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE bucket_id = 'furniture-scans' 
        AND name = 'Public Update'
        AND operation = 'UPDATE'
    ) THEN
        INSERT INTO storage.policies (bucket_id, name, definition, operation)
        VALUES ('furniture-scans', 'Public Update', 'true'::jsonb, 'UPDATE');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE bucket_id = 'furniture-scans' 
        AND name = 'Public Delete'
        AND operation = 'DELETE'
    ) THEN
        INSERT INTO storage.policies (bucket_id, name, definition, operation)
        VALUES ('furniture-scans', 'Public Delete', 'true'::jsonb, 'DELETE');
    END IF;
END $$;

-- 6. Test ob alles funktioniert
SELECT 
  'Storage Bucket Status:' as info,
  COUNT(*) as bucket_count,
  bool_or(public) as has_public_bucket
FROM storage.buckets 
WHERE id = 'furniture-scans';

-- =====================================================
-- ALTERNATIVE: Bucket neu erstellen (falls korrupt)
-- =====================================================
-- Falls der Bucket Probleme macht, können Sie ihn löschen und neu erstellen:

/*
-- Bucket löschen (VORSICHT: Löscht alle Dateien!)
DELETE FROM storage.buckets WHERE id = 'furniture-scans';

-- Bucket neu erstellen
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'furniture-scans',
  'furniture-scans', 
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']::text[]
);

-- Policies neu erstellen
INSERT INTO storage.policies (bucket_id, name, definition, operation)
VALUES 
  ('furniture-scans', 'Public Access', 'true'::jsonb, 'SELECT'),
  ('furniture-scans', 'Public Upload', 'true'::jsonb, 'INSERT'),
  ('furniture-scans', 'Public Update', 'true'::jsonb, 'UPDATE'),
  ('furniture-scans', 'Public Delete', 'true'::jsonb, 'DELETE');
*/
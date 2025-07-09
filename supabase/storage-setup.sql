-- Storage Bucket erstellen (falls noch nicht vorhanden)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'furniture-scans', 
  'furniture-scans', 
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Policies erstellen
CREATE POLICY "Public Access" ON storage.objects 
FOR SELECT USING (bucket_id = 'furniture-scans');

CREATE POLICY "Authenticated users can upload" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'furniture-scans');

CREATE POLICY "Users can update own images" ON storage.objects 
FOR UPDATE USING (bucket_id = 'furniture-scans');

CREATE POLICY "Users can delete own images" ON storage.objects 
FOR DELETE USING (bucket_id = 'furniture-scans');
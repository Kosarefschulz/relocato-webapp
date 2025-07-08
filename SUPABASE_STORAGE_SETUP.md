# Supabase Storage Setup für Foto-Upload

## Problem
Der Foto-Upload funktioniert nicht, weil der Storage Bucket `furniture-scans` fehlt.

## Lösung

### Option 1: Über Supabase Dashboard (Empfohlen)

1. **Einloggen bei Supabase**
   - Gehen Sie zu: https://app.supabase.com
   - Loggen Sie sich mit Ihren Zugangsdaten ein

2. **Storage Bucket erstellen**
   - Navigieren Sie zu **Storage** im linken Menü
   - Klicken Sie auf **New bucket**
   - Geben Sie ein:
     - Name: `furniture-scans`
     - Public bucket: ✅ aktivieren
     - File size limit: 5MB
     - Allowed MIME types: `image/jpeg, image/jpg, image/png, image/webp`
   - Klicken Sie auf **Create bucket**

3. **Policies konfigurieren**
   - Klicken Sie auf den neuen Bucket `furniture-scans`
   - Gehen Sie zu **Policies**
   - Klicken Sie auf **New Policy**
   - Wählen Sie **For full customization**
   - Fügen Sie die Policies aus der SQL-Option unten hinzu

### Option 2: Über SQL Editor

1. Öffnen Sie den **SQL Editor** in Supabase
2. Führen Sie dieses SQL aus:

```sql
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
```

## Nach der Einrichtung

1. **Testen Sie den Upload** im Volume Scanner
2. Fotos sollten jetzt hochgeladen werden können
3. Die Fotos sind öffentlich zugänglich

## Alternative: Ohne Fotos arbeiten

Während der Einrichtung können Sie:
- **Manuelle Eingabe** verwenden (ohne Fotos)
- **AR-Scan** nutzen (benötigt keine Foto-Uploads)

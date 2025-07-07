# Supabase Storage Setup für Briefbogen-Upload

## 1. Storage Bucket erstellen

1. Gehe zu deinem Supabase Dashboard
2. Klicke auf "Storage" im linken Menü
3. Klicke auf "New bucket"
4. Erstelle einen Bucket mit dem Namen: `branding`
5. Setze den Bucket auf "Public" (damit die Bilder in PDFs angezeigt werden können)

## 2. Storage Policies einrichten

Füge folgende Policies für den `branding` Bucket hinzu:

### Policy 1: Öffentliches Lesen
```sql
-- Name: Public read access
-- Allowed operation: SELECT

CREATE POLICY "Public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'branding');
```

### Policy 2: Authentifiziertes Hochladen
```sql
-- Name: Authenticated users can upload
-- Allowed operation: INSERT

CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'branding' 
  AND auth.role() = 'authenticated'
);
```

### Policy 3: Authentifiziertes Löschen
```sql
-- Name: Authenticated users can delete
-- Allowed operation: DELETE

CREATE POLICY "Authenticated users can delete" ON storage.objects
FOR DELETE USING (
  bucket_id = 'branding' 
  AND auth.role() = 'authenticated'
);
```

## 3. Alternative: Öffentlicher Zugriff (für Tests)

Wenn du erstmal ohne Authentifizierung testen willst:

```sql
-- Erlaube allen Zugriff (NUR FÜR TESTS!)
CREATE POLICY "Allow all" ON storage.objects
FOR ALL USING (bucket_id = 'branding');
```

## 4. Test

Nach dem Setup solltest du:
1. Die App neu laden
2. Zu "Einstellungen" > "PDF-Vorlagen" gehen
3. Ein Unternehmen auswählen
4. Auf "Branding bearbeiten" klicken
5. Einen Briefbogen hochladen können

## Troubleshooting

Falls es nicht funktioniert:
1. Prüfe in der Browser-Konsole auf Fehler
2. Stelle sicher, dass der Bucket "branding" existiert
3. Prüfe die Storage Policies
4. Kontrolliere, ob CORS richtig konfiguriert ist (sollte standardmäßig passen)
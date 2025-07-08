# AR Scanner Anleitung für Relocato

## 📱 Voraussetzungen für AR

- **iPhone 6s oder neuer** (für AR-Funktionen)
- **iPhone 12 Pro oder neuer** (für LiDAR-Scanner)
- **iOS 13 oder höher**
- Die Relocato AR App muss installiert sein

## 🚀 AR-Funktion nutzen

### 1. AR Scanner starten

1. Öffnen Sie die Relocato Web-App auf Ihrem iPhone
2. Gehen Sie zu **Kunden → Volume Scanner**
3. Wählen Sie einen Raum aus
4. Klicken Sie auf den **AR-Scan (iPhone)** Button
   - Der Button zeigt ein LiDAR-Badge, wenn Ihr iPhone LiDAR unterstützt

### 2. AR-Messungen durchführen

Nach dem Start der AR-App:

#### **Distanzmessung** 📏
- Tippen Sie auf einen Startpunkt
- Tippen Sie auf einen Endpunkt
- Die Distanz wird automatisch berechnet und angezeigt

#### **Flächenmessung** 📐
- Tippen Sie auf 4 Eckpunkte einer Fläche
- Die Fläche wird automatisch berechnet

#### **Möbelerkennung** 🪑
- Wechseln Sie in den "Scannen"-Modus
- Richten Sie die Kamera auf ein Möbelstück
- Die App erkennt automatisch Möbeltyp und Dimensionen

### 3. Daten zurück zur Web-App

- Tippen Sie auf **"Fertig"** wenn alle Messungen abgeschlossen sind
- Die Daten werden automatisch zur Web-App übertragen
- Sie sehen die gescannten Objekte mit AR-Badge in der Übersicht

## 🔧 Foto-Upload Problem beheben

### Sofortlösung:
1. **In Supabase Dashboard einloggen**
2. **Storage → New Bucket** erstellen:
   - Name: `furniture-scans`
   - Public bucket: ✅ aktivieren
3. **SQL Editor** öffnen und folgendes ausführen:

```sql
-- Storage Bucket erstellen
INSERT INTO storage.buckets (id, name, public)
VALUES ('furniture-scans', 'furniture-scans', true)
ON CONFLICT (id) DO NOTHING;

-- Berechtigungen setzen
CREATE POLICY "Public Access" ON storage.objects 
FOR SELECT USING (bucket_id = 'furniture-scans');

CREATE POLICY "Authenticated users can upload" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'furniture-scans');
```

### Alternative: Temporärer Fix
Wenn Sie keinen Zugriff auf Supabase haben, nutzen Sie:
- **Manuelle Eingabe** statt Foto-Scan
- **AR-Scan** (keine Fotos nötig)

## 📸 Foto-Scan verwenden

Nach dem Fix:
1. Klicken Sie auf **"Foto-Scan"**
2. Wählen Sie Fotos aus oder nehmen Sie neue auf
3. Die App erkennt automatisch Möbeltyp und Dimensionen
4. Überprüfen und anpassen Sie die Werte
5. Speichern Sie das Möbelstück

## 🎯 Tipps für beste Ergebnisse

### AR-Scan:
- **Gute Beleuchtung** verwenden
- **Langsame Bewegungen** für bessere Erkennung
- **Mehrere Winkel** scannen für Genauigkeit
- Bei LiDAR: **1-3 Meter Abstand** optimal

### Foto-Scan:
- **Gesamtes Möbelstück** im Bild
- **Klare Kanten** sichtbar
- **Referenzobjekt** (z.B. Tür) für Größenschätzung

## ❓ Häufige Probleme

### "AR nicht verfügbar"
- Prüfen Sie, ob Sie ein iPhone verwenden
- Starten Sie die App neu
- Erlauben Sie Kamerazugriff in den Einstellungen

### "Foto-Upload fehlgeschlagen"
- Supabase Storage Bucket fehlt → siehe Anleitung oben
- Internetverbindung prüfen
- Foto-Größe reduzieren (max. 5MB)

### "Messungen ungenau"
- Mehr Licht verwenden
- Näher an das Objekt gehen
- Mehrere Messungen durchführen und Durchschnitt nehmen

## 📞 Support

Bei weiteren Problemen:
- Email: support@relocato.de
- Im Dashboard: Hilfe → Feedback senden
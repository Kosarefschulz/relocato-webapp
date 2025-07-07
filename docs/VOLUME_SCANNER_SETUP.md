# Volume Scanner Setup Guide

## Übersicht

Der Volume Scanner ermöglicht es Umzugsberatern, Möbel mit der Kamera zu scannen und automatisch das Volumen zu berechnen. Die App nutzt Google Vision API für die AI-basierte Möbelerkennung.

## Funktionen

- **Foto-Scan**: Fotografiere Möbel und lass die AI den Typ erkennen
- **Manuelle Eingabe**: Gib Maße manuell ein
- **Schnellauswahl**: Wähle aus häufigen Möbeltypen
- **Volumen-Berechnung**: Automatische m³-Berechnung
- **Raum-Organisation**: Ordne Möbel nach Räumen
- **Integration**: Direkte Übernahme in Angebote

## Google Vision API Setup

### 1. Google Cloud Console

1. Gehe zu https://console.cloud.google.com
2. Erstelle ein neues Projekt oder wähle ein bestehendes
3. Aktiviere die "Cloud Vision API"
4. Erstelle API-Credentials (API Key)

### 2. API Key in Vercel

Füge den API Key als Umgebungsvariable hinzu:

```bash
REACT_APP_GOOGLE_VISION_API_KEY=dein-api-key
```

In Vercel:
1. Project Settings → Environment Variables
2. Name: `REACT_APP_GOOGLE_VISION_API_KEY`
3. Value: Dein Google Vision API Key
4. Environment: Production, Preview, Development

### 3. Kosten

- **Kostenlos**: Erste 1000 Bilder/Monat
- **Danach**: $1.50 pro 1000 Bilder für Object Detection
- **Geschätzt**: €20-50/Monat bei 100 Scans/Tag

## Verwendung

### Für Umzugsberater

1. **Kunde öffnen** → "Volumen scannen" Button
2. **Raum wählen** (Wohnzimmer, Schlafzimmer, etc.)
3. **Möbel scannen**:
   - Foto-Scan: Foto machen → AI erkennt Typ
   - Schnellauswahl: Häufige Möbel direkt wählen
   - Manuell: Maße selbst eingeben
4. **Überprüfen**: Maße kontrollieren und anpassen
5. **Speichern**: Scan-Session abschließen

### AI-Erkennung

Die AI erkennt automatisch:
- Sofas, Betten, Schränke
- Tische, Stühle, Regale
- Kühlschränke, Waschmaschinen
- Und viele weitere Möbeltypen

**Genauigkeit**:
- Hoch (>80%): Automatische Übernahme
- Mittel (60-80%): Bitte überprüfen
- Niedrig (<60%): Manuell auswählen

## Offline-Modus

Ohne Google Vision API funktioniert die App im Mock-Modus:
- Manuelle Eingabe funktioniert immer
- Schnellauswahl mit Standard-Maßen
- Keine automatische Foto-Erkennung

## Technische Details

### Datenbank-Tabellen

- `scan_sessions`: Scan-Sitzungen pro Kunde
- `scanned_furniture`: Einzelne Möbelstücke
- `room_scans`: Raum-Informationen
- `scan_photos`: Foto-Speicher

### Storage

Fotos werden in Supabase Storage gespeichert:
- Bucket: `furniture-scans`
- Struktur: `/scans/{item-id}/photo_{timestamp}.jpg`

### Integration

Gescannte Daten können direkt in Angebote übernommen werden:
- Automatische Volumen-Berechnung
- LKW-Größen-Empfehlung
- Zeitaufwand-Schätzung

## Troubleshooting

### "AI-Erkennung nicht verfügbar"
- Prüfe ob API Key konfiguriert ist
- Prüfe Google Cloud Console für Fehler
- Fallback: Nutze manuelle Eingabe

### "Foto-Upload fehlgeschlagen"
- Prüfe Internetverbindung
- Prüfe Supabase Storage Limits
- Versuche kleinere Fotos

### "Volumen scheint unrealistisch"
- Prüfe eingegebene Maße (cm!)
- Standard-Maße in `FURNITURE_DIMENSIONS`
- Manuelle Korrektur immer möglich

## Zukünftige Features

- [ ] AR-Messung mit LiDAR (iPhone 12+)
- [ ] Barcode-Scanner für Kartons
- [ ] Gewichts-Schätzung
- [ ] 3D-Modell Export
- [ ] Team-Sharing von Scans
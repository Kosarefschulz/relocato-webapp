# Foto-Funktionalität in der Umzugs-WebApp

## Übersicht

Die Foto-Funktionalität ermöglicht es, Fotos von Kundenimmobilien zu erfassen, zu kategorisieren und zu verwalten. Die Fotos werden derzeit lokal im Browser gespeichert, die Google Drive Integration ist vorbereitet.

## Features

### 1. Foto-Upload
- **Multi-Upload**: Mehrere Fotos gleichzeitig hochladen
- **Kategorisierung**: 12 vordefinierte Kategorien (Wohnzimmer, Küche, Bad, etc.)
- **Beschreibung**: Optionale Beschreibung für jedes Foto
- **Fortschrittsanzeige**: Upload-Progress wird angezeigt
- **Validierung**: 
  - Nur Bilddateien erlaubt
  - Maximale Dateigröße: 10 MB pro Bild
  - Automatische Komprimierung großer Bilder

### 2. Foto-Anzeige
- **Kategorien-Tabs**: Fotos nach Kategorien gefiltert anzeigen
- **Thumbnail-Ansicht**: Optimierte Vorschaubilder (300x300px)
- **Grid-Layout**: Responsive Darstellung (1-3 Spalten)
- **Vollbild-Viewer**: Fotos in voller Größe betrachten
- **Foto-Informationen**: Dateiname, Kategorie, Beschreibung, Upload-Datum

### 3. Foto-Verwaltung
- **Download**: Einzelne Fotos herunterladen
- **Löschen**: Fotos mit Bestätigung löschen
- **Statistiken**: Anzahl Fotos pro Kategorie
- **Speicherverwaltung**: Automatisches Löschen alter Fotos bei Speicherplatzmangel

### 4. Kategorien
- 🛋️ Wohnzimmer
- 🛏️ Schlafzimmer
- 🍳 Küche
- 🚿 Bad
- 🚪 Flur
- 🏚️ Keller
- 🏠 Dachboden
- 🚗 Garage
- 🌳 Garten
- ⚠️ Schäden
- ⭐ Besonderheiten
- 📦 Sonstiges

## Technische Details

### Speicherung
- **localStorage**: Fotos werden als Base64-Strings gespeichert
- **Komprimierung**: Bilder werden auf max. 1920px Breite komprimiert
- **Thumbnails**: Automatische Generierung von 300x300px Vorschaubildern
- **Limit**: Maximal 100 Fotos pro Browser (älteste werden automatisch gelöscht)

### Google Drive Integration (vorbereitet)
- **Service Account**: relocato-drive-service@umzugs-app.iam.gserviceaccount.com
- **Folder ID**: 1Q7hSlmX2PXtUiPihcwRB12gXC-pxIhnJ
- **Credentials**: In .env konfiguriert
- **Status**: Bereit zur Implementierung (derzeit localStorage)

### Komponenten
- `CustomerPhotos.tsx`: Hauptkomponente für Foto-Verwaltung
- `googleDriveService.ts`: Service für Foto-Speicherung

## Verwendung

1. **Kunde öffnen**: In der Kundendetailansicht
2. **Tab "Fotos"**: Zweiter Tab in der Navigation
3. **Hochladen**: Button "Fotos hochladen" klicken
4. **Kategorisieren**: Kategorie auswählen (Pflichtfeld)
5. **Beschreiben**: Optional eine Beschreibung hinzufügen
6. **Speichern**: Upload starten

## Zukünftige Erweiterungen

1. **Google Drive Upload**: Direkte Speicherung in Google Drive
2. **PDF-Integration**: Fotos in Angebots-PDFs einbinden
3. **Bulk-Operationen**: Mehrere Fotos gleichzeitig bearbeiten/löschen
4. **Metadaten**: EXIF-Daten auslesen (Aufnahmedatum, GPS, etc.)
5. **Bildbearbeitung**: Zuschneiden, Drehen, Helligkeit anpassen
6. **Kommentare**: Notizen direkt auf Fotos zeichnen
7. **Export**: Alle Fotos als ZIP herunterladen

## Performance

- **Lazy Loading**: Bilder werden erst bei Bedarf geladen
- **Thumbnail-Optimierung**: Kleine Vorschaubilder für schnelle Ladezeiten
- **Speicher-Management**: Automatische Bereinigung bei Platzmangel
- **Komprimierung**: JPEG-Qualität 85% für optimale Balance

## Sicherheit

- **Validierung**: Nur Bilddateien werden akzeptiert
- **Größenlimit**: Maximal 10 MB pro Datei
- **Lokale Speicherung**: Keine Datenübertragung an externe Server (derzeit)
- **Zugriffskontrolle**: Fotos nur für angemeldete Benutzer sichtbar
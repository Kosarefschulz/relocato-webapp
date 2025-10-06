# 📁 Kundendateien-System Setup

## Übersicht

Vollständiges Dateiverwaltungs-System für Kunden mit:
- ✅ Drag & Drop Upload
- ✅ Automatische PDF-Analyse beim Upload
- ✅ Kategorisierung (Angebote, Rechnungen, Verträge, etc.)
- ✅ Datei-Vorschau und Download
- ✅ Automatische Angebotserstellung aus PDFs

---

## 🚀 Deployment (2 Schritte)

### Schritt 1: Storage Bucket erstellen

**Im Supabase Dashboard:**

1. Gehe zu: https://supabase.com/dashboard/project/kmxipuaqierjqaikuimi/storage/buckets
2. Klicke **"New bucket"**
3. Konfiguration:
   ```
   Name: customer-files
   Public: OFF (privat)
   File size limit: 50 MB
   Allowed MIME types:
     - application/pdf
     - image/png
     - image/jpeg
     - application/msword
     - application/vnd.openxmlformats-officedocument.wordprocessingml.document
     - application/vnd.ms-excel
     - application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
   ```
4. Klicke **"Create bucket"**

**Policies hinzufügen:**

Im Bucket → Policies → New Policy:

```sql
-- Upload Policy
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'customer-files');

-- Download Policy
CREATE POLICY "Authenticated users can download files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'customer-files');

-- Delete Policy
CREATE POLICY "Authenticated users can delete files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'customer-files');
```

### Schritt 2: Datenbank-Migration

**Im Supabase Dashboard SQL Editor:**

1. Öffne: https://supabase.com/dashboard/project/kmxipuaqierjqaikuimi/editor
2. SQL Editor → New Query
3. Kopiere Inhalt von: `supabase/migrations/20251001_add_customer_files.sql`
4. Ausführen (Run)

✅ **Fertig!**

---

## 💡 Funktionen

### Automatischer Workflow

1. **Datei hochladen** (Drag & Drop oder Klick)
   - Datei wird in Supabase Storage gespeichert
   - Datenbank-Eintrag wird erstellt

2. **Automatische Kategorisierung**
   - Dateiname enthält "angebot" → Kategorie: Angebot
   - Dateiname enthält "rechnung" → Kategorie: Rechnung
   - Dateiname enthält "vertrag" → Kategorie: Vertrag
   - Sonst: Allgemein

3. **Automatisches PDF-Parsing** (im Hintergrund)
   - PDF wird an `parse-pdf-ruempel` Edge Function geschickt
   - Daten werden extrahiert (Preise, Leistungen, etc.)
   - Geparste Daten werden in `parsed_data` gespeichert
   - Status: pending → processing → completed/failed

4. **Automatische Angebotserstellung**
   - Wenn Angebotsnummer gefunden → Angebot wird erstellt
   - Verknüpfung zum Kunden
   - Follow-ups werden angelegt

### Features

- **Drag & Drop Upload** mit Mehrfachauswahl
- **Kategorisierung**: Angebot, Rechnung, Vertrag, Besichtigung, Sonstiges
- **Automatische PDF-Analyse** ohne manuelle Aktion
- **Datei-Vorschau** (geparste Daten)
- **Download** mit signierten URLs
- **Soft Delete** (Wiederherstellung möglich)
- **Statistiken** pro Kunde
- **Suche & Filter** nach Kategorie, Typ, Datum

---

## 📊 Datenbank-Schema

### customer_files Tabelle

```sql
id                UUID PRIMARY KEY
customer_id       TEXT NOT NULL
file_name         TEXT
file_type         TEXT (pdf, png, jpg, etc.)
file_size         BIGINT (in Bytes)
file_path         TEXT (Storage-Pfad)
category          TEXT (angebot, rechnung, vertrag, etc.)
parsed_data       JSONB (Automatisch extrahierte Daten)
is_parsed         BOOLEAN
parse_status      TEXT (pending, processing, completed, failed)
parse_error       TEXT
description       TEXT
tags              TEXT[]
uploaded_at       TIMESTAMP
```

### Beispiel parsed_data:

```json
{
  "offerNumber": "AG0159",
  "customerNumber": "10253",
  "offerDate": "2025-10-01",
  "validUntil": "2025-10-31",
  "pricing": {
    "netAmount": 2941.18,
    "vatRate": 19,
    "vatAmount": 558.82,
    "grossAmount": 3500.00
  },
  "service": {
    "type": "Hausauflösung Komplettservice",
    "rooms": ["Dachboden", "EG", "Keller"]
  }
}
```

---

## 🎯 Verwendung

### In Kundendetails

1. Kunde öffnen
2. **"Dateien"** Tab auswählen
3. Dateien per Drag & Drop hochladen
4. System analysiert automatisch PDFs
5. Geparste Daten werden angezeigt

### Automatische Aktionen

**Bei PDF-Upload:**
- ✅ Datei wird gespeichert
- ✅ PDF wird im Hintergrund geparst
- ✅ Wenn Angebots-PDF: Angebot wird erstellt
- ✅ Wenn Rechnungs-PDF: Daten werden extrahiert
- ✅ Preise werden dem Kunden zugeordnet

**Bei Bild-Upload:**
- ✅ Datei wird gespeichert
- ✅ Kategorie "Besichtigung" wenn "foto" im Namen
- ✅ Verfügbar für spätere Verwendung

---

## 🔍 API Funktionen

### customerFilesService

```typescript
// Datei hochladen
const result = await customerFilesService.uploadFile(
  customerId,
  file,
  'angebot',
  'Angebot vom 01.10.2025'
);

// Alle Dateien laden
const files = await customerFilesService.getCustomerFiles(customerId);

// Download-URL generieren
const url = await customerFilesService.getDownloadUrl(filePath);

// Datei löschen
await customerFilesService.deleteFile(fileId);

// PDF neu parsen
await customerFilesService.reparseFile(fileId);

// Statistiken
const stats = await customerFilesService.getFileStats(customerId);
```

---

## 📋 Storage-Struktur

```
customer-files/
├── K123/                     (Kunden-ID)
│   ├── uuid-1/
│   │   └── angebot_AG0159.pdf
│   ├── uuid-2/
│   │   └── rechnung_2025.pdf
│   └── uuid-3/
│       └── besichtigung.jpg
└── K456/
    └── ...
```

---

## 🧪 Testen

### Browser Console

```javascript
// Service importieren
const { customerFilesService } = await import('./services/customerFilesService');

// Dateien eines Kunden
const files = await customerFilesService.getCustomerFiles('K123');
console.table(files);

// Statistiken
const stats = await customerFilesService.getFileStats('K123');
console.log(stats);
```

---

## 🎨 UI-Features

### Dateien-Tab

**Anzeige:**
- 📊 Statistiken-Cards (Gesamt, PDFs, Rechnungen, Größe)
- 📤 Drag & Drop Upload-Bereich
- 📋 Dateiliste mit:
  - Icon nach Dateityp
  - Kategorie-Badge
  - Parse-Status (bei PDFs)
  - Größe und Datum
  - Geparster Preis (wenn vorhanden)

**Aktionen:**
- ⬇️ Download
- 🔄 Neu parsen (bei PDFs)
- ✏️ Bearbeiten (Kategorie, Beschreibung)
- 🗑️ Löschen

### Automatische Kategorisierung

**Dateiname → Kategorie:**
- "angebot_AG0159.pdf" → Angebot
- "rechnung_2025.pdf" → Rechnung
- "vertrag_mietvertrag.pdf" → Vertrag
- "besichtigung_wohnung.jpg" → Besichtigung

---

## 🔧 Konfiguration

### Erlaubte Dateitypen erweitern

**In `customerFilesService.ts`:**

```typescript
allowedMimeTypes: [
  'application/pdf',
  'image/png',
  // Neue Typen hinzufügen:
  'text/plain',
  'application/zip',
]
```

### Maximale Dateigröße ändern

```typescript
fileSizeLimit: 104857600, // 100MB statt 50MB
```

---

## 📈 Workflow-Beispiel

### Kunde erhält Angebot als PDF

1. **Upload:**
   - Datei "Angebot_AG0159_Schwind.pdf" hochladen
   - System erkennt automatisch: Kategorie = "Angebot"

2. **Automatisches Parsing:**
   - Status: pending → processing
   - PDF wird an Edge Function geschickt
   - Daten werden extrahiert:
     - Angebotsnummer: AG0159
     - Kunde: Sabine Schwind
     - Preis: 3.500,00 €
     - Leistungen: Hausauflösung

3. **Automatische Angebotserstellung:**
   - Neuer Eintrag in `offers` Tabelle
   - Status: "offen"
   - Follow-ups werden angelegt

4. **Anzeige:**
   - Datei erscheint in Dateiliste
   - Badge: "Angebot"
   - Preis: 3.500,00 € wird angezeigt
   - Status: ✅ Geparst

---

## ⚠️ Wichtige Hinweise

1. **Storage Bucket MUSS erstellt werden** im Supabase Dashboard
2. **Policies MÜSSEN gesetzt werden** für Upload/Download
3. **Migration MUSS ausgeführt werden** für Datenbank-Tabellen
4. **PDF-Parsing läuft asynchron** (dauert 2-5 Sekunden)

---

## 🐛 Troubleshooting

### "Upload failed: Bucket not found"

→ Storage Bucket noch nicht erstellt (siehe Schritt 1 oben)

### "Permission denied"

→ Storage Policies fehlen (siehe Bucket Policies oben)

### PDF wird nicht geparst

→ Prüfe `customer_files` Tabelle:
```sql
SELECT id, file_name, parse_status, parse_error
FROM customer_files
WHERE customer_id = 'K123'
AND file_type = 'pdf';
```

### Edge Function Fehler

→ Logs ansehen:
```bash
npx supabase functions logs parse-pdf-ruempel
```

---

## ✅ Deployment-Checklist

- [ ] Storage Bucket "customer-files" erstellt
- [ ] Storage Policies gesetzt (Upload, Download, Delete)
- [ ] Datenbank-Migration ausgeführt
- [ ] Frontend neu gebaut (`npm run build`)
- [ ] Datei-Upload getestet
- [ ] PDF-Parsing funktioniert
- [ ] Angebotserstellung funktioniert

**Alles ✅? System ist einsatzbereit! 🚀**

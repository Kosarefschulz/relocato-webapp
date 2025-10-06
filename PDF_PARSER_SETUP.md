# PDF Parser Setup & Verwendung

## Übersicht

Der PDF-Parser extrahiert automatisch Kundendaten, Preise und Leistungen aus PDF-Dateien (Rechnungen, Angebote).

## Features

- ✅ Automatische Extraktion von:
  - Kundenname, E-Mail, Telefon
  - Rechnungsnummer und Datum
  - Gesamtpreis
  - Einzelne Leistungen mit Preisen
- ✅ Unterstützt PDF-Dateien bis 10MB
- ✅ Direkte Integration in Kundendetails
- ✅ Standalone Upload-Komponente für Bulk-Import

## Komponenten

### 1. Supabase Edge Function (`parse-pdf`)
**Pfad:** `supabase/functions/parse-pdf/index.ts`

Parst PDF-Dateien serverseitig und extrahiert strukturierte Daten.

**Funktionen:**
- Text-Extraktion aus PDFs
- Regex-basierte Datenextraktion
- Intelligente Erkennung von Preisen, E-Mails, Telefonnummern
- Service-Erkennung (Umzugsservice, Verpackungsmaterial, etc.)

### 2. Frontend Service (`pdfParserService`)
**Pfad:** `src/services/pdfParserService.ts`

Kommuniziert mit der Supabase Edge Function und verwaltet PDF-Parsing im Frontend.

**Methoden:**
```typescript
// PDF parsen
await pdfParserService.parsePDF(pdfFile, customerId?)

// PDF parsen und Daten einem Kunden zuordnen
await pdfParserService.parsePDFAndAssignToCustomer(pdfFile, customerId)

// PDF-Datei validieren
pdfParserService.validatePDFFile(file)
```

### 3. UI-Komponenten

#### CustomerPdfParser
**Pfad:** `src/components/CustomerPdfParser.tsx`

Inline-Komponente für Kundendetails-Seite. Ermöglicht Upload und direktes Übernehmen von Daten.

**Props:**
```typescript
{
  customer: Customer;
  onDataUpdated?: () => void;
}
```

#### PdfUpload
**Pfad:** `src/components/PdfUpload.tsx`

Standalone-Komponente für Bulk-Import von PDFs.

**Props:**
```typescript
{
  customerId?: string;
  onParsed?: (data: ParsedPDFData) => void;
  onCustomerCreated?: (customerId: string) => void;
}
```

## Datenbank-Schema

**Migration:** `supabase/migrations/20251001_add_pdf_parsed_data.sql`

Neue Felder in `customers` Tabelle:
```sql
- parsed_services JSONB      -- Array von Services
- estimated_price DECIMAL     -- Geschätzter/Tatsächlicher Preis
- invoice_number TEXT         -- Rechnungsnummer
- invoice_date DATE           -- Rechnungsdatum
- pdf_metadata JSONB          -- Zusätzliche PDF-Metadaten
```

## Deployment

### 1. Supabase Edge Function deployen

```bash
# In supabase-Projekt einloggen
npx supabase login

# Function deployen
npx supabase functions deploy parse-pdf --project-ref YOUR_PROJECT_REF
```

### 2. Datenbank-Migration ausführen

```bash
# Migration anwenden
npx supabase db push --db-url $SUPABASE_DB_URL
```

Oder manuell in Supabase Dashboard:
1. SQL Editor öffnen
2. Inhalt von `supabase/migrations/20251001_add_pdf_parsed_data.sql` einfügen
3. Ausführen

### 3. Frontend bauen und deployen

```bash
npm run build
npm run deploy
```

## Integration in Kundendetails

Um den PDF-Parser in die Kundendetails-Seite zu integrieren, füge ein neues Tab hinzu:

**In `src/components/CustomerDetails.modern.tsx`:**

```tsx
import CustomerPdfParser from './CustomerPdfParser';

// In der Tabs-Liste:
<Tab label="PDF Parser" />

// Im TabPanel:
<TabPanel value={tabValue} index={X}>
  <CustomerPdfParser
    customer={customer!}
    onDataUpdated={loadCustomerData}
  />
</TabPanel>
```

## Verwendung

### 1. In Kundendetails (nach Integration)

1. Kundendetails öffnen
2. "PDF Parser" Tab wählen
3. PDF hochladen
4. Geparste Daten prüfen
5. "Daten übernehmen" klicken

### 2. Standalone Bulk-Import

Erstelle eine neue Route für den PDF-Import:

**`src/pages/PdfImportPage.tsx`:**
```tsx
import PdfUpload from '../components/PdfUpload';

const PdfImportPage = () => {
  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        PDF Import
      </Typography>
      <PdfUpload
        onCustomerCreated={(id) => {
          console.log('Kunde erstellt:', id);
        }}
      />
    </Container>
  );
};
```

## Erweiterte Konfiguration

### Custom Service-Erkennung

In `supabase/functions/parse-pdf/index.ts`, passe die `commonServices` Liste an:

```typescript
const commonServices = [
  'Umzugsservice',
  'Transportservice',
  'Verpackungsmaterial',
  // ... deine Services
];
```

### Preis-Muster erweitern

Erweitere die `pricePatterns` in der `extractPrices()` Funktion:

```typescript
const pricePatterns = [
  /(\d+[.,]\d{2})\s*€/g,
  /€\s*(\d+[.,]\d{2})/g,
  // ... weitere Muster
];
```

## Browser Console Testing

Für schnelle Tests in der Browser Console:

```javascript
// PDF-Parser Service importieren
const { pdfParserService } = await import('./services/pdfParserService');

// PDF-Datei aus Input holen
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.accept = '.pdf';
fileInput.onchange = async (e) => {
  const file = e.target.files[0];
  const result = await pdfParserService.parsePDF(file);
  console.log('Parsed:', result);
};
fileInput.click();
```

## Troubleshooting

### PDF wird nicht korrekt geparst

1. **Prüfe PDF-Format:** Manche PDFs sind Bilder (gescannt) und enthalten keinen extrahierbaren Text
2. **Erweitere Regex-Muster:** Passe die Extraktionsmuster in der Edge Function an
3. **Aktiviere Logging:** Schau in Supabase Logs für Details

### Edge Function Fehler

```bash
# Logs ansehen
npx supabase functions logs parse-pdf
```

### Datenbank-Fehler

Prüfe ob Migration erfolgreich war:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'customers'
AND column_name IN ('parsed_services', 'estimated_price', 'invoice_number');
```

## Beispiel-Workflow

1. **Kunde erhält Angebot als PDF**
2. **PDF in Kundendetails hochladen**
3. **System extrahiert:**
   - Name: Max Mustermann
   - E-Mail: max@example.com
   - Telefon: 0521 123456
   - Preis: 1.850,00 €
   - Services: Umzugsservice, Verpackungsmaterial, LKW-Miete
4. **Daten prüfen und übernehmen**
5. **Kunde wird automatisch aktualisiert**

## Support

Bei Fragen oder Problemen:
- Prüfe Supabase Logs
- Schau in Browser Console
- Teste Edge Function direkt im Supabase Dashboard

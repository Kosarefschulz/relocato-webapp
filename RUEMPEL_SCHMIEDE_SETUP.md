## Rümpel Schmiede PDF-Parser & CRM-Integration

Komplettes System zur automatischen Verarbeitung von Hausauflösungs-Angeboten mit CRM-Integration, Wiedervorlagen und Status-Tracking.

---

## 📋 Übersicht

Das System besteht aus:

1. **Spezialisierter PDF-Parser** für Rümpel Schmiede Angebote
2. **Vollständige Datenbank-Struktur** für Angebotsverwaltung
3. **CRM-Integration** mit automatischem Kunden-Matching
4. **Wiedervorlage-System** mit automatischen Follow-ups
5. **Validierung & Fehlerbehandlung**
6. **UI-Komponenten** für komfortable Verwaltung

---

## 🔧 Installation & Deployment

### 1. Datenbank-Migration ausführen

```bash
# Migration für Angebots-System
npx supabase db push --file supabase/migrations/20251001_add_offers_system.sql
```

Oder manuell im Supabase Dashboard SQL Editor:
- Inhalt von `supabase/migrations/20251001_add_offers_system.sql` einfügen
- Ausführen

**Erstellt folgende Tabellen:**
- `offers` - Haupttabelle für Angebote
- `offer_line_items` - Einzelne Leistungspositionen
- `offer_history` - Audit-Log für Änderungen
- `follow_ups` - Wiedervorlagen
- `v_active_offers` - View für aktive Angebote
- `v_expiring_offers` - View für bald ablaufende Angebote

### 2. Supabase Edge Function deployen

```bash
# Rümpel Schmiede Parser deployen
npx supabase functions deploy parse-pdf-ruempel --project-ref YOUR_PROJECT_REF
```

### 3. Frontend bauen

```bash
npm run build
npm run deploy
```

---

## 📄 Parser-Spezifikation

### Extrahierte Datenfelder

#### Angebotskopfdaten
```typescript
{
  offerNumber: "AG0159",          // Angebotsnummer
  customerNumber: "10253",         // Kundennummer
  offerDate: "01.10.2025",         // Angebotsdatum
  validUntil: "31.10.2025"         // Gültigkeitsdatum
}
```

#### Kundenstammdaten
```typescript
{
  customer: {
    salutation: "Frau",            // Anrede
    firstName: "Sabine",           // Vorname
    lastName: "Schwind",           // Nachname
    street: "Birkenkopfstraße 18B", // Straße
    zipCode: "34132",              // PLZ
    city: "Kassel",                // Ort
    fullAddress: "..."             // Vollständige Adresse
  }
}
```

#### Leistungsdetails
```typescript
{
  service: {
    type: "Hausauflösung nach Auszug - Komplettservice",
    objectSize: "ca. 200 qm",
    rooms: ["Dachboden", "EG", "1. OG", "Keller", "Schuppen", "2x Garage"],
    exceptions: ["3x Küche verbleibt", "Lampen bleiben", "Gardinen bleiben"],
    condition: "besenrein"
  }
}
```

#### Preisdaten
```typescript
{
  pricing: {
    netAmount: 2941.18,            // Nettobetrag
    vatRate: 19,                   // MwSt-Satz (%)
    vatAmount: 558.82,             // MwSt-Betrag
    grossAmount: 3500.00,          // Bruttobetrag
    priceType: "Pauschalpreis"     // Preisart
  }
}
```

#### Terminierung
```typescript
{
  appointments: [
    { date: "13.10.2025", time: "08:30" },
    { date: "14.10.2025", time: "08:30" }
  ]
}
```

#### Zahlungsbedingungen
```typescript
{
  payment: {
    timing: "direkt nach Durchführung vor Ort",
    methods: ["EC-Karte", "Bar"]
  }
}
```

---

## ✅ Validierungsregeln

### Pflichtfelder
- `offerNumber` - Angebotsnummer
- `offerDate` - Angebotsdatum
- `pricing.grossAmount` - Bruttobetrag

### Format-Validierung
- **Datum**: `DD.MM.YYYY` (z.B. 01.10.2025)
- **PLZ**: 5-stellig (z.B. 34132)
- **MwSt-Sätze**: 0%, 7%, 19%
- **Währung**: EUR
- **Max. Dateigröße**: 10MB

### Automatische Prüfungen
- ✅ Preisberechnung (Netto + MwSt = Brutto)
- ✅ Gültigkeitsdatum > Angebotsdatum
- ✅ PLZ-Format
- ✅ Datums-Format
- ✅ MwSt-Satz gültig

---

## 🔄 CRM-Integration Workflow

### 1. PDF hochladen
```typescript
// In UI-Komponente
const result = await ruempelPdfParserService.parsePDFAndCreateOffer(pdfFile, customerId);
```

### 2. Automatische Verarbeitung

**Schritt 1:** PDF-Parsing
- Text-Extraktion aus PDF
- Regex-basierte Datenextraktion
- Strukturierung der Daten

**Schritt 2:** Validierung
- Pflichtfelder prüfen
- Formate validieren
- Preisberechnung überprüfen

**Schritt 3:** Kunden-Matching
- Suche nach Kundennummer
- Suche nach Name + PLZ
- Falls nicht gefunden → Neuen Kunden erstellen

**Schritt 4:** Angebot erstellen
- Speichern in `offers` Tabelle
- Leistungspositionen in `offer_line_items`
- Status: "offen"

**Schritt 5:** Automatische Follow-ups
- Wiedervorlage 7 Tage vor Ablauf
- Wiedervorlage 2 Tage vor Termin

### 3. Status-Tracking

**Mögliche Status:**
- `offen` - Angebot erstellt
- `verhandlung` - In Verhandlung
- `angenommen` - Kunde hat zugestimmt
- `abgelehnt` - Kunde hat abgelehnt
- `abgelaufen` - Gültigkeit überschritten
- `storniert` - Manuell storniert

**Status-Änderung wird geloggt in:**
- `offer_history` Tabelle
- Automatische Timestamps (`accepted_at`, `rejected_at`)

---

## 📊 Wiedervorlage-System

### Automatische Follow-ups

**Bei Angebotserstellung:**

1. **7 Tage vor Ablauf**
   ```
   Typ: "Angebot läuft bald ab"
   Priorität: normal
   Notiz: "Angebot AG0159 läuft am 31.10.2025 ab. Kunde kontaktieren."
   ```

2. **2 Tage vor Termin**
   ```
   Typ: "Terminbestätigung einholen"
   Priorität: normal
   Notiz: "Termin am 13.10.2025 bestätigen lassen."
   ```

### Manuelle Follow-ups erstellen

```typescript
await offerService.createFollowUp({
  offer_id: "uuid",
  customer_id: "K123",
  due_date: "2025-10-20",
  priority: "hoch",
  type: "Nachverhandlung Preis",
  status: "offen",
  notes: "Kunde möchte Angebot besprechen"
});
```

### Wiedervorlage-Prioritäten
- `niedrig` - Routine-Aufgaben
- `normal` - Standard-Follow-ups
- `hoch` - Wichtige Termine
- `dringend` - Sofortige Aufmerksamkeit erforderlich

---

## 🎨 UI-Komponenten

### 1. OfferManager

**Pfad:** `src/components/OfferManager.tsx`

**Features:**
- PDF-Upload mit Drag & Drop
- Angebots-Liste mit Tabs (Offen / Angenommen / Geschlossen)
- Status-Änderung per Dropdown
- Detail-Ansicht mit allen Informationen
- Statistiken (Anzahl, Gesamtwert)

**Verwendung:**
```tsx
import OfferManager from './components/OfferManager';

<OfferManager
  customerId={customer.id}
  onOfferCreated={(offer) => console.log('Neues Angebot:', offer)}
/>
```

### 2. FollowUpManager

**Pfad:** `src/components/FollowUpManager.tsx`

**Features:**
- Übersicht offener Wiedervorlagen
- Priorisierung nach Fälligkeit
- Überfällige Einträge hervorgehoben
- "Erledigt" markieren
- Neue Wiedervorlagen erstellen

**Verwendung:**
```tsx
import FollowUpManager from './components/FollowUpManager';

// Für einen Kunden
<FollowUpManager customerId={customer.id} />

// Für alle Kunden
<FollowUpManager showAllCustomers={true} />
```

---

## 📈 API & Services

### offerService

```typescript
// Angebot aus PDF erstellen
await offerService.createOfferFromPDF(parsedData, customerId, fileName);

// Angebote eines Kunden laden
const offers = await offerService.getOffersByCustomer(customerId);

// Status ändern
await offerService.updateOfferStatus(offerId, 'angenommen', 'Kunde hat telefonisch zugestimmt');

// Leistungspositionen laden
const items = await offerService.getLineItems(offerId);

// Follow-up erstellen
await offerService.createFollowUp(followUpData);

// Offene Follow-ups laden
const followUps = await offerService.getPendingFollowUps(customerId);

// Follow-up erledigen
await offerService.completeFollowUp(followUpId);

// Statistiken
const stats = await offerService.getOfferStats();

// Abgelaufene Angebote aktualisieren
await offerService.updateExpiredOffers();
```

### ruempelPdfParserService

```typescript
// PDF parsen
const result = await ruempelPdfParserService.parsePDF(pdfFile);

// PDF parsen und Angebot erstellen
const result = await ruempelPdfParserService.parsePDFAndCreateOffer(pdfFile, customerId);

// Kunden aus PDF-Daten erstellen/finden
const customerId = await ruempelPdfParserService.upsertCustomerFromPDF(parsedData);

// Validierung
const validation = ruempelPdfParserService.validateParsedData(data);
const formatted = ruempelPdfParserService.formatValidationResults(validation);
```

---

## 🔍 Reporting & Views

### Aktive Angebote
```sql
SELECT * FROM v_active_offers;
```

**Beinhaltet:**
- Alle offenen und in Verhandlung befindlichen Angebote
- Verknüpfte Kundendaten
- Anzahl Leistungspositionen
- Anzahl offene Follow-ups

### Bald ablaufende Angebote
```sql
SELECT * FROM v_expiring_offers;
```

**Zeigt:**
- Angebote die in den nächsten 7 Tagen ablaufen
- Verbleibende Tage bis Ablauf
- Kundenkontaktdaten

---

## 🎯 Integration in Kundendetails

**In `CustomerDetails.modern.tsx`:**

```tsx
import OfferManager from './OfferManager';
import FollowUpManager from './FollowUpManager';

// Neue Tabs hinzufügen
<Tab label="Angebote" />
<Tab label="Wiedervorlagen" />

// In TabPanels
<TabPanel value={tabValue} index={X}>
  <OfferManager
    customerId={customer.id}
    onOfferCreated={loadCustomerData}
  />
</TabPanel>

<TabPanel value={tabValue} index={Y}>
  <FollowUpManager customerId={customer.id} />
</TabPanel>
```

---

## 🔧 Konfiguration & Anpassung

### Parser-Muster erweitern

**In `supabase/functions/parse-pdf-ruempel/index.ts`:**

```typescript
// Neue Leistungstypen hinzufügen
const serviceTypePatterns = [
  /Hausauflösung[^\n]*/gi,
  /Entrümpelung[^\n]*/gi,
  /Wohnungsauflösung[^\n]*/gi,  // NEU
];

// Neue Zahlungsmethoden
if (text.match(/Kreditkarte/i)) methods.push('Kreditkarte');
```

### Validierungsregeln anpassen

**In `src/services/ruempelPdfParserService.ts`:**

```typescript
const VALIDATION_RULES = {
  pflichtfelder: ['offerNumber', 'offerDate', 'pricing.grossAmount'],
  mwstSaetze: [0, 7, 19, 16], // Füge 16% hinzu
  maxFileSize: 20 * 1024 * 1024, // Erhöhe auf 20MB
};
```

---

## 🧪 Testing

### Browser Console

```javascript
// Service importieren
const { ruempelPdfParserService } = await import('./services/ruempelPdfParserService');

// PDF hochladen und testen
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.accept = '.pdf';
fileInput.onchange = async (e) => {
  const file = e.target.files[0];
  const result = await ruempelPdfParserService.parsePDF(file);
  console.log('Parsed:', result);
  console.log('Validation:', result.validation);
};
fileInput.click();
```

### Angebots-Statistiken

```javascript
const { offerService } = await import('./services/offerService');
const stats = await offerService.getOfferStats();
console.table(stats);
```

---

## 🐛 Troubleshooting

### PDF wird nicht korrekt geparst

**Problem:** Preise oder Daten fehlen

**Lösung:**
1. Prüfe Supabase Logs: `npx supabase functions logs parse-pdf-ruempel`
2. Schaue dir `rawText` in der Response an
3. Passe Regex-Muster an

### Validierung schlägt fehl

**Problem:** "Angebotsdatum fehlt"

**Lösung:**
- Prüfe Datums-Format im PDF (muss DD.MM.YYYY sein)
- Schaue in `offer_history` für Details
- Teste Regex-Muster separat

### Kunde wird doppelt angelegt

**Problem:** Trotz existierendem Kunden wird neuer erstellt

**Lösung:**
```typescript
// Verbessere Matching in upsertCustomerFromPDF
// Suche auch nach Telefon, E-Mail, etc.
```

### Follow-ups werden nicht erstellt

**Problem:** Keine automatischen Wiedervorlagen

**Lösung:**
1. Prüfe ob Trigger aktiv: `\df+ create_offer_follow_ups`
2. Schaue in `offer_history` nach Fehlern
3. Prüfe `valid_until` Datum im Angebot

---

## 📊 Datenbank-Schema

### offers
```sql
id                UUID PRIMARY KEY
customer_id       TEXT NOT NULL
offer_number      TEXT UNIQUE NOT NULL
customer_number   TEXT
offer_date        DATE NOT NULL
valid_until       DATE
status            TEXT (offen, verhandlung, angenommen, ...)
net_amount        DECIMAL(10,2)
vat_rate          INTEGER
vat_amount        DECIMAL(10,2)
gross_amount      DECIMAL(10,2) NOT NULL
price_type        TEXT
payment_timing    TEXT
payment_methods   JSONB
service_details   JSONB
appointments      JSONB
document_type     TEXT
pdf_file_name     TEXT
raw_text          TEXT
follow_up_date    DATE
follow_up_done    BOOLEAN
created_at        TIMESTAMP
updated_at        TIMESTAMP
accepted_at       TIMESTAMP
rejected_at       TIMESTAMP
```

### offer_line_items
```sql
id                UUID PRIMARY KEY
offer_id          UUID REFERENCES offers(id)
position          INTEGER
designation       TEXT
object_size       TEXT
rooms             JSONB
exceptions        JSONB
condition         TEXT
quantity          DECIMAL(10,2)
unit              TEXT
unit_price        DECIMAL(10,2)
total_price       DECIMAL(10,2)
```

### follow_ups
```sql
id                UUID PRIMARY KEY
offer_id          UUID REFERENCES offers(id)
customer_id       TEXT NOT NULL
due_date          DATE NOT NULL
priority          TEXT (niedrig, normal, hoch, dringend)
type              TEXT
status            TEXT (offen, erledigt, verschoben, abgebrochen)
notes             TEXT
completed_at      TIMESTAMP
created_at        TIMESTAMP
updated_at        TIMESTAMP
```

---

## 🎬 Beispiel-Workflow

### Kompletter Prozess

1. **PDF hochladen**
   - Kunde öffnen → Angebote-Tab → "PDF hochladen"
   - PDF auswählen

2. **Automatische Verarbeitung**
   - System parst PDF
   - Validiert Daten
   - Erstellt Angebot
   - Legt Follow-ups an

3. **Angebot prüfen**
   - Details ansehen
   - Bei Bedarf Status ändern

4. **Follow-ups bearbeiten**
   - Wiedervorlagen-Tab öffnen
   - Überfällige markieren
   - Erledigt abhaken

5. **Status aktualisieren**
   - Bei Annahme: Status → "angenommen"
   - Automatischer Timestamp
   - Historie wird geloggt

---

## 📝 Beispieldaten

### Testangebot erstellen

```sql
INSERT INTO offers (
  customer_id, offer_number, offer_date, valid_until,
  status, gross_amount, pricing
) VALUES (
  'K123', 'AG0159', '2025-10-01', '2025-10-31',
  'offen', 3500.00,
  '{"netAmount": 2941.18, "vatRate": 19, "vatAmount": 558.82, "grossAmount": 3500.00}'::jsonb
);
```

---

## 🚀 Performance-Tipps

1. **Indizes sind bereits erstellt** für alle wichtigen Felder
2. **Views cachen** in Frontend mit React Query
3. **Bulk-Operations** für viele PDFs nutzen
4. **Background-Jobs** für automatische Status-Updates

---

Diese Implementierung bietet ein vollständiges, produktionsreifes System für die Angebotsverwaltung mit automatischer PDF-Verarbeitung, Validierung, CRM-Integration und Wiedervorlage-Management.

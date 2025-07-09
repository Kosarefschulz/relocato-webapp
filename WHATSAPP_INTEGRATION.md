# WhatsApp Integration mit 360dialog

## Übersicht

Diese Dokumentation beschreibt die WhatsApp-Integration in die Umzugsapp mit 360dialog als Business Service Provider (BSP).

## API Credentials

- **API Key**: IAZJrrEVUymetKybaO6p83rQAK
- **Base URL**: https://waba-v2.360dialog.io

## Implementierte Komponenten

### 1. Backend-Infrastruktur

#### Datenbank-Schema (`supabase/migrations/20250109_whatsapp_integration.sql`)

**Tabellen:**
- `whatsapp_messages`: Speichert alle WhatsApp-Nachrichten
- `whatsapp_conversations`: Verwaltet Konversationen mit Kunden
- `whatsapp_customer_links`: Verknüpft Nachrichten mit Kunden
- `whatsapp_templates`: Speichert genehmigte Message Templates
- `whatsapp_media`: Verwaltet Media-Dateien (Bilder, Videos, Dokumente)

#### WhatsApp Service (`src/services/whatsappService.ts`)

**Hauptfunktionen:**
- `sendTextMessage()`: Sendet Text-Nachrichten
- `sendMediaMessage()`: Sendet Media-Nachrichten (Bilder, Videos, Dokumente)
- `sendTemplateMessage()`: Sendet Template-Nachrichten
- `getConversations()`: Lädt alle Konversationen
- `getMessages()`: Lädt Nachrichten einer Konversation
- `markAsRead()`: Markiert Nachrichten als gelesen
- `linkToCustomer()`: Verknüpft Nachrichten mit Kunden
- `handleWebhook()`: Verarbeitet eingehende Webhooks

#### Supabase Edge Functions

1. **whatsapp-send** (`supabase/functions/whatsapp-send/`)
   - Sendet Nachrichten über die 360dialog API
   - Unterstützt alle Nachrichtentypen

2. **whatsapp-webhook** (`supabase/functions/whatsapp-webhook/`)
   - Empfängt Webhooks von 360dialog
   - Speichert eingehende Nachrichten
   - Aktualisiert Nachrichtenstatus

3. **whatsapp-media** (`supabase/functions/whatsapp-media/`)
   - Lädt Media-Dateien von WhatsApp herunter
   - Speichert sie in Supabase Storage

### 2. Frontend-Komponenten

#### WhatsApp Client (`src/components/WhatsAppClient.tsx`)

Vollständiger WhatsApp-Chat-Client mit:
- Konversationsübersicht
- Nachrichtenverlauf
- Echtzeit-Updates
- Senden von Text- und Media-Nachrichten
- Suchfunktion
- Ungelesene Nachrichten Counter

#### Customer Communication Integration

Die `CustomerCommunication.tsx` Komponente wurde erweitert um:
- WhatsApp-Tab neben E-Mail
- Anzeige aller WhatsApp-Nachrichten eines Kunden
- Möglichkeit neue Nachrichten zu senden
- Automatische Telefonnummern-Formatierung

#### Dashboard Integration

- Neuer WhatsApp-Button im Dashboard
- Route: `/whatsapp`
- WhatsApp-typisches grünes Design

### 3. Storage

#### WhatsApp Media Storage (`supabase/storage-whatsapp.sql`)

- Bucket: `whatsapp-media`
- Unterstützte Formate: Bilder, Videos, Audio, Dokumente
- 50MB Limit pro Datei
- Public Access für authenticated users

## Konfiguration

### 1. Webhook Setup bei 360dialog

1. Login bei https://app.360dialog.io/
2. Navigation zu: Phone Numbers → Select Number → Settings → Webhooks
3. Webhook URL eintragen:
   ```
   https://[IHRE_SUPABASE_URL]/functions/v1/whatsapp-webhook
   ```
4. Events aktivieren:
   - messages
   - message_status
   - errors

### 2. Umgebungsvariablen

Die API-Credentials sind derzeit im Code hinterlegt. Für Production sollten diese in Umgebungsvariablen ausgelagert werden:

```env
WHATSAPP_API_KEY=IAZJrrEVUymetKybaO6p83rQAK
WHATSAPP_BASE_URL=https://waba-v2.360dialog.io
```

### 3. Datenbank Migration

Führe die Migration aus:
```bash
supabase db push
```

Erstelle den Storage Bucket:
```bash
psql -f supabase/storage-whatsapp.sql
```

## Verwendung

### 1. WhatsApp Client

- Navigation über Dashboard → WhatsApp
- Zeigt alle aktiven Konversationen
- Klick auf Konversation öffnet Chat
- Nachrichten senden über Eingabefeld

### 2. Kundenkommunikation

- In Kundendetails → Kommunikation Tab
- WhatsApp-Tab zeigt alle Nachrichten des Kunden
- "Neue Nachricht" Button zum Senden
- Automatische Verknüpfung mit Kundenprofil

### 3. API Usage

```typescript
import { whatsappService } from './services/whatsappService';

// Text-Nachricht senden
await whatsappService.sendTextMessage('+491234567890', 'Hallo!');

// Media senden
await whatsappService.sendMediaMessage(
  '+491234567890',
  'image',
  'https://example.com/image.jpg',
  'Bildunterschrift'
);

// Template senden
await whatsappService.sendTemplateMessage(
  '+491234567890',
  'welcome_message',
  'de',
  [{ type: 'body', parameters: [{ type: 'text', text: 'Max' }] }]
);
```

## Wichtige Hinweise

### WhatsApp Business Policy

1. **24-Stunden-Fenster**: Nach einer Kundennachricht können Sie 24 Stunden lang frei antworten
2. **Template Messages**: Außerhalb des 24-Stunden-Fensters nur genehmigte Templates
3. **Opt-in erforderlich**: Kunden müssen explizit zustimmen

### Telefonnummern-Format

- International mit Ländercode: `+49123456789`
- Ohne Leerzeichen oder Sonderzeichen
- Automatische Formatierung für deutsche Nummern

### Limits

- Nachrichten: Abhängig vom 360dialog Tier
- Media: Max 50MB pro Datei
- Templates: Müssen von Meta genehmigt werden

## Troubleshooting

### Webhook empfängt keine Nachrichten

1. Webhook URL in 360dialog prüfen
2. Supabase Edge Function Logs checken
3. CORS Headers verifizieren

### Nachrichten werden nicht gesendet

1. API Key prüfen
2. Telefonnummer-Format verifizieren
3. 24-Stunden-Fenster beachten

### Media wird nicht angezeigt

1. Storage Bucket Permissions prüfen
2. Media URL Gültigkeit checken
3. Unterstützte Formate verwenden

## Nächste Schritte

1. **Message Templates erstellen**: Für Benachrichtigungen außerhalb des 24h-Fensters
2. **Broadcast Listen**: Für Massennachrichten
3. **Automatisierungen**: Antworten auf häufige Fragen
4. **Analytics**: Nachrichtenverlauf und Engagement tracking
5. **Multi-Agent Support**: Zuweisung von Konversationen an Mitarbeiter
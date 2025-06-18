# Vercel API Routes für Email-Synchronisation

Diese API Routes bieten die gleiche Funktionalität wie die Firebase Functions für die Email-Client-Features.

## Verfügbare Endpunkte

### 1. Email-Synchronisation
- **Endpoint**: `/api/email-sync`
- **Method**: GET
- **Query Parameters**:
  - `folder` (optional): Email-Ordner (Standard: INBOX)
  - `limit` (optional): Anzahl der Emails (Standard: 50)
  - `forceSync` (optional): Erzwinge vollständige Synchronisation (Standard: false)
- **Headers**: 
  - `Authorization: Bearer {idToken}` (optional für Firestore-Speicherung)

### 2. Email-Ordner abrufen
- **Endpoint**: `/api/email-folders`
- **Method**: GET
- **Headers**: 
  - `Authorization: Bearer {idToken}` (erforderlich)

### 3. Email senden
- **Endpoint**: `/api/send-email`
- **Method**: POST
- **Body**:
  ```json
  {
    "to": "empfaenger@example.com",
    "subject": "Betreff",
    "html": "<p>HTML-Inhalt</p>",
    "cc": "cc@example.com",
    "bcc": "bcc@example.com",
    "replyTo": "reply@example.com",
    "attachments": []
  }
  ```
- **Headers**: 
  - `Authorization: Bearer {idToken}` (optional für Firestore-Speicherung)

### 4. Email-Aktionen
- **Endpoint**: `/api/email-actions`
- **Method**: POST
- **Headers**: 
  - `Authorization: Bearer {idToken}` (erforderlich)
- **Body für "Als gelesen markieren"**:
  ```json
  {
    "action": "markAsRead",
    "emailId": "email-id",
    "isRead": true
  }
  ```
- **Body für "In Ordner verschieben"**:
  ```json
  {
    "action": "move",
    "emailId": "email-id",
    "targetFolder": "Zielordner"
  }
  ```
- **Body für "Löschen"**:
  ```json
  {
    "action": "delete",
    "emailId": "email-id"
  }
  ```

### 5. Email-Suche
- **Endpoint**: `/api/email-search`
- **Method**: GET
- **Query Parameters**:
  - `query`: Suchbegriff (erforderlich)
  - `folder` (optional): Auf bestimmten Ordner beschränken
- **Headers**: 
  - `Authorization: Bearer {idToken}` (erforderlich)

## Environment Variables

Folgende Umgebungsvariablen müssen in Vercel konfiguriert werden:

```env
IONOS_EMAIL_USER=bielefeld@relocato.de
IONOS_EMAIL_PASS=<passwort>
FIREBASE_SERVICE_ACCOUNT=<firebase-service-account-json>
```

## CORS-Konfiguration

Alle Endpunkte unterstützen CORS mit folgenden Headers:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET,OPTIONS,PATCH,DELETE,POST,PUT`
- `Access-Control-Allow-Headers: X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization`

## Authentifizierung

Die meisten Endpunkte erfordern eine Firebase ID Token Authentifizierung. Das Token muss im Authorization Header als Bearer Token übergeben werden:

```
Authorization: Bearer <firebase-id-token>
```

## Fehlerbehandlung

Alle Endpunkte geben bei Fehlern JSON-Antworten mit folgendem Format zurück:

```json
{
  "success": false,
  "error": "Fehlerbeschreibung"
}
```

HTTP-Statuscodes:
- 200: Erfolg
- 400: Ungültige Anfrage
- 401: Nicht authentifiziert
- 405: Methode nicht erlaubt
- 500: Interner Serverfehler
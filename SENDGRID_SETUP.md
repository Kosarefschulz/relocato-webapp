# SendGrid Email Integration Setup

## 1. SendGrid Account erstellen

1. Gehe zu [SendGrid](https://sendgrid.com)
2. Erstelle einen kostenlosen Account
3. Verifiziere deine Email-Adresse

## 2. API-Key erstellen

1. Login zu SendGrid Dashboard
2. Gehe zu **Settings** → **API Keys**
3. Klicke **Create API Key**
4. Wähle **Restricted Access**
5. Berechtigungen setzen:
   - **Mail Send**: Full Access
   - **Mail Settings**: Read Access (optional)
6. Kopiere den API-Key (wird nur einmal angezeigt!)

## 3. Sender Identity verifizieren

### Option A: Domain-Authentifikation (empfohlen)
1. Gehe zu **Settings** → **Sender Authentication**
2. Klicke **Authenticate Your Domain**
3. Folge den DNS-Setup Anweisungen

### Option B: Single Sender Verification
1. Gehe zu **Settings** → **Sender Authentication** 
2. Klicke **Create a Single Sender**
3. Fülle das Formular aus:
   - **From Email**: deine-email@domain.com
   - **From Name**: Umzugsfirma
   - **Reply To**: deine-email@domain.com
   - **Company**: Umzugsfirma GmbH
4. Bestätige über Email-Link

## 4. Umgebungsvariablen konfigurieren

Bearbeite die `.env` Datei:

```env
REACT_APP_SENDGRID_API_KEY=dein_sendgrid_api_key_hier
REACT_APP_SENDGRID_FROM_EMAIL=deine-verifizierte-email@domain.com
```

## 5. Email-Templates (optional)

Für professionelle Emails erstelle Templates:

1. Gehe zu **Email API** → **Dynamic Templates**
2. Erstelle neues Template
3. Design mit Drag & Drop Editor
4. Verwende Variablen wie `{{customer_name}}`

## 6. Test der Integration

1. Starte die App: `npm start`
2. Erstelle ein Angebot für einen Testkunden
3. Prüfe, ob Email ankommt
4. Prüfe Spam-Ordner falls nötig

## Fallback-Verhalten

Wenn SendGrid nicht konfiguriert ist:
- Emails werden in Console geloggt
- PDF wird trotzdem generiert
- Alle anderen Funktionen bleiben verfügbar

## Kostenlose Limits

SendGrid Free Plan:
- 100 Emails/Tag
- 40.000 Emails erste 30 Tage
- Danach 100/Tag permanent

## Troubleshooting

**"API Key invalid"**: API-Key in .env prüfen
**"Sender not verified"**: Sender Identity verifizieren
**"Permission denied"**: API-Key Berechtigungen prüfen
**"Template not found"**: Template-ID korrekt setzen

## Produktionshinweise

- Verwende Domain-Authentifikation für bessere Zustellbarkeit
- Monitoring über SendGrid Dashboard
- Bounce/Spam-Handling implementieren
- DSGVO: Einverständnis für Marketing-Emails
# E-Mail Setup für Relocato WebApp

## Übersicht

Die App unterstützt E-Mail-Versand über IONOS SMTP und speichert den E-Mail-Verlauf für jeden Kunden.

## Features

### ✅ Implementiert:
- E-Mail-Versand über IONOS SMTP
- E-Mail-Historie pro Kunde
- Thread-basierte Ansicht
- Anhänge (PDFs)
- BCC an bielefeld@relocato.de für Archiv
- Vercel API Function für E-Mail-Versand

### 📧 E-Mail-Verlauf:
- Alle gesendeten E-Mails werden automatisch gespeichert
- Zuordnung zu Kunden über Kunden-ID
- Thread-Gruppierung nach Betreff
- Status-Tracking (gesendet, zugestellt, gelesen)

## Konfiguration

### 1. Umgebungsvariablen auf Vercel setzen:

```bash
SMTP_HOST=smtp.ionos.de
SMTP_PORT=587
SMTP_USER=bielefeld@relocato.de
SMTP_PASS=Bicm1308
SMTP_FROM=bielefeld@relocato.de
```

### 2. In Vercel Dashboard:
1. Gehe zu: https://vercel.com/dashboard
2. Wähle dein Projekt "umzugs-webapp"
3. Settings → Environment Variables
4. Füge die obigen Variablen hinzu
5. Redeploye die App

## Verwendung

### E-Mail senden:
1. Kunde öffnen
2. Tab "Emails" oder Schnellaktion "E-Mail schreiben"
3. E-Mail verfassen und senden

### E-Mail-Verlauf anzeigen:
1. Kunde öffnen
2. Tab "Emails"
3. Alle E-Mails mit diesem Kunden werden angezeigt

## Technische Details

### API Endpoint:
- `/api/send-email` - Vercel Function für E-Mail-Versand

### Services:
- `emailService.ts` - E-Mail-Versand mit Fallback
- `emailHistoryService.ts` - E-Mail-Historie und Thread-Management
- `CustomerCommunication.tsx` - UI-Komponente

### Speicherung:
- E-Mail-Historie wird in localStorage gespeichert
- Später: Firebase/Datenbank Integration

## Troubleshooting

### E-Mails werden nicht gesendet:
1. Prüfe Vercel Environment Variables
2. Prüfe IONOS SMTP Zugangsdaten
3. Schaue in Vercel Function Logs

### E-Mail-Verlauf wird nicht angezeigt:
1. Browser-Cache leeren
2. localStorage prüfen (Developer Tools)
3. Kunde hat E-Mail-Adresse?

## Zukünftige Erweiterungen

1. **IMAP Integration**: Eingehende E-Mails automatisch abrufen
2. **Gmail API**: Direkte Gmail Integration
3. **E-Mail Templates**: Vordefinierte Vorlagen
4. **Tracking**: Öffnungsraten und Klicks
5. **Automatisierung**: Follow-up E-Mails
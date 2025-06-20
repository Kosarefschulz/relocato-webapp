# 🚀 Vercel Deployment - Komplettanleitung

## Schnellstart (One-Click Deployment)

```bash
# Führen Sie einfach dieses Script aus:
./deploy-to-vercel.sh
```

Das Script führt automatisch alle Schritte durch:
1. Vercel Login
2. Projekt-Verknüpfung
3. Storage-Setup
4. Datenbank-Migration
5. Deployment

## Manuelle Schritte (falls nötig)

### 1. Vercel Login
```bash
vercel login
```

### 2. Storage im Vercel Dashboard erstellen

Gehen Sie zu: https://vercel.com/dashboard/stores

Erstellen Sie:
- **Postgres Database**
  - Name: `umzugsapp-db`
  - Region: `Frankfurt (eu-central-1)`
  
- **Blob Store**
  - Name: `umzugsapp-files`
  - Region: `Frankfurt (eu-central-1)`
  
- **KV Store** (optional)
  - Name: `umzugsapp-cache`
  - Region: `Frankfurt (eu-central-1)`

### 3. Environment Variables laden
```bash
vercel env pull .env.local
```

### 4. Firebase Service Account Key

1. Gehen Sie zu Firebase Console > Projekteinstellungen > Dienstkonten
2. Klicken Sie auf "Neuen privaten Schlüssel generieren"
3. Speichern Sie als: `migration/serviceAccountKey.json`

### 5. Migration ausführen
```bash
# Datenbank-Schema erstellen
psql $POSTGRES_URL -f migration/vercel/vercel-schema.sql

# Komplette Migration
node migration/vercel/complete-migration.js
```

### 6. Deployment
```bash
# Preview (Test)
vercel

# Production
vercel --prod
```

## 🔧 Konfiguration

### Platform Switch
```bash
# Zu Vercel wechseln
npm run switch:vercel

# Zurück zu Firebase
npm run switch:firebase
```

### Status prüfen
```bash
npm run vercel:status
```

## 📊 Was wird migriert?

- ✅ **Alle Kundendaten** (customers)
- ✅ **Alle Angebote** (quotes)
- ✅ **Alle Rechnungen** (invoices)
- ✅ **E-Mail-Historie** (emailHistory)
- ✅ **Benutzer** (users)
- ✅ **Templates** (email & quote)
- ✅ **Fotos** (optional zu Vercel Blob)

## 🔍 Troubleshooting

### Problem: "POSTGRES_URL not defined"
```bash
vercel env pull .env.local
```

### Problem: "Firebase Admin initialization failed"
Stellen Sie sicher, dass `migration/serviceAccountKey.json` existiert.

### Problem: "Connection timeout"
Prüfen Sie Ihre Internetverbindung und Firewall-Einstellungen.

## 📱 Nach dem Deployment

1. **Testen Sie alle Features:**
   - Login
   - Kundenverwaltung
   - Angebotserstellung
   - E-Mail-Versand

2. **Monitoring:**
   - Vercel Dashboard: https://vercel.com/dashboard
   - Logs: `vercel logs`

3. **Performance:**
   - Analytics: https://vercel.com/analytics
   - Speed Insights: Automatisch aktiviert

## 🆘 Support

- Vercel Docs: https://vercel.com/docs
- Projekt-spezifisch: Siehe `/migration/logs/`
- Backups: `/migration/backups/`

## 🎉 Fertig!

Ihre App läuft jetzt auf Vercel mit:
- Besserer Performance
- Automatischer Skalierung
- Integrierten Analytics
- Edge Functions
- Global CDN

Viel Erfolg mit Ihrer migrierten App!
# Schrittweise Migration zu Vercel - Detaillierte Anleitung

## 🎯 Übersicht
Diese Anleitung führt Sie Schritt für Schritt durch die Migration von Firebase zu Vercel.

## 📋 Vorbereitung

### 1. Vercel Account Setup
1. Gehen Sie zu https://vercel.com/dashboard
2. Ihr Projekt: `relocato-webapp-fzwo`
3. Navigieren Sie zu "Storage" Tab

### 2. Storage Services aktivieren

#### PostgreSQL Database
```
1. Klicken Sie auf "Create Database"
2. Wählen Sie "Postgres"
3. Name: "umzugsapp-db"
4. Region: "Frankfurt (eu-central-1)"
5. Klicken Sie "Create"
```

#### Blob Storage
```
1. Klicken Sie auf "Create Store"
2. Wählen Sie "Blob"
3. Name: "umzugsapp-files"
4. Region: "Frankfurt (eu-central-1)"
5. Klicken Sie "Create"
```

#### KV Store (Optional)
```
1. Klicken Sie auf "Create Store"
2. Wählen Sie "KV"
3. Name: "umzugsapp-cache"
4. Region: "Frankfurt (eu-central-1)"
5. Klicken Sie "Create"
```

### 3. Environment Variables laden
```bash
# Im Terminal in Ihrem Projekt-Ordner
vercel env pull .env.local
```

## 🚀 Migration durchführen

### Schritt 1: Setup-Script ausführen
```bash
# Dependencies installieren
npm install @vercel/postgres @vercel/blob @vercel/kv pg

# Setup-Script ausführen
npm run vercel:setup
```

### Schritt 2: Datenbank-Schema erstellen
```bash
# PostgreSQL Schema anwenden
psql $POSTGRES_URL -f migration/vercel/vercel-schema.sql

# Oder mit npm script
npm run db:setup
```

### Schritt 3: Status prüfen
```bash
# Vercel Services Status
npm run vercel:status
```

Sie sollten sehen:
```
✅ PostgreSQL verbunden
✅ Blob Storage verbunden
✅ KV Store verbunden
```

### Schritt 4: Test-Migration
```bash
# 10 Test-Kunden migrieren
npm run migrate:test
```

Erwartete Ausgabe:
```
🚀 Starte Test-Migration...
✅ 10 Kunden erfolgreich migriert
✅ 45 Angebote migriert
✅ 23 Rechnungen migriert
```

### Schritt 5: Vollständige Migration

#### 5.1 Firestore Export
```bash
# Alle Daten aus Firestore exportieren
cd migration
node export-firestore.js
```

Dies erstellt JSON-Dateien:
- `exports/customers.json`
- `exports/quotes.json`
- `exports/invoices.json`
- etc.

#### 5.2 PostgreSQL Import
```bash
# Daten in PostgreSQL importieren
node migrate-to-postgres.js

# Oder schrittweise:
node migrate-to-postgres.js --collection customers
node migrate-to-postgres.js --collection quotes
node migrate-to-postgres.js --collection invoices
```

#### 5.3 Foto-Migration (Optional)
```bash
# Fotos von Google Drive zu Vercel Blob
node migrate-photos.js --limit 100
```

### Schritt 6: Frontend umstellen

#### 6.1 Environment Variable setzen
```bash
# .env.local
REACT_APP_USE_VERCEL=true
REACT_APP_API_URL=https://relocato-webapp-fzwo.vercel.app/api
```

#### 6.2 Test im Development
```bash
npm start
```

#### 6.3 Production Build
```bash
npm run build
```

### Schritt 7: Deployment

#### 7.1 Preview Deployment
```bash
vercel
```

#### 7.2 Production Deployment
```bash
vercel --prod
```

## 🔍 Verifizierung

### 1. Datenintegrität prüfen
```bash
# Vergleiche Datenzahlen
node scripts/verify-migration.js
```

### 2. Funktionen testen
- [ ] Login funktioniert
- [ ] Kunden werden angezeigt
- [ ] Neuer Kunde kann erstellt werden
- [ ] Angebote werden geladen
- [ ] E-Mail-Versand funktioniert
- [ ] Fotos werden angezeigt

### 3. Performance testen
- Ladezeiten messen
- API Response Times
- Vergleich mit Firebase

## 🔄 Rollback Plan

Falls Probleme auftreten:

### 1. Schneller Rollback
```bash
# Environment Variable ändern
REACT_APP_USE_VERCEL=false

# Neu deployen
vercel --prod
```

### 2. Daten-Sync stoppen
```bash
# Dual-Write deaktivieren
node scripts/stop-sync.js
```

### 3. DNS zurücksetzen
Falls custom Domain verwendet wird, DNS auf Firebase zeigen lassen.

## 📊 Monitoring

### Vercel Dashboard
- https://vercel.com/[your-team]/relocato-webapp-fzwo/analytics
- Functions Tab für API Logs
- Storage Tab für Datenbank-Metriken

### Alerts einrichten
```javascript
// api/monitoring/health.js
export default async function handler(req, res) {
  const checks = {
    database: await checkDatabase(),
    storage: await checkStorage(),
    api: true
  };
  
  const healthy = Object.values(checks).every(v => v);
  res.status(healthy ? 200 : 503).json(checks);
}
```

## 🎉 Migration abgeschlossen

Nach erfolgreicher Migration:

1. **Firebase Cleanup** (nach 30 Tagen)
   - Firebase Functions pausieren
   - Firestore in Read-Only Modus
   - Kosten reduzieren

2. **Dokumentation aktualisieren**
   - README.md
   - API Dokumentation
   - Deployment Guide

3. **Team informieren**
   - Neue URLs
   - Geänderte Prozesse
   - Support-Kontakte

## 🆘 Hilfe & Support

### Vercel Support
- Dashboard: "Help" Button
- Email: support@vercel.com
- Docs: https://vercel.com/docs

### Projekt-spezifisch
- Migration Logs: `migration/logs/`
- Backup Files: `migration/backups/`
- Scripts: `migration/vercel/`

### Häufige Probleme

**Problem: "POSTGRES_URL not defined"**
```bash
vercel env pull .env.local
source .env.local
```

**Problem: "Connection timeout"**
- Prüfen Sie Firewall/VPN
- Vercel Dashboard → Storage → Connection String

**Problem: "Migration incomplete"**
```bash
# Fortsetzen wo aufgehört
node migrate-to-postgres.js --resume
```

Viel Erfolg bei der Migration! 🚀
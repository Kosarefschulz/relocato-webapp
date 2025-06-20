# Vercel Migration Plan - Umzugs-WebApp

## 🎯 Ziel
Komplette Migration von Firebase zu Vercel mit allen Kundendaten, Fotos und Services.

## 📊 Aktuelle Datenlage

### Firestore Collections
- **customers**: ~1,000 Dokumente
- **quotes**: ~5,000 Dokumente  
- **invoices**: ~3,000 Dokumente
- **emailHistory**: ~10,000 Dokumente
- **users**: ~50 Dokumente
- **emailTemplates**: ~20 Dokumente
- **quoteTemplates**: ~10 Dokumente

### Dateien
- **Fotos**: Aktuell in Google Drive (nicht Firebase Storage)
- **PDFs**: Generiert on-the-fly
- **Uploads**: ~10GB geschätzt

## 🏗️ Vercel Architecture

### 1. Vercel Postgres
```
┌─────────────────┐
│    customers    │
├─────────────────┤
│ id (PK)         │
│ customer_number │
│ name            │
│ email           │
│ phone           │
│ address (JSONB) │
│ metadata (JSONB)│
│ created_at      │
│ updated_at      │
└─────────────────┘
        │
        ├── quotes (FK: customer_id)
        ├── invoices (FK: customer_id)
        └── photos (FK: customer_id)
```

### 2. Vercel Blob Storage
```
/customers/
  /{customer_id}/
    /photos/
      /{category}/
        /{filename}
    /documents/
      /quotes/
      /invoices/
```

### 3. Vercel KV (Redis)
- Session Management
- Real-time Status
- Cache Layer
- Rate Limiting

## 🚀 Migration Phases

### Phase 1: Setup (Tag 1)
- [ ] Vercel Postgres einrichten
- [ ] Vercel Blob aktivieren
- [ ] Vercel KV einrichten
- [ ] Test-Umgebung erstellen

### Phase 2: Schema & Scripts (Tag 2-3)
- [ ] PostgreSQL Schema erstellen
- [ ] Migration Scripts schreiben
- [ ] Test mit 10 Kunden
- [ ] Performance validieren

### Phase 3: Dual-Write (Tag 4-7)
- [ ] Service Layer mit Feature Flags
- [ ] Neue Daten in beide Systeme
- [ ] Monitoring einrichten
- [ ] Fehlerbehandlung

### Phase 4: Daten-Migration (Tag 8-10)
- [ ] Batch-Migration Customers
- [ ] Batch-Migration Quotes
- [ ] Batch-Migration Invoices
- [ ] Foto-Migration zu Blob

### Phase 5: Cutover (Tag 11)
- [ ] DNS Update
- [ ] Final Testing
- [ ] Go-Live
- [ ] Monitoring

## 💻 Code-Beispiele

### Service Abstraction
```typescript
// src/services/database/index.ts
export interface DatabaseService {
  customers: CustomerService;
  quotes: QuoteService;
  invoices: InvoiceService;
}

export const db: DatabaseService = 
  process.env.REACT_APP_USE_VERCEL === 'true'
    ? vercelDatabase
    : firebaseDatabase;
```

### Migration Script
```typescript
// scripts/migrate-customers.ts
async function migrateCustomers(batchSize = 100) {
  const customers = await firestore
    .collection('customers')
    .limit(batchSize)
    .get();
    
  for (const doc of customers.docs) {
    await postgres.query(
      'INSERT INTO customers (...) VALUES (...)',
      [doc.data()]
    );
  }
}
```

## 📈 Monitoring & Rollback

### Monitoring
- Vercel Analytics
- Custom Dashboards
- Error Tracking (Sentry)
- Performance Metrics

### Rollback Plan
1. Feature Flag zurücksetzen
2. DNS auf Firebase
3. Daten-Sync stoppen
4. Cache leeren

## ✅ Success Criteria
- [ ] Alle Daten migriert
- [ ] Performance gleich oder besser
- [ ] Keine Datenverluste
- [ ] Kosten im Budget
- [ ] Team geschult

## 📞 Support & Kontakte
- Vercel Support: support@vercel.com
- Projektleitung: [Ihre Kontaktdaten]
- Notfall-Hotline: [Nummer]
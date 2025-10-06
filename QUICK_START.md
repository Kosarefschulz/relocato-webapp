# 🚀 Quick Start - PDF-Parser Deployment

## Automatisches Deployment

Führe einfach das Deployment-Script aus:

```bash
cd /Users/sergejschulz/Downloads/relocato-webapp
./deploy-pdf-parser.sh
```

Das Script führt dich durch alle Schritte! ✅

---

## Manuelle Schritte (falls Script nicht funktioniert)

### 1️⃣ Datenbank-Migration

**Supabase Dashboard öffnen:**
https://supabase.com/dashboard/project/kmxipuaqierjqaikuimi/editor

**Schritte:**
1. Gehe zu **SQL Editor** (linke Sidebar)
2. Klicke **New Query**
3. Öffne die Datei: `supabase/migrations/20251001_add_offers_system.sql`
4. Kopiere den **kompletten Inhalt**
5. Füge ihn im SQL Editor ein
6. Klicke **Run** (oder Cmd+Enter)

**Erwartetes Ergebnis:**
```
Success. No rows returned
```

✅ **Migration abgeschlossen!**

---

### 2️⃣ Edge Function deployen

```bash
# Wenn noch nicht eingeloggt
npx supabase login

# Function deployen
npx supabase functions deploy parse-pdf-ruempel --project-ref kmxipuaqierjqaikuimi
```

**Erwartetes Ergebnis:**
```
Deploying Function (project-ref: kmxipuaqierjqaikuimi)...
Deployed function parse-pdf-ruempel to https://...
```

✅ **Function deployed!**

---

### 3️⃣ Frontend bauen

```bash
npm run build
```

**Erwartetes Ergebnis:**
```
Compiled successfully!
File sizes after gzip:
  ...
```

✅ **Build erfolgreich!**

---

### 4️⃣ Frontend deployen

```bash
# Mit npm
npm run deploy

# Oder mit Vercel
vercel --prod
```

✅ **Deployment abgeschlossen!**

---

## 🧪 Testen

### 1. Öffne die App
https://deine-app.vercel.app

### 2. Gehe zu einem Kunden
Kundendetails öffnen

### 3. Finde das neue Tab
Tab: **"PDF-Angebote"**

### 4. Lade ein PDF hoch
- Klicke "PDF hochladen"
- Wähle ein Rümpel Schmiede Angebots-PDF
- System parst automatisch

### 5. Prüfe die Ergebnisse
- Angebotsnummer
- Kundenadresse
- Preise (Netto, MwSt, Brutto)
- Leistungsdetails
- Termine

---

## ❓ Probleme?

### Supabase CLI nicht gefunden

```bash
brew install supabase/tap/supabase
```

### Build-Fehler

```bash
# Dependencies neu installieren
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Edge Function Fehler

```bash
# Logs ansehen
npx supabase functions logs parse-pdf-ruempel --project-ref kmxipuaqierjqaikuimi
```

### Migration schlägt fehl

**Prüfe ob Tabellen bereits existieren:**
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('offers', 'offer_line_items', 'follow_ups');
```

Falls Tabellen existieren:
```sql
-- Tabellen löschen (VORSICHT: Löscht alle Daten!)
DROP TABLE IF EXISTS public.follow_ups CASCADE;
DROP TABLE IF EXISTS public.offer_history CASCADE;
DROP TABLE IF EXISTS public.offer_line_items CASCADE;
DROP TABLE IF EXISTS public.offers CASCADE;

-- Dann Migration nochmal ausführen
```

---

## 📚 Weitere Dokumentation

- **Komplette Doku**: `RUEMPEL_SCHMIEDE_SETUP.md`
- **Basis PDF-Parser**: `PDF_PARSER_SETUP.md`

---

## ✅ Checklist

- [ ] Datenbank-Migration ausgeführt
- [ ] Edge Function deployed
- [ ] Frontend gebaut
- [ ] Frontend deployed
- [ ] PDF-Upload getestet
- [ ] Angebotsdaten korrekt extrahiert
- [ ] Status-Änderung funktioniert
- [ ] Wiedervorlagen erstellt

**Alles ✅? Dann bist du fertig! 🎉**

---

## 🆘 Support

Bei Problemen:

1. Prüfe Supabase Logs
2. Prüfe Browser Console (F12)
3. Schaue in `RUEMPEL_SCHMIEDE_SETUP.md` → Troubleshooting
4. Kontaktiere Support

**Happy Parsing! 🚀**

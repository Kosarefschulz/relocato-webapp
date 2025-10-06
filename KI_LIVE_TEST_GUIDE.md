# 🧪 KI-Assistent LIVE TESTEN - Schritt für Schritt

## ✅ Server-Status

**Alle Systeme laufen:**
- ✅ Code Backend: http://localhost:3002 🟢
- ✅ Frontend: http://localhost:3004 🟢
- ✅ Kompiliert erfolgreich!

---

## 🚀 Schritt 1: KI-Assistent öffnen

### Im Browser öffnen:
```
http://localhost:3004/ai-assistant
```

**Oder:**
1. Gehe zu http://localhost:3004
2. Klicke Sidebar → Tools
3. Klicke "✨ KI-Assistent" (mit NEU Badge)

---

## 🧪 Schritt 2: BASIS-TESTS (Prüfe ob alles funktioniert)

### Test 1: Begrüßung & Context-Loading
**Eingabe:**
```
Hallo, bist du bereit?
```

**Erwartete Antwort:**
```
✅ "Ja, ich bin bereit! Ich habe Zugriff auf [X] Kunden, [Y] Angebote...
   Wie kann ich dir helfen?"
```

**Prüft:** ✓ Claude API ✓ Context-Loading ✓ Supabase-Connection

---

### Test 2: Preis-Kalkulation (Wissensdatenbank-Test)
**Eingabe:**
```
Was kostet ein 3-Zimmer-Umzug, 4. Stock ohne Aufzug, 80km Entfernung?
```

**Erwartete Antwort:**
```
💰 KALKULATION:

Basispreis 3-Zimmer (ca. 25m³): 1.299€
+ Etage (4 × 50€): +200€
+ Entfernung (30km × 1,20€): +36€
════════════════════════
GESAMT: ca. 1.535€

[Detaillierte Erklärung...]
```

**Prüft:** ✓ Pricing-Wissen ✓ Kalkulations-Fähigkeit ✓ Deutsches Format

---

### Test 3: Kunden anlegen (Database Write)
**Eingabe:**
```
Lege einen Testkunden an: Max Mustermann, Tel: 0151-99887766, Email: max@test.de
```

**Erwartete Antwort:**
```
✅ Kunde erfolgreich angelegt!

📋 Details:
- Name: Max Mustermann
- Telefon: 0151-99887766
- E-Mail: max@test.de
- Phase: angerufen

Soll ich ein Angebot erstellen?
```

**Prüft:** ✓ create_customer Tool ✓ Supabase Write ✓ Proaktive Vorschläge

---

### Test 4: Code-Operation (File Read)
**Eingabe:**
```
Lies die Datei src/App.tsx und zeig mir die ersten 20 Zeilen
```

**Erwartete Antwort:**
```
✅ Datei gelesen!

📄 src/App.tsx
Größe: [X] Bytes

[Erste 20 Zeilen Code...]
```

**Prüft:** ✓ read_file Tool ✓ Code Backend ✓ File-System-Zugriff

---

### Test 5: E-Mail-Template (Knowledge Base)
**Eingabe:**
```
Schreibe eine Angebots-Email für Kunde "Anna Schmidt" über 1.200€
```

**Erwartete Antwort:**
```
📧 Angebots-Email für Anna Schmidt:

Betreff: Ihr Umzugsangebot von RELOCATO®

Sehr geehrte Frau Schmidt,

vielen Dank für Ihre Anfrage!

Gerne unterbreiten wir Ihnen folgendes Angebot...

ANGEBOTSPREIS: 1.200€ (inkl. MwSt.)

[Template mit Personalisierung...]
```

**Prüft:** ✓ Email-Templates ✓ Personalisierung ✓ Professioneller Ton

---

## 🎯 Schritt 3: ERWEITERTE TESTS

### Test 6: Multi-Step Operation
**Eingabe:**
```
Erstelle eine TestStats Komponente UND füge sie zur App.tsx hinzu
```

**Erwartete Antwort:**
```
✅ Multi-Step Operation abgeschlossen!

📊 3/3 Aktionen erfolgreich

📋 Ausgeführte Schritte:

1. ✅ Komponente erstellen
   Komponente "TestStats" wurde erstellt

2. ✅ Datei lesen
   "src/App.tsx" wurde gelesen (X Bytes)

3. ✅ Datei editieren
   "src/App.tsx" wurde editiert (2 Änderungen)

Die Komponente ist jetzt integriert!
```

**Prüft:** ✓ Multi-Step Chaining ✓ create_component ✓ read_file ✓ edit_file ✓ Tool-Verkettung

---

### Test 7: Proaktive Hilfe
**Eingabe:**
```
Tagesübersicht
```

**Erwartete Antwort:**
```
📅 HEUTE (06.10.2025):

🚚 UMZÜGE:
- [Liste der heutigen Umzüge]

📞 FOLLOW-UPS ÜBERFÄLLIG:
- [Liste überfälliger Follow-Ups]

💰 ÜBERFÄLLIGE RECHNUNGEN:
- [Liste]

🎯 PRIORITÄTEN:
1. Follow-Ups bearbeiten
2. Zahlungserinnerungen senden
3. ...

Soll ich dir bei den Follow-Ups helfen?
```

**Prüft:** ✓ Context-Awareness ✓ Data-Analysis ✓ Proaktive Vorschläge

---

### Test 8: FAQ-Wissen
**Eingabe:**
```
Kunde fragt: "Wie lange dauert ein 4-Zimmer-Umzug?"
```

**Erwartete Antwort:**
```
📋 Antwort für Kunden:

"Bei einer 4-Zimmer-Wohnung (ca. 35m³) planen wir in der Regel
8-10 Stunden ein.

Das hängt aber auch von weiteren Faktoren ab:
- Etagen und Aufzug
- Entfernung
- Menge der Möbel
- Komplexität (Montage, etc.)

Für eine genauere Einschätzung schaue ich mir gerne Ihre
spezifische Situation an!"

💡 Interne Notiz: Richtwerte sind in FAQ hinterlegt
```

**Prüft:** ✓ FAQ-Knowledge ✓ Professionelle Antwort ✓ Customer-Facing

---

### Test 9: Screenshot-Analyse (Vision)
**Aktion:**
1. Screenshot hochladen (Bild-Icon klicken)
2. Text eingeben: "Analysiere diesen Screenshot"

**Erwartete Antwort:**
```
👁️ Screenshot-Analyse:

Ich sehe [Beschreibung...]

Erkannte Elemente:
- [Details...]

Möchtest du, dass ich basierend darauf Aktionen durchführe?
```

**Prüft:** ✓ Vision (Claude Sonnet 4.5) ✓ Image-Upload ✓ Analyse

---

### Test 10: Komplexe Multi-Step
**Eingabe:**
```
Implementiere ein Excel-Export-Feature:
1. Installiere xlsx package
2. Erstelle exportService.ts
3. Erstelle ExportButton Komponente
4. Füge zur CustomerList hinzu
```

**Erwartete Antwort:**
```
✅ Multi-Step Operation abgeschlossen!

📊 4/4 Aktionen erfolgreich

📋 Ausgeführte Schritte:

1. ✅ Command ausführen
   npm install xlsx

2. ✅ Datei schreiben
   src/services/exportService.ts

3. ✅ Komponente erstellen
   ExportButton

4. ✅ Datei editieren
   CustomerList.tsx integriert

Das Excel-Export Feature ist fertig und einsatzbereit!
```

**Prüft:** ✓ Komplexes Multi-Step ✓ Alle 4 Tool-Typen ✓ Feature-Implementation

---

## 🔍 Schritt 4: BACKEND-API-TESTS (Terminal)

Diese Tests kannst du im Terminal ausführen während die KI läuft:

### Test A: Code Backend Health
```bash
curl http://localhost:3002/api/code/health | python3 -m json.tool
```

**Erwartete Ausgabe:**
```json
{
  "status": "ok",
  "service": "code-operations",
  "projectRoot": "/Users/sergejschulz/Downloads/relocato-webapp",
  "allowedPaths": 3
}
```

---

### Test B: File Read
```bash
curl -X POST http://localhost:3002/api/code/read \
  -H "Content-Type: application/json" \
  -d '{"path": "src/App.tsx"}' | python3 -m json.tool | head -20
```

**Erwartete Ausgabe:**
```json
{
  "success": true,
  "content": "import React...",
  "path": "src/App.tsx",
  "size": 12345
}
```

---

### Test C: Code Search
```bash
curl -X POST http://localhost:3002/api/code/search \
  -H "Content-Type: application/json" \
  -d '{"pattern": "supabaseService"}' | python3 -m json.tool
```

**Erwartete Ausgabe:**
```json
{
  "success": true,
  "pattern": "supabaseService",
  "results": [
    {"file": "/components/X.tsx", "content": "import { supabaseService }..."},
    ...
  ]
}
```

---

### Test D: Git Status
```bash
curl -X POST http://localhost:3002/api/code/git \
  -H "Content-Type: application/json" \
  -d '{"action": "status"}' | python3 -m json.tool
```

**Erwartete Ausgabe:**
```json
{
  "success": true,
  "action": "status",
  "output": " M src/App.tsx\n ?? knowledge-base/\n..."
}
```

---

## ✅ Schritt 5: CHECKLISTE - Was sollte funktionieren

### CRM-Operationen:
- [ ] Kunden anlegen
- [ ] Kunden suchen
- [ ] Angebot erstellen
- [ ] Phase ändern

### Wissens-Fragen:
- [ ] Preise nennen können
- [ ] FAQs beantworten
- [ ] Email-Templates nutzen
- [ ] Prozesse erklären

### Code-Operationen:
- [ ] Dateien lesen
- [ ] Code durchsuchen
- [ ] Komponenten erstellen
- [ ] Git-Status zeigen

### Multi-Step:
- [ ] Mehrere Tools hintereinander
- [ ] Komplexe Features implementieren
- [ ] Progress-Anzeige (Steps & Actions)

### Proaktiv:
- [ ] Vorschläge machen
- [ ] Nächste Schritte empfehlen
- [ ] Tagesübersicht generieren

---

## 🐛 Troubleshooting

### "KI antwortet nicht"
1. Check Browser-Console (F12) für Errors
2. Check Claude API Key in .env.development
3. Prüfe Network-Tab ob API-Calls gemacht werden

### "Tools werden nicht ausgeführt"
1. Check Code Backend: http://localhost:3002/api/code/health
2. Schaue Backend-Logs im Terminal
3. Prüfe ob Tools im Frontend geladen wurden

### "Preise stimmen nicht"
1. Prüfe knowledge-base/pricing-guide.md
2. Check System-Prompt (sollte Preise enthalten)
3. Frage KI: "Welche Preise kennst du?"

### "Multi-Step funktioniert nicht"
1. Schaue in Browser Console nach "Step 1/10" Logs
2. Prüfe ob maxSteps Parameter gesetzt ist
3. Test mit einfachem 2-Step zuerst

---

## 📊 Erwartete Performance

### Response-Zeiten:
- **Einfache Frage:** 1-2 Sekunden
- **Mit Tool:** 2-4 Sekunden
- **Multi-Step (3 Tools):** 5-8 Sekunden
- **Multi-Step (10 Tools):** 15-25 Sekunden

### Context-Loading:
- **Erster Request:** 2-3 Sekunden (lädt Context)
- **Weitere Requests:** <1 Sekunde (nutzt Cache)

---

## 💬 TEST-PROMPTS SAMMLUNG

### **Level 1: Einfach** (Prüfe Grundfunktionen)
```
1. "Hallo, stelle dich vor"
2. "Was kostet ein 2-Zimmer-Umzug?"
3. "Zeig mir die Preistabelle"
4. "Wie viele Kunden haben wir?"
5. "Lies src/App.tsx"
```

### **Level 2: Medium** (Single-Tool-Operations)
```
1. "Lege Testkunden Hans Müller an, Tel 0151-123456"
2. "Suche nach Kunden mit Namen 'Schmidt'"
3. "Erstelle Komponente PriceCalculator"
4. "Was kostet 40m³ mit Klaviertransport und Halteverbot?"
5. "Schreibe Follow-Up Email für überfälliges Angebot"
```

### **Level 3: Advanced** (Multi-Step)
```
1. "Erstelle DailyOverview Komponente UND integriere sie in App.tsx"
2. "Analysiere die Pipeline und gib mir Optimierungsvorschläge"
3. "Finde alle Kunden in 'Nachfassen' seit >10 Tagen und erstelle Follow-Ups"
4. "Implementiere Excel-Export: Service + UI + Integration"
5. "Tagesübersicht für heute generieren"
```

### **Level 4: Expert** (Komplexe Workflows)
```
1. "Kunde ruft an: 5-Zimmer, München→Berlin, Klaviertransport, Montage.
    Erstelle Kunde, kalkuliere Preis, erstelle Angebot, sende Email, Follow-Up"

2. "Analysiere alle Kunden in Phase 'Angebot erstellt' seit >14 Tagen,
    priorisiere nach Angebotswert, entwerfe Follow-Up-Emails"

3. "Erstelle komplettes Reporting-Feature mit Service, UI, Charts und Integration"
```

---

## 🎯 Was du sehen solltest:

### Bei erfolgreicher Aktion:
- ✅ Grünes Bestätigungs-Icon
- 📊 Multi-Step Badge (wenn >1 Step)
- 🏷️ Action-Chips (✅ create_customer, ✅ edit_file, etc.)
- 💬 Detaillierte Zusammenfassung
- ⏱️ Timestamp

### Bei Multi-Step:
- 🔄 Live-Updates im Browser-Console: "Step 1/10", "Step 2/10", etc.
- 📊 Badge: "5 Steps · 5 Aktionen"
- 📋 Liste aller ausgeführten Aktionen
- ✅ Zusammenfassung am Ende

### Bei Fehlern:
- ❌ Rotes Error-Icon
- 💬 Fehlermel dung
- 🔍 Hilfestellung/Vorschläge

---

## 🎬 Empfohlene Test-Reihenfolge:

### Session 1: Wissensdatenbank (5 min)
```
1. "Was kostet 3-Zimmer-Umzug?"
2. "Kunde fragt: Wie lange dauert der Umzug?"
3. "Schreibe Angebots-Email für Kunde X"
4. "Erkläre mir den Prozess von Anruf bis Rechnung"
5. "Welche Rabatte gibt es?"
```

**Ziel:** Prüfen ob KI alle Infos kennt

---

### Session 2: CRM-Operationen (10 min)
```
1. "Lege 3 Testkunden an"
2. "Suche nach Kunde 'Müller'"
3. "Erstelle Angebot für ersten Testkunden"
4. "Ändere Phase von Kunde X zu 'Angebot erstellt'"
5. "Zeig mir alle Kunden in Phase 'Nachfassen'"
```

**Ziel:** Prüfen ob Database-Operations funktionieren

---

### Session 3: Code-Operations (10 min)
```
1. "Lies src/App.tsx"
2. "Suche nach 'Customer' im Code"
3. "Erstelle Komponente HelloWorld"
4. "Zeige Git Status"
5. "Führe npm list react aus"
```

**Ziel:** Prüfen ob Code-Zugriff funktioniert

---

### Session 4: Multi-Step Magic (15 min)
```
1. "Erstelle Komponente UND integriere sie"
2. "Implementiere Feature X komplett"
3. "Finde Bug → Lies Datei → Fixe"
4. "Analysiere + Optimiere + Dokumentiere"
```

**Ziel:** Prüfen ob Tool-Chaining funktioniert

---

## 💡 Pro-Tipps beim Testen:

### 1. **Schaue in Browser Console** (F12)
```
Siehst du:
- "✅ Claude Sonnet 4.5 initialized"
- "🔄 Step 1/10"
- "🔧 Tool: create_customer"
- "✅ Tool executed successfully"
```

→ Alles funktioniert!

### 2. **Teste schrittweise**
- Erst einfach ("Hallo")
- Dann Single-Tool ("Lege Kunde an")
- Dann Multi-Step ("Erstelle UND integriere")

### 3. **Nutze die Quick-Actions**
- Klicke auf die Chips oben:
  - "Kunde anlegen"
  - "Kunden suchen"
  - "Nachberechnung"
  - "Analyse"

### 4. **Experimentiere!**
```
"Wie würdest du Feature X umsetzen?"
"Zeig mir alle Möglichkeiten für Y"
"Was würdest du mir empfehlen?"
```

→ KI ist sehr kreativ wenn man sie fragt!

---

## 🎊 Finale Verifikation

### Wenn ALLES funktioniert siehst du:

✅ KI antwortet auf Deutsch
✅ Preise werden korrekt berechnet
✅ Kunden können angelegt werden
✅ Code kann gelesen/geschrieben werden
✅ Multi-Step läuft (mehrere Tools nacheinander)
✅ Progress wird angezeigt (Steps & Actions)
✅ Proaktive Vorschläge kommen
✅ Email-Templates werden genutzt
✅ FAQs werden beantwortet

### **→ DANN ist dein KI-Allrounder einsatzbereit! 🚀**

---

## 📞 Falls Probleme:

1. **Check Logs** im Terminal wo `npm run dev` läuft
2. **Browser Console** (F12) für Frontend-Errors
3. **Backend Health**: `curl http://localhost:3002/api/code/health`
4. **Restart alles**: Ctrl+C im Terminal, dann `npm run dev`

---

**Viel Spaß beim Testen! 🎉**

Bei Fragen: Frag einfach die KI - sie erklärt sich selbst! 😄

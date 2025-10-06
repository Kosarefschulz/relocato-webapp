# 🚀 KI-Assistent auf Vercel deployen - Komplett-Anleitung

## ⚠️ WICHTIG: Production-spezifische Anpassungen

Damit die KI auf Vercel funktioniert, müssen wir einiges ändern:

---

## 📋 Schritt 1: Environment Variables in Vercel konfigurieren

### Im Vercel Dashboard:
1. Gehe zu deinem Projekt
2. Settings → Environment Variables
3. Füge hinzu:

```
REACT_APP_ANTHROPIC_API_KEY=your-anthropic-api-key-from-console
REACT_APP_AI_MODEL=claude-sonnet-4-5-20250929
```

**Hole deinen API Key aus:** https://console.anthropic.com/settings/keys

**Wichtig:** Für Production, Development & Preview!

---

## 🔧 Schritt 2: Code Backend auf Vercel deployen

### Problem:
Das `code-backend.js` läuft lokal auf Port 3002, aber Vercel unterstützt keine long-running Node.js Prozesse.

### Lösung: Serverless Functions nutzen

**Erstelle:** `api/code/read.js`, `api/code/write.js`, etc.

Oder **Alternative:** Code Backend auf separatem Service (Render.com, Railway, etc.)

---

## 🎯 Empfohlene Lösung: Hybrid-Ansatz

### Option A: Code-Backend AUF Render.com/Railway
**Vorteile:**
- ✅ Läuft 24/7
- ✅ Keine Änderungen am Code nötig
- ✅ Einfach zu deployen

**Steps:**
1. Erstelle neues Projekt auf Render.com
2. Deploye `code-backend.js`
3. Update `CODE_BACKEND_URL` in Frontend auf Production-URL

**Code-Änderung:**
```typescript
// src/services/ai/codeOperationsService.ts
const CODE_BACKEND_URL = process.env.REACT_APP_CODE_BACKEND_URL || 'http://localhost:3002/api/code';
```

**In Vercel .env:**
```
REACT_APP_CODE_BACKEND_URL=https://your-code-backend.onrender.com/api/code
```

---

### Option B: Code-Operations DEAKTIVIEREN in Production
**Vorteile:**
- ✅ Einfachste Lösung
- ✅ Keine zusätzlichen Kosten
- ✅ CRM-Features funktionieren vollständig

**Nachteil:**
- ❌ Code-Tools (read_file, write_file, etc.) funktionieren nicht in Production

**Code-Änderung:**
```typescript
// src/services/ai/intelligentAssistantService.ts

private getToolDefinitions(): any[] {
  const tools = [
    // CRM Tools (funktionieren immer)
    { name: 'create_customer', ... },
    { name: 'create_quote', ... },
    // ... etc
  ];

  // Code-Tools nur in Development
  if (process.env.NODE_ENV === 'development') {
    tools.push(
      { name: 'read_file', ... },
      { name: 'write_file', ... },
      // ... etc
    );
  }

  return tools;
}
```

**Empfehlung:** Start mit Option B, später auf Option A upgraden

---

## 📦 Schritt 3: Knowledge Base Files deployen

### Automatisch mit Build:
Die Files in `public/knowledge-base/` werden automatisch mit deployed! ✅

**Prüfen:**
```bash
# Nach Deployment in Browser:
https://your-app.vercel.app/knowledge-base/pricing-guide.md
```

Sollte den Markdown-Content anzeigen.

---

## 🔒 Schritt 4: API-Key-Sicherheit in Production

### ⚠️ WICHTIG: API-Keys im Frontend sind SICHTBAR!

**Problem:**
- REACT_APP_* Variablen werden ins Bundle kompiliert
- Jeder kann deinen Claude API-Key im Browser sehen
- Potenzielles Sicherheitsrisiko

### Lösung: Proxy über Backend

**Besser-Architektur:**
```
Frontend → Vercel Serverless Function → Claude API
             (schützt API-Key)
```

**Erstelle:** `api/claude-chat.js`
```javascript
export default async function handler(req, res) {
  const { message } = req.body;

  // API-Key ist Server-Side (sicher!)
  const apiKey = process.env.ANTHROPIC_API_KEY; // Kein REACT_APP_ prefix!

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 8192,
      messages: [{ role: 'user', content: message }]
    })
  });

  const data = await response.json();
  res.json(data);
}
```

**Frontend nutzt dann:**
```typescript
// Statt direkt Claude API
await fetch('/api/claude-chat', {
  method: 'POST',
  body: JSON.stringify({ message })
});
```

---

## 🎬 Deployment-Schritte

### 1. Code vorbereiten (local)

```bash
# Alle Background-Prozesse stoppen
lsof -ti:3004,3002 | xargs kill -9

# Test-Build lokal
npm run build

# Prüfen ob Build erfolgreich
ls -la build/
```

### 2. Git Commit (wenn nicht schon done)

```bash
git add .
git commit -m "feat: KI-Allrounder mit Claude Sonnet 4.5, Multi-Step, Knowledge Base

- Claude Sonnet 4.5 Integration
- Multi-Step Tool-Chaining (bis 10 Steps)
- Knowledge Base (35KB Firmen-Wissen)
- Code-Operations Backend
- Spezialisierte Tools (13+)
- Context Caching & Streaming
- Code Validation
- Komplett gefütterter Allrounder für Bürokräfte"
```

### 3. Push zu Git & Auto-Deploy

```bash
git push origin main
```

→ Vercel deployed automatisch! 🚀

---

## ✅ Nach Deployment: Verifikation

### 1. Environment Variables prüfen
```
Vercel Dashboard → Settings → Environment Variables

Sollte enthalten:
✓ REACT_APP_ANTHROPIC_API_KEY
✓ REACT_APP_AI_MODEL
✓ SUPABASE_URL
✓ SUPABASE_ANON_KEY
```

### 2. Knowledge Base testen
```
https://your-app.vercel.app/knowledge-base/pricing-guide.md
```
Sollte Markdown anzeigen.

### 3. KI-Assistent testen
```
https://your-app.vercel.app/ai-assistant
```

**Test-Prompt:**
```
"Hallo, funktionierst du in Production? Was kostet ein 3-Zimmer-Umzug?"
```

**Erwartete Antwort:**
- ✅ Preise korrekt (Knowledge Base geladen)
- ✅ CRM-Tools funktionieren
- ❌ Code-Tools (wenn nicht extra Backend deployed)

---

## 🔄 Unterschiede Development vs. Production

| Feature | Development | Production (Vercel) |
|---------|-------------|---------------------|
| **Frontend** | localhost:3004 | your-app.vercel.app |
| **Claude API** | Direkt vom Browser | ⚠️ API-Key sichtbar! |
| **Code Backend** | localhost:3002 | ❌ Nicht deployed |
| **Knowledge Base** | ✅ Verfügbar | ✅ Verfügbar |
| **CRM-Tools** | ✅ Funktionieren | ✅ Funktionieren |
| **Code-Tools** | ✅ Funktionieren | ❌ Brauchen Backend |
| **Multi-Step** | ✅ Funktioniert | ✅ Funktioniert |
| **Supabase** | ✅ Funktioniert | ✅ Funktioniert |

---

## 💡 Empfohlene Production-Konfiguration

### Phase 1: Minimal (sofort einsatzbereit)
```
✅ Frontend auf Vercel
✅ CRM-Tools aktiv (Kunden, Angebote, etc.)
✅ Knowledge Base integriert
✅ Preis-Kalkulation funktioniert
❌ Code-Tools deaktiviert (nur Dev)
```

**Für Bürokräfte völlig ausreichend!**

### Phase 2: Full-Featured (später)
```
✅ Frontend auf Vercel
✅ Code Backend auf Render.com
✅ Alle Tools funktionieren
✅ Vollständiger Feature-Set
```

---

## 🛡️ Sicherheits-Checkliste für Production

### Vor Deployment prüfen:

- [ ] API-Keys in Vercel Environment (nicht im Code!)
- [ ] .env Dateien in .gitignore
- [ ] Keine Passwords/Secrets im Code
- [ ] CORS richtig konfiguriert
- [ ] Rate Limiting aktiv
- [ ] Error-Handling robust

### Nach Deployment prüfen:

- [ ] API-Key funktioniert
- [ ] Supabase Connection OK
- [ ] Knowledge Base erreichbar
- [ ] Keine Console-Errors im Browser
- [ ] Mobile funktioniert

---

## 📝 Deployment-Checklist

```bash
# 1. Local Build Test
npm run build

# 2. Test Build lokal
serve -s build

# 3. Git Commit
git add .
git commit -m "feat: KI-Allrounder ready for production"

# 4. Push (triggert Auto-Deploy)
git push origin main

# 5. Vercel Environment Variables setzen

# 6. Warte auf Deployment

# 7. Teste Production-URL

# 8. Bei Problemen: Check Logs
vercel logs
```

---

## 🎯 Schnellstart für Vercel:

### Minimal-Config (jetzt sofort):

```bash
# 1. Vercel CLI installieren (falls nicht vorhanden)
npm i -g vercel

# 2. Deploy
vercel --prod

# 3. Environment Variables setzen
vercel env add REACT_APP_ANTHROPIC_API_KEY
# [API-Key eingeben]

vercel env add REACT_APP_AI_MODEL
# claude-sonnet-4-5-20250929

# 4. Redeploy mit neuen Vars
vercel --prod

# 5. Teste!
```

---

## ✅ Success-Kriterien für Production:

### Die KI sollte in Production können:
- ✅ Sich vorstellen
- ✅ Preise kalkulieren
- ✅ Kunden anlegen
- ✅ Angebote erstellen
- ✅ E-Mail-Templates nutzen
- ✅ FAQs beantworten
- ✅ Tagesübersicht generieren
- ✅ Auf Deutsch antworten
- ✅ Proaktive Vorschläge

### Nicht in Production (ohne Code Backend):
- ❌ Code lesen/schreiben
- ❌ Terminal-Befehle
- ❌ Git-Operationen

**→ Aber 80% der Funktionen funktionieren! Perfekt für Bürokräfte!**

---

## 💰 Kosten-Überlegungen

### Claude API Costs:
- **Input:** $3 / 1M Tokens
- **Output:** $15 / 1M Tokens

**Beispiel-Rechnung:**
- Durchschnitt: 2.000 Tokens pro Anfrage (Input + Output)
- 100 Anfragen/Tag = 200.000 Tokens
- 200k Tokens ≈ $0,60-3,00/Tag
- **~$18-90/Monat** bei aktiver Nutzung

**Tipp:** Start mit niedrigem Budget-Limit in Anthropic Console!

---

## 🎊 Finale Steps:

```bash
# 1. Alles committed?
git status

# 2. Build Test
npm run build

# 3. Deploy!
git push origin main

# 4. Vercel Env Vars setzen

# 5. Teste Production-URL

# 6. 🎉 Bürokräften zeigen!
```

---

**Die KI ist bereit für die Welt! 🌍**

Bei Problemen: Check Vercel Logs oder frag mich! 😊

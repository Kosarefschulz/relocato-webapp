# 🤖 KI Code-Assistent - Vollständige Anleitung

## 🎉 Was ist neu?

Dein KI-Assistent hat jetzt **VOLLSTÄNDIGE CODE-FÄHIGKEITEN** - genau wie Claude Code im Terminal!

### 🚀 Neue Capabilities

Die KI kann jetzt:
- ✅ **Code lesen** - Jede Datei im Projekt öffnen
- ✅ **Code schreiben** - Neue Dateien/Komponenten erstellen
- ✅ **Code editieren** - Bestehende Dateien ändern
- ✅ **Komponenten generieren** - React-Komponenten mit Template
- ✅ **Code durchsuchen** - grep-basierte Code-Suche
- ✅ **Terminal-Befehle** - npm, git, etc. ausführen
- ✅ **Git-Operationen** - status, add, commit, diff, log
- ✅ **Komponenten integrieren** - Routes & Sidebar automatisch updaten

---

## 📦 Setup & Installation

### 1. Servers starten

```bash
# Option A: Alles auf einmal starten
npm run dev

# Option B: Individuell starten
npm run start:code-backend  # Port 3002
npm start                    # Port 3004
```

### 2. Prüfen ob alles läuft

```bash
# Code Backend Health Check
curl http://localhost:3002/api/code/health

# Expected Output:
# {
#   "status": "ok",
#   "service": "code-operations",
#   "projectRoot": "/Users/sergejschulz/Downloads/relocato-webapp",
#   "allowedPaths": 3
# }
```

### 3. KI-Assistent öffnen

- Browser: http://localhost:3004/ai-assistant
- Oder: Sidebar → Tools → KI-Assistent

---

## 💬 Was kannst du sagen?

### 🎨 Komponenten erstellen

```
"Erstelle eine neue CustomerStats Komponente"
"Erstelle eine Dashboard-Seite für Analytics"
"Erstelle einen Chart-Component mit Recharts"
```

**Was passiert:**
- ✅ Neue `.tsx` Datei wird erstellt
- ✅ Standard React-Component-Template wird verwendet
- ✅ TypeScript-Interfaces werden generiert
- ✅ Material-UI Imports sind vorbereitet

### 🐛 Bugs fixen

```
"Fixe den TypeScript-Fehler in CustomerDetails.tsx"
"Der Button in CustomerList funktioniert nicht, bitte reparieren"
"Zeile 42 in App.tsx hat einen Syntax-Fehler"
```

**Was passiert:**
- ✅ KI liest die Datei
- ✅ Analysiert den Fehler
- ✅ Schlägt eine Lösung vor
- ✅ Wartet auf deine Bestätigung
- ✅ Führt die Änderung aus

### 📝 Code editieren

```
"Ändere die Button-Farbe in CustomerList zu primary"
"Füge einen Loading-State zur Dashboard-Komponente hinzu"
"Refactore die useState Hooks in CustomerDetails"
```

**Was passiert:**
- ✅ Liest die aktuelle Datei
- ✅ Findet die relevante Stelle
- ✅ Macht präzise find/replace Operations
- ✅ Zeigt dir die Changes

### 🔍 Code durchsuchen

```
"Suche nach allen Verwendungen von 'supabaseService'"
"Finde alle TODOs im Code"
"Wo wird CustomerPhase verwendet?"
```

**Was passiert:**
- ✅ grep-basierte Code-Suche
- ✅ Zeigt Datei + Zeile
- ✅ Kontextuelle Ergebnisse

### 🎯 Features implementieren

```
"Implementiere ein Notification-System"
"Füge Export-to-Excel-Funktion hinzu"
"Erstelle eine Suchfunktion für Kunden"
```

**Was passiert:**
- ✅ Analysiert Requirements
- ✅ Erstellt benötigte Dateien
- ✅ Integriert in App
- ✅ Zeigt dir Step-by-Step was gemacht wird

### 💻 Terminal-Befehle

```
"Führe npm install recharts aus"
"Zeige mir den Git Status"
"Erstelle einen Git Commit mit message 'Feature XYZ hinzugefügt'"
```

**Was passiert:**
- ✅ Validiert Command (nur erlaubte Befehle)
- ✅ Führt sicher in Sandbox aus
- ✅ Zeigt Output

---

## 🎬 Beispiel-Session

```
User:
"Erstelle eine neue Komponente CustomerAnalytics"

AI:
"✅ Ich erstelle die Komponente!

Geplante Aktionen:
- Neue Datei: src/components/CustomerAnalytics.tsx
- Standard React Component mit MUI

Soll ich fortfahren?"

User:
"Ja"

AI:
[Erstellt Komponente...]

"✅ Komponente erstellt!

🎨 CustomerAnalytics

Die React-Komponente wurde erfolgreich generiert und ist ready to use!

Möchtest du, dass ich sie auch in App.tsx als Route hinzufüge?"

User:
"Ja, füge Route /analytics hinzu"

AI:
[Liest App.tsx, fügt Import und Route hinzu]

"✅ Route hinzugefügt!

Die Komponente ist jetzt unter /analytics verfügbar!
🔗 http://localhost:3004/analytics"
```

---

## 🔒 Sicherheit

### Sandbox-Beschränkungen

Die KI kann **NUR** in folgenden Verzeichnissen arbeiten:
- ✅ `src/`
- ✅ `public/`
- ✅ `supabase/`

**Verboten:**
- ❌ `node_modules/`
- ❌ `.env` Dateien
- ❌ `.git/config`
- ❌ Credential-Dateien

### Erlaubte Commands

- ✅ npm (install, start, build, etc.)
- ✅ git (status, add, commit, diff, log)
- ✅ ls, cat, grep, find
- ✅ mkdir, touch, pwd, echo

**Verboten:**
- ❌ rm, rmdir, del
- ❌ sudo, chmod, chown
- ❌ format, kill (außer eigene Prozesse)

### Rate Limiting

- Max 100 File-Operations pro Minute
- Max 20 Terminal-Commands pro Minute
- Circuit Breaker bei verdächtigen Patterns

### Audit-Logging

Alle Operationen werden geloggt:
```json
{
  "timestamp": "2025-10-06T16:00:00Z",
  "operation": "write_file",
  "path": "src/components/NewComponent.tsx",
  "success": true
}
```

---

## 🛠️ Troubleshooting

### "Code Backend not available"

```bash
# Starte Code Backend neu
npm run start:code-backend

# Prüfe ob Port 3002 frei ist
lsof -ti:3002

# Falls belegt, kill den Prozess
lsof -ti:3002 | xargs kill -9
```

### "File not found" / "Path not allowed"

- Prüfe ob Pfad relativ zum Projekt-Root ist
- Verwende `src/components/...` nicht `/absolute/path`
- Stelle sicher dass Pfad in allowed directories liegt

### KI macht nicht was du willst

- Sei spezifischer: "Ändere die Farbe des Submit-Buttons in `CustomerForm.tsx` zu `primary.main`"
- Gib Context: "In der Funktion `handleSubmit` in Zeile 42..."
- Frage nach Details: "Zeig mir zuerst den Code von X"

### Changes werden nicht angezeigt

```bash
# Server neu starten um TypeScript-Fehler zu beheben
# Ctrl+C im Terminal
npm start
```

---

## 📚 API Endpoints (für Entwickler)

Das Code-Backend läuft auf `http://localhost:3002/api/code`:

### `POST /read`
```json
{
  "path": "src/components/MyComponent.tsx"
}
```

### `POST /write`
```json
{
  "path": "src/components/NewComponent.tsx",
  "content": "import React..."
}
```

### `POST /edit`
```json
{
  "path": "src/App.tsx",
  "oldString": "const foo = 1",
  "newString": "const foo = 2"
}
```

### `POST /execute`
```json
{
  "command": "npm install axios"
}
```

### `POST /git`
```json
{
  "action": "commit",
  "params": {
    "message": "Add new feature"
  }
}
```

---

## 🎯 Best Practices

### 1. **Starte klein**
Teste mit einfachen Operationen wie "Lies src/App.tsx" bevor du komplexe Features baust.

### 2. **Gib Context**
Je mehr Context du gibst, desto besser die Results:
- ❌ "Fixe den Fehler"
- ✅ "Fixe den TypeScript-Fehler in CustomerDetails.tsx Zeile 42 - undefined ist nicht nullable"

### 3. **Review Changes**
Die KI zeigt dir Changes bevor sie sie anwendet. Review sie IMMER.

### 4. **Git vor großen Changes**
```
"Zeige mir den Git Status"
"Erstelle einen Git Commit mit allem bisher"
```

### 5. **Iterativ arbeiten**
```
1. "Erstelle Komponente X"
2. "Füge State-Management hinzu"
3. "Integriere API-Call"
4. "Style mit MUI"
```

### 6. **Bei Fehlern: Details geben**
```
"Der API Call funktioniert nicht - hier ist die Fehlermeldung: [paste error]"
```

---

## 🚀 Advanced Features

### Multi-File Operations

```
"Erstelle ein kompletttes Feature:
1. Service: customerAnalyticsService.ts
2. Komponente: CustomerAnalytics.tsx
3. Types: customerAnalytics.d.ts
4. Integration in App.tsx und Sidebar"
```

### Refactoring

```
"Refactore CustomerList.tsx:
- Extrahiere CustomerCard in separate Komponente
- Move inline Styles zu styled components
- Add prop types mit TypeScript"
```

### Testing

```
"Erstelle Tests für CustomerService:
- Unit tests für alle Methoden
- Mock Supabase calls
- Test error handling"
```

---

## 💡 Tipps & Tricks

### Schnell-Commands

- "Show me the code" → Liest Datei
- "Git it" → Git status + diff
- "NPM it" → npm install
- "Fix it" → Behebt letzten Fehler

### Code-Snippets verwenden

```
"Füge diesen Code zu CustomerList.tsx hinzu:

const handleExport = () => {
  // Export logic
};
```

### Templates nutzen

```
"Erstelle eine Komponente wie CustomerDetails aber für Offers"
```

---

## 📊 Statistiken & Monitoring

### Logs ansehen

```bash
# Code Backend Logs
tail -f code-backend.log

# Alle Operationen
grep "WRITE_FILE" code-backend.log
grep "EXECUTE" code-backend.log
```

### Performance

- File Read: ~10-50ms
- File Write: ~20-100ms
- Code Search: ~100-500ms (je nach Projektgröße)
- Command Execution: ~100-5000ms (je nach Command)

---

## ⚠️ Limits & Constraints

### File Size
- Max 10MB per file

### Command Timeout
- Max 30 Sekunden per Command

### Rate Limits
- 100 File-Ops / Minute
- 20 Commands / Minute

### Not Supported (yet)
- Binary files (Images, PDFs direkt editieren)
- Multi-line Regex in edit operations
- Interactive Commands (die Input erwarten)

---

## 🆘 Support

### Fehler melden

Öffne ein Issue mit:
- ✅ Was du versucht hast
- ✅ Erwartetes Ergebnis
- ✅ Tatsächliches Ergebnis
- ✅ Error Message (falls vorhanden)
- ✅ Backend Logs

### Features vorschlagen

Erstelle ein Feature Request mit:
- ✅ Use Case beschreiben
- ✅ Beispiel-Dialog
- ✅ Erwartetes Verhalten

---

## 🎓 Lern-Ressourcen

### Für Fortgeschrittene

1. **Custom Functions erstellen**
   - Siehe: `src/services/ai/codeOperationsService.ts`
   - Füge neue Helper-Methoden hinzu

2. **Function Definitions erweitern**
   - Siehe: `intelligentAssistantService.ts` → `getFunctionDefinitions()`
   - Füge neue OpenAI Functions hinzu

3. **Backend Endpoints erweitern**
   - Siehe: `code-backend.js`
   - Füge neue API-Endpoints hinzu

---

## 🎉 Viel Erfolg!

Du hast jetzt einen vollwertigen KI-Code-Assistenten der dir bei der Entwicklung hilft!

**Happy Coding! 🚀**

---

## Changelog

### v1.0.0 (2025-10-06)
- ✨ Initial Release
- ✅ Code Read/Write/Edit Operations
- ✅ Component Generation
- ✅ Terminal Command Execution
- ✅ Git Integration
- ✅ Code Search (grep)
- ✅ Security Sandbox
- ✅ Rate Limiting
- ✅ Audit Logging

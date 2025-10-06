# 🚀 KI Code-Assistent - Quick Start

## ✅ FERTIG! Alles ist bereit.

### 🎯 Was wurde implementiert?

1. ✅ **Code Operations Backend** (Port 3002)
   - Dateien lesen/schreiben/editieren
   - Terminal-Befehle ausführen
   - Git-Operationen
   - Sicherheits-Sandbox aktiv

2. ✅ **Intelligenter KI-Assistent** (erweitert)
   - Vollständiger Supabase-Zugriff
   - OpenAI GPT-4 Vision
   - Function Calling für Code-Ops
   - 13+ verschiedene Capabilities

3. ✅ **UI-Integration**
   - Chat-Interface im Browser
   - Schnellaktionen-Buttons
   - Screenshot-Upload
   - Real-time Updates

---

## 🏁 Jetzt starten!

### 1. Servers laufen bereits ✅

```bash
✅ Code Backend: http://localhost:3002
✅ Frontend: http://localhost:3004
✅ KI-Assistent: http://localhost:3004/ai-assistant
```

### 2. KI-Assistent öffnen

**Option A:** Direkt im Browser
```
http://localhost:3004/ai-assistant
```

**Option B:** Über Sidebar
```
Sidebar → Tools → KI-Assistent (mit NEU Badge)
```

---

## 💬 Erste Schritte - Was sagen?

### 🧪 Test 1: Code lesen

```
"Lies die Datei src/App.tsx und zeig mir die ersten 50 Zeilen"
```

**Erwartet:** KI liest die Datei und zeigt dir den Code

---

### 🧪 Test 2: Komponente erstellen

```
"Erstelle eine neue Komponente TestComponent"
```

**Erwartet:**
- ✅ Neue Datei `src/components/TestComponent.tsx` wird erstellt
- ✅ KI bestätigt mit Details
- ✅ Template-Code ist drin

---

### 🧪 Test 3: Code durchsuchen

```
"Suche nach allen Verwendungen von 'Customer' im Code"
```

**Erwartet:**
- ✅ Liste aller Dateien mit "Customer"
- ✅ Zeile und Context wird angezeigt

---

### 🧪 Test 4: Terminal-Befehl

```
"Führe 'npm list react' aus"
```

**Erwartet:**
- ✅ Command wird ausgeführt
- ✅ Output wird angezeigt

---

### 🧪 Test 5: Git-Status

```
"Zeige mir den Git Status"
```

**Erwartet:**
- ✅ Liste aller geänderten/neuen Dateien
- ✅ Git-Status-Output

---

## 🎨 Was die KI JETZT kann:

### CRM-Operationen
- ✅ Kunden anlegen: "Lege Kunde Max Mustermann an"
- ✅ Angebote erstellen: "Erstelle Angebot für Kunde XYZ"
- ✅ Daten suchen: "Finde alle Kunden in Phase 'angerufen'"

### Code-Operationen (NEU!)
- ✅ Dateien lesen: "Zeig mir src/App.tsx"
- ✅ Code schreiben: "Erstelle Komponente CustomerStats"
- ✅ Code editieren: "Ändere die Farbe in Zeile 42 zu blue"
- ✅ Code suchen: "Wo wird supabaseService verwendet?"
- ✅ Terminal: "npm install axios"
- ✅ Git: "git status", "git commit -m 'Fix bug'"

### Vision & Analyse
- ✅ Screenshots analysieren
- ✅ PDFs lesen
- ✅ Kundeninfo extrahieren

---

## 🎬 Beispiel: Komplettes Feature erstellen

```
User: "Erstelle ein Feature für Kunden-Export als Excel"

AI: "✅ Ich erstelle das Feature für dich!

Geplante Schritte:
1. Installiere xlsx package
2. Erstelle customerExportService.ts
3. Erstelle ExportButton Komponente
4. Integriere in CustomerList

Soll ich fortfahren? [Ja]"

User: "Ja"

AI:
→ execute_command("npm install xlsx")
→ write_file("src/services/customerExportService.ts", ...)
→ create_component("ExportButton")
→ edit_file("src/components/CustomerList.tsx", ...)

"✅ Feature komplett implementiert!

📦 Installiert: xlsx@0.18.5
📝 Erstellt: customerExportService.ts
🎨 Erstellt: ExportButton.tsx
✏️ Integriert in: CustomerList.tsx

Du kannst jetzt Kunden als Excel exportieren!"
```

---

## 🔥 Power-User Tipps

### 1. Projekt-Overview generieren

```
"Analysiere das Projekt und gib mir eine Übersicht:
- Anzahl Komponenten
- Verwendete Services
- Tech Stack
- Verbesserungsvorschläge"
```

### 2. Refactoring-Assistant

```
"Refactore src/components/ - finde alle Komponenten die
useState() falsch nutzen und fixe sie"
```

### 3. Dependency-Management

```
"Prüfe package.json auf veraltete Dependencies und update sie"
```

### 4. Code-Quality Check

```
"Finde alle TypeScript-Fehler im Projekt und fixe sie automatisch"
```

---

## 🎁 Bonus: Vorgefertigte Prompts

Kopiere diese direkt in den Chat:

### Component Generator
```
Erstelle eine neue Komponente [NAME] mit:
- TypeScript
- Material-UI
- Props-Interface
- State-Management mit useState
- Styled mit sx-Props
```

### Bug Fixer
```
In der Datei [PATH] Zeile [LINE] gibt es folgenden Fehler:
[ERROR MESSAGE]

Bitte analysiere und fixe den Fehler.
```

### Feature Builder
```
Implementiere folgendes Feature:
[FEATURE DESCRIPTION]

Erstelle alle nötigen Dateien:
- Service
- Component
- Types
- Integration

Und zeige mir jeden Schritt.
```

---

## 📞 Nächste Schritte

1. **Öffne KI-Assistent:** http://localhost:3004/ai-assistant
2. **Teste mit einfachem Command:** "Hallo, zeig mir was du kannst"
3. **Experimentiere:** Probiere die Beispiel-Prompts aus
4. **Feedback geben:** Was funktioniert? Was fehlt?

---

**Viel Spaß mit deinem neuen KI-Developer! 🎉**

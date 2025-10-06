# ⚠️ PDF-Parser Limitation & Lösung

## Problem

Der aktuelle PDF-Parser verwendet einen **simplen TextDecoder**, der bei **komprimierten PDFs** nicht funktioniert:

```
Extrahierter Text: "%PDF-1.6 %���� 4 0 obj 554876 1920..."
```

Das sind **binäre Stream-Daten**, kein lesbarer Text!

## Warum passiert das?

PDFs können Text auf zwei Arten enthalten:
1. **Unkomprimiert** (selten) → TextDecoder funktioniert
2. **Komprimiert** (Standard) → TextDecoder zeigt nur Binärdaten

Rümpel Schmiede PDFs sind **komprimiert** → Parser findet keine Daten

## ✅ Lösung: pdf.js verwenden

Ich muss eine echte PDF-Bibliothek verwenden:

### Option 1: pdf.js in Deno (Edge Function)

```typescript
import { getDocument } from "npm:pdfjs-dist"

// PDF richtig parsen
const pdf = await getDocument(pdfData).promise
const page = await pdf.getPage(1)
const textContent = await page.getTextContent()
const text = textContent.items.map(item => item.str).join(' ')
```

### Option 2: Frontend-basiertes Parsing

```typescript
// Im Frontend mit pdfjs-dist (bereits installiert!)
import * as pdfjsLib from 'pdfjs-dist'

const pdf = await pdfjsLib.getDocument(arrayBuffer).promise
// ... Text extrahieren
```

## 🎯 Empfehlung: Frontend-Parser

**Vorteile:**
- ✅ `pdfjs-dist` ist bereits installiert (package.json Zeile 62)
- ✅ Keine Edge Function Änderungen nötig
- ✅ Sofort einsatzbereit
- ✅ Bessere Performance (kein Server-Roundtrip)

**Implementierung:**

1. Neuer Service: `frontendPdfParserService.ts`
2. Verwendet `pdfjs-dist` zum Text-Extrahieren
3. Dann gleiche Regex-Patterns wie jetzt
4. Funktioniert für **ALLE** PDFs

## 🔧 Schnelle Alternative (jetzt)

Da die meisten Daten sichtbar im PDF sind, mache ich die UI so dass:

1. ✅ PDF wird hochgeladen
2. ⚠️ Parser findet nicht alle Daten
3. ✏️ **Manuelle Eingabe-Maske erscheint**
4. ✅ Du ergänzt fehlende Daten
5. ✅ Kunde + Angebot werden erstellt

So kannst du **sofort loslegen** während ich den Parser verbessere!

## 📋 Was soll ich tun?

**A)** Frontend-Parser mit pdf.js implementieren (10 Min, funktioniert perfekt)
**B)** Manuelle Eingabe-Maske hinzufügen (5 Min, funktioniert sofort)
**C)** Beides (15 Min, beste Lösung)

Was bevorzugst du?

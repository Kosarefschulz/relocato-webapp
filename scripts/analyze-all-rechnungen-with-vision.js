/**
 * Analysiert ALLE Rechnungen mit Claude Vision
 * Extrahiert: Betrag, Leistungen, Positionen
 * Erstellt: Leistungsverzeichnis für Auswertungen
 */

const Anthropic = require('@anthropic-ai/sdk');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || 'your-api-key-here';
const SUPABASE_URL = 'https://kmxipuaqierjqaikuimi.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtteGlwdWFxaWVyanFhaWt1aW1pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDQyNTY0NSwiZXhwIjoyMDY2MDAxNjQ1fQ.VTT4d5nndvGQxJxlR6t0YyVHcZfFStqbI1KRbcIOH0c';

const claude = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const BASE_FOLDER = '/Users/sergejschulz/Downloads/Ausgangsrechnungen 2025 Kunden';

// PDF zu Base64
function pdfToBase64(pdfPath) {
  const pdfBuffer = fs.readFileSync(pdfPath);
  return pdfBuffer.toString('base64');
}

// Sammle PDFs
function collectPDFs() {
  const pdfs = [];

  function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      if (fs.statSync(filePath).isDirectory()) {
        walk(filePath);
      } else if (file.endsWith('.pdf') && !filePath.includes('Storno')) {
        pdfs.push(filePath);
      }
    }
  }

  walk(BASE_FOLDER);
  return pdfs;
}

// Analysiere PDF mit Claude Vision
async function analyzePDFWithVision(pdfPath, filename) {
  try {
    console.log(`\n📄 Analyzing: ${filename}`);

    const base64 = pdfToBase64(pdfPath);

    const message = await claude.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: base64
            }
          },
          {
            type: 'text',
            text: 'Analysiere diese Rechnung und extrahiere folgende Daten als JSON:\n\n' +

{
  "rechnungsnummer": "RE2025-XXXX",
  "kundenname": "Max Mustermann",
  "datum": "2025-XX-XX",
  "gesamtbetrag_brutto": 1234.56,
  "netto": 1000.00,
  "mwst": 234.56,
  "positionen": [
    {
      "pos": 1,
      "bezeichnung": "Umzugsleistung",
      "menge": 1,
      "einheit": "Pauschale",
      "einzelpreis": 1000.00,
      "gesamt": 1000.00
    }
  ],
  "leistungs_kategorien": ["Transport", "Montage", "..."],
  "umzugsdatum": "2025-XX-XX" // falls erwähnt
}

Gib NUR das JSON zurück, keine zusätzlichen Erklärungen.'
          }
        ]
      }]
    });

    const responseText = message.content[0].text;

    // Parse JSON (manchmal wrapped in ```json ... ```)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log('   ⚠️  No JSON found in response');
      return null;
    }

    const data = JSON.parse(jsonMatch[0]);
    console.log(`   ✅ ${data.kundenname} - ${data.gesamtbetrag_brutto}€ - ${data.positionen.length} Positionen`);

    return data;

  } catch (error) {
    console.error(`   ❌ Error:`, error.message);
    return null;
  }
}

// Haupt-Workflow
async function analyzeAllRechnungen() {
  console.log('🚀 Analyzing ALL 2025 Rechnungen with Claude Vision...\n');

  const pdfs = collectPDFs();
  console.log(`📄 Found ${pdfs.length} PDFs\n`);

  const results = [];
  const leistungsverzeichnis = {};

  // Test: Erste 5 PDFs
  const LIMIT = process.argv.includes('--all') ? pdfs.length : 5;
  console.log(`Processing ${LIMIT} PDFs...\n`);

  for (let i = 0; i < LIMIT; i++) {
    const pdfPath = pdfs[i];
    const filename = path.basename(pdfPath);

    const data = await analyzePDFWithVision(pdfPath, filename);

    if (data) {
      results.push({
        ...data,
        filename,
        path: pdfPath
      });

      // Sammle Leistungen
      data.positionen.forEach(pos => {
        const key = pos.bezeichnung.toLowerCase().trim();
        if (!leistungsverzeichnis[key]) {
          leistungsverzeichnis[key] = {
            bezeichnung: pos.bezeichnung,
            auftraege: [],
            gesamt_menge: 0,
            gesamt_umsatz: 0,
            durchschnitt_preis: 0
          };
        }

        leistungsverzeichnis[key].auftraege.push({
          kunde: data.kundenname,
          menge: pos.menge,
          einzelpreis: pos.einzelpreis,
          gesamt: pos.gesamt
        });

        leistungsverzeichnis[key].gesamt_menge += pos.menge || 0;
        leistungsverzeichnis[key].gesamt_umsatz += pos.gesamt || 0;
      });
    }

    // Rate limiting (avoid API overload)
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1s pause
  }

  // Berechne Durchschnittspreise
  Object.values(leistungsverzeichnis).forEach(leistung => {
    if (leistung.auftraege.length > 0) {
      leistung.durchschnitt_preis = leistung.gesamt_umsatz / leistung.auftraege.length;
    }
  });

  // Speichere Results
  fs.writeFileSync(
    'rechnungen-analysis-complete.json',
    JSON.stringify(results, null, 2)
  );

  fs.writeFileSync(
    'leistungsverzeichnis-auswertung.json',
    JSON.stringify(leistungsverzeichnis, null, 2)
  );

  console.log('\n═══════════════════════════════════════');
  console.log('📊 ANALYSIS COMPLETE');
  console.log('═══════════════════════════════════════');
  console.log(`Analyzed: ${results.length} PDFs`);
  console.log(`Total customers: ${new Set(results.map(r => r.kundenname)).size}`);
  console.log(`Total revenue: ${results.reduce((sum, r) => sum + (r.gesamtbetrag_brutto || 0), 0).toFixed(2)}€`);
  console.log(`Unique services: ${Object.keys(leistungsverzeichnis).length}`);
  console.log('═══════════════════════════════════════\n');

  // Top 10 Leistungen
  const topLeistungen = Object.entries(leistungsverzeichnis)
    .sort((a, b) => b[1].gesamt_umsatz - a[1].gesamt_umsatz)
    .slice(0, 10);

  console.log('🏆 TOP 10 LEISTUNGEN (nach Umsatz):\n');
  topLeistungen.forEach(([key, leistung], i) => {
    console.log(`${i + 1}. ${leistung.bezeichnung}`);
    console.log(`   Umsatz: ${leistung.gesamt_umsatz.toFixed(2)}€`);
    console.log(`   Aufträge: ${leistung.auftraege.length}`);
    console.log(`   Ø Preis: ${leistung.durchschnitt_preis.toFixed(2)}€\n`);
  });

  console.log('💾 Files saved:');
  console.log('   - rechnungen-analysis-complete.json');
  console.log('   - leistungsverzeichnis-auswertung.json\n');

  if (LIMIT < pdfs.length) {
    console.log(`💡 Processed ${LIMIT}/${pdfs.length} files (TEST)`);
    console.log(`   To analyze ALL, run: node scripts/analyze-all-rechnungen-with-vision.js --all\n`);
    console.log(`   ⏱️  Estimated time for all: ~${Math.ceil(pdfs.length / 60)} minutes\n`);
  }
}

analyzeAllRechnungen();

/**
 * Import Leistungsverzeichnis in Knowledge Base
 * Alle Preise und Leistungen aus Rechnungen
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://kmxipuaqierjqaikuimi.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtteGlwdWFxaWVyanFhaWt1aW1pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDQyNTY0NSwiZXhwIjoyMDY2MDAxNjQ1fQ.VTT4d5nndvGQxJxlR6t0YyVHcZfFStqbI1KRbcIOH0c';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function generateMockEmbedding(text) {
  const hash = simpleHash(text);
  return Array(1024).fill(0).map((_, i) => Math.sin(hash + i) * 0.5 + 0.5);
}

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return hash;
}

const leistungsKatalog = [
  // UMZUGS-LEISTUNGEN
  {
    category: 'pricing',
    title: 'Standard Umzug Komplettservice',
    content: 'Standard-Umzug inkl. Be-/Entladung, Transport, Möbelmontage. Preise: 20m³=1.200-1.800€, 30m³=1.800-2.400€, 40m³=2.400-3.500€, 50m³=3.000-4.500€. Je nach Entfernung und Etagen.',
    tags: ['umzug', 'transport', 'standard'],
    keywords: ['umzugskosten', 'komplettservice', 'festpreis']
  },
  {
    category: 'pricing',
    title: 'Fernumzug >100km',
    content: 'Fernumzüge ab 100km: Basis 2.000-2.500€ + Entfernungszuschlag. Beispiele: 170km/47m³=2.900-5.500€, 195km/27m³=2.530€, 380km/30m³=3.600€, 438km/20m³=2.000€. Oft 2 Tage.',
    tags: ['fernumzug', 'entfernung', 'kilometer'],
    keywords: ['langstrecke', 'fernumzugskosten']
  },
  {
    category: 'pricing',
    title: 'Möbelmontage/-demontage',
    content: 'Oft im Pauschalpreis inklusive (0€ Position). Einzeln: Kleiderschrank 168€, Küche 250€ pauschal, Bett meist inklusive, TV-Montage + Dübelarbeiten 0€ extra.',
    tags: ['montage', 'demontage', 'möbel'],
    keywords: ['möbelmontage', 'aufbau', 'abbau']
  },

  // RENOVIERUNGS-LEISTUNGEN
  {
    category: 'pricing',
    title: 'Renovierung Komplettpreise',
    content: 'Große Renovierungsprojekte: 10.000-15.000€. Beispiel Klußmeyer: 12.430€ (Tapezieren, Streichen, Boden, Bad). Beispiel Schmidt: 11.786€ + 15.004€ Abschlag = 26.790€ gesamt.',
    tags: ['renovierung', 'sanierung'],
    keywords: ['renovierungskosten', 'sanierungskosten']
  },
  {
    category: 'pricing',
    title: 'Malerarbeiten Preise',
    content: 'Wände streichen: 6,50-8€/m². Decken tapezieren: 10€/m². Tapezieren: 9,20€/m². Q3 Spachtelung: 10,69€/m². Alte Tapeten entfernen: 6€/m².',
    tags: ['maler', 'streichen', 'tapezieren'],
    keywords: ['malerarbeiten', 'anstrich']
  },
  {
    category: 'pricing',
    title: 'Bodenarbeiten',
    content: 'Boden verlegen (Vinyl/Laminat): 21€/m² oder 19,70€/Stk. Boden entfernen: 13€/m². Inkl. Trittschalldämmung, Sockelleisten.',
    tags: ['boden', 'verlegen', 'vinyl'],
    keywords: ['bodenbelag', 'laminat', 'vinyl']
  },
  {
    category: 'pricing',
    title: 'Badrenovierung',
    content: 'Komplett-Badrenovierung: 49,50€/Std Arbeitsleistung. Beispiel: 45h = 2.227,50€. Inkl. Abriss, Spachtel, Abdichtung, Silikon. Trockenbau Bad pauschal: 3.000€.',
    tags: ['bad', 'sanitär', 'renovierung'],
    keywords: ['badrenovierung', 'badumbau']
  },

  // ENTRÜMPELUNG
  {
    category: 'pricing',
    title: 'Entrümpelung Preise',
    content: 'Entrümpelung besenrein: 450-2.270€. Kellerentrümpelung: 450€. Wohnungsauflösung: 790-1.100€. Zimmer-Räumung: 500€. Messi-Wohnung: ab 1.176€. Wertanrechnung für Möbel üblich: -40 bis -310€.',
    tags: ['entrümpelung', 'räumung', 'entsorgung'],
    keywords: ['wohnungsauflösung', 'entrümpeln']
  },

  // MATERIAL
  {
    category: 'pricing',
    title: 'Umzugsmaterial Verkauf',
    content: 'Umzugskartons: 2,50€/Stk (Miete). Kleiderkisten: 15€/Stk (Miete). Stretchfolie: 32€/Rolle. Luftpolsterfolie: 26€/Rolle. Klebeband: 3,50€/Rolle. Seidenpapier: oft inklusive.',
    tags: ['material', 'kartons', 'verpackung'],
    keywords: ['umzugsmaterial', 'kartonverkauf']
  },

  // SONSTIGES
  {
    category: 'pricing',
    title: 'Zusatzleistungen Diverses',
    content: 'Einlagerung: 0-500€. Halteverbotszone: 80€ (aus früherer KB). Anschluss Waschmaschine: 0€. Dübelarbeiten: 17,50€. Vermieterübergabe: 70€. Heizkörper tauschen: 1€/psch (Material extra).',
    tags: ['zusatz', 'service', 'extra'],
    keywords: ['zusatzleistungen', 'sonderleistungen']
  },
  {
    category: 'pricing',
    title: 'Rabatte und Kulanz',
    content: 'Rabatte: 5% Frühbucher, 110-230€ Kulanz-Rabatte üblich. Schadensabzug: -110 bis -310€ bei Problemen. Wertanrechnung bei Entrümpelung: -40 bis -310€ für brauchbare Möbel.',
    tags: ['rabatt', 'kulanz', 'nachlass'],
    keywords: ['preisnachlass', 'schadensersatz']
  },

  // PROZESS-WISSEN
  {
    category: 'process',
    title: 'Abschlagsrechnungen bei Renovierung',
    content: 'Bei großen Renovierungen: Abschlagsrechnungen während Baufortschritt üblich. Beispiel Schmidt: 1. Abschlag 15.004€, 2. Abschlag 11.786€. Rest nach Fertigstellung.',
    tags: ['abschlag', 'zahlung', 'renovierung'],
    keywords: ['abschlagsrechnung', 'teilrechnung']
  }
];

async function importLeistungsverzeichnis() {
  console.log('📚 Importing Leistungsverzeichnis in Knowledge Base...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const item of leistungsKatalog) {
    try {
      const embedding = generateMockEmbedding(item.content);

      const { data, error } = await supabase
        .from('ai_knowledge_base')
        .insert({
          category: item.category,
          title: item.title,
          content: item.content,
          embedding,
          tags: item.tags,
          keywords: item.keywords,
          source_file: 'Belege.pdf + Belege-2.pdf'
        })
        .select();

      if (error) {
        console.error(`❌ Error: ${item.title}:`, error.message);
        errorCount++;
      } else {
        console.log(`✅ ${item.title}`);
        successCount++;
      }
    } catch (error) {
      console.error(`❌ Exception: ${item.title}:`, error.message);
      errorCount++;
    }
  }

  console.log(`\n═══════════════════════════════════════`);
  console.log(`📊 Results:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`═══════════════════════════════════════\n`);

  if (successCount > 0) {
    console.log('🎉 Leistungsverzeichnis in Knowledge Base importiert!');
    console.log(`\nTotal Knowledge Base Einträge jetzt: ${14 + successCount}\n`);
  }
}

importLeistungsverzeichnis();

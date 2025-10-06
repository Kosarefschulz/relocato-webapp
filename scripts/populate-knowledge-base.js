/**
 * Populate Knowledge Base with Embeddings
 * Füllt die ai_knowledge_base Tabelle mit allen Wissens-Dokumenten
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://kmxipuaqierjqaikuimi.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtteGlwdWFxaWVyanFhaWt1aW1pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDQyNTY0NSwiZXhwIjoyMDY2MDAxNjQ1fQ.cXQ4YY9kV3jXqo5pYPJ-gThJVkQFNxQPK0y8KMqE4-w';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Mock Embedding Generator (für jetzt, später Voyage AI)
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

async function populateKnowledgeBase() {
  console.log('🚀 Populating Knowledge Base...\n');

  const knowledgeItems = [
    // ===== PRICING =====
    {
      category: 'pricing',
      title: 'Preistabelle Basis',
      content: '10m³=749€, 15m³=899€, 20m³=1.099€, 25m³=1.299€, 30m³=1.499€, 35m³=1.699€, 40m³=1.899€, 45m³=2.099€, 50m³=2.299€',
      tags: ['preis', 'tabelle', 'basis'],
      keywords: ['preistabelle', 'grundpreis', 'volumen']
    },
    {
      category: 'pricing',
      title: 'Etagen-Zuschlag',
      content: 'Pro Stockwerk ohne Aufzug: +50€. Beispiel: 4. Stock = 4 × 50€ = 200€ Zuschlag. Mit Aufzug = 0€ Zuschlag.',
      tags: ['etage', 'stock', 'aufzug', 'zuschlag'],
      keywords: ['etagen-zuschlag', 'stockwerk', 'treppe']
    },
    {
      category: 'pricing',
      title: 'Entfernungs-Zuschlag',
      content: 'Basis: 50km inkludiert. Über 50km: +1,20€ pro km. Beispiel: 100km = (100-50) × 1,20€ = 60€ Zuschlag.',
      tags: ['entfernung', 'kilometer', 'zuschlag'],
      keywords: ['distanz', 'fernumzug']
    },
    {
      category: 'pricing',
      title: 'Klaviertransport',
      content: 'Spezial-Transport für Klavier oder Flügel: 150€ Pauschale. Inkludiert: Geschulte Träger, Spezial-Equipment, Transport-Versicherung.',
      tags: ['klavier', 'special', 'transport'],
      keywords: ['klaviertransport', 'flügel', 'spezialtransport']
    },
    {
      category: 'pricing',
      title: 'Frühbucher-Rabatt',
      content: '5% Rabatt bei Buchung mindestens 4 Wochen im Voraus. Beispiel: 1.000€ mit Frühbucher = 950€.',
      tags: ['rabatt', 'frühbucher'],
      keywords: ['discount', 'frühbucherrabatt']
    },

    // ===== FAQs =====
    {
      category: 'faq_customer',
      title: 'Was kostet ein Umzug?',
      content: 'Kosten hängen ab von: Volumen (Größe der Wohnung), Entfernung, Etagen, Zusatzleistungen. Beispiel 3-Zimmer (25m³), 50km, 2. Stock mit Aufzug = ca. 1.099€.',
      tags: ['kosten', 'preis', 'was kostet'],
      keywords: ['umzugskosten', 'preisanfrage']
    },
    {
      category: 'faq_customer',
      title: 'Wie lange dauert ein Umzug?',
      content: '1-Zimmer: 2-4h, 2-Zimmer: 4-6h, 3-Zimmer: 6-8h, 4-Zimmer: 8-10h, 5-Zimmer: Ganztags. Abhängig von Etagen, Entfernung, Komplexität.',
      tags: ['dauer', 'zeit', 'wie lange'],
      keywords: ['umzugsdauer', 'zeitaufwand']
    },
    {
      category: 'faq_customer',
      title: 'Versicherung und Haftung',
      content: 'Haftpflichtversicherung mit 620€ pro Kubikmeter gemäß §451e HGB ist inklusive. Zusatzversicherung für Wertgegenstände auf Anfrage möglich.',
      tags: ['versicherung', 'haftung', 'schaden'],
      keywords: ['transport-versicherung', 'haftpflicht']
    },
    {
      category: 'faq_customer',
      title: 'Stornierung und Umbuchung',
      content: 'Kostenlose Stornierung bis 48h vorher. 24-48h vorher: 50% Gebühr. Weniger als 24h: 100% Gebühr.',
      tags: ['stornierung', 'umbuchung', 'absage'],
      keywords: ['storno', 'cancellation']
    },

    // ===== PROZESSE =====
    {
      category: 'process',
      title: '8 Phasen Pipeline',
      content: 'Kunden-Phasen: 1.Angerufen, 2.Nachfassen, 3.Angebot erstellt, 4.Besichtigung geplant, 5.Durchführung, 6.Rechnung, 7.Bewertung, 8.Archiviert',
      tags: ['pipeline', 'phasen', 'prozess'],
      keywords: ['kundenphasen', 'workflow']
    },
    {
      category: 'process',
      title: 'Workflow Neuanfrage',
      content: 'Schritte: 1.Daten erfassen, 2.Volumen schätzen, 3.Preis kalkulieren, 4.Angebot erstellen, 5.Per Email senden, 6.Follow-Up nach 7 Tagen anlegen',
      tags: ['neuanfrage', 'workflow', 'ablauf'],
      keywords: ['neukundenworkflow', 'erstanfrage']
    },

    // ===== EMAIL TEMPLATES =====
    {
      category: 'email_template',
      title: 'Angebots-Email Standard',
      content: 'Betreff: "Ihr Umzugsangebot von RELOCATO®". Inhalt: Vielen Dank für Ihre Anfrage! Gerne unterbreiten wir Ihnen folgendes Angebot: [DETAILS]. Gültig bis [DATUM]. Bei Fragen melden Sie sich gerne!',
      tags: ['email', 'angebot', 'template'],
      keywords: ['angebots-email', 'offer-email']
    },
    {
      category: 'email_template',
      title: 'Follow-Up Email',
      content: 'Betreff: "Ihr Umzugsangebot - Haben Sie noch Fragen?". Inhalt: Vor 7 Tagen habe ich Ihnen ein Angebot unterbreitet. Gibt es noch offene Fragen? Gerne bespreche ich Details mit Ihnen.',
      tags: ['email', 'followup', 'template'],
      keywords: ['follow-up-email', 'nachfass-email']
    },

    // ===== PHONE SCRIPTS =====
    {
      category: 'phone_script',
      title: 'Neuanfrage Telefon-Script',
      content: 'Begrüßung: RELOCATO® Umzüge, [NAME], guten Tag! Dann: 1.Kundenname?, 2.Von wo nach wo?, 3.Wann?, 4.Zimmerzahl?, 5.Etage & Aufzug?, 6.Besonderheiten?',
      tags: ['telefon', 'script', 'neuanfrage'],
      keywords: ['telefonskript', 'gesprächsleitfaden']
    }
  ];

  console.log(`📚 Inserting ${knowledgeItems.length} knowledge items...\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const item of knowledgeItems) {
    try {
      // Generate embedding
      const embedding = generateMockEmbedding(item.content);

      // Insert
      const { data, error } = await supabase
        .from('ai_knowledge_base')
        .insert({
          category: item.category,
          title: item.title,
          content: item.content,
          embedding,
          tags: item.tags,
          keywords: item.keywords
        })
        .select();

      if (error) {
        console.error(`❌ Error inserting "${item.title}":`, error.message);
        errorCount++;
      } else {
        console.log(`✅ Inserted: ${item.title}`);
        successCount++;
      }

    } catch (error) {
      console.error(`❌ Exception for "${item.title}":`, error.message);
      errorCount++;
    }
  }

  console.log(`\n═══════════════════════════════════════`);
  console.log(`📊 Results:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`═══════════════════════════════════════\n`);

  if (successCount > 0) {
    console.log('🎉 Knowledge Base populated successfully!');
    console.log('\n🔍 Verify in Supabase Dashboard:');
    console.log('   Table Editor → ai_knowledge_base');
    console.log(`   Should have ${successCount} rows\n`);
  }
}

populateKnowledgeBase();

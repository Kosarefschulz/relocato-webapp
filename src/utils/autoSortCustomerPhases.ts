/**
 * Auto-Sort Customer Phases
 * Sortiert Kunden automatisch basierend auf Kalenderdaten
 */

import { databaseService } from '../config/database.config';
import { CustomerPhase } from '../types';

interface SortingRule {
  customerName: string;
  phase: CustomerPhase;
  reason: string;
}

export async function autoSortCustomerPhases() {
  console.log('🔄 Starting auto-sort of customer phases...');

  try {
    // Lade alle Kunden
    const customers = await databaseService.getCustomers();
    console.log(`📊 Loaded ${customers.length} customers`);

    const updates: SortingRule[] = [];
    const cutoffDate = new Date('2025-10-01');
    const lastSeptemberWeek = new Date('2025-09-24');

    for (const customer of customers) {
      let newPhase: CustomerPhase | null = null;
      let reason = '';

      // Parse moving date
      const movingDate = customer.movingDate ? new Date(customer.movingDate) : null;

      if (movingDate) {
        // Termine vor letzter Septemberwoche → Archiviert
        if (movingDate < lastSeptemberWeek) {
          newPhase = 'archiviert';
          reason = `Umzug vor ${lastSeptemberWeek.toLocaleDateString('de-DE')}`;
        }
        // Termine ab 1. Oktober
        else if (movingDate >= cutoffDate) {
          // Prüfe Event-Typ basierend auf Kundendaten
          const hasQuote = customer.id; // Placeholder - würde normalerweise Quotes prüfen

          // UT/RT im Kalender = Umzugstermin → Durchführung
          if (customer.name.includes('UT:') || customer.name.includes('RT:') ||
              movingDate > new Date()) {
            newPhase = 'durchfuehrung';
            reason = `Umzugstermin am ${movingDate.toLocaleDateString('de-DE')}`;
          }
          // BT im Kalender = Besichtigungstermin
          else if (customer.name.includes('BT:')) {
            newPhase = 'besichtigung_geplant';
            reason = `Besichtigung am ${movingDate.toLocaleDateString('de-DE')}`;
          }
          // Fallback: Datum in Zukunft
          else if (movingDate > new Date()) {
            newPhase = 'besichtigung_geplant';
            reason = `Termin am ${movingDate.toLocaleDateString('de-DE')}`;
          }
        }
        // Letzte Septemberwoche bis 30.09
        else if (movingDate >= lastSeptemberWeek && movingDate < cutoffDate) {
          newPhase = 'durchfuehrung';
          reason = `Umzug Ende September`;
        }
      }
      // Kunden ohne Datum
      else {
        // Bleiben in aktueller Phase oder "angerufen"
        if (!customer.currentPhase) {
          newPhase = 'angerufen';
          reason = 'Kein Umzugsdatum';
        }
      }

      // Update nur wenn Phase geändert werden soll
      if (newPhase && newPhase !== customer.currentPhase) {
        updates.push({
          customerName: customer.name,
          phase: newPhase,
          reason
        });

        await databaseService.updateCustomer(customer.id, {
          currentPhase: newPhase
        });
      }
    }

    console.log(`\n✅ Auto-sort completed! Updated ${updates.length} customers:\n`);
    console.table(updates);

    return {
      success: true,
      updatedCount: updates.length,
      updates
    };

  } catch (error) {
    console.error('❌ Error during auto-sort:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Manuelle Phasen-Zuordnung basierend auf Kalenderdaten
export const MANUAL_PHASE_ASSIGNMENTS: Record<string, CustomerPhase> = {
  // Ab 1. Oktober - Umzugstermine (grün UT/RT)
  'Alexander Betz': 'durchfuehrung',
  'Christopher Francke': 'durchfuehrung',
  'Norbert Deckert': 'durchfuehrung',
  'Peter Bellmann': 'durchfuehrung',
  'ETW GmbH Transport': 'durchfuehrung',
  'Franziska Weßler': 'durchfuehrung',
  'Fried/Hayder Dhahir': 'durchfuehrung',
  'Axel Erfkamp': 'durchfuehrung',
  'Brigitte Erfkamp': 'durchfuehrung',
  'Manfred Gärtner': 'durchfuehrung',
  'Francke Umzug': 'durchfuehrung',
  'Melanie Hainke': 'durchfuehrung',
  'Sigrid Roski': 'durchfuehrung',
  'Norbert Fuest': 'durchfuehrung',
  'Bernd Hinrechs': 'durchfuehrung',
  'Vera Krüger': 'durchfuehrung',
  'Michaela Heine': 'durchfuehrung',
  'Xenia Möller': 'durchfuehrung',
  'Helmut Gröger': 'durchfuehrung',
  'Filiz Temiz': 'durchfuehrung',

  // Besichtigungstermine (rosa BT)
  'Gerda Rohden': 'besichtigung_geplant',
  'Sabine Schwind': 'besichtigung_geplant',
  'Birgit Chrapia': 'besichtigung_geplant',
  'Scharke Hausmeister Domizil': 'besichtigung_geplant',
  'Jacqueline Leiwat': 'besichtigung_geplant',
  'Martina Steinke': 'besichtigung_geplant',
  'Von der Heide': 'besichtigung_geplant',
  'Christiane Hanswillemenke': 'besichtigung_geplant',
  'Thorsten Fischer': 'besichtigung_geplant',
  'Thomas Buekenhout': 'besichtigung_geplant',
  'Stefanie Käßner': 'besichtigung_geplant',
  'Esra Kudeyt': 'besichtigung_geplant',
  'Ralf Hallermann': 'besichtigung_geplant',
  'Heike Obermeyer': 'besichtigung_geplant',
  'Benninghoff': 'besichtigung_geplant',
  'Schmiede: Fr. Littmann': 'besichtigung_geplant',

  // Letzte Septemberwoche (24-30.09)
  'Sergej Schulz': 'archiviert',
};

export async function applyManualPhaseAssignments() {
  console.log('🔄 Applying manual phase assignments...');

  try {
    const customers = await databaseService.getCustomers();
    let updatedCount = 0;

    for (const [customerNamePattern, phase] of Object.entries(MANUAL_PHASE_ASSIGNMENTS)) {
      // Finde Kunde mit partiellem Namensabgleich
      const customer = customers.find(c =>
        c.name.toLowerCase().includes(customerNamePattern.toLowerCase()) ||
        customerNamePattern.toLowerCase().includes(c.name.toLowerCase())
      );

      if (customer && customer.currentPhase !== phase) {
        await databaseService.updateCustomer(customer.id, {
          currentPhase: phase
        });
        console.log(`✅ ${customer.name}: ${customer.currentPhase || 'keine'} → ${phase}`);
        updatedCount++;
      }
    }

    console.log(`\n✅ Manual assignments completed! Updated ${updatedCount} customers`);
    return { success: true, updatedCount };

  } catch (error) {
    console.error('❌ Error applying manual assignments:', error);
    return { success: false, error };
  }
}

// Exportiere für Browser Console
if (typeof window !== 'undefined') {
  (window as any).autoSortCustomerPhases = autoSortCustomerPhases;
  (window as any).applyManualPhaseAssignments = applyManualPhaseAssignments;
}

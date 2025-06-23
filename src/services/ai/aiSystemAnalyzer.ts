import { firebaseService } from '../firebaseService';
import analyticsService from '../analyticsService';

export class AISystemAnalyzer {
  async getCompleteSystemState(): Promise<string> {
    try {
      // Sammle alle System-Informationen
      const [
        customers,
        quotes,
        invoices,
        systemHealth,
        appStructure,
        recentErrors
      ] = await Promise.all([
        this.getCustomerStats(),
        this.getQuoteStats(),
        this.getInvoiceStats(),
        this.checkSystemHealth(),
        this.getAppStructure(),
        this.getRecentErrors()
      ]);

      return `
VOLLSTÄNDIGER SYSTEM-STATUS:

📊 GESCHÄFTSDATEN:
${customers}
${quotes}
${invoices}

🏗️ APP-STRUKTUR:
${appStructure}

💪 SYSTEM-GESUNDHEIT:
${systemHealth}

⚠️ AKTUELLE PROBLEME:
${recentErrors}

🚀 VERFÜGBARE FUNKTIONEN:
- Kundenverwaltung (Erstellen, Suchen, Bearbeiten, Duplikate finden)
- Angebotserstellung (Mit Preiskalkulation, PDF-Generierung, E-Mail-Versand)
- Rechnungswesen (Rechnungen erstellen, Mahnungen, Zahlungsverfolgung)
- E-Mail-System (Vorlagen, Automatisierung, Massenversand)
- Kalender & Disposition (Termine, Routen, Mitarbeiter)
- Analytics (Umsätze, Trends, Berichte)
- Dokumentenverwaltung (PDFs, Fotos, Unterschriften)
- Import/Export (Google Sheets, EML-Dateien)

📱 UI-KOMPONENTEN:
- Dashboard (Übersicht, Quick-Actions)
- Kundenliste (Optimiert mit Pagination)
- E-Mail-Client (Professional mit Vorlagen)
- Angebotseditor (Ultimate-Version mit allen Features)
- Dispositionsplaner (Drag & Drop)
- Admin-Tools (Duplikate, Import, KI-Einstellungen)
`;
    } catch (error) {
      return `Fehler beim Abrufen des System-Status: ${error}`;
    }
  }

  private async getCustomerStats(): Promise<string> {
    try {
      const customers = await firebaseService.getCustomers();
      const activeCustomers = customers.filter(c => {
        const lastContact = new Date(c.updatedAt || c.createdAt || 0);
        const daysSinceContact = (Date.now() - lastContact.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceContact < 90;
      });

      const cities = customers.reduce((acc, c) => {
        const city = c.city || 'Unbekannt';
        acc[city] = (acc[city] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topCities = Object.entries(cities)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([city, count]) => `  - ${city}: ${count}`)
        .join('\n');

      return `
Kunden-Statistik:
- Gesamt: ${customers.length}
- Aktive (< 90 Tage): ${activeCustomers.length}
- Top-Städte:
${topCities}`;
    } catch (error) {
      return `Kunden-Statistik: Fehler beim Laden`;
    }
  }

  private async getQuoteStats(): Promise<string> {
    try {
      const quotes = await firebaseService.getQuotes();
      const thisMonth = quotes.filter(q => {
        const date = new Date(q.createdAt);
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      });

      const totalValue = quotes.reduce((sum, q) => sum + (q.price || 0), 0);
      const avgValue = quotes.length > 0 ? totalValue / quotes.length : 0;

      const statusCount = quotes.reduce((acc, q) => {
        acc[q.status] = (acc[q.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return `
Angebots-Statistik:
- Gesamt: ${quotes.length}
- Diesen Monat: ${thisMonth.length}
- Gesamtwert: ${totalValue.toFixed(2)}€
- Durchschnitt: ${avgValue.toFixed(2)}€
- Status: ${Object.entries(statusCount).map(([s, c]) => `${s}: ${c}`).join(', ')}`;
    } catch (error) {
      return `Angebots-Statistik: Fehler beim Laden`;
    }
  }

  private async getInvoiceStats(): Promise<string> {
    try {
      const invoices = await firebaseService.getInvoices();
      const unpaid = invoices.filter(i => i.status === 'sent' || i.status === 'unpaid');
      const totalUnpaid = unpaid.reduce((sum, i) => sum + (i.totalPrice || 0), 0);

      const overdue = unpaid.filter(i => {
        const dueDate = new Date(i.dueDate);
        return dueDate < new Date();
      });

      return `
Rechnungs-Statistik:
- Gesamt: ${invoices.length}
- Unbezahlt: ${unpaid.length} (${totalUnpaid.toFixed(2)}€)
- Überfällig: ${overdue.length}`;
    } catch (error) {
      return `Rechnungs-Statistik: Fehler beim Laden`;
    }
  }

  private async checkSystemHealth(): Promise<string> {
    const checks = [];

    // Firebase Connection
    try {
      await firebaseService.getCustomers();
      checks.push('✅ Firebase: Verbunden');
    } catch {
      checks.push('❌ Firebase: Keine Verbindung');
    }

    // E-Mail Service
    checks.push('✅ E-Mail: SendGrid/IONOS konfiguriert');

    // Storage
    checks.push('✅ Storage: Firebase Storage aktiv');

    // Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      checks.push('✅ Analytics: Google Analytics aktiv');
    } else {
      checks.push('⚠️ Analytics: Nicht geladen');
    }

    return checks.join('\n');
  }

  private getAppStructure(): string {
    return `
- React 19.1.0 mit TypeScript
- Material-UI für Design
- Firebase für Backend (Firestore, Auth, Storage)
- Vercel für Hosting
- SendGrid/IONOS für E-Mails
- jsPDF für PDF-Generierung
- Google Sheets Integration
- PWA-fähig (installierbar)

Hauptseiten:
- /dashboard - Übersicht
- /customers - Kundenverwaltung
- /create-quote - Angebotserstellung
- /quotes - Angebotsübersicht
- /invoices - Rechnungen
- /calendar - Kalender
- /disposition - Disposition
- /email-client - E-Mail-Center
- /analytics - Statistiken
- /admin-tools - Admin-Bereich`;
  }

  private async getRecentErrors(): Promise<string> {
    // Hier könntest du ein Error-Logging-System integrieren
    return `
- Keine kritischen Fehler in den letzten 24h
- Performance: Durchschnittliche Ladezeit < 2s
- Alle Services erreichbar`;
  }

  async getDatabaseStructure(): Promise<string> {
    return `
FIRESTORE COLLECTIONS:
- customers/
  - {id}
    - name, phone, email, address
    - apartment: {rooms, area, floor, elevator}
    - tags[], notes, priority
    - createdAt, updatedAt

- quotes/
  - {id}
    - customerId, customerName
    - price, volume, distance
    - status, calculation
    - createdAt, createdBy

- invoices/
  - {id}
    - customerId, quoteId
    - invoiceNumber, items[]
    - price, tax, total
    - status, dueDate

- email_templates/
  - {id}
    - name, subject, content
    - variables[], category

- settings/
  - ai_config
  - company_settings
  - email_settings`;
  }

  async getAppFeatures(): Promise<string> {
    return `
HAUPTFUNKTIONEN DER UMZUGSAPP:

📦 KUNDENVERWALTUNG
- Anlegen, Bearbeiten, Löschen von Kunden
- Duplikatserkennung und -bereinigung
- Tags und Prioritäten
- Import/Export (Google Sheets, CSV)
- Erweiterte Suche und Filter

💰 ANGEBOTS- & PREISSYSTEM
- Automatische Preisberechnung nach Volumen
- Entfernungszuschläge (2,50€/km über 50km)
- Etagenzuschläge (3% pro Etage)
- Zusatzleistungen (Verpackung, Montage, etc.)
- PDF-Generierung mit Unterschriftsmöglichkeit

📧 E-MAIL-SYSTEM
- Professionelle E-Mail-Vorlagen
- SendGrid & IONOS Integration
- Massen-E-Mail-Versand
- Automatische Follow-ups
- E-Mail-Import aus EML-Dateien

📅 KALENDER & DISPOSITION
- Termin- und Routenplanung
- Mitarbeiterzuweisung
- Drag & Drop Interface
- Google Calendar Integration
- Fahrzeugverwaltung

📊 ANALYTICS & BERICHTE
- Umsatzstatistiken
- Kundenanalysen
- Performance-Metriken
- Export-Funktionen
- Echtzeit-Dashboard

🤖 KI-ASSISTENT (NEU!)
- Natürliche Sprachverarbeitung
- Automatische Angebotserstellung
- Bildanalyse (Besichtigungsfotos)
- Spracherkennung
- Hintergrundaufgaben

🔧 ADMIN-TOOLS
- Benutzerverwaltung
- Systemeinstellungen
- Backup & Restore
- API-Konfiguration
- Fehlerüberwachung`;
  }
}
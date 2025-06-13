export interface TranslationKeys {
  // Navigation & Layout
  'nav.dashboard': string;
  'nav.customers': string;
  'nav.quotes': string;
  'nav.analytics': string;
  'nav.settings': string;
  'nav.profile': string;
  'nav.help': string;

  // Common UI Elements
  'common.save': string;
  'common.cancel': string;
  'common.delete': string;
  'common.edit': string;
  'common.view': string;
  'common.add': string;
  'common.search': string;
  'common.filter': string;
  'common.export': string;
  'common.import': string;
  'common.loading': string;
  'common.error': string;
  'common.success': string;
  'common.warning': string;
  'common.info': string;
  'common.confirm': string;
  'common.yes': string;
  'common.no': string;
  'common.back': string;
  'common.next': string;
  'common.previous': string;
  'common.close': string;
  'common.refresh': string;

  // Dashboard
  'dashboard.title': string;
  'dashboard.welcome': string;
  'dashboard.totalRevenue': string;
  'dashboard.totalQuotes': string;
  'dashboard.totalCustomers': string;
  'dashboard.conversionRate': string;
  'dashboard.recentQuotes': string;
  'dashboard.recentCustomers': string;
  'dashboard.monthlyGrowth': string;
  'dashboard.targetAchievement': string;

  // Customers
  'customers.title': string;
  'customers.list': string;
  'customers.add': string;
  'customers.edit': string;
  'customers.delete': string;
  'customers.firstName': string;
  'customers.lastName': string;
  'customers.email': string;
  'customers.phone': string;
  'customers.address': string;
  'customers.city': string;
  'customers.zipCode': string;
  'customers.company': string;
  'customers.notes': string;
  'customers.createdAt': string;
  'customers.lastContact': string;
  'customers.totalQuotes': string;
  'customers.totalRevenue': string;
  'customers.status': string;
  'customers.active': string;
  'customers.inactive': string;
  'customers.new': string;
  'customers.returning': string;

  // Quotes
  'quotes.title': string;
  'quotes.list': string;
  'quotes.create': string;
  'quotes.edit': string;
  'quotes.delete': string;
  'quotes.duplicate': string;
  'quotes.send': string;
  'quotes.accept': string;
  'quotes.reject': string;
  'quotes.status': string;
  'quotes.draft': string;
  'quotes.sent': string;
  'quotes.accepted': string;
  'quotes.rejected': string;
  'quotes.expired': string;
  'quotes.id': string;
  'quotes.customer': string;
  'quotes.price': string;
  'quotes.date': string;
  'quotes.validUntil': string;
  'quotes.services': string;
  'quotes.description': string;
  'quotes.notes': string;
  'quotes.terms': string;
  'quotes.total': string;
  'quotes.subtotal': string;
  'quotes.tax': string;
  'quotes.discount': string;
  'quotes.finalPrice': string;

  // Services
  'services.standardMove': string;
  'services.packingService': string;
  'services.cleaningService': string;
  'services.pianoTransport': string;
  'services.storage': string;
  'services.officeMove': string;
  'services.dismantling': string;
  'services.assembly': string;
  'services.renovation': string;
  'services.disposal': string;

  // Analytics
  'analytics.title': string;
  'analytics.overview': string;
  'analytics.revenue': string;
  'analytics.customers': string;
  'analytics.performance': string;
  'analytics.revenueTracking': string;
  'analytics.kpiDashboard': string;
  'analytics.timeRange': string;
  'analytics.lastWeek': string;
  'analytics.lastMonth': string;
  'analytics.last3Months': string;
  'analytics.last6Months': string;
  'analytics.lastYear': string;
  'analytics.last2Years': string;
  'analytics.growth': string;
  'analytics.target': string;
  'analytics.achieved': string;
  'analytics.pending': string;
  'analytics.trend': string;
  'analytics.compare': string;
  'analytics.export': string;

  // KPI
  'kpi.totalRevenue': string;
  'kpi.monthlyRecurring': string;
  'kpi.averageOrderValue': string;
  'kpi.customerSatisfaction': string;
  'kpi.newCustomers': string;
  'kpi.conversionRate': string;
  'kpi.responseTime': string;
  'kpi.completedMoves': string;
  'kpi.fleetUtilization': string;
  'kpi.targetAchievement': string;

  // Forms & Validation
  'form.required': string;
  'form.email.invalid': string;
  'form.phone.invalid': string;
  'form.zipCode.invalid': string;
  'form.price.invalid': string;
  'form.date.invalid': string;
  'form.submit': string;
  'form.reset': string;
  'form.clear': string;

  // Messages & Notifications
  'message.saveSuccess': string;
  'message.deleteSuccess': string;
  'message.deleteConfirm': string;
  'message.loadError': string;
  'message.saveError': string;
  'message.networkError': string;
  'message.permissionError': string;
  'message.validationError': string;
  'message.emptyData': string;
  'message.noResults': string;

  // Time & Dates
  'time.today': string;
  'time.yesterday': string;
  'time.tomorrow': string;
  'time.thisWeek': string;
  'time.thisMonth': string;
  'time.thisYear': string;
  'time.hour': string;
  'time.hours': string;
  'time.day': string;
  'time.days': string;
  'time.week': string;
  'time.weeks': string;
  'time.month': string;
  'time.months': string;
  'time.year': string;
  'time.years': string;
  'time.ago': string;
  'time.in': string;

  // Units & Currency
  'currency.eur': string;
  'unit.km': string;
  'unit.hours': string;
  'unit.days': string;
  'unit.pieces': string;
  'unit.m3': string;
  'unit.kg': string;
  'unit.percentage': string;

  // Status Messages
  'status.online': string;
  'status.offline': string;
  'status.connecting': string;
  'status.connected': string;
  'status.disconnected': string;
  'status.syncing': string;
  'status.synced': string;
  'status.error': string;

  // Moving Specific Terms
  'move.fromAddress': string;
  'move.toAddress': string;
  'move.distance': string;
  'move.moveDate': string;
  'move.moveTime': string;
  'move.duration': string;
  'move.crew': string;
  'move.truck': string;
  'move.volume': string;
  'move.weight': string;
  'move.floors': string;
  'move.elevator': string;
  'move.parking': string;
  'move.specialItems': string;
  'move.instructions': string;

  // Company Info
  'company.name': string;
  'company.tagline': string;
  'company.address': string;
  'company.phone': string;
  'company.email': string;
  'company.website': string;
  'company.about': string;
  'company.services': string;
  'company.testimonials': string;
  'company.contact': string;

  // Settings & Preferences
  'settings.language': string;
  'settings.languageDescription': string;
  'settings.browserLanguageDetected': string;
  'settings.useBrowserLanguage': string;
  'settings.theme': string;
  'settings.notifications': string;
  'settings.privacy': string;

  // Additional Navigation
  'nav.language': string;
}

// German translations
export const deTranslations: TranslationKeys = {
  // Navigation & Layout
  'nav.dashboard': 'Dashboard',
  'nav.customers': 'Kunden',
  'nav.quotes': 'Angebote',
  'nav.analytics': 'Analytics',
  'nav.settings': 'Einstellungen',
  'nav.logout': 'Abmelden',
  'nav.profile': 'Profil',
  'nav.help': 'Hilfe',

  // Common UI Elements
  'common.save': 'Speichern',
  'common.cancel': 'Abbrechen',
  'common.delete': 'Löschen',
  'common.edit': 'Bearbeiten',
  'common.view': 'Anzeigen',
  'common.add': 'Hinzufügen',
  'common.search': 'Suchen',
  'common.filter': 'Filter',
  'common.export': 'Exportieren',
  'common.import': 'Importieren',
  'common.loading': 'Lädt...',
  'common.error': 'Fehler',
  'common.success': 'Erfolgreich',
  'common.warning': 'Warnung',
  'common.info': 'Info',
  'common.confirm': 'Bestätigen',
  'common.yes': 'Ja',
  'common.no': 'Nein',
  'common.back': 'Zurück',
  'common.next': 'Weiter',
  'common.previous': 'Vorherige',
  'common.close': 'Schließen',
  'common.refresh': 'Aktualisieren',

  // Dashboard
  'dashboard.title': 'Dashboard',
  'dashboard.welcome': 'Willkommen zurück!',
  'dashboard.totalRevenue': 'Gesamtumsatz',
  'dashboard.totalQuotes': 'Angebote gesamt',
  'dashboard.totalCustomers': 'Kunden gesamt',
  'dashboard.conversionRate': 'Conversion Rate',
  'dashboard.recentQuotes': 'Aktuelle Angebote',
  'dashboard.recentCustomers': 'Neue Kunden',
  'dashboard.monthlyGrowth': 'Monatliches Wachstum',
  'dashboard.targetAchievement': 'Zielerreichung',

  // Customers
  'customers.title': 'Kunden',
  'customers.list': 'Kundenliste',
  'customers.add': 'Kunde hinzufügen',
  'customers.edit': 'Kunde bearbeiten',
  'customers.delete': 'Kunde löschen',
  'customers.firstName': 'Vorname',
  'customers.lastName': 'Nachname',
  'customers.email': 'E-Mail',
  'customers.phone': 'Telefon',
  'customers.address': 'Adresse',
  'customers.city': 'Stadt',
  'customers.zipCode': 'PLZ',
  'customers.company': 'Firma',
  'customers.notes': 'Notizen',
  'customers.createdAt': 'Erstellt am',
  'customers.lastContact': 'Letzter Kontakt',
  'customers.totalQuotes': 'Angebote insgesamt',
  'customers.totalRevenue': 'Umsatz insgesamt',
  'customers.status': 'Status',
  'customers.active': 'Aktiv',
  'customers.inactive': 'Inaktiv',
  'customers.new': 'Neukunde',
  'customers.returning': 'Stammkunde',

  // Quotes
  'quotes.title': 'Angebote',
  'quotes.list': 'Angebotsliste',
  'quotes.create': 'Angebot erstellen',
  'quotes.edit': 'Angebot bearbeiten',
  'quotes.delete': 'Angebot löschen',
  'quotes.duplicate': 'Angebot duplizieren',
  'quotes.send': 'Angebot senden',
  'quotes.accept': 'Angebot annehmen',
  'quotes.reject': 'Angebot ablehnen',
  'quotes.status': 'Status',
  'quotes.draft': 'Entwurf',
  'quotes.sent': 'Versendet',
  'quotes.accepted': 'Angenommen',
  'quotes.rejected': 'Abgelehnt',
  'quotes.expired': 'Abgelaufen',
  'quotes.id': 'Angebots-ID',
  'quotes.customer': 'Kunde',
  'quotes.price': 'Preis',
  'quotes.date': 'Datum',
  'quotes.validUntil': 'Gültig bis',
  'quotes.services': 'Leistungen',
  'quotes.description': 'Beschreibung',
  'quotes.notes': 'Notizen',
  'quotes.terms': 'Bedingungen',
  'quotes.total': 'Gesamt',
  'quotes.subtotal': 'Zwischensumme',
  'quotes.tax': 'MwSt.',
  'quotes.discount': 'Rabatt',
  'quotes.finalPrice': 'Endpreis',

  // Services
  'services.standardMove': 'Standardumzug',
  'services.packingService': 'Verpackungsservice',
  'services.cleaningService': 'Reinigungsservice',
  'services.pianoTransport': 'Klaviertransport',
  'services.storage': 'Lagerung',
  'services.officeMove': 'Büroumzug',
  'services.dismantling': 'Demontage',
  'services.assembly': 'Montage',
  'services.renovation': 'Renovierung',
  'services.disposal': 'Entsorgung',

  // Analytics
  'analytics.title': 'Analytics',
  'analytics.overview': 'Übersicht',
  'analytics.revenue': 'Umsatz',
  'analytics.customers': 'Kunden',
  'analytics.performance': 'Performance',
  'analytics.revenueTracking': 'Revenue Tracking',
  'analytics.kpiDashboard': 'KPI Dashboard',
  'analytics.timeRange': 'Zeitraum',
  'analytics.lastWeek': 'Letzte Woche',
  'analytics.lastMonth': 'Letzter Monat',
  'analytics.last3Months': 'Letzte 3 Monate',
  'analytics.last6Months': 'Letzte 6 Monate',
  'analytics.lastYear': 'Letztes Jahr',
  'analytics.last2Years': 'Letzte 2 Jahre',
  'analytics.growth': 'Wachstum',
  'analytics.target': 'Ziel',
  'analytics.achieved': 'Erreicht',
  'analytics.pending': 'Ausstehend',
  'analytics.trend': 'Trend',
  'analytics.compare': 'Vergleichen',
  'analytics.export': 'Exportieren',

  // KPI
  'kpi.totalRevenue': 'Gesamtumsatz',
  'kpi.monthlyRecurring': 'Monatlich wiederkehrend',
  'kpi.averageOrderValue': 'Ø Auftragswert',
  'kpi.customerSatisfaction': 'Kundenzufriedenheit',
  'kpi.newCustomers': 'Neukunden',
  'kpi.conversionRate': 'Conversion Rate',
  'kpi.responseTime': 'Ø Antwortzeit',
  'kpi.completedMoves': 'Abgeschlossene Umzüge',
  'kpi.fleetUtilization': 'Fahrzeugauslastung',
  'kpi.targetAchievement': 'Zielerreichung',

  // Forms & Validation
  'form.required': 'Dieses Feld ist erforderlich',
  'form.email.invalid': 'Ungültige E-Mail-Adresse',
  'form.phone.invalid': 'Ungültige Telefonnummer',
  'form.zipCode.invalid': 'Ungültige Postleitzahl',
  'form.price.invalid': 'Ungültiger Preis',
  'form.date.invalid': 'Ungültiges Datum',
  'form.submit': 'Absenden',
  'form.reset': 'Zurücksetzen',
  'form.clear': 'Leeren',

  // Messages & Notifications
  'message.saveSuccess': 'Erfolgreich gespeichert',
  'message.deleteSuccess': 'Erfolgreich gelöscht',
  'message.deleteConfirm': 'Möchten Sie diesen Eintrag wirklich löschen?',
  'message.loadError': 'Fehler beim Laden der Daten',
  'message.saveError': 'Fehler beim Speichern',
  'message.networkError': 'Netzwerkfehler',
  'message.permissionError': 'Keine Berechtigung',
  'message.validationError': 'Validierungsfehler',
  'message.emptyData': 'Keine Daten vorhanden',
  'message.noResults': 'Keine Ergebnisse gefunden',

  // Time & Dates
  'time.today': 'Heute',
  'time.yesterday': 'Gestern',
  'time.tomorrow': 'Morgen',
  'time.thisWeek': 'Diese Woche',
  'time.thisMonth': 'Dieser Monat',
  'time.thisYear': 'Dieses Jahr',
  'time.hour': 'Stunde',
  'time.hours': 'Stunden',
  'time.day': 'Tag',
  'time.days': 'Tage',
  'time.week': 'Woche',
  'time.weeks': 'Wochen',
  'time.month': 'Monat',
  'time.months': 'Monate',
  'time.year': 'Jahr',
  'time.years': 'Jahre',
  'time.ago': 'vor',
  'time.in': 'in',

  // Units & Currency
  'currency.eur': '€',
  'unit.km': 'km',
  'unit.hours': 'Std',
  'unit.days': 'Tage',
  'unit.pieces': 'Stück',
  'unit.m3': 'm³',
  'unit.kg': 'kg',
  'unit.percentage': '%',

  // Status Messages
  'status.online': 'Online',
  'status.offline': 'Offline',
  'status.connecting': 'Verbinde...',
  'status.connected': 'Verbunden',
  'status.disconnected': 'Getrennt',
  'status.syncing': 'Synchronisiere...',
  'status.synced': 'Synchronisiert',
  'status.error': 'Fehler',

  // Moving Specific Terms
  'move.fromAddress': 'Von Adresse',
  'move.toAddress': 'Nach Adresse',
  'move.distance': 'Entfernung',
  'move.moveDate': 'Umzugsdatum',
  'move.moveTime': 'Umzugszeit',
  'move.duration': 'Dauer',
  'move.crew': 'Team',
  'move.truck': 'Fahrzeug',
  'move.volume': 'Volumen',
  'move.weight': 'Gewicht',
  'move.floors': 'Stockwerke',
  'move.elevator': 'Aufzug',
  'move.parking': 'Parkplatz',
  'move.specialItems': 'Besondere Gegenstände',
  'move.instructions': 'Anweisungen',

  // Company Info
  'company.name': 'relocato',
  'company.tagline': 'Ihr professioneller Umzugspartner',
  'company.address': 'Musterstraße 123, 12345 Berlin',
  'company.phone': '+49 30 12345678',
  'company.email': 'info@relocato.de',
  'company.website': 'www.relocato.de',
  'company.about': 'Über uns',
  'company.services': 'Unsere Leistungen',
  'company.testimonials': 'Kundenbewertungen',
  'company.contact': 'Kontakt',

  // Settings & Preferences
  'settings.language': 'Sprache',
  'settings.languageDescription': 'Wählen Sie Ihre bevorzugte Sprache',
  'settings.browserLanguageDetected': 'Browser-Sprache erkannt',
  'settings.useBrowserLanguage': 'Browser-Sprache verwenden',
  'settings.theme': 'Design',
  'settings.notifications': 'Benachrichtigungen',
  'settings.privacy': 'Datenschutz',

  // Additional Navigation
  'nav.language': 'Sprache',
};

// English translations
export const enTranslations: TranslationKeys = {
  // Navigation & Layout
  'nav.dashboard': 'Dashboard',
  'nav.customers': 'Customers',
  'nav.quotes': 'Quotes',
  'nav.analytics': 'Analytics',
  'nav.settings': 'Settings',
  'nav.logout': 'Logout',
  'nav.profile': 'Profile',
  'nav.help': 'Help',

  // Common UI Elements
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.delete': 'Delete',
  'common.edit': 'Edit',
  'common.view': 'View',
  'common.add': 'Add',
  'common.search': 'Search',
  'common.filter': 'Filter',
  'common.export': 'Export',
  'common.import': 'Import',
  'common.loading': 'Loading...',
  'common.error': 'Error',
  'common.success': 'Success',
  'common.warning': 'Warning',
  'common.info': 'Info',
  'common.confirm': 'Confirm',
  'common.yes': 'Yes',
  'common.no': 'No',
  'common.back': 'Back',
  'common.next': 'Next',
  'common.previous': 'Previous',
  'common.close': 'Close',
  'common.refresh': 'Refresh',

  // Dashboard
  'dashboard.title': 'Dashboard',
  'dashboard.welcome': 'Welcome back!',
  'dashboard.totalRevenue': 'Total Revenue',
  'dashboard.totalQuotes': 'Total Quotes',
  'dashboard.totalCustomers': 'Total Customers',
  'dashboard.conversionRate': 'Conversion Rate',
  'dashboard.recentQuotes': 'Recent Quotes',
  'dashboard.recentCustomers': 'New Customers',
  'dashboard.monthlyGrowth': 'Monthly Growth',
  'dashboard.targetAchievement': 'Target Achievement',

  // Customers
  'customers.title': 'Customers',
  'customers.list': 'Customer List',
  'customers.add': 'Add Customer',
  'customers.edit': 'Edit Customer',
  'customers.delete': 'Delete Customer',
  'customers.firstName': 'First Name',
  'customers.lastName': 'Last Name',
  'customers.email': 'Email',
  'customers.phone': 'Phone',
  'customers.address': 'Address',
  'customers.city': 'City',
  'customers.zipCode': 'ZIP Code',
  'customers.company': 'Company',
  'customers.notes': 'Notes',
  'customers.createdAt': 'Created At',
  'customers.lastContact': 'Last Contact',
  'customers.totalQuotes': 'Total Quotes',
  'customers.totalRevenue': 'Total Revenue',
  'customers.status': 'Status',
  'customers.active': 'Active',
  'customers.inactive': 'Inactive',
  'customers.new': 'New Customer',
  'customers.returning': 'Returning Customer',

  // Quotes
  'quotes.title': 'Quotes',
  'quotes.list': 'Quote List',
  'quotes.create': 'Create Quote',
  'quotes.edit': 'Edit Quote',
  'quotes.delete': 'Delete Quote',
  'quotes.duplicate': 'Duplicate Quote',
  'quotes.send': 'Send Quote',
  'quotes.accept': 'Accept Quote',
  'quotes.reject': 'Reject Quote',
  'quotes.status': 'Status',
  'quotes.draft': 'Draft',
  'quotes.sent': 'Sent',
  'quotes.accepted': 'Accepted',
  'quotes.rejected': 'Rejected',
  'quotes.expired': 'Expired',
  'quotes.id': 'Quote ID',
  'quotes.customer': 'Customer',
  'quotes.price': 'Price',
  'quotes.date': 'Date',
  'quotes.validUntil': 'Valid Until',
  'quotes.services': 'Services',
  'quotes.description': 'Description',
  'quotes.notes': 'Notes',
  'quotes.terms': 'Terms',
  'quotes.total': 'Total',
  'quotes.subtotal': 'Subtotal',
  'quotes.tax': 'Tax',
  'quotes.discount': 'Discount',
  'quotes.finalPrice': 'Final Price',

  // Services
  'services.standardMove': 'Standard Move',
  'services.packingService': 'Packing Service',
  'services.cleaningService': 'Cleaning Service',
  'services.pianoTransport': 'Piano Transport',
  'services.storage': 'Storage',
  'services.officeMove': 'Office Move',
  'services.dismantling': 'Dismantling',
  'services.assembly': 'Assembly',
  'services.renovation': 'Renovation',
  'services.disposal': 'Disposal',

  // Analytics
  'analytics.title': 'Analytics',
  'analytics.overview': 'Overview',
  'analytics.revenue': 'Revenue',
  'analytics.customers': 'Customers',
  'analytics.performance': 'Performance',
  'analytics.revenueTracking': 'Revenue Tracking',
  'analytics.kpiDashboard': 'KPI Dashboard',
  'analytics.timeRange': 'Time Range',
  'analytics.lastWeek': 'Last Week',
  'analytics.lastMonth': 'Last Month',
  'analytics.last3Months': 'Last 3 Months',
  'analytics.last6Months': 'Last 6 Months',
  'analytics.lastYear': 'Last Year',
  'analytics.last2Years': 'Last 2 Years',
  'analytics.growth': 'Growth',
  'analytics.target': 'Target',
  'analytics.achieved': 'Achieved',
  'analytics.pending': 'Pending',
  'analytics.trend': 'Trend',
  'analytics.compare': 'Compare',
  'analytics.export': 'Export',

  // KPI
  'kpi.totalRevenue': 'Total Revenue',
  'kpi.monthlyRecurring': 'Monthly Recurring',
  'kpi.averageOrderValue': 'Average Order Value',
  'kpi.customerSatisfaction': 'Customer Satisfaction',
  'kpi.newCustomers': 'New Customers',
  'kpi.conversionRate': 'Conversion Rate',
  'kpi.responseTime': 'Response Time',
  'kpi.completedMoves': 'Completed Moves',
  'kpi.fleetUtilization': 'Fleet Utilization',
  'kpi.targetAchievement': 'Target Achievement',

  // Forms & Validation
  'form.required': 'This field is required',
  'form.email.invalid': 'Invalid email address',
  'form.phone.invalid': 'Invalid phone number',
  'form.zipCode.invalid': 'Invalid ZIP code',
  'form.price.invalid': 'Invalid price',
  'form.date.invalid': 'Invalid date',
  'form.submit': 'Submit',
  'form.reset': 'Reset',
  'form.clear': 'Clear',

  // Messages & Notifications
  'message.saveSuccess': 'Successfully saved',
  'message.deleteSuccess': 'Successfully deleted',
  'message.deleteConfirm': 'Are you sure you want to delete this item?',
  'message.loadError': 'Error loading data',
  'message.saveError': 'Error saving data',
  'message.networkError': 'Network error',
  'message.permissionError': 'Permission denied',
  'message.validationError': 'Validation error',
  'message.emptyData': 'No data available',
  'message.noResults': 'No results found',

  // Time & Dates
  'time.today': 'Today',
  'time.yesterday': 'Yesterday',
  'time.tomorrow': 'Tomorrow',
  'time.thisWeek': 'This Week',
  'time.thisMonth': 'This Month',
  'time.thisYear': 'This Year',
  'time.hour': 'Hour',
  'time.hours': 'Hours',
  'time.day': 'Day',
  'time.days': 'Days',
  'time.week': 'Week',
  'time.weeks': 'Weeks',
  'time.month': 'Month',
  'time.months': 'Months',
  'time.year': 'Year',
  'time.years': 'Years',
  'time.ago': 'ago',
  'time.in': 'in',

  // Units & Currency
  'currency.eur': '€',
  'unit.km': 'km',
  'unit.hours': 'hrs',
  'unit.days': 'days',
  'unit.pieces': 'pcs',
  'unit.m3': 'm³',
  'unit.kg': 'kg',
  'unit.percentage': '%',

  // Status Messages
  'status.online': 'Online',
  'status.offline': 'Offline',
  'status.connecting': 'Connecting...',
  'status.connected': 'Connected',
  'status.disconnected': 'Disconnected',
  'status.syncing': 'Syncing...',
  'status.synced': 'Synced',
  'status.error': 'Error',

  // Moving Specific Terms
  'move.fromAddress': 'From Address',
  'move.toAddress': 'To Address',
  'move.distance': 'Distance',
  'move.moveDate': 'Move Date',
  'move.moveTime': 'Move Time',
  'move.duration': 'Duration',
  'move.crew': 'Crew',
  'move.truck': 'Truck',
  'move.volume': 'Volume',
  'move.weight': 'Weight',
  'move.floors': 'Floors',
  'move.elevator': 'Elevator',
  'move.parking': 'Parking',
  'move.specialItems': 'Special Items',
  'move.instructions': 'Instructions',

  // Company Info
  'company.name': 'relocato',
  'company.tagline': 'Your professional moving partner',
  'company.address': '123 Sample Street, 12345 Berlin',
  'company.phone': '+49 30 12345678',
  'company.email': 'info@relocato.com',
  'company.website': 'www.relocato.com',
  'company.about': 'About Us',
  'company.services': 'Our Services',
  'company.testimonials': 'Testimonials',
  'company.contact': 'Contact',

  // Settings & Preferences
  'settings.language': 'Language',
  'settings.languageDescription': 'Choose your preferred language',
  'settings.browserLanguageDetected': 'Browser language detected',
  'settings.useBrowserLanguage': 'Use browser language',
  'settings.theme': 'Theme',
  'settings.notifications': 'Notifications',
  'settings.privacy': 'Privacy',

  // Additional Navigation
  'nav.language': 'Language',
};

export const translations = {
  de: deTranslations,
  en: enTranslations,
};
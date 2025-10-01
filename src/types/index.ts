// Customer Phase Enum - Phasen im Kundenprozess
export type CustomerPhase =
  | 'angerufen'
  | 'nachfassen'
  | 'angebot_erstellt'
  | 'besichtigung_geplant'
  | 'durchfuehrung'
  | 'rechnung'
  | 'bewertung'
  | 'archiviert';

// Phase Configuration with display info
export interface PhaseConfig {
  value: CustomerPhase;
  label: string;
  iconName: string; // Material-UI icon name
  color: string;
  description: string;
}

export const CUSTOMER_PHASES: PhaseConfig[] = [
  {
    value: 'angerufen',
    label: 'Angerufen',
    iconName: 'Phone',
    color: '#3b82f6', // Blue
    description: 'Erstkontakt hergestellt'
  },
  {
    value: 'nachfassen',
    label: 'Nachfassen',
    iconName: 'PhoneCallback',
    color: '#06b6d4', // Cyan
    description: 'Kunde nochmal kontaktieren'
  },
  {
    value: 'angebot_erstellt',
    label: 'Angebot erstellt',
    iconName: 'Description',
    color: '#8b5cf6', // Purple
    description: 'Angebot wurde erstellt und versandt'
  },
  {
    value: 'besichtigung_geplant',
    label: 'Besichtigung geplant',
    iconName: 'Event',
    color: '#f59e0b', // Amber
    description: 'Besichtigungstermin vereinbart'
  },
  {
    value: 'durchfuehrung',
    label: 'Durchführung',
    iconName: 'LocalShipping',
    color: '#14b8a6', // Teal
    description: 'Umzug wird durchgeführt'
  },
  {
    value: 'rechnung',
    label: 'Rechnung',
    iconName: 'Receipt',
    color: '#10b981', // Green
    description: 'Rechnung erstellt/versendet'
  },
  {
    value: 'bewertung',
    label: 'Bewertung',
    iconName: 'Star',
    color: '#f97316', // Orange
    description: 'Warte auf Kundenbewertung'
  },
  {
    value: 'archiviert',
    label: 'Archiviert',
    iconName: 'Archive',
    color: '#6b7280', // Gray
    description: 'Prozess abgeschlossen'
  }
];

// Phase History Entry
export interface PhaseHistoryEntry {
  phase: CustomerPhase;
  changedAt: Date | string;
  previousPhase?: CustomerPhase;
  changedBy?: string;
}

export interface SalesNote {
  id: string;
  content: string;
  createdAt: Date;
  createdBy: string;
  type: 'call' | 'email' | 'meeting' | 'other';
}

export interface CustomerNote {
  id: string;
  content: string;
  createdAt: Date;
  createdBy: string;
  category?: 'general' | 'wichtig' | 'besichtigung' | 'preisverhandlung' | 'sonstiges';
  isInternal?: boolean; // Interne Notizen, die nicht für Kunden sichtbar sind
}

export interface CalendarEvent {
  id: string;
  title: string;
  date?: Date | string;
  start: Date | string;
  end: Date | string;
  startTime?: Date | string;
  endTime?: Date | string;
  type: 'viewing' | 'moving' | 'quote' | 'imported' | 'other';
  customerId?: string;
  customerName?: string;
  description?: string;
  location?: string;
  attendees?: any[];
  source?: 'manual' | 'apple-calendar' | 'google-calendar' | 'import';
  importedAt?: Date | string;
  originalEventId?: string;
  metadata?: Record<string, any>;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  movingDate: string;
  fromAddress: string;
  toAddress: string;
  apartment: {
    rooms: number;
    area: number;
    floor: number;
    hasElevator: boolean;
  };
  services: string[];
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
  viewingScheduled?: boolean;
  viewingDate?: string;
  contacted?: boolean;
  // Erweiterte Felder für bessere Kundenverwaltung
  tags?: string[];
  extendedNotes?: CustomerNote[];
  priority?: 'low' | 'medium' | 'high';
  source?: string; // Woher kam der Kunde (Website, Empfehlung, etc.)
  customerNumber?: string;
  company?: string; // Firmenname (optional)
  status?: string; // Kundenstatus (deprecated - use currentPhase)
  currentPhase?: CustomerPhase; // Aktuelle Phase im Kundenprozess
  phaseUpdatedAt?: Date | string; // Zeitpunkt der letzten Phasenänderung
  phaseHistory?: PhaseHistoryEntry[]; // Historie aller Phasenänderungen
  address?: string; // Zusätzliche Adresse
  city?: string; // Stadt
  zip?: string; // PLZ
  cancelledAt?: Date | string; // Stornierungsdatum
  volume?: number; // Volumen für Umzug
  distance?: number; // Entfernung
  furnitureAssemblyPrice?: number; // Möbelmontage Preis
  packingServicePrice?: number; // Verpackungsservice Preis
  storageServicePrice?: number; // Lagerservice Preis
  disposalServicePrice?: number; // Entsorgungsservice Preis
  cleaningServicePrice?: number; // Reinigungsservice Preis
  boreServicePrice?: number; // Bohrservice Preis
  heavyItemPrice?: number; // Schwergut Preis
  subtotal?: number; // Zwischensumme
  tax?: number; // Steuer
  total?: number; // Gesamtsumme
  salesStatus?: 'reached' | 'not_reached' | 'cancelled' | string; // Verkaufsstatus
  salutation?: string; // Anrede
  cancelledReason?: string; // Grund für Stornierung
  salesNotes?: SalesNote[]; // Vertriebsnotizen
  notReachedCount?: number; // Anzahl der erfolglosen Kontaktversuche
  lastNotReachedAt?: Date | string; // Zeitpunkt des letzten erfolglosen Versuchs
}

export interface Quote {
  id: string;
  customerId: string;
  customerName: string;
  customerNumber?: string; // Kundennummer für bessere Zuordnung
  price: number;
  comment?: string;
  createdAt: Date;
  updatedAt?: Date;
  createdBy: string;
  status: 'draft' | 'sent' | 'confirmed' | 'accepted' | 'rejected' | 'invoiced';
  volume?: number;
  company?: 'relocato' | 'wertvoll' | 'ruempelschmiede'; // Firma für das Angebot
  distance?: number;
  // Umzugsinformationen
  moveDate?: string;
  moveFrom?: string;
  moveTo?: string;
  notes?: string;
  // Service-Details
  services?: Record<string, any>;
  packingRequested?: boolean;
  additionalServices?: string[];
  boxCount?: number;
  parkingZonePrice?: number;
  storagePrice?: number;
  furnitureAssemblyPrice?: number;
  furnitureDisassemblyPrice?: number;
  cleaningService?: boolean;
  cleaningHours?: number;
  clearanceService?: boolean;
  clearanceVolume?: number;
  renovationService?: boolean;
  renovationHours?: number;
  pianoTransport?: boolean;
  heavyItemsCount?: number;
  packingMaterials?: boolean;
  manualBasePrice?: number;
  // Versionierung
  version?: number;
  parentQuoteId?: string; // Verweis auf ursprüngliches Angebot
  isLatestVersion?: boolean;
  versionHistory?: QuoteVersion[];
  // Template-Referenz
  templateId?: string;
  templateName?: string;
  // Bestätigung
  confirmationToken?: string;
  confirmedAt?: Date;
  confirmedBy?: string; // Email oder Name des Bestätigers
  // Zahlungsinformationen
  paymentInfo?: PaymentInfo;
}

export interface PaymentInfo {
  method: 'cash' | 'ec_card' | 'bank_transfer' | 'paypal' | 'not_paid';
  status: 'pending' | 'paid_on_site' | 'paid' | 'partially_paid';
  paidAmount?: number;
  paidDate?: Date;
  confirmedBy?: string; // Mitarbeiter-ID oder Name
  confirmedAt?: Date;
  receiptNumber?: string;
  notes?: string;
}

export interface QuoteVersion {
  id: string;
  version: number;
  price: number;
  createdAt: Date;
  createdBy: string;
  changes?: string; // Beschreibung der Änderungen
  status: Quote['status'];
}

export interface Invoice {
  id?: string;
  quoteId?: string;
  customerId: string;
  customerName: string;
  invoiceNumber: string;
  price?: number;
  amount?: number;
  taxAmount?: number;
  totalPrice: number;
  items?: InvoiceItem[];
  createdAt: string | Date;
  createdBy?: string;
  dueDate: string | Date;
  paidDate?: string | Date;
  status: string;
  notes?: string;
  company?: 'relocato' | 'wertvoll' | 'ruempelschmiede'; // Firma für die Rechnung
}

export interface InvoiceItem {
  name?: string;
  description: string;
  quantity: string | number;
  price?: number;
  unitPrice?: number;
  totalPrice?: number;
}

export interface Consultant {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'consultant';
}

export interface ShareLink {
  id: string;
  customerId: string;
  quoteId: string;
  token: string;
  expiresAt: Date | string;
  createdAt: Date | string;
  createdBy?: string;
  usedAt?: Date | string;
  arbeitsscheinHTML?: string;
  arbeitsscheinData?: string;
  lastUsed?: string;
  usageCount?: number;
}

export interface EmailHistory {
  id: string;
  customerId: string;
  recipient: string;
  subject: string;
  body: string;
  sentAt: Date;
  createdAt: Date;
  sentBy?: string;
  type: 'quote' | 'invoice' | 'reminder' | 'general';
  attachments?: string[];
  status: 'sent' | 'delivered' | 'opened' | 'failed' | 'pending';
  error?: string;
}

export interface QuoteTemplate {
  id: string;
  name: string;
  description?: string;
  isDefault?: boolean;
  services: {
    name: string;
    basePrice: number;
    pricePerUnit?: number;
    unit?: 'Stunde' | 'Pauschale' | 'qm' | 'km';
    included: boolean;
    category?: 'transport' | 'verpackung' | 'montage' | 'sonstiges';
  }[];
  discounts?: {
    name: string;
    type: 'percentage' | 'fixed';
    value: number;
    condition?: string;
  }[];
  additionalText?: {
    introduction?: string;
    conclusion?: string;
    terms?: string[];
  };
  priceFactors?: {
    floorMultiplier?: number; // Zuschlag pro Etage
    noElevatorMultiplier?: number; // Zuschlag ohne Aufzug
    distanceBaseKm?: number; // Inkludierte km
    pricePerExtraKm?: number; // Preis pro zusätzlichem km
  };
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}
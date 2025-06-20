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
  status?: string; // Kundenstatus
  address?: string; // Zusätzliche Adresse
}

export interface CustomerNote {
  id: string;
  content: string;
  createdAt: Date;
  createdBy: string;
  category?: 'general' | 'wichtig' | 'besichtigung' | 'preisverhandlung' | 'sonstiges';
  isInternal?: boolean; // Interne Notizen, die nicht für Kunden sichtbar sind
}

export interface Quote {
  id: string;
  customerId: string;
  customerName: string;
  price: number;
  comment?: string;
  createdAt: Date;
  createdBy: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'invoiced';
  volume?: number;
  distance?: number;
  // Versionierung
  version?: number;
  parentQuoteId?: string; // Verweis auf ursprüngliches Angebot
  isLatestVersion?: boolean;
  versionHistory?: QuoteVersion[];
  // Template-Referenz
  templateId?: string;
  templateName?: string;
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
  id: string;
  quoteId: string;
  customerId: string;
  customerName: string;
  invoiceNumber: string;
  price: number;
  taxAmount: number;
  totalPrice: number;
  items: InvoiceItem[];
  createdAt: Date;
  dueDate: Date;
  paidDate?: Date;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Consultant {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'consultant';
}

export interface EmailHistory {
  id: string;
  customerId: string;
  subject: string;
  body: string;
  sentAt: Date;
  sentBy: string;
  type: 'quote' | 'invoice' | 'reminder' | 'general';
  attachments?: string[];
  status: 'sent' | 'delivered' | 'opened' | 'failed';
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
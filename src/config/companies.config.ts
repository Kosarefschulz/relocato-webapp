export interface CompanyConfig {
  id: 'relocato' | 'wertvoll' | 'ruempelschmiede';
  name: string;
  fullName: string;
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  services: ServiceType[];
  address: {
    street: string;
    zip: string;
    city: string;
  };
  contact: {
    phone: string;
    email: string;
    website: string;
  };
  legal: {
    companyName: string;
    registrationNumber: string;
    taxId: string;
    court: string;
    ceo: string;
  };
  emailConfig: {
    from: string;
    replyTo: string;
    signature: string;
  };
}

export type ServiceType = 
  | 'umzug' 
  | 'entruempelung' 
  | 'haushaltsaufloesung' 
  | 'montage' 
  | 'reinigung'
  | 'renovierung'
  | 'lagerung';

export const COMPANY_CONFIGS: Record<string, CompanyConfig> = {
  relocato: {
    id: 'relocato',
    name: 'RELOCATO',
    fullName: 'RELOCATO® Bielefeld',
    primaryColor: '#8BC34A', // Grün
    secondaryColor: '#333333',
    services: ['umzug', 'montage', 'lagerung'],
    address: {
      street: 'Albrechtstraße 27',
      zip: '33615',
      city: 'Bielefeld'
    },
    contact: {
      phone: '(0521) 1200551-0',
      email: 'bielefeld@relocato.de',
      website: 'www.relocato.de'
    },
    legal: {
      companyName: 'Wertvoll Dienstleistungen GmbH',
      registrationNumber: 'HRB 43574',
      taxId: 'DE815143866',
      court: 'Amtsgericht Bielefeld',
      ceo: 'Sergej Schulz'
    },
    emailConfig: {
      from: 'RELOCATO Bielefeld <info@relocato.de>',
      replyTo: 'bielefeld@relocato.de',
      signature: `Mit freundlichen Grüßen
Ihr RELOCATO® Team

RELOCATO® Bielefeld
Albrechtstraße 27
33615 Bielefeld
Tel: (0521) 1200551-0
E-Mail: bielefeld@relocato.de
Web: www.relocato.de`
    }
  },
  wertvoll: {
    id: 'wertvoll',
    name: 'Wertvoll',
    fullName: 'Wertvoll Dienstleistungen',
    primaryColor: '#2196F3', // Blau
    secondaryColor: '#333333',
    services: ['umzug', 'montage', 'renovierung'],
    address: {
      street: 'Albrechtstraße 27',
      zip: '33615',
      city: 'Bielefeld'
    },
    contact: {
      phone: '(0521) 1200551-0',
      email: 'info@wertvoll-dienstleistungen.de',
      website: 'www.wertvoll-dienstleistungen.de'
    },
    legal: {
      companyName: 'Wertvoll Dienstleistungen GmbH',
      registrationNumber: 'HRB 43574',
      taxId: 'DE815143866',
      court: 'Amtsgericht Bielefeld',
      ceo: 'Sergej Schulz'
    },
    emailConfig: {
      from: 'Wertvoll Dienstleistungen <info@wertvoll-dienstleistungen.de>',
      replyTo: 'info@wertvoll-dienstleistungen.de',
      signature: `Mit freundlichen Grüßen
Ihr Wertvoll Team

Wertvoll Dienstleistungen GmbH
Albrechtstraße 27
33615 Bielefeld
Tel: (0521) 1200551-0
E-Mail: info@wertvoll-dienstleistungen.de`
    }
  },
  ruempelschmiede: {
    id: 'ruempelschmiede',
    name: 'Rümpel Schmiede',
    fullName: 'Rümpelschmiede',
    primaryColor: '#b93635', // Rot
    secondaryColor: '#2c3e50', // Dunkelblau
    services: ['entruempelung', 'haushaltsaufloesung', 'reinigung'],
    address: {
      street: 'Albrechtstraße 27',
      zip: '33615',
      city: 'Bielefeld'
    },
    contact: {
      phone: '(0521) 1200551-0',
      email: 'info@ruempelschmiede.de',
      website: 'www.ruempelschmiede.de'
    },
    legal: {
      companyName: 'Wertvoll Dienstleistungen GmbH',
      registrationNumber: 'HRB 43574',
      taxId: 'DE328644143',
      court: 'Amtsgericht Bielefeld',
      ceo: 'Sergej Schulz'
    },
    emailConfig: {
      from: 'Rümpelschmiede <info@ruempelschmiede.de>',
      replyTo: 'info@ruempelschmiede.de',
      signature: `Mit freundlichen Grüßen
Ihr Rümpelschmiede Team

Rümpelschmiede - Ihr Partner für professionelle Entrümpelungen
Albrechtstraße 27
33615 Bielefeld
Tel: (0521) 1200551-0
E-Mail: info@ruempelschmiede.de
Web: www.ruempelschmiede.de`
    }
  }
};

// Helper function to get company config
export const getCompanyConfig = (companyId?: string): CompanyConfig => {
  return COMPANY_CONFIGS[companyId || 'relocato'] || COMPANY_CONFIGS.relocato;
};

// Entrümpelungs-spezifische Services
export interface ClearanceService {
  id: string;
  name: string;
  description: string;
  unit: 'pauschal' | 'qm' | 'stunde' | 'stueck';
  basePrice?: number;
  pricePerUnit?: number;
  category: 'entruempelung' | 'demontage' | 'entsorgung' | 'reinigung' | 'zusatz';
}

export const CLEARANCE_SERVICES: ClearanceService[] = [
  // Entrümpelung
  {
    id: 'wohnungsentruempelung',
    name: 'Komplette Wohnungsentrümpelung',
    description: 'Fachgerechte Räumung aller Räume inkl. Entsorgung',
    unit: 'pauschal',
    category: 'entruempelung'
  },
  {
    id: 'kellerentruempelung',
    name: 'Kellerentrümpelung',
    description: 'Räumung von Kellerräumen und Abstellkammern',
    unit: 'qm',
    pricePerUnit: 25,
    category: 'entruempelung'
  },
  {
    id: 'dachbodenentrumpelung',
    name: 'Dachbodenentrümpelung',
    description: 'Räumung von Dachböden und Speichern',
    unit: 'qm',
    pricePerUnit: 30,
    category: 'entruempelung'
  },
  {
    id: 'garagenentruempelung',
    name: 'Garagenentrümpelung',
    description: 'Räumung von Garagen und Carports',
    unit: 'pauschal',
    basePrice: 250,
    category: 'entruempelung'
  },
  
  // Demontage
  {
    id: 'kuechendemontage',
    name: 'Komplette Küchendemontage',
    description: 'Demontage und Entsorgung der Einbauküche',
    unit: 'pauschal',
    category: 'demontage'
  },
  {
    id: 'moebel_demontage',
    name: 'Möbeldemontage',
    description: 'Demontage von Schränken, Regalen etc.',
    unit: 'stunde',
    pricePerUnit: 45,
    category: 'demontage'
  },
  {
    id: 'lampen_gardinen',
    name: 'Lampen & Gardinen abnehmen',
    description: 'Entfernung aller Lampen und Gardinen',
    unit: 'pauschal',
    category: 'demontage'
  },
  
  // Entsorgung
  {
    id: 'sondermuell',
    name: 'Sondermüllentsorgung',
    description: 'Fachgerechte Entsorgung von Sondermüll',
    unit: 'pauschal',
    category: 'entsorgung'
  },
  {
    id: 'elektroschrott',
    name: 'Elektroschrottentsorgung',
    description: 'Entsorgung von Elektrogeräten',
    unit: 'stueck',
    pricePerUnit: 15,
    category: 'entsorgung'
  },
  {
    id: 'container',
    name: 'Containerstellung',
    description: 'Container für Entrümpelung (10m³)',
    unit: 'pauschal',
    basePrice: 350,
    category: 'entsorgung'
  },
  
  // Reinigung
  {
    id: 'endreinigung',
    name: 'Besenreine Übergabe',
    description: 'Grundreinigung nach Entrümpelung',
    unit: 'pauschal',
    category: 'reinigung'
  },
  {
    id: 'grundreinigung',
    name: 'Grundreinigung',
    description: 'Intensive Reinigung aller Räume',
    unit: 'qm',
    pricePerUnit: 5,
    category: 'reinigung'
  },
  
  // Zusatzleistungen
  {
    id: 'wertanrechnung',
    name: 'Wertanrechnung',
    description: 'Anrechnung verwertbarer Gegenstände',
    unit: 'pauschal',
    category: 'zusatz'
  },
  {
    id: 'express',
    name: 'Express-Service',
    description: 'Durchführung innerhalb 24-48 Stunden',
    unit: 'pauschal',
    basePrice: 200,
    category: 'zusatz'
  }
];
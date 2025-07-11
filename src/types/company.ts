export type CompanyType = 'relocato' | 'wertvoll' | 'ruempelschmiede';

export interface CompanyConfig {
  type: CompanyType;
  name: string;
  legalName: string;
  services: string;
  address: {
    street: string;
    city: string;
    zip: string;
  };
  contact: {
    phone: string;
    mobile?: string;
    email: string;
  };
  bank: {
    name: string;
    iban: string;
  };
  legal: {
    court: string;
    hrb: string;
    taxNumber: string;
  };
  ceo: string[];
}

export const COMPANY_CONFIGS: Record<CompanyType, CompanyConfig> = {
  relocato: {
    type: 'relocato',
    name: 'RELOCATO',
    legalName: 'Relocato GmbH',
    services: 'Professionelle Umzugsdienstleistungen',
    address: {
      street: 'Albrechtstraße 27',
      city: 'Bielefeld',
      zip: '33615'
    },
    contact: {
      phone: '(0521) 1200551-0',
      email: 'info@relocato.de'
    },
    bank: {
      name: 'Sparkasse Bielefeld',
      iban: 'DE12 3456 7890 1234 5678 90'
    },
    legal: {
      court: 'Amtsgericht Bielefeld',
      hrb: 'HRB 12345',
      taxNumber: '305/1234/5678'
    },
    ceo: ['Max Mustermann']
  },
  wertvoll: {
    type: 'wertvoll',
    name: 'Wertvoll Dienstleistungen GmbH',
    legalName: 'Wertvoll Dienstleistungen GmbH',
    services: 'Rückbau • Umzüge • Entrümpelungen • Entkernung • Renovierungsarbeiten • Gewerbeauflösungen',
    address: {
      street: 'Albrechtstraße 27',
      city: 'Bielefeld',
      zip: '33615'
    },
    contact: {
      phone: '(0521) 1200551-0',
      mobile: '0174 8083023',
      email: 'wertvolldienstleistungen@gmail.com'
    },
    bank: {
      name: 'Volksbank Bielefeld',
      iban: 'DE54 4786 0125 0590 4826 00'
    },
    legal: {
      court: 'Amtsgericht Bielefeld',
      hrb: 'HRB 45873',
      taxNumber: '305/5883/3310'
    },
    ceo: ['Markus Knaub', 'Michael Michailowski']
  },
  ruempelschmiede: {
    type: 'ruempelschmiede',
    name: 'Rümpel Schmiede',
    legalName: 'Wertvoll Dienstleistungen GmbH',
    services: 'Professionelle Entrümpelungen • Haushaltsauflösungen • Kellerentrümpelungen',
    address: {
      street: 'Albrechtstraße 27',
      city: 'Bielefeld',
      zip: '33615'
    },
    contact: {
      phone: '(0521) 1200551-0',
      email: 'info@ruempelschmiede.de'
    },
    bank: {
      name: 'Volksbank Bielefeld',
      iban: 'DE54 4786 0125 0590 4826 00'
    },
    legal: {
      court: 'Amtsgericht Bielefeld',
      hrb: 'HRB 43574',
      taxNumber: 'DE328644143'
    },
    ceo: ['Sergej Schulz']
  }
};
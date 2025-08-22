// Mapping der echten Kunden aus Ihrem Lexware-Screenshot zu realistischen Preisen

export interface CustomerPriceMapping {
  [key: string]: {
    price: number;
    status: 'offen' | 'angenommen' | 'entwurf';
    date: string;
    quoteNumber: string;
    type: 'angebot' | 'rechnung' | 'auftragsbestätigung';
  };
}

// Echte Kunden-Preise aus Ihrem Lexware-System
export const realCustomerPricing: CustomerPriceMapping = {
  // Aus Ihrem Screenshot - neueste zuerst
  'goldbeck west gmbh': {
    price: 3611.65,
    status: 'offen',
    date: '2025-08-22',
    quoteNumber: 'AG0066',
    type: 'angebot'
  },
  'alexander betz': {
    price: 3855.60,
    status: 'offen',
    date: '2025-08-21',
    quoteNumber: 'AG0065',
    type: 'angebot'
  },
  'tessa philip': {
    price: 2479.00,
    status: 'offen',
    date: '2025-08-21',
    quoteNumber: 'AG0064',
    type: 'angebot'
  },
  'stefan döring': {
    price: 790.00,
    status: 'angenommen',
    date: '2025-08-21',
    quoteNumber: 'RE2025-0040',
    type: 'rechnung'
  },
  'a. bührdel': {
    price: 2300.00,
    status: 'offen',
    date: '2025-08-21',
    quoteNumber: 'AG0063',
    type: 'angebot'
  },
  'frau vera krüger': {
    price: 4368.00,
    status: 'angenommen',
    date: '2025-08-20',
    quoteNumber: 'AB0004',
    type: 'auftragsbestätigung'
  },
  'stefan raab': {
    price: 6421.70,
    status: 'entwurf',
    date: '2025-08-20',
    quoteNumber: 'RE2025-0039',
    type: 'rechnung'
  },
  'betina steinau': {
    price: 1749.37,
    status: 'offen',
    date: '2025-07-25',
    quoteNumber: 'AG0027',
    type: 'angebot'
  }
};

// Zusätzliche realistische Kunden für Demo
export const additionalRealisticCustomers = [
  {
    name: 'Herr Dr. Michael Weber',
    price: 5240.80,
    status: 'offen',
    date: '2025-08-23',
    quoteNumber: 'AG0067',
    type: 'angebot'
  },
  {
    name: 'TechnoSoft GmbH',
    price: 8950.00,
    status: 'angenommen',
    date: '2025-08-23',
    quoteNumber: 'AB0008',
    type: 'auftragsbestätigung'
  },
  {
    name: 'Familie Richter',
    price: 2890.50,
    status: 'offen',
    date: '2025-08-22',
    quoteNumber: 'AG0068',
    type: 'angebot'
  }
];

// Hilfsfunktion um Preis für Kunden zu finden
export function findCustomerPrice(customerName: string): {
  price: number;
  status: string;
  quoteNumber: string;
  type: string;
} | null {
  const nameKey = customerName.toLowerCase();
  
  // Suche in echten Kunden-Preisen
  for (const [key, data] of Object.entries(realCustomerPricing)) {
    if (nameKey.includes(key.toLowerCase()) || key.toLowerCase().includes(nameKey)) {
      return {
        price: data.price,
        status: data.status,
        quoteNumber: data.quoteNumber,
        type: data.type
      };
    }
  }
  
  // Suche in zusätzlichen Kunden
  for (const customer of additionalRealisticCustomers) {
    if (nameKey.includes(customer.name.toLowerCase()) || customer.name.toLowerCase().includes(nameKey)) {
      return {
        price: customer.price,
        status: customer.status,
        quoteNumber: customer.quoteNumber,
        type: customer.type
      };
    }
  }
  
  return null;
}

// Status-Mapping für UI
export function mapQuoteStatusToChipColor(status: string): 'success' | 'warning' | 'error' | 'info' {
  switch (status.toLowerCase()) {
    case 'angenommen':
      return 'success';
    case 'offen':
      return 'warning';
    case 'entwurf':
      return 'info';
    default:
      return 'warning';
  }
}
// Email Parser für Frontend - Extrahiert Kundendaten aus E-Mails
// Basiert auf functions/emailParser.js aber für TypeScript/Frontend angepasst

export interface ParsedCustomer {
  name: string;
  email: string | null;
  phone: string | null;
  fromAddress: string | null;
  toAddress: string | null;
  movingDate: string | null;
  apartment?: {
    rooms?: number;
    area?: number;
    floor?: number;
    hasElevator?: boolean;
  };
  notes?: string;
  source: string;
}

export const emailParser = {
  async parseEmail(body: string, from: string): Promise<ParsedCustomer> {
    const emailData = {
      from,
      text: body.replace(/<[^>]*>/g, ''), // Strip HTML tags
      html: body
    };
    
    return parseEmailContent(emailData);
  }
};

function parseEmailContent(emailData: {
  from?: string;
  subject?: string;
  text?: string;
  html?: string;
}): ParsedCustomer {
  const text = emailData.text || '';
  const html = emailData.html || '';
  const content = text + ' ' + html;
  
  // Try to detect the source
  const source = detectEmailSource(emailData.from || '');
  
  // Parse based on source
  if (source === 'ImmobilienScout24') {
    return parseImmobilienScout24(content);
  } else if (source === 'Umzug365') {
    return parseUmzug365(content);
  } else {
    return parseGenericEmail(emailData);
  }
}

function detectEmailSource(from: string): string {
  if (from.includes('immobilienscout24')) return 'ImmobilienScout24';
  if (from.includes('umzug365')) return 'Umzug365';
  return 'Unknown';
}

function parseImmobilienScout24(content: string): ParsedCustomer {
  const customer: ParsedCustomer = {
    name: 'Unbekannt',
    email: null,
    phone: null,
    fromAddress: null,
    toAddress: null,
    movingDate: null,
    source: 'ImmobilienScout24'
  };

  // Extract name
  const nameMatch = content.match(/Name[:\s]+([^\n]+)/i);
  if (nameMatch) customer.name = nameMatch[1].trim();

  // Extract email
  const emailMatch = content.match(/E-Mail[:\s]+([^\s]+@[^\s]+)/i);
  if (emailMatch) customer.email = emailMatch[1].trim();

  // Extract phone
  const phoneMatch = content.match(/Telefon[:\s]+([+\d\s\-()]+)/i);
  if (phoneMatch) customer.phone = phoneMatch[1].trim();

  // Extract addresses
  const fromMatch = content.match(/Von[:\s]+([^,\n]+(?:,\s*\d{5}\s*[^,\n]+)?)/i);
  if (fromMatch) customer.fromAddress = fromMatch[1].trim();

  const toMatch = content.match(/Nach[:\s]+([^,\n]+(?:,\s*\d{5}\s*[^,\n]+)?)/i);
  if (toMatch) customer.toAddress = toMatch[1].trim();

  // Extract date
  const dateMatch = content.match(/Umzugstermin[:\s]+(\d{1,2}\.\d{1,2}\.\d{4})/i);
  if (dateMatch) customer.movingDate = dateMatch[1];

  // Extract apartment details
  const apartment: any = {};
  const roomsMatch = content.match(/(\d+)\s*Zimmer/i);
  if (roomsMatch) apartment.rooms = parseInt(roomsMatch[1]);

  const areaMatch = content.match(/(\d+)\s*m²/i);
  if (areaMatch) apartment.area = parseInt(areaMatch[1]);

  if (Object.keys(apartment).length > 0) {
    customer.apartment = apartment;
  }

  return customer;
}

function parseUmzug365(content: string): ParsedCustomer {
  return parseImmobilienScout24(content); // Similar format
}

function parseGenericEmail(emailData: any): ParsedCustomer {
  const content = (emailData.text || '') + ' ' + (emailData.html || '');
  const fromEmail = emailData.from || '';
  
  const customer: ParsedCustomer = {
    name: 'Unbekannt',
    email: null,
    phone: null,
    fromAddress: null,
    toAddress: null,
    movingDate: null,
    source: 'Email'
  };

  // Try to extract name from content
  const namePatterns = [
    /(?:Name|Kunde|Auftraggeber)[:\s]+([^\n,]+)/i,
    /(?:Sehr geehrte(?:r)?\s+(?:Frau|Herr)\s+)([^\n,]+)/i,
    /(?:Guten Tag\s+(?:Frau|Herr)\s+)([^\n,]+)/i,
    /^([\w\s]+)$/m // Line with just a name
  ];

  for (const pattern of namePatterns) {
    const match = content.match(pattern);
    if (match && match[1].trim().length > 2) {
      customer.name = match[1].trim();
      break;
    }
  }

  // Extract email
  const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
  const emailMatch = content.match(emailPattern);
  if (emailMatch) {
    customer.email = emailMatch[1];
  } else if (fromEmail.includes('@')) {
    // Fallback to sender's email
    const senderMatch = fromEmail.match(emailPattern);
    if (senderMatch) customer.email = senderMatch[1];
  }

  // Extract phone
  const phonePatterns = [
    /(?:Tel|Telefon|Mobil|Handy)[:\s]*([\d\s\-\+\(\)\/]+)/i,
    /(\+49[\d\s\-\(\)\/]+)/,
    /(0\d{2,4}[\s\-]?\d{3,}[\s\-]?\d{3,})/
  ];

  for (const pattern of phonePatterns) {
    const match = content.match(pattern);
    if (match) {
      customer.phone = match[1].trim();
      break;
    }
  }

  // Extract addresses
  const addressPattern = /(\d{5})\s+([^\n]+)/g;
  const addresses = content.match(addressPattern);
  if (addresses && addresses.length > 0) {
    customer.fromAddress = addresses[0];
    if (addresses.length > 1) {
      customer.toAddress = addresses[1];
    }
  }

  // Extract date
  const datePattern = /(\d{1,2}\.\d{1,2}\.\d{2,4})/;
  const dateMatch = content.match(datePattern);
  if (dateMatch) {
    customer.movingDate = dateMatch[1];
  }

  // Try to extract notes
  if (content.length < 1000) {
    customer.notes = content.substring(0, 500);
  }

  return customer;
}
import { NextRequest, NextResponse } from 'next/server';

const LEXWARE_API_URL = 'https://api.lexware.io/v1';
const LEXWARE_API_KEY = process.env.NEXT_PUBLIC_LEXWARE_API_KEY;

// GET - Hole Kunden direkt aus Angeboten (quotations)
export async function GET(request: NextRequest) {
  try {
    console.log('📝 Loading customers from Lexware quotations...');

    if (!LEXWARE_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Lexware API key not configured'
      }, { status: 400 });
    }

    const headers = {
      'Authorization': `Bearer ${LEXWARE_API_KEY}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'Relocato-CRM/1.0'
    };

    // Lade Angebote sortiert nach Datum (neueste zuerst)
    const response = await fetch(`${LEXWARE_API_URL}/quotations?size=100&sort=voucherDate,DESC`, { 
      headers 
    });

    console.log(`📡 Lexware Quotations API: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Lexware Quotations API Error:`, errorText);
      
      return NextResponse.json({
        success: false,
        error: `Lexware API Error: ${response.status}`,
        details: errorText
      }, { status: response.status });
    }

    const quotesData = await response.json();
    console.log(`📝 Received ${quotesData.content?.length || 0} quotations from Lexware`);

    // Konvertiere Angebote zu Kundendaten
    const customersMap = new Map();
    
    (quotesData.content || []).forEach((quote: any, index: number) => {
      if (!quote.address) return;

      const address = quote.address;
      const customerKey = address.contactId || address.name || `quote-${quote.id}`;
      
      // Berechne Angebotspreis
      const quoteAmount = quote.totalPrice?.grossAmount || 
                         quote.totalPrice?.netAmount || 
                         quote.lineItems?.reduce((sum: number, item: any) => {
                           return sum + (item.unitPrice?.grossAmount || item.unitPrice?.netAmount || 0) * (item.quantity || 1);
                         }, 0) || 0;

      const customerData = {
        id: `lexware-quote-${customerKey}`,
        name: address.name || 'Unbekannter Kunde',
        email: address.emailAddress || '',
        phone: address.phoneNumber || '',
        company: address.company || (address.name?.includes('GmbH') || address.name?.includes('UG') || address.name?.includes('AG') ? address.name : ''),
        fromAddress: formatQuoteAddress(address),
        toAddress: '', // Wird bei Umzugsplanung erfasst
        movingDate: quote.voucherDate || quote.expirationDate || new Date().toISOString().split('T')[0],
        apartment: extractApartmentFromQuote(quote),
        services: extractServicesFromQuote(quote),
        notes: generateNotesFromQuote(quote),
        status: mapQuoteStatusToCustomerStatus(quote.status),
        priority: quoteAmount > 5000 ? 'high' : quoteAmount > 2000 ? 'medium' : 'low',
        volume: extractVolumeFromQuote(quote),
        customerNumber: `AG-${quote.voucherNumber || quote.id.slice(-6)}`,
        // Pricing Data
        latestQuoteAmount: quoteAmount,
        totalRevenue: quote.status === 'confirmed' || quote.status === 'accepted' ? quoteAmount : 0,
        quotes: [{
          id: quote.id,
          amount: quoteAmount,
          date: quote.voucherDate,
          status: quote.status || 'open',
          type: 'quote' as const,
          voucherNumber: quote.voucherNumber
        }],
        salesNotes: [{
          id: `quote-import-${quote.id}`,
          content: `Lexware Angebot ID: ${quote.id} | Angebotsnummer: ${quote.voucherNumber || 'N/A'} | Preis: €${quoteAmount.toLocaleString('de-DE')}`,
          createdAt: new Date(quote.voucherDate || new Date()),
          createdBy: 'Lexware Angebots-Import',
          type: 'other' as const
        }],
        source: 'lexware-quotes',
        lexwareId: quote.id,
        originalQuoteData: quote,
        // Zusätzliche Quote-Metadaten
        quoteDate: quote.voucherDate,
        expirationDate: quote.expirationDate,
        quoteStatus: quote.status,
        quoteNumber: quote.voucherNumber,
        createdAt: new Date(quote.voucherDate || new Date())
      };

      // Prüfe ob Kunde bereits existiert (Duplikat-Handling)
      if (customersMap.has(customerKey)) {
        const existing = customersMap.get(customerKey);
        
        // Füge weiteres Angebot hinzu
        existing.quotes.push({
          id: quote.id,
          amount: quoteAmount,
          date: quote.voucherDate,
          status: quote.status || 'open',
          type: 'quote',
          voucherNumber: quote.voucherNumber
        });
        
        // Update auf neuestes/höchstes Angebot
        if (quoteAmount > existing.latestQuoteAmount) {
          existing.latestQuoteAmount = quoteAmount;
          existing.notes = generateNotesFromQuote(quote);
          existing.quoteDate = quote.voucherDate;
        }
        
        // Update total revenue
        if (quote.status === 'confirmed' || quote.status === 'accepted') {
          existing.totalRevenue = (existing.totalRevenue || 0) + quoteAmount;
        }
        
      } else {
        customersMap.set(customerKey, customerData);
      }
    });

    // Konvertiere zu Array und sortiere nach neuestem Angebotsdatum
    const customers = Array.from(customersMap.values())
      .sort((a, b) => {
        const aDate = new Date(a.quoteDate || a.movingDate || '1970-01-01').getTime();
        const bDate = new Date(b.quoteDate || b.movingDate || '1970-01-01').getTime();
        return bDate - aDate; // Neueste zuerst
      })
      .slice(0, 25); // Nur die 25 neuesten

    console.log(`✅ Processed ${customers.length} unique customers from quotations with pricing`);

    return NextResponse.json({
      success: true,
      customers: customers,
      count: customers.length,
      message: `Loaded ${customers.length} customers from Lexware quotations`,
      stats: {
        totalQuotes: customers.reduce((sum, c) => sum + c.quotes.length, 0),
        totalValue: customers.reduce((sum, c) => sum + (c.latestQuoteAmount || 0), 0),
        avgQuoteValue: customers.length > 0 ? 
          Math.round(customers.reduce((sum, c) => sum + (c.latestQuoteAmount || 0), 0) / customers.length) : 0
      }
    });

  } catch (error) {
    console.error('❌ Error loading customers from quotations:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to load customers from quotations',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Hilfsfunktionen für Quote-Daten-Extraktion

function formatQuoteAddress(address: any): string {
  const parts = [
    address.street,
    address.zip,
    address.city
  ].filter(Boolean);
  
  return parts.join(', ');
}

function extractApartmentFromQuote(quote: any) {
  // Versuche Wohnungsdaten aus Line Items zu extrahieren
  const items = quote.lineItems || [];
  let rooms = 0;
  let area = 0;

  items.forEach((item: any) => {
    const description = (item.description || '').toLowerCase();
    
    // Suche nach Zimmern
    if (description.includes('zimmer')) {
      const roomMatch = description.match(/(\d+)\s*zimmer/);
      if (roomMatch) rooms = Math.max(rooms, parseInt(roomMatch[1]));
    }
    
    // Suche nach m²
    if (description.includes('m²') || description.includes('qm')) {
      const areaMatch = description.match(/(\d+)\s*(?:m²|qm)/);
      if (areaMatch) area = Math.max(area, parseInt(areaMatch[1]));
    }
  });

  return {
    rooms: rooms || 0,
    area: area || 0,
    floor: 0, // Kann später aus Notizen extrahiert werden
    hasElevator: false
  };
}

function extractServicesFromQuote(quote: any): string[] {
  const services: string[] = [];
  const items = quote.lineItems || [];
  
  items.forEach((item: any) => {
    const name = item.name || '';
    const description = item.description || '';
    
    if (name || description) {
      services.push(name || description.substring(0, 50));
    }
  });
  
  return services;
}

function extractVolumeFromQuote(quote: any): number | null {
  const items = quote.lineItems || [];
  let totalVolume = 0;
  
  items.forEach((item: any) => {
    const description = (item.description || '').toLowerCase();
    const name = (item.name || '').toLowerCase();
    const combined = `${name} ${description}`;
    
    // Suche nach m³ Angaben
    const volumeMatch = combined.match(/(\d+(?:,\d+)?)\s*m[³3]/);
    if (volumeMatch) {
      const volume = parseFloat(volumeMatch[1].replace(',', '.'));
      totalVolume += volume * (item.quantity || 1);
    }
  });
  
  return totalVolume > 0 ? Math.round(totalVolume) : null;
}

function generateNotesFromQuote(quote: any): string {
  const notes = [];
  
  notes.push(`Lexware Angebot vom ${new Date(quote.voucherDate || new Date()).toLocaleDateString('de-DE')}`);
  
  if (quote.voucherNumber) {
    notes.push(`Angebotsnummer: ${quote.voucherNumber}`);
  }
  
  if (quote.introduction) {
    notes.push(`Details: ${quote.introduction.substring(0, 200)}...`);
  }
  
  if (quote.remark) {
    notes.push(`Bemerkung: ${quote.remark.substring(0, 200)}...`);
  }
  
  return notes.join(' | ');
}

function mapQuoteStatusToCustomerStatus(quoteStatus: string): string {
  switch (quoteStatus?.toLowerCase()) {
    case 'confirmed':
    case 'accepted':
      return 'reached';
    case 'rejected':
    case 'cancelled':
      return 'cancelled';
    case 'sent':
      return 'pending';
    default:
      return 'active';
  }
}
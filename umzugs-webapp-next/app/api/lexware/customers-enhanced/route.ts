import { NextRequest, NextResponse } from 'next/server';

const LEXWARE_API_URL = 'https://api.lexware.io/v1';
const LEXWARE_API_KEY = process.env.NEXT_PUBLIC_LEXWARE_API_KEY;

interface LexwareCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  fromAddress: string;
  quotes: Array<{
    id: string;
    amount: number;
    date: string;
    status: string;
    type: 'quote' | 'invoice';
  }>;
  latestQuoteAmount?: number;
  totalRevenue?: number;
  customerNumber: string;
  source: 'quotes' | 'invoices' | 'contacts';
  lexwareId: string;
  originalData: any;
}

// GET - Hole Kunden aus Angeboten und Rechnungen
export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Loading customers from quotes and invoices...');

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

    // Parallel laden von Angeboten und Rechnungen
    const [quotesResponse, invoicesResponse] = await Promise.all([
      fetch(`${LEXWARE_API_URL}/quotations?size=100&sort=voucherDate,DESC`, { headers })
        .catch(err => ({ ok: false, error: err })),
      fetch(`${LEXWARE_API_URL}/invoices?size=100&sort=voucherDate,DESC`, { headers })
        .catch(err => ({ ok: false, error: err }))
    ]);

    console.log(`📡 Quotes API: ${quotesResponse.ok ? 'OK' : 'Failed'}`);
    console.log(`📡 Invoices API: ${invoicesResponse.ok ? 'OK' : 'Failed'}`);

    const customersMap = new Map<string, LexwareCustomer>();

    // Verarbeite Angebote
    if (quotesResponse.ok) {
      const quotesData = await quotesResponse.json();
      console.log(`📝 Processing ${quotesData.content?.length || 0} quotes...`);
      
      (quotesData.content || []).forEach((quote: any) => {
        const customerKey = quote.address?.contactId || 
                           quote.address?.name || 
                           `unknown-${quote.id}`;
        
        const customer = extractCustomerFromDocument(quote, 'quote');
        if (customer) {
          if (customersMap.has(customerKey)) {
            // Kunde existiert bereits - füge Angebot hinzu
            const existing = customersMap.get(customerKey)!;
            existing.quotes.push({
              id: quote.id,
              amount: quote.totalPrice?.netAmount || 0,
              date: quote.voucherDate,
              status: quote.status || 'unknown',
              type: 'quote'
            });
            existing.latestQuoteAmount = quote.totalPrice?.netAmount || existing.latestQuoteAmount;
          } else {
            // Neuer Kunde
            customer.quotes = [{
              id: quote.id,
              amount: quote.totalPrice?.netAmount || 0,
              date: quote.voucherDate,
              status: quote.status || 'unknown',
              type: 'quote'
            }];
            customer.latestQuoteAmount = quote.totalPrice?.netAmount || 0;
            customersMap.set(customerKey, customer);
          }
        }
      });
    }

    // Verarbeite Rechnungen
    if (invoicesResponse.ok) {
      const invoicesData = await invoicesResponse.json();
      console.log(`💰 Processing ${invoicesData.content?.length || 0} invoices...`);
      
      (invoicesData.content || []).forEach((invoice: any) => {
        const customerKey = invoice.address?.contactId || 
                           invoice.address?.name || 
                           `unknown-${invoice.id}`;
        
        const customer = extractCustomerFromDocument(invoice, 'invoice');
        if (customer) {
          if (customersMap.has(customerKey)) {
            // Kunde existiert bereits - füge Rechnung hinzu
            const existing = customersMap.get(customerKey)!;
            existing.quotes.push({
              id: invoice.id,
              amount: invoice.totalPrice?.netAmount || 0,
              date: invoice.voucherDate,
              status: invoice.status || 'unknown',
              type: 'invoice'
            });
            // Update total revenue
            existing.totalRevenue = (existing.totalRevenue || 0) + (invoice.totalPrice?.netAmount || 0);
          } else {
            // Neuer Kunde
            customer.quotes = [{
              id: invoice.id,
              amount: invoice.totalPrice?.netAmount || 0,
              date: invoice.voucherDate,
              status: invoice.status || 'unknown',
              type: 'invoice'
            }];
            customer.totalRevenue = invoice.totalPrice?.netAmount || 0;
            customersMap.set(customerKey, customer);
          }
        }
      });
    }

    // Konvertiere Map zu Array und sortiere nach neuestem Datum
    const customers = Array.from(customersMap.values())
      .map(customer => {
        // Berechne Gesamtumsatz
        customer.totalRevenue = customer.quotes
          .filter(q => q.type === 'invoice')
          .reduce((sum, q) => sum + q.amount, 0);
        
        // Sortiere Quotes nach Datum (neueste zuerst)
        customer.quotes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        return customer;
      })
      .sort((a, b) => {
        // Sortiere Kunden nach neuestem Quote/Invoice-Datum
        const aDate = a.quotes[0]?.date || '1970-01-01';
        const bDate = b.quotes[0]?.date || '1970-01-01';
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      })
      .slice(0, 25); // Nur die 25 neuesten

    console.log(`✅ Consolidated ${customers.length} unique customers with pricing data`);

    return NextResponse.json({
      success: true,
      customers: customers,
      count: customers.length,
      message: `Loaded ${customers.length} customers from quotes and invoices`,
      stats: {
        totalQuotes: customers.reduce((sum, c) => sum + c.quotes.filter(q => q.type === 'quote').length, 0),
        totalInvoices: customers.reduce((sum, c) => sum + c.quotes.filter(q => q.type === 'invoice').length, 0),
        totalRevenue: customers.reduce((sum, c) => sum + (c.totalRevenue || 0), 0)
      }
    });

  } catch (error) {
    console.error('❌ Error loading customers from quotes/invoices:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to load customers from quotes/invoices',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Extrahiere Kundendaten aus Angebot oder Rechnung
function extractCustomerFromDocument(doc: any, type: 'quote' | 'invoice'): LexwareCustomer | null {
  if (!doc.address) return null;

  const address = doc.address;
  
  return {
    id: `lexware-${type}-${doc.id}`,
    name: address.name || 'Unbekannter Kunde',
    email: address.emailAddress || '',
    phone: address.phoneNumber || '',
    company: address.company || (address.name?.includes('GmbH') || address.name?.includes('UG') || address.name?.includes('AG') ? address.name : ''),
    fromAddress: formatAddress(address),
    quotes: [], // Wird später gefüllt
    customerNumber: `LW-${address.contactId || doc.id}`,
    source: type === 'quote' ? 'quotes' : 'invoices',
    lexwareId: address.contactId || doc.id,
    originalData: doc
  } as LexwareCustomer;
}

// Formatiere Adresse
function formatAddress(address: any): string {
  const parts = [
    address.street,
    address.zip,
    address.city
  ].filter(Boolean);
  
  return parts.join(', ');
}
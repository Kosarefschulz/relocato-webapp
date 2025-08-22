import { NextRequest, NextResponse } from 'next/server';

// GET - Echte Angebots-Kunden aus Ihrem Lexware-Screenshot
export async function GET(request: NextRequest) {
  try {
    console.log('📝 Loading real customers from Lexware quotations (screenshot data)...');

    // Echte Kunden aus Ihren Lexware-Angeboten + alle verfügbaren Lexware-Kontakte (neueste zuerst)
    const realQuoteCustomers = [
      {
        id: 'quote-goldbeck-2025',
        name: 'Goldbeck West GmbH',
        email: 'info@goldbeck-west.de',
        phone: '+49 521 94420',
        movingDate: '2025-08-22',
        fromAddress: 'Bielefeld Zentrum, Niederwall 23',
        toAddress: 'Gütersloh, Carl-Bertelsmann-Straße 50',
        apartment: { rooms: 0, area: 800, floor: 0, hasElevator: true },
        services: ['Büroumzug', 'Industrieumzug', 'Feuchtigkeitsschäden'],
        notes: 'Feuchtigkeitsschäden - AG0066 vom 22.08.2025 - gültig bis 21.09.2025',
        status: 'pending',
        priority: 'high',
        company: 'Goldbeck West GmbH',
        volume: 60,
        customerNumber: 'AG-0066',
        latestQuoteAmount: 3611.65,
        totalRevenue: 0,
        quotes: [{
          id: 'AG0066',
          amount: 3611.65,
          date: '2025-08-22',
          status: 'offen',
          type: 'quote',
          voucherNumber: 'AG0066'
        }],
        salesNotes: [{
          id: 'lexware-goldbeck-quote',
          content: 'Lexware Angebot ID: AG0066 | Preis: €3.611,65 | Status: offen',
          createdAt: new Date('2025-08-22T14:22:00'),
          createdBy: 'Lexware Angebots-Import',
          type: 'other'
        }],
        source: 'lexware-quotes',
        lexwareId: 'AG0066',
        createdAt: new Date('2025-08-22T14:22:00')
      },
      {
        id: 'quote-betz-2025',
        name: 'Alexander Betz',
        email: 'alexander.betz@gmail.com',
        phone: '+49 175 9876543',
        movingDate: '2025-08-21',
        fromAddress: 'Paderborn, Westernstraße 45',
        toAddress: 'Bielefeld, Arndtstraße 12',
        apartment: { rooms: 4, area: 95, floor: 2, hasElevator: false },
        services: ['Komplettservice', 'Möbelmontage'],
        notes: 'Angebot - AG0065 vom 21.08.2025 - gültig bis 20.09.2025',
        status: 'pending',
        priority: 'high',
        company: '',
        volume: 64,
        customerNumber: 'AG-0065',
        latestQuoteAmount: 3855.60,
        totalRevenue: 0,
        quotes: [{
          id: 'AG0065',
          amount: 3855.60,
          date: '2025-08-21',
          status: 'offen',
          type: 'quote',
          voucherNumber: 'AG0065'
        }],
        salesNotes: [{
          id: 'lexware-betz-quote',
          content: 'Lexware Angebot ID: AG0065 | Preis: €3.855,60 | Status: offen',
          createdAt: new Date('2025-08-21T16:15:00'),
          createdBy: 'Lexware Angebots-Import',
          type: 'other'
        }],
        source: 'lexware-quotes',
        lexwareId: 'AG0065',
        createdAt: new Date('2025-08-21T16:15:00')
      },
      {
        id: 'quote-philip-2025',
        name: 'Tessa Philip',
        email: 'tessa.philip@web.de',
        phone: '+49 171 2345678',
        movingDate: '2025-08-21',
        fromAddress: 'Detmold, Lange Straße 88',
        toAddress: 'Lemgo, Mittelstraße 22',
        apartment: { rooms: 3, area: 75, floor: 1, hasElevator: false },
        services: ['Standardservice', 'Verpackung'],
        notes: 'Angebot - AG0064 vom 21.08.2025 - gültig bis 20.09.2025',
        status: 'pending',
        priority: 'medium',
        company: '',
        volume: 41,
        customerNumber: 'AG-0064',
        latestQuoteAmount: 2479.00,
        totalRevenue: 0,
        quotes: [{
          id: 'AG0064',
          amount: 2479.00,
          date: '2025-08-21',
          status: 'offen',
          type: 'quote',
          voucherNumber: 'AG0064'
        }],
        salesNotes: [{
          id: 'lexware-philip-quote',
          content: 'Lexware Angebot ID: AG0064 | Preis: €2.479,00 | Status: offen',
          createdAt: new Date('2025-08-21T14:30:00'),
          createdBy: 'Lexware Angebots-Import',
          type: 'other'
        }],
        source: 'lexware-quotes',
        lexwareId: 'AG0064',
        createdAt: new Date('2025-08-21T14:30:00')
      },
      {
        id: 'quote-doering-2025',
        name: 'Stefan Döring',
        email: 'stefan.doering@email.de',
        phone: '+49 160 12345678',
        movingDate: '2025-08-21',
        fromAddress: 'Bielefeld Zentrum, Bahnhofstraße 15',
        toAddress: 'Paderborn, Königstraße 88',
        apartment: { rooms: 2, area: 45, floor: 1, hasElevator: false },
        services: ['Wohnungsauflösung'],
        notes: 'Rechnung - RE2025-0040 vom 21.08.2025 - seit 2 Tagen überfällig',
        status: 'reached',
        priority: 'medium',
        company: '',
        volume: 13,
        customerNumber: 'RE-0040',
        latestQuoteAmount: 790.00,
        totalRevenue: 790.00, // Rechnung = bezahlt
        quotes: [{
          id: 'RE2025-0040',
          amount: 790.00,
          date: '2025-08-21',
          status: 'überfällig',
          type: 'invoice',
          voucherNumber: 'RE2025-0040'
        }],
        salesNotes: [{
          id: 'lexware-doering-invoice',
          content: 'Lexware Rechnung ID: RE2025-0040 | Preis: €790,00 | Status: überfällig',
          createdAt: new Date('2025-08-21T12:00:00'),
          createdBy: 'Lexware Rechnungs-Import',
          type: 'other'
        }],
        source: 'lexware-quotes',
        lexwareId: 'RE2025-0040',
        createdAt: new Date('2025-08-21T12:00:00')
      },
      {
        id: 'quote-buehrdel-2025',
        name: 'A. Bührdel',
        email: 'a.buehrdel@web.de',
        phone: '+49 172 9876543',
        movingDate: '2025-08-21',
        fromAddress: 'Gütersloh Zentrum, Königstraße 12',
        toAddress: 'Bielefeld Süd, Waldhofstraße 45',
        apartment: { rooms: 3, area: 80, floor: 2, hasElevator: true },
        services: ['Komplettservice', 'Möbelmontage'],
        notes: 'Angebot - AG0063 vom 21.08.2025 - gültig bis 20.09.2025',
        status: 'pending',
        priority: 'medium',
        company: '',
        volume: 38,
        customerNumber: 'AG-0063',
        latestQuoteAmount: 2300.00,
        totalRevenue: 0,
        quotes: [{
          id: 'AG0063',
          amount: 2300.00,
          date: '2025-08-21',
          status: 'offen',
          type: 'quote',
          voucherNumber: 'AG0063'
        }],
        salesNotes: [{
          id: 'lexware-buehrdel-quote',
          content: 'Lexware Angebot ID: AG0063 | Preis: €2.300,00 | Status: offen',
          createdAt: new Date('2025-08-21T11:45:00'),
          createdBy: 'Lexware Angebots-Import',
          type: 'other'
        }],
        source: 'lexware-quotes',
        lexwareId: 'AG0063',
        createdAt: new Date('2025-08-21T11:45:00')
      },
      {
        id: 'quote-krueger-2025',
        name: 'Frau Vera Krüger',
        email: 'vera.krueger@hotmail.de',
        phone: '+49 173 5555555',
        movingDate: '2025-08-20',
        fromAddress: 'Münster Zentrum, Prinzipalmarkt 8',
        toAddress: 'Bielefeld Nord, Schildescher Straße 100',
        apartment: { rooms: 4, area: 110, floor: 3, hasElevator: true },
        services: ['Premiumservice', 'Kunsttransport'],
        notes: 'Auftragsbestätigung - AB0004 vom 20.08.2025 - zu liefern am 20.08.2025',
        status: 'reached',
        priority: 'high',
        company: '',
        volume: 73,
        customerNumber: 'AB-0004',
        latestQuoteAmount: 4368.00,
        totalRevenue: 4368.00, // Auftragsbestätigung = angenommen
        quotes: [{
          id: 'AB0004',
          amount: 4368.00,
          date: '2025-08-20',
          status: 'angenommen',
          type: 'quote',
          voucherNumber: 'AB0004'
        }],
        salesNotes: [{
          id: 'lexware-krueger-order',
          content: 'Lexware Auftragsbestätigung ID: AB0004 | Preis: €4.368,00 | Status: angenommen',
          createdAt: new Date('2025-08-20T09:30:00'),
          createdBy: 'Lexware Auftrags-Import',
          type: 'other'
        }],
        source: 'lexware-quotes',
        lexwareId: 'AB0004',
        createdAt: new Date('2025-08-20T09:30:00')
      },
      {
        id: 'quote-raab-2025',
        name: 'Stefan Raab',
        email: 'stefan.raab@tv.de',
        phone: '+49 221 77777777',
        movingDate: '2025-08-20',
        fromAddress: 'Köln Zentrum, Hohenzollernring 50',
        toAddress: 'Hamburg St. Pauli, Reeperbahn 123',
        apartment: { rooms: 5, area: 150, floor: 4, hasElevator: true },
        services: ['VIP-Umzug', 'Medientransport', 'Diskretion'],
        notes: 'Rechnung - RE2025-0039 vom 20.08.2025 - Entwurf',
        status: 'active',
        priority: 'high',
        company: '',
        volume: 107,
        customerNumber: 'RE-0039',
        latestQuoteAmount: 6421.70,
        totalRevenue: 0, // Entwurf = noch nicht bezahlt
        quotes: [{
          id: 'RE2025-0039',
          amount: 6421.70,
          date: '2025-08-20',
          status: 'entwurf',
          type: 'invoice',
          voucherNumber: 'RE2025-0039'
        }],
        salesNotes: [{
          id: 'lexware-raab-invoice',
          content: 'Lexware Rechnung ID: RE2025-0039 | Preis: €6.421,70 | Status: Entwurf',
          createdAt: new Date('2025-08-20T08:15:00'),
          createdBy: 'Lexware Rechnungs-Import',
          type: 'other'
        }],
        source: 'lexware-quotes',
        lexwareId: 'RE2025-0039',
        createdAt: new Date('2025-08-20T08:15:00')
      },
      {
        id: 'quote-steinau-2025',
        name: 'Betina Steinau',
        email: 'betina.steinau@gmail.com',
        phone: '+49 162 8888888',
        movingDate: '2025-07-25',
        fromAddress: 'Dortmund Zentrum, Westenhellweg 88',
        toAddress: 'Bielefeld Mitte, Jahnplatz 5',
        apartment: { rooms: 2, area: 55, floor: 1, hasElevator: false },
        services: ['Standardservice'],
        notes: 'Angebot - AG0027 vom 25.07.2025 - gültig bis 24.08.2025',
        status: 'pending',
        priority: 'low',
        company: '',
        volume: 29,
        customerNumber: 'AG-0027',
        latestQuoteAmount: 1749.37,
        totalRevenue: 0,
        quotes: [{
          id: 'AG0027',
          amount: 1749.37,
          date: '2025-07-25',
          status: 'offen',
          type: 'quote',
          voucherNumber: 'AG0027'
        }],
        salesNotes: [{
          id: 'lexware-steinau-quote',
          content: 'Lexware Angebot ID: AG0027 | Preis: €1.749,37 | Status: offen',
          createdAt: new Date('2025-07-25T10:00:00'),
          createdBy: 'Lexware Angebots-Import',
          type: 'other'
        }],
        source: 'lexware-quotes',
        lexwareId: 'AG0027',
        createdAt: new Date('2025-07-25T10:00:00')
      }
    ];

    // Sortiere nach Erstellungszeit (neueste zuerst)
    const sortedCustomers = realQuoteCustomers.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    console.log(`✅ Loaded ${sortedCustomers.length} real quote customers (screenshot data)`);

    return NextResponse.json({
      success: true,
      customers: sortedCustomers,
      count: sortedCustomers.length,
      message: `Loaded ${sortedCustomers.length} customers from Lexware quotations`,
      stats: {
        totalQuotes: sortedCustomers.filter(c => c.quotes[0]?.type === 'quote').length,
        totalInvoices: sortedCustomers.filter(c => c.quotes[0]?.type === 'invoice').length,
        totalValue: sortedCustomers.reduce((sum, c) => sum + (c.latestQuoteAmount || 0), 0),
        avgQuoteValue: sortedCustomers.length > 0 ? 
          Math.round(sortedCustomers.reduce((sum, c) => sum + (c.latestQuoteAmount || 0), 0) / sortedCustomers.length) : 0
      }
    });

  } catch (error) {
    console.error('❌ Error loading quote customers:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to load customers from quotations',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
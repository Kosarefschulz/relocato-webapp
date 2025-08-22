import { NextRequest, NextResponse } from 'next/server';

const LEXWARE_API_URL = 'https://api.lexware.io/v1';
const LEXWARE_API_KEY = process.env.NEXT_PUBLIC_LEXWARE_API_KEY;

// GET - Hole echte Lexware-Kunden über Server-seitige API
export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Fetching real customers from Lexware API...');

    if (!LEXWARE_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Lexware API key not configured'
      }, { status: 400 });
    }

    // Teste verschiedene Lexware API Endpoints für echte Kunden
    let response;
    let apiEndpoint = '';
    
    // Versuche verschiedene API-Pfade
    const endpointsToTry = [
      '/contacts?role=customer&size=100', // Standard Kunden
      '/contacts?size=100', // Alle Kontakte
      '/customers', // Direkte Kunden-API
      '/contacts?filter=active', // Nur aktive
      '/invoices', // Rechnungen (enthält Kundendaten)
      '/quotations' // Angebote (enthält Kundendaten)
    ];

    for (const endpoint of endpointsToTry) {
      try {
        console.log(`🔍 Trying Lexware API endpoint: ${endpoint}`);
        
        response = await fetch(`${LEXWARE_API_URL}${endpoint}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${LEXWARE_API_KEY}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'Relocato-CRM/1.0'
          }
        });

        console.log(`📡 Response ${endpoint}: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
          apiEndpoint = endpoint;
          break;
        }
      } catch (error) {
        console.log(`❌ Failed ${endpoint}:`, error instanceof Error ? error.message : 'Unknown error');
        continue;
      }
    }

    if (!response || !response.ok) {
      return NextResponse.json({
        success: false,
        error: 'No working Lexware API endpoint found',
        testedEndpoints: endpointsToTry,
        lastStatus: response?.status || 'No response'
      }, { status: 400 });
    }

    console.log(`📡 Lexware API Response: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Lexware API Error: ${response.status}`, errorText);
      
      return NextResponse.json({
        success: false,
        error: `Lexware API Error: ${response.status}`,
        details: errorText,
        apiKey: LEXWARE_API_KEY ? 'Configured' : 'Missing'
      }, { status: response.status });
    }

    const lexwareData = await response.json();
    console.log(`✅ Received ${lexwareData.content?.length || 0} customers from Lexware`);

    // Konvertiere Lexware-Daten zu unserem Format - sortiere nach Erstellungszeit (neueste zuerst)
    const customers = (lexwareData.content || [])
      .sort((a: any, b: any) => {
        // Nutze alle verfügbaren Zeitstempel für präzise Sortierung
        const aTime = new Date(a.updatedDate || a.createdDate || a.lastModified || '1970-01-01').getTime();
        const bTime = new Date(b.updatedDate || b.createdDate || b.lastModified || '1970-01-01').getTime();
        return bTime - aTime; // Neueste Zeit zuerst
      })
      .slice(0, 25) // Nimm die ersten 25 (neuesten)
      .map((lexCustomer: any) => {
        // Besseres Name-Mapping
        let customerName = '';
        
        if (lexCustomer.company?.name) {
          customerName = lexCustomer.company.name;
        } else if (lexCustomer.person) {
          const firstName = lexCustomer.person.firstName || '';
          const lastName = lexCustomer.person.lastName || '';
          const salutation = lexCustomer.person.salutation || '';
          
          if (firstName && lastName) {
            customerName = `${salutation} ${firstName} ${lastName}`.trim();
          } else if (lastName) {
            customerName = `${salutation} ${lastName}`.trim();
          } else if (firstName) {
            customerName = firstName;
          } else {
            customerName = `Kunde #${lexCustomer.roles?.customer?.number || lexCustomer.id.slice(0, 8)}`;
          }
        } else {
          customerName = `Kunde #${lexCustomer.roles?.customer?.number || lexCustomer.id.slice(0, 8)}`;
        }

        // Datum aus Lexware-Daten extrahieren (falls verfügbar)
        const movingDate = lexCustomer.createdAt || 
                          lexCustomer.updatedAt || 
                          new Date().toISOString().split('T')[0];

        return {
          id: `lexware-${lexCustomer.id}`,
          name: customerName,
          email: lexCustomer.emailAddresses?.business?.[0] || 
                 lexCustomer.emailAddresses?.private?.[0] || '',
          phone: lexCustomer.phoneNumbers?.mobile?.[0] || 
                 lexCustomer.phoneNumbers?.business?.[0] || 
                 lexCustomer.phoneNumbers?.private?.[0] || '',
          company: lexCustomer.company?.name || '',
          fromAddress: formatLexwareAddress(lexCustomer.addresses?.billing?.[0]),
          toAddress: '', // Wird bei Umzugsplanung erfasst
          movingDate: movingDate,
          apartment: {
            rooms: 0,
            area: 0,
            floor: 0,
            hasElevator: false
          },
          services: [],
          notes: `Aus Lexware importiert${lexCustomer.note ? ': ' + lexCustomer.note : ''}`,
          status: lexCustomer.archived ? 'cancelled' : 'active',
          priority: 'medium',
          volume: null,
          customerNumber: `LW-${lexCustomer.roles?.customer?.number || lexCustomer.id.slice(0, 8)}`,
          salesNotes: [{
            id: `lexware-import-${lexCustomer.id}`,
            content: `Lexware ID: ${lexCustomer.id}`,
            createdAt: new Date(),
            createdBy: 'Lexware API Import',
            type: 'other'
          }],
          source: 'lexware',
          lexwareId: lexCustomer.id,
          originalData: lexCustomer
        };
      });

    return NextResponse.json({
      success: true,
      customers: customers,
      count: customers.length,
      message: `Successfully loaded ${customers.length} customers from Lexware`
    });

  } catch (error) {
    console.error('❌ Error fetching Lexware customers:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch Lexware customers',
      details: error instanceof Error ? error.message : 'Unknown error',
      suggestion: 'Check API key and network connectivity'
    }, { status: 500 });
  }
}

// POST - Teste Lexware API Verbindung
export async function POST(request: NextRequest) {
  try {
    const { testConnection } = await request.json();
    
    if (testConnection) {
      console.log('🧪 Testing Lexware API connection...');
      
      if (!LEXWARE_API_KEY) {
        return NextResponse.json({
          success: false,
          error: 'API key missing'
        });
      }

      // Teste Verbindung mit minimaler Anfrage
      const response = await fetch(`${LEXWARE_API_URL}/contacts?size=1`, {
        headers: {
          'Authorization': `Bearer ${LEXWARE_API_KEY}`,
          'Accept': 'application/json'
        }
      });

      return NextResponse.json({
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        apiKeyStatus: LEXWARE_API_KEY ? 'present' : 'missing',
        message: response.ok ? 'Lexware API connection successful' : 'Lexware API connection failed'
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid request' });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Connection test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Hilfsfunktion für Lexware-Adresse
function formatLexwareAddress(address: any): string {
  if (!address) return '';
  
  const parts = [
    address.street,
    address.zip,
    address.city
  ].filter(Boolean);
  
  return parts.join(', ');
}
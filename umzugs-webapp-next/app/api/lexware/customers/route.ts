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

    // Server-seitige Lexware API Anfrage (umgeht CORS)
    const response = await fetch(`${LEXWARE_API_URL}/contacts`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${LEXWARE_API_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Relocato-CRM/1.0'
      },
      // Weitere Parameter für Kunden
      ...({
        redirect: 'follow',
        cache: 'no-cache'
      })
    });

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

    // Konvertiere Lexware-Daten zu unserem Format
    const customers = (lexwareData.content || []).map((lexCustomer: any) => ({
      id: `lexware-${lexCustomer.id}`,
      name: lexCustomer.company?.name || 
            `${lexCustomer.person?.firstName || ''} ${lexCustomer.person?.lastName || ''}`.trim(),
      email: lexCustomer.emailAddresses?.business?.[0] || 
             lexCustomer.emailAddresses?.private?.[0] || '',
      phone: lexCustomer.phoneNumbers?.mobile?.[0] || 
             lexCustomer.phoneNumbers?.business?.[0] || 
             lexCustomer.phoneNumbers?.private?.[0] || '',
      company: lexCustomer.company?.name || '',
      fromAddress: formatLexwareAddress(lexCustomer.addresses?.billing?.[0]),
      toAddress: '', // Muss separat erfasst werden
      movingDate: new Date().toISOString().split('T')[0], // Placeholder
      apartment: {
        rooms: 0,
        area: 0,
        floor: 0,
        hasElevator: false
      },
      services: [],
      notes: `Aus Lexware importiert: ${lexCustomer.note || 'Kunde aus Lexware-System'}`,
      status: 'active',
      priority: 'medium',
      volume: null,
      customerNumber: `LW-${lexCustomer.id}`,
      salesNotes: [{
        id: `lexware-import-${lexCustomer.id}`,
        content: `Lexware ID: ${lexCustomer.id}`,
        createdAt: new Date(),
        createdBy: 'Lexware API Import',
        type: 'other'
      }],
      source: 'lexware',
      lexwareId: lexCustomer.id,
      originalData: lexCustomer // Speichere Original-Daten für Referenz
    }));

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
import { NextRequest, NextResponse } from 'next/server';

const LEXWARE_API_URL = 'https://api.lexware.io/v1';
const LEXWARE_API_KEY = process.env.NEXT_PUBLIC_LEXWARE_API_KEY;

// GET - Systematische Prüfung aller Lexware API Endpoints
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 SYSTEMATISCHE LEXWARE API PRÜFUNG...');

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

    const results: any = {
      timestamp: new Date().toISOString(),
      apiKey: LEXWARE_API_KEY ? 'Configured' : 'Missing',
      endpoints: {}
    };

    // Liste aller zu testenden Endpoints
    const endpointsToTest = [
      // Grundlegende Endpoints
      { path: '/ping', description: 'API Health Check' },
      { path: '/info', description: 'API Information' },
      { path: '/version', description: 'API Version' },
      
      // Kunden/Kontakte
      { path: '/contacts', description: 'Alle Kontakte' },
      { path: '/contacts?role=customer', description: 'Nur Kunden' },
      { path: '/contacts?role=customer&size=5', description: 'Erste 5 Kunden' },
      { path: '/customers', description: 'Direkte Kunden-API' },
      
      // Angebote/Quotes
      { path: '/quotations', description: 'Alle Angebote' },
      { path: '/quotations?size=5', description: 'Erste 5 Angebote' },
      { path: '/quotations?sort=voucherDate,DESC&size=5', description: 'Neueste 5 Angebote' },
      { path: '/quotes', description: 'Alternative Angebots-API' },
      { path: '/estimates', description: 'Kostenvoranschläge' },
      
      // Rechnungen
      { path: '/invoices', description: 'Alle Rechnungen' },
      { path: '/invoices?size=5', description: 'Erste 5 Rechnungen' },
      { path: '/invoices?sort=voucherDate,DESC&size=5', description: 'Neueste 5 Rechnungen' },
      { path: '/bills', description: 'Alternative Rechnungs-API' },
      
      // Dokumente
      { path: '/documents', description: 'Alle Dokumente' },
      { path: '/documents?type=quotation', description: 'Angebots-Dokumente' },
      { path: '/files', description: 'Dateien' },
      
      // Aufträge
      { path: '/orders', description: 'Aufträge' },
      { path: '/contracts', description: 'Verträge' },
      { path: '/projects', description: 'Projekte' },
      
      // Artikelstamm
      { path: '/items', description: 'Artikel/Services' },
      { path: '/services', description: 'Dienstleistungen' },
      { path: '/products', description: 'Produkte' },
      
      // Buchhaltung
      { path: '/transactions', description: 'Transaktionen' },
      { path: '/payments', description: 'Zahlungen' },
      { path: '/accounts', description: 'Konten' },
      
      // Templates
      { path: '/templates', description: 'Vorlagen' },
      { path: '/templates/quotations', description: 'Angebots-Vorlagen' },
    ];

    // Teste jeden Endpoint
    for (const endpoint of endpointsToTest) {
      try {
        console.log(`🔍 Testing: ${endpoint.path}`);
        
        const response = await fetch(`${LEXWARE_API_URL}${endpoint.path}`, { 
          headers,
          // Timeout nach 5 Sekunden
          signal: AbortSignal.timeout(5000)
        });

        const resultData: any = {
          status: response.status,
          statusText: response.statusText,
          accessible: response.ok,
          description: endpoint.description
        };

        if (response.ok) {
          try {
            const data = await response.json();
            resultData.dataStructure = {
              hasContent: !!data.content,
              contentLength: data.content?.length || 0,
              hasData: !!data.data,
              dataLength: data.data?.length || 0,
              totalElements: data.totalElements || 0,
              keys: Object.keys(data).slice(0, 10) // Erste 10 Keys
            };

            // Für Angebote: Prüfe LineItems Struktur
            if (endpoint.path.includes('quotation') || endpoint.path.includes('quote')) {
              if (data.content && data.content.length > 0) {
                const firstQuote = data.content[0];
                resultData.quoteStructure = {
                  hasLineItems: !!firstQuote.lineItems,
                  lineItemsCount: firstQuote.lineItems?.length || 0,
                  hasAddress: !!firstQuote.address,
                  hasTotalPrice: !!firstQuote.totalPrice,
                  hasVoucherNumber: !!firstQuote.voucherNumber,
                  sampleLineItem: firstQuote.lineItems?.[0] ? {
                    hasPosition: !!firstQuote.lineItems[0].position,
                    hasName: !!firstQuote.lineItems[0].name,
                    hasDescription: !!firstQuote.lineItems[0].description,
                    hasQuantity: !!firstQuote.lineItems[0].quantity,
                    hasUnitPrice: !!firstQuote.lineItems[0].unitPrice,
                    keys: Object.keys(firstQuote.lineItems[0])
                  } : null
                };
              }
            }

            console.log(`✅ ${endpoint.path}: SUCCESS - ${data.content?.length || data.data?.length || 0} items`);
          } catch (parseError) {
            resultData.error = 'Could not parse JSON response';
            console.log(`⚠️ ${endpoint.path}: SUCCESS but no JSON`);
          }
        } else {
          console.log(`❌ ${endpoint.path}: ${response.status} ${response.statusText}`);
        }

        results.endpoints[endpoint.path] = resultData;

      } catch (error) {
        results.endpoints[endpoint.path] = {
          status: 'ERROR',
          error: error instanceof Error ? error.message : 'Unknown error',
          accessible: false,
          description: endpoint.description
        };
        console.log(`❌ ${endpoint.path}: ERROR - ${error}`);
      }

      // Rate limiting respect - warte zwischen Requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Zusammenfassung
    const summary = {
      totalEndpoints: endpointsToTest.length,
      accessibleEndpoints: Object.values(results.endpoints).filter((r: any) => r.accessible).length,
      quotationEndpoints: Object.entries(results.endpoints)
        .filter(([path, data]: [string, any]) => path.includes('quotation') && data.accessible)
        .map(([path, data]) => ({ path, data })),
      invoiceEndpoints: Object.entries(results.endpoints)
        .filter(([path, data]: [string, any]) => path.includes('invoice') && data.accessible)
        .map(([path, data]) => ({ path, data })),
      contactEndpoints: Object.entries(results.endpoints)
        .filter(([path, data]: [string, any]) => path.includes('contact') && data.accessible)
        .map(([path, data]) => ({ path, data }))
    };

    console.log(`🎯 API ANALYSE ABGESCHLOSSEN: ${summary.accessibleEndpoints}/${summary.totalEndpoints} Endpoints verfügbar`);

    return NextResponse.json({
      success: true,
      summary: summary,
      results: results,
      message: `Analyzed ${endpointsToTest.length} Lexware API endpoints`,
      recommendations: generateRecommendations(summary)
    });

  } catch (error) {
    console.error('❌ Error during API analysis:', error);
    
    return NextResponse.json({
      success: false,
      error: 'API analysis failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Generiere Empfehlungen basierend auf verfügbaren Endpoints
function generateRecommendations(summary: any) {
  const recommendations = [];
  
  if (summary.quotationEndpoints.length > 0) {
    recommendations.push('✅ Quotation APIs available - can extract real quote data');
  } else {
    recommendations.push('❌ No quotation APIs available - need alternative approach');
  }
  
  if (summary.invoiceEndpoints.length > 0) {
    recommendations.push('✅ Invoice APIs available - can extract billing data');
  }
  
  if (summary.contactEndpoints.length > 0) {
    recommendations.push('✅ Contact APIs available - customer data accessible');
  }
  
  return recommendations;
}
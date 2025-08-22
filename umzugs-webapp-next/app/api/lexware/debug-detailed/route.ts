import { NextRequest, NextResponse } from 'next/server';

const LEXWARE_API_URL = 'https://api.lexware.io/v1';
const LEXWARE_API_KEY = process.env.NEXT_PUBLIC_LEXWARE_API_KEY;

// GET - Detaillierte Debug-Anfragen an Lexware API
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 DETAILLIERTE LEXWARE API DEBUG...');
    console.log('API Key:', LEXWARE_API_KEY ? `${LEXWARE_API_KEY.substring(0, 10)}...` : 'MISSING');
    console.log('Base URL:', LEXWARE_API_URL);

    if (!LEXWARE_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Lexware API key not configured'
      }, { status: 400 });
    }

    const results: any = {
      apiKey: LEXWARE_API_KEY.substring(0, 10) + '...',
      baseUrl: LEXWARE_API_URL,
      tests: []
    };

    // Test 1: Basis Connectivity
    console.log('\n=== TEST 1: BASIS CONNECTIVITY ===');
    try {
      const response = await fetch(`${LEXWARE_API_URL}/ping`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${LEXWARE_API_KEY}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      results.tests.push({
        test: 'Ping Test',
        url: `${LEXWARE_API_URL}/ping`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${LEXWARE_API_KEY.substring(0, 10)}...`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        status: response.status,
        statusText: response.statusText,
        success: response.ok
      });

      console.log(`Ping: ${response.status} ${response.statusText}`);
    } catch (error) {
      results.tests.push({
        test: 'Ping Test',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 2: Quotations API - Verschiedene Varianten
    console.log('\n=== TEST 2: QUOTATIONS API ===');
    const quotationTests = [
      '/quotations',
      '/quotations?size=1',
      '/quotations?page=0&size=1',
      '/quotation',
      '/quotes',
      '/estimate',
      '/estimates'
    ];

    for (const endpoint of quotationTests) {
      try {
        console.log(`Testing: ${LEXWARE_API_URL}${endpoint}`);
        
        const response = await fetch(`${LEXWARE_API_URL}${endpoint}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${LEXWARE_API_KEY}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'Relocato-CRM/1.0'
          }
        });

        let responseData = null;
        let responseText = '';

        try {
          responseText = await response.text();
          responseData = JSON.parse(responseText);
        } catch (parseError) {
          responseData = null;
        }

        results.tests.push({
          test: 'Quotations API',
          endpoint: endpoint,
          url: `${LEXWARE_API_URL}${endpoint}`,
          method: 'GET',
          status: response.status,
          statusText: response.statusText,
          success: response.ok,
          responsePreview: responseText.substring(0, 200),
          hasData: !!responseData,
          dataKeys: responseData ? Object.keys(responseData).slice(0, 5) : null,
          contentLength: responseData?.content?.length || 0
        });

        console.log(`${endpoint}: ${response.status} ${response.statusText}`);
        if (response.ok && responseData?.content) {
          console.log(`  -> ${responseData.content.length} items found`);
          if (responseData.content[0]) {
            console.log(`  -> Sample keys:`, Object.keys(responseData.content[0]).slice(0, 5));
          }
        }

      } catch (error) {
        results.tests.push({
          test: 'Quotations API',
          endpoint: endpoint,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        console.log(`${endpoint}: ERROR - ${error}`);
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Test 3: Invoices API
    console.log('\n=== TEST 3: INVOICES API ===');
    const invoiceTests = [
      '/invoices',
      '/invoices?size=1', 
      '/invoice',
      '/bills',
      '/receipts'
    ];

    for (const endpoint of invoiceTests) {
      try {
        console.log(`Testing: ${LEXWARE_API_URL}${endpoint}`);
        
        const response = await fetch(`${LEXWARE_API_URL}${endpoint}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${LEXWARE_API_KEY}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        let responseText = '';
        try {
          responseText = await response.text();
        } catch (e) {
          responseText = 'Could not read response';
        }

        results.tests.push({
          test: 'Invoices API',
          endpoint: endpoint,
          status: response.status,
          statusText: response.statusText,
          success: response.ok,
          responsePreview: responseText.substring(0, 200)
        });

        console.log(`${endpoint}: ${response.status} ${response.statusText}`);

      } catch (error) {
        results.tests.push({
          test: 'Invoices API',
          endpoint: endpoint, 
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Test 4: Alternative Headers
    console.log('\n=== TEST 4: ALTERNATIVE HEADERS ===');
    try {
      const alternativeResponse = await fetch(`${LEXWARE_API_URL}/quotations`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${LEXWARE_API_KEY}`,
          'Accept': '*/*',
          'Content-Type': 'application/json',
          'User-Agent': 'LexwareClient/1.0',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });

      const altText = await alternativeResponse.text();

      results.tests.push({
        test: 'Alternative Headers',
        endpoint: '/quotations',
        status: alternativeResponse.status,
        statusText: alternativeResponse.statusText,
        success: alternativeResponse.ok,
        responsePreview: altText.substring(0, 300),
        headers: {
          'Accept': '*/*',
          'User-Agent': 'LexwareClient/1.0',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });

      console.log(`Alternative Headers: ${alternativeResponse.status} ${alternativeResponse.statusText}`);
      console.log(`Response Preview:`, altText.substring(0, 200));

    } catch (error) {
      results.tests.push({
        test: 'Alternative Headers',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    const summary = {
      totalTests: results.tests.length,
      successfulTests: results.tests.filter((t: any) => t.success).length,
      quotationResults: results.tests.filter((t: any) => t.test === 'Quotations API'),
      invoiceResults: results.tests.filter((t: any) => t.test === 'Invoices API')
    };

    return NextResponse.json({
      success: true,
      apiKey: LEXWARE_API_KEY.substring(0, 15) + '...',
      summary: summary,
      detailedResults: results,
      message: `Tested ${summary.totalTests} API calls with detailed debugging`
    });

  } catch (error) {
    console.error('❌ Error during detailed API analysis:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Detailed API analysis failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
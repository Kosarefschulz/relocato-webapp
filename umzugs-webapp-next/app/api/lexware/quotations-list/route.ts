import { NextRequest, NextResponse } from 'next/server';

const LEXWARE_API_URL = 'https://api.lexware.io/v1';
const LEXWARE_API_KEY = process.env.NEXT_PUBLIC_LEXWARE_API_KEY;

// GET - Alle Angebote über voucherlist (KORREKTE Lexware API)
export async function GET(request: NextRequest) {
  try {
    console.log('📝 Loading quotations via CORRECT Lexware voucherlist API...');

    if (!LEXWARE_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Lexware API key not configured'
      }, { status: 400 });
    }

    // KORREKTE Headers für GET (ohne Content-Type!)
    const headers = {
      'Authorization': `Bearer ${LEXWARE_API_KEY}`,
      'Accept': 'application/json',
      'User-Agent': 'Relocato-CRM/1.0'
    };

    // SCHRITT 1: Lade Angebots-Liste über voucherlist (KORREKTE API)
    console.log('🔍 Step 1: Loading voucher list...');
    const voucherListResponse = await fetch(
      `${LEXWARE_API_URL}/voucherlist?voucherType=quotation&voucherStatus=any&page=0&size=50`, 
      { headers }
    );

    console.log(`📡 Voucherlist API: ${voucherListResponse.status} ${voucherListResponse.statusText}`);

    if (!voucherListResponse.ok) {
      const errorText = await voucherListResponse.text();
      console.error('❌ Voucherlist API Error:', errorText);
      
      return NextResponse.json({
        success: false,
        error: `Voucherlist API Error: ${voucherListResponse.status}`,
        details: errorText,
        correctEndpoint: '/v1/voucherlist?voucherType=quotation&voucherStatus=any'
      }, { status: voucherListResponse.status });
    }

    const voucherData = await voucherListResponse.json();
    console.log(`✅ Found ${voucherData.content?.length || 0} quotations in voucherlist`);

    if (!voucherData.content || voucherData.content.length === 0) {
      return NextResponse.json({
        success: true,
        quotations: [],
        count: 0,
        message: 'No quotations found in voucherlist'
      });
    }

    // SCHRITT 2: Lade Details für jeden Angebot über /quotations/{id}
    console.log('🔍 Step 2: Loading detailed quotation data...');
    const detailedQuotations = [];

    for (const voucher of voucherData.content) { // ALLE Angebote, nicht nur 10
      try {
        console.log(`📋 Loading quotation details: ${voucher.id}`);
        
        // Rate limiting: 1 RPS (konservativ um 429 zu vermeiden)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const quotationResponse = await fetch(
          `${LEXWARE_API_URL}/quotations/${voucher.id}`, 
          { headers }
        );

        if (quotationResponse.ok) {
          const quotationDetail = await quotationResponse.json();
          
          console.log(`✅ Loaded quotation ${voucher.id}: ${quotationDetail.voucherNumber}`);
          
          // Extrahiere Kundendaten aus Angebot
          const customerFromQuote = {
            id: `quote-customer-${voucher.id}`,
            name: quotationDetail.address?.name || 'Unbekannter Kunde',
            email: quotationDetail.address?.emailAddress || '',
            phone: quotationDetail.address?.phoneNumber || '',
            company: quotationDetail.address?.company || '',
            fromAddress: formatAddress(quotationDetail.address),
            toAddress: '',
            movingDate: quotationDetail.voucherDate,
            apartment: { rooms: 0, area: 0, floor: 0, hasElevator: false },
            services: extractServicesFromLineItems(quotationDetail.lineItems),
            notes: `${quotationDetail.introduction || ''} | ${quotationDetail.remark || ''}`,
            status: mapVoucherStatusToCustomerStatus(quotationDetail.voucherStatus),
            priority: (quotationDetail.totalPrice?.grossAmount || 0) > 5000 ? 'high' : 'medium',
            volume: null,
            customerNumber: quotationDetail.voucherNumber,
            // Echte Angebotsdaten
            latestQuoteAmount: quotationDetail.totalPrice?.grossAmount || 0,
            totalRevenue: quotationDetail.voucherStatus === 'open' ? quotationDetail.totalPrice?.grossAmount || 0 : 0,
            quotes: [{
              id: quotationDetail.id,
              amount: quotationDetail.totalPrice?.grossAmount || 0,
              date: quotationDetail.voucherDate,
              status: quotationDetail.voucherStatus,
              type: 'quote',
              voucherNumber: quotationDetail.voucherNumber,
              lineItems: quotationDetail.lineItems || []
            }],
            salesNotes: [{
              id: `quote-import-${quotationDetail.id}`,
              content: `Lexware Angebot ID: ${quotationDetail.id} | Nr: ${quotationDetail.voucherNumber} | Status: ${quotationDetail.voucherStatus}`,
              createdAt: new Date(quotationDetail.voucherDate),
              createdBy: 'Lexware Quotations API',
              type: 'other'
            }],
            source: 'lexware-quotations',
            lexwareId: quotationDetail.id,
            originalQuoteData: quotationDetail,
            createdAt: new Date(quotationDetail.voucherDate)
          };

          detailedQuotations.push(customerFromQuote);
          
        } else {
          console.warn(`⚠️ Could not load quotation ${voucher.id}: ${quotationResponse.status}`);
        }
      } catch (error) {
        console.error(`❌ Error loading quotation ${voucher.id}:`, error);
        continue;
      }
    }

    // Sortiere nach Datum (neueste zuerst)
    detailedQuotations.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    console.log(`✅ Successfully loaded ${detailedQuotations.length} detailed quotations`);

    return NextResponse.json({
      success: true,
      quotations: detailedQuotations,
      count: detailedQuotations.length,
      message: `Loaded ${detailedQuotations.length} real quotations via CORRECT Lexware API`,
      voucherListTotal: voucherData.totalElements,
      stats: {
        totalVouchers: voucherData.totalElements,
        loadedDetails: detailedQuotations.length,
        avgAmount: detailedQuotations.length > 0 ? 
          Math.round(detailedQuotations.reduce((sum, q) => sum + (q.latestQuoteAmount || 0), 0) / detailedQuotations.length) : 0
      }
    });

  } catch (error) {
    console.error('❌ Error loading quotations via correct API:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to load quotations via voucherlist API',
      details: error instanceof Error ? error.message : 'Unknown error',
      apiDocumentation: 'Use /v1/voucherlist?voucherType=quotation&voucherStatus=any then /v1/quotations/{id}'
    }, { status: 500 });
  }
}

// Hilfsfunktionen
function formatAddress(address: any): string {
  if (!address) return '';
  
  const parts = [
    address.street,
    address.zip,
    address.city
  ].filter(Boolean);
  
  return parts.join(', ');
}

function extractServicesFromLineItems(lineItems: any[]): string[] {
  if (!lineItems) return [];
  
  return lineItems.map(item => item.name || item.description || 'Service').slice(0, 5);
}

function mapVoucherStatusToCustomerStatus(voucherStatus: string): string {
  switch (voucherStatus?.toLowerCase()) {
    case 'open':
      return 'pending';
    case 'accepted':
      return 'reached';
    case 'rejected':
      return 'cancelled';
    case 'draft':
      return 'active';
    default:
      return 'active';
  }
}
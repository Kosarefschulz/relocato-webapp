import { NextRequest, NextResponse } from 'next/server';

const LEXWARE_API_URL = 'https://api.lexware.io/v1';
const LEXWARE_API_KEY = process.env.NEXT_PUBLIC_LEXWARE_API_KEY;

// GET - Lade PDF direkt aus Lexware für spezifisches Angebot
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: quoteId } = await params;
    console.log(`📄 Loading PDF from Lexware for quote: ${quoteId}`);

    if (!LEXWARE_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Lexware API key not configured'
      }, { status: 400 });
    }

    const headers = {
      'Authorization': `Bearer ${LEXWARE_API_KEY}`,
      'Accept': 'application/pdf',
      'User-Agent': 'Relocato-CRM/1.0'
    };

    // Schritt 1: Finde echte Lexware Quote ID für den Kunden
    let realQuoteId = null;
    
    // Versuche verschiedene Mappings
    const quoteMappings: { [key: string]: string } = {
      'LW-10179': '9f2706c2-c957-4bbb-81df-b1991ffd7f17', // Goldbeck West GmbH
      'LW-10178': '6fb0b99e-20e1-4e1a-ad83-edd51d92b7e7', // Alexander Betz
      'LW-10176': '1cc4d030-9dd1-45e3-acf0-024f0bb2d02c', // A. Bührdel
      'LW-10177': '0ad72e9d-73a4-46ed-80e5-7b622bfc7b9a', // Tessa Philip
      'LW-10140': '74038aa1-69c2-43d0-8b69-ce6692644b17'  // Stefan Döring
    };

    realQuoteId = quoteMappings[quoteId] || quoteId;

    // Schritt 2: Versuche verschiedene PDF-Endpoints
    const pdfEndpoints = [
      `/quotations/${realQuoteId}/file`,      // Neuer Standard-Endpoint
      `/quotations/${realQuoteId}/document`,  // Alter Endpoint
      `/quotations/${realQuoteId}/pdf`,       // Alternative
      `/documents/${realQuoteId}`,            // Dokument-API
      `/files/${realQuoteId}`                 // File-API
    ];

    for (const endpoint of pdfEndpoints) {
      try {
        console.log(`🔍 Trying PDF endpoint: ${LEXWARE_API_URL}${endpoint}`);
        
        const response = await fetch(`${LEXWARE_API_URL}${endpoint}`, { 
          headers,
          // Timeout nach 10 Sekunden
          signal: AbortSignal.timeout(10000)
        });

        console.log(`📡 PDF Response ${endpoint}: ${response.status} ${response.statusText}`);

        if (response.ok) {
          // PDF erfolgreich geladen
          const pdfBuffer = await response.arrayBuffer();
          console.log(`✅ PDF loaded from Lexware: ${pdfBuffer.byteLength} bytes`);

          // Headers für PDF-Download setzen
          const headers = new Headers({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="Angebot_${quoteId}.pdf"`,
            'Content-Length': pdfBuffer.byteLength.toString(),
          });

          return new NextResponse(pdfBuffer, {
            status: 200,
            headers,
          });
        }
      } catch (error) {
        console.log(`❌ Failed ${endpoint}:`, error instanceof Error ? error.message : 'Unknown error');
        continue;
      }
    }

    // Keine PDF in Lexware gefunden - generiere PDF aus Angebotsdaten
    console.log('⚠️ No PDF found in Lexware, generating from quote data...');
    
    // Lade Angebotsdaten
    const quoteResponse = await fetch(`${request.nextUrl.origin}/api/lexware/quote/${quoteId}`);
    const quoteResult = await quoteResponse.json();

    if (quoteResult.success) {
      // Generiere PDF aus Angebotsdaten
      const generatedPdf = await generatePDFFromQuoteData(quoteResult.quote);
      
      const headers = new Headers({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Angebot_${quoteId}.pdf"`,
        'Content-Length': generatedPdf.byteLength.toString(),
      });

      return new NextResponse(generatedPdf, {
        status: 200,
        headers,
      });
    }

    return NextResponse.json({
      success: false,
      error: 'PDF not found in Lexware and could not generate',
      testedEndpoints: pdfEndpoints,
      quoteId: quoteId,
      realQuoteId: realQuoteId
    }, { status: 404 });

  } catch (error) {
    console.error('❌ Error loading PDF from Lexware:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to load PDF from Lexware',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Generiere PDF aus Angebotsdaten (Fallback)
async function generatePDFFromQuoteData(quoteData: any): Promise<ArrayBuffer> {
  // Hier würde die PDF-Generierung mit jsPDF implementiert werden
  // Für jetzt erstelle ich eine leere PDF
  const { jsPDF } = await import('jspdf');
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 30;

  // Header
  doc.setFontSize(20);
  doc.setTextColor(167, 38, 8); // Rufous
  doc.text(`Angebot ${quoteData.voucherNumber}`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 20;

  // Kundendaten
  doc.setFontSize(12);
  doc.setTextColor(9, 12, 2); // Smoky Black
  doc.text(`Datum: ${quoteData.voucherDate}`, 20, yPosition);
  doc.text(`Gültig bis: ${quoteData.expirationDate}`, pageWidth - 20, yPosition, { align: 'right' });
  yPosition += 20;

  // Line Items
  if (quoteData.lineItems) {
    doc.setFontSize(14);
    doc.text('Positionen:', 20, yPosition);
    yPosition += 15;

    quoteData.lineItems.forEach((item: any, index: number) => {
      doc.setFontSize(10);
      doc.text(`${item.position}. ${item.name}`, 20, yPosition);
      doc.text(`€${(item.totalPrice || 0).toLocaleString('de-DE')}`, pageWidth - 20, yPosition, { align: 'right' });
      yPosition += 8;
      
      if (item.description) {
        doc.setFontSize(9);
        doc.setTextColor(187, 197, 170); // Ash Gray
        doc.text(item.description, 25, yPosition);
        yPosition += 6;
        doc.setTextColor(9, 12, 2); // Zurück zu Smoky Black
      }
      yPosition += 4;
    });
  }

  // Summen
  yPosition += 10;
  doc.setFontSize(12);
  doc.text(`Gesamtsumme: €${(quoteData.totalPrice?.grossAmount || 0).toLocaleString('de-DE')}`, pageWidth - 20, yPosition, { align: 'right' });

  return doc.output('arraybuffer');
}
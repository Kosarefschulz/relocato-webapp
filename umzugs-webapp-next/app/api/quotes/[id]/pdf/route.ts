import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/services/supabase';
import { generateQuotePDF } from '@/lib/services/pdfService';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const quoteId = params.id;
    
    if (!quoteId) {
      return NextResponse.json({ error: 'Quote ID is required' }, { status: 400 });
    }

    console.log(`📄 Generating PDF for quote: ${quoteId}`);

    // Initialize Supabase service
    await supabaseService.initialize();

    // Fetch quote data
    const quote = await supabaseService.getQuote(quoteId);
    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    // Fetch customer data
    const customer = await supabaseService.getCustomer(quote.customerId);
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Generate PDF
    const pdfBlob = await generateQuotePDF(customer, quote, {
      company: quote.company as any,
      includeTerms: true,
      includeSignature: false,
    });

    // Convert blob to buffer
    const buffer = await pdfBlob.arrayBuffer();

    // Set headers for PDF download
    const headers = new Headers({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Angebot_${quoteId.slice(-8).toUpperCase()}.pdf"`,
      'Content-Length': buffer.byteLength.toString(),
    });

    return new NextResponse(buffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('❌ PDF generation failed:', error);
    
    return NextResponse.json(
      { 
        error: 'PDF generation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const quoteId = params.id;
    const body = await request.json();
    
    const { 
      company = 'relocato',
      includeTerms = true,
      includeSignature = false,
      customOptions = {}
    } = body;

    console.log(`📄 Generating custom PDF for quote: ${quoteId}`);

    // Initialize Supabase service
    await supabaseService.initialize();

    // Fetch quote and customer data
    const quote = await supabaseService.getQuote(quoteId);
    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    const customer = await supabaseService.getCustomer(quote.customerId);
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Generate PDF with custom options
    const pdfBlob = await generateQuotePDF(customer, quote, {
      company: company as any,
      includeTerms,
      includeSignature,
      ...customOptions,
    });

    // Convert blob to buffer
    const buffer = await pdfBlob.arrayBuffer();

    // Return PDF as base64 for API consumption
    const base64 = Buffer.from(buffer).toString('base64');

    return NextResponse.json({
      success: true,
      pdf: base64,
      filename: `Angebot_${quoteId.slice(-8).toUpperCase()}.pdf`,
      size: buffer.byteLength,
    });
  } catch (error) {
    console.error('❌ PDF generation failed:', error);
    
    return NextResponse.json(
      { 
        error: 'PDF generation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
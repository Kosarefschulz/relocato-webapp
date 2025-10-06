import * as pdfjsLib from 'pdfjs-dist';

// Worker für PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface ExtractedPdfText {
  fullText: string;
  pageTexts: string[];
}

/**
 * Extrahiere Text aus PDF mit pdf.js (funktioniert für ALLE PDFs!)
 */
export async function extractTextFromPDF(file: File): Promise<ExtractedPdfText> {
  try {
    console.log('📄 Extracting text from PDF with pdf.js...');

    // Lese Datei als ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Lade PDF
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    console.log(`📚 PDF has ${pdf.numPages} pages`);

    const pageTexts: string[] = [];

    // Extrahiere Text von jeder Seite
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();

      // Kombiniere alle Text-Items
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      pageTexts.push(pageText);
      console.log(`📄 Page ${i}: ${pageText.length} chars`);
    }

    const fullText = pageTexts.join('\n\n');
    console.log(`✅ Total extracted text: ${fullText.length} chars`);

    return {
      fullText,
      pageTexts,
    };
  } catch (error: any) {
    console.error('❌ Error extracting PDF text:', error);
    throw new Error(`PDF text extraction failed: ${error.message}`);
  }
}

/**
 * Parse Rümpel Schmiede PDF direkt im Frontend
 */
export async function parseRuempelPdfFrontend(file: File): Promise<any> {
  try {
    // Extrahiere Text
    const { fullText } = await extractTextFromPDF(file);
    console.log('📝 Extracted text:', fullText.substring(0, 500));

    // Jetzt die gleichen Regex-Patterns wie in der Edge Function
    const parsedData: any = {};

    // Angebotsnummer
    const offerMatch = fullText.match(/Angebotsnr\.?:?\s*([A-Z]+\d+)/i);
    if (offerMatch) {
      parsedData.offerNumber = offerMatch[1];
    }

    // Kundennummer
    const customerNumMatch = fullText.match(/Kundennr\.?:?\s*(\d+)/i);
    if (customerNumMatch) {
      parsedData.customerNumber = customerNumMatch[1];
    }

    // Datum
    const dateMatch = fullText.match(/Datum:?\s*(\d{2}\.\d{2}\.\d{4})/i);
    if (dateMatch) {
      parsedData.offerDate = dateMatch[1];
    }

    // Gültig bis
    const validMatch = fullText.match(/gültig\s+bis:?\s*(\d{2}\.\d{2}\.\d{4})/i);
    if (validMatch) {
      parsedData.validUntil = validMatch[1];
    }

    // Kundenadresse
    parsedData.customer = {};

    // Anrede
    const salutationMatch = fullText.match(/Sehr\s+geehrte[rn]?\s+(Frau|Herr)/i);
    if (salutationMatch) {
      parsedData.customer.salutation = salutationMatch[1];
    }

    // Name
    const nameMatch = fullText.match(/Herr\s+([A-ZÄÖÜ][a-zäöüß]+)\s+([A-ZÄÖÜ][a-zäöüß-]+)/i);
    if (nameMatch) {
      parsedData.customer.firstName = nameMatch[1];
      parsedData.customer.lastName = nameMatch[2];
    }

    // Straße
    const streetMatch = fullText.match(/([A-ZÄÖÜ][a-zäöüßA-Z]+(?:straße|str\.|weg))\s+(\d+[A-Z]?)/i);
    if (streetMatch) {
      parsedData.customer.street = `${streetMatch[1]} ${streetMatch[2]}`;
    }

    // PLZ + Ort
    const addressMatch = fullText.match(/(\d{5})\s+([A-ZÄÖÜ][a-zäöüß]+)/);
    if (addressMatch) {
      parsedData.customer.zipCode = addressMatch[1];
      parsedData.customer.city = addressMatch[2];
      parsedData.customer.fullAddress = `${parsedData.customer.street || ''}, ${addressMatch[1]} ${addressMatch[2]}`.trim();
    }

    // Preise
    parsedData.pricing = {};

    // Gesamtbetrag - suche nach allen Preis-Patterns
    const pricePatterns = [
      /Gesamtbetrag\*?\s*(\d{1,3}(?:\.\d{3})*,\d{2})/i,
      /Pauschal\s+\d{1,3}(?:\.\d{3})*,\d{2}\s+(\d{1,3}(?:\.\d{3})*,\d{2})/i,
    ];

    for (const pattern of pricePatterns) {
      const match = fullText.match(pattern);
      if (match && match[1]) {
        const cleanPrice = match[1].replace(/\./g, '').replace(',', '.');
        parsedData.pricing.grossAmount = parseFloat(cleanPrice);
        break;
      }
    }

    // Netto (aus Klammer: "Netto: 1.062,18 €")
    const nettoMatch = fullText.match(/Netto:\s*(\d{1,3}(?:\.\d{3})*,\d{2})/i);
    if (nettoMatch) {
      const cleanNet = nettoMatch[1].replace(/\./g, '').replace(',', '.');
      parsedData.pricing.netAmount = parseFloat(cleanNet);
    }

    // MwSt
    const vatMatch = fullText.match(/USt\s*(\d+)\s*%\s*\((\d{1,3}(?:\.\d{3})*,\d{2})/i);
    if (vatMatch) {
      parsedData.pricing.vatRate = parseInt(vatMatch[1]);
      const cleanVat = vatMatch[2].replace(/\./g, '').replace(',', '.');
      parsedData.pricing.vatAmount = parseFloat(cleanVat);
    }

    // Service
    parsedData.service = {};

    // Leistungstyp (z.B. "Entrümpelung Wohnung im Altenheim - Komplettservice")
    const serviceMatch = fullText.match(/(Entrümpelung|Hausauflösung|Umzug)[^\n]*/i);
    if (serviceMatch) {
      parsedData.service.type = serviceMatch[0].trim();
    }

    // Objektgröße (60 m²)
    const sizeMatch = fullText.match(/(\d+)\s*m²/i);
    if (sizeMatch) {
      parsedData.service.objectSize = `${sizeMatch[1]} m²`;
    }

    parsedData.documentType = 'Angebot';
    parsedData.rawText = fullText.substring(0, 2000);

    console.log('✅ Parsed data:', parsedData);
    return parsedData;
  } catch (error: any) {
    console.error('❌ Frontend PDF parsing failed:', error);
    throw error;
  }
}

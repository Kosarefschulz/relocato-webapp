import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ParsedPDFData {
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  totalPrice?: number
  services: Array<{
    name: string
    description?: string
    price?: number
    quantity?: number
  }>
  invoiceNumber?: string
  date?: string
  rawText: string
}

// Hilfsfunktion zum Extrahieren von Preisen
function extractPrices(text: string): number[] {
  const pricePatterns = [
    /(\d+[.,]\d{2})\s*€/g,
    /€\s*(\d+[.,]\d{2})/g,
    /(\d+[.,]\d{2})\s*EUR/g,
    /Betrag:\s*(\d+[.,]\d{2})/gi,
    /Preis:\s*(\d+[.,]\d{2})/gi,
    /Gesamt:\s*(\d+[.,]\d{2})/gi,
  ]

  const prices: number[] = []

  for (const pattern of pricePatterns) {
    const matches = text.matchAll(pattern)
    for (const match of matches) {
      const priceStr = match[1].replace(',', '.')
      const price = parseFloat(priceStr)
      if (!isNaN(price)) {
        prices.push(price)
      }
    }
  }

  return prices
}

// Hilfsfunktion zum Extrahieren von E-Mail-Adressen
function extractEmails(text: string): string[] {
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
  return text.match(emailPattern) || []
}

// Hilfsfunktion zum Extrahieren von Telefonnummern
function extractPhones(text: string): string[] {
  const phonePatterns = [
    /\+49\s*\d{2,4}\s*\d{3,}\s*\d{3,}/g,
    /0\d{2,4}[\s\/-]?\d{3,}[\s\/-]?\d{3,}/g,
    /Tel\.?:?\s*(\+49\s*\d{2,4}\s*\d{3,}\s*\d{3,})/gi,
    /Telefon:?\s*(\+49\s*\d{2,4}\s*\d{3,}\s*\d{3,})/gi,
  ]

  const phones: string[] = []

  for (const pattern of phonePatterns) {
    const matches = text.matchAll(pattern)
    for (const match of matches) {
      phones.push(match[0].replace(/Tel\.?:?\s*/gi, '').replace(/Telefon:?\s*/gi, ''))
    }
  }

  return phones
}

// Hilfsfunktion zum Extrahieren von Rechnungsnummern
function extractInvoiceNumber(text: string): string | undefined {
  const invoicePatterns = [
    /Rechnungs[-\s]?Nr\.?:?\s*(\d+)/gi,
    /Rechnung\s+Nr\.?:?\s*(\d+)/gi,
    /Invoice\s+No\.?:?\s*(\d+)/gi,
    /R-(\d+)/g,
  ]

  for (const pattern of invoicePatterns) {
    const match = text.match(pattern)
    if (match) {
      return match[1] || match[0]
    }
  }

  return undefined
}

// Hilfsfunktion zum Extrahieren von Datumsangaben
function extractDate(text: string): string | undefined {
  const datePatterns = [
    /Datum:?\s*(\d{1,2}\.\d{1,2}\.\d{2,4})/gi,
    /(\d{1,2}\.\d{1,2}\.\d{2,4})/g,
    /(\d{4}-\d{2}-\d{2})/g,
  ]

  for (const pattern of datePatterns) {
    const match = text.match(pattern)
    if (match) {
      return match[1] || match[0]
    }
  }

  return undefined
}

// Hilfsfunktion zum Extrahieren von Leistungen
function extractServices(text: string): Array<{ name: string; description?: string; price?: number; quantity?: number }> {
  const services: Array<{ name: string; description?: string; price?: number; quantity?: number }> = []

  // Suche nach Leistungsbeschreibungen
  const servicePatterns = [
    /Leistung[en]?:?\s*([^\n]+)/gi,
    /Pos\.\s*\d+\s*([^\n]+?)\s*(\d+[.,]\d{2})\s*€/gi,
    /(\d+)x\s+([^\n]+?)\s*(\d+[.,]\d{2})\s*€/gi,
  ]

  // Beispiel-Leistungen für Umzugsfirma
  const commonServices = [
    'Umzugsservice',
    'Transportservice',
    'Verpackungsmaterial',
    'Möbelmontage',
    'Einpackservice',
    'Auspackhilfe',
    'LKW-Miete',
    'Halteverbotsschilder',
    'Versicherung',
  ]

  // Durchsuche Text nach bekannten Leistungen
  for (const service of commonServices) {
    const serviceRegex = new RegExp(`${service}[^\n]*?(\\d+[.,]\\d{2})\\s*€`, 'gi')
    const match = text.match(serviceRegex)
    if (match) {
      const priceMatch = match[0].match(/(\d+[.,]\d{2})\s*€/)
      const price = priceMatch ? parseFloat(priceMatch[1].replace(',', '.')) : undefined

      services.push({
        name: service,
        description: match[0],
        price: price,
      })
    }
  }

  // Falls keine spezifischen Leistungen gefunden, versuche allgemeine Extraktion
  if (services.length === 0) {
    const lines = text.split('\n')
    let inServiceSection = false

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()

      // Prüfe ob wir in einem Leistungsbereich sind
      if (line.match(/Leistung|Position|Beschreibung/i)) {
        inServiceSection = true
        continue
      }

      if (inServiceSection && line.length > 0) {
        const priceMatch = line.match(/(\d+[.,]\d{2})\s*€/)
        if (priceMatch) {
          const price = parseFloat(priceMatch[1].replace(',', '.'))
          const serviceName = line.replace(/(\d+[.,]\d{2})\s*€.*/, '').trim()

          if (serviceName.length > 3) {
            services.push({
              name: serviceName,
              price: price,
            })
          }
        }
      }

      // Beende Servicebereich bei bestimmten Schlüsselwörtern
      if (line.match(/Summe|Gesamt|Total/i)) {
        inServiceSection = false
      }
    }
  }

  return services
}

// Hauptfunktion zum Parsen der PDF
async function parsePDF(pdfBase64: string): Promise<ParsedPDFData> {
  try {
    // PDF.js für Deno
    const pdfData = Uint8Array.from(atob(pdfBase64), c => c.charCodeAt(0))

    // Extrahiere Text aus PDF (vereinfachte Version - für Produktion würde man pdf.js nutzen)
    // Hier verwenden wir eine einfache Text-Extraktion
    const textDecoder = new TextDecoder()
    let rawText = textDecoder.decode(pdfData)

    // Bereinige Text von PDF-Metadaten
    rawText = rawText.replace(/\/[A-Z][a-zA-Z]+/g, ' ')
    rawText = rawText.replace(/[<>]/g, ' ')
    rawText = rawText.replace(/\s+/g, ' ')

    console.log('📄 Extracted text from PDF (first 500 chars):', rawText.substring(0, 500))

    // Extrahiere Daten
    const emails = extractEmails(rawText)
    const phones = extractPhones(rawText)
    const prices = extractPrices(rawText)
    const services = extractServices(rawText)
    const invoiceNumber = extractInvoiceNumber(rawText)
    const date = extractDate(rawText)

    // Gesamtpreis ist normalerweise der höchste Wert
    const totalPrice = prices.length > 0 ? Math.max(...prices) : undefined

    // Versuche Kundennamen zu extrahieren (z.B. nach "Kunde:" oder vor der Adresse)
    let customerName: string | undefined
    const namePatterns = [
      /Kunde:?\s*([^\n]+)/i,
      /Name:?\s*([^\n]+)/i,
      /Herr\/Frau\s+([^\n]+)/i,
    ]

    for (const pattern of namePatterns) {
      const match = rawText.match(pattern)
      if (match && match[1]) {
        customerName = match[1].trim()
        break
      }
    }

    return {
      customerName,
      customerEmail: emails[0],
      customerPhone: phones[0],
      totalPrice,
      services,
      invoiceNumber,
      date,
      rawText: rawText.substring(0, 2000), // Begrenze auf erste 2000 Zeichen
    }
  } catch (error) {
    console.error('❌ Error parsing PDF:', error)
    throw new Error(`PDF parsing failed: ${error.message}`)
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { pdfBase64, customerId } = await req.json()

    if (!pdfBase64) {
      throw new Error('PDF data (base64) is required')
    }

    console.log('📄 Parsing PDF...')
    console.log(`Customer ID: ${customerId || 'Not provided'}`)
    console.log(`PDF size: ${pdfBase64.length} bytes (base64)`)

    // Parse PDF
    const parsedData = await parsePDF(pdfBase64)

    console.log('✅ PDF parsed successfully!')
    console.log('Extracted data:', {
      customerName: parsedData.customerName,
      customerEmail: parsedData.customerEmail,
      totalPrice: parsedData.totalPrice,
      servicesCount: parsedData.services.length,
      invoiceNumber: parsedData.invoiceNumber,
    })

    // Wenn customerId vorhanden, speichere die Daten in Supabase
    if (customerId) {
      // TODO: Hier würde man die Daten mit dem Kunden verknüpfen
      console.log(`🔗 Would associate data with customer ${customerId}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: parsedData,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('❌ Error in parse-pdf function:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: error.stack
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ParsedRuempelOffer {
  // Angebotskopfdaten
  offerNumber?: string        // AG0159
  customerNumber?: string     // 10253
  offerDate?: string          // 01.10.2025
  validUntil?: string         // 31.10.2025

  // Kundenstammdaten
  customer: {
    salutation?: string       // Frau/Herr
    firstName?: string        // Sabine
    lastName?: string         // Schwind
    street?: string           // Birkenkopfstraße 18B
    zipCode?: string          // 34132
    city?: string             // Kassel
    fullAddress?: string
  }

  // Leistungsdetails
  service: {
    type?: string             // Hausauflösung nach Auszug - Komplettservice
    objectSize?: string       // ca. 200 qm
    rooms?: string[]          // [Dachboden, EG, 1. OG, Keller, Schuppen, 2x Garage]
    exceptions?: string[]     // [3x Küche verbleibt, Lampen bleiben, etc.]
    condition?: string        // besenrein
    details?: string
  }

  // Preisdaten
  pricing: {
    netAmount?: number        // 2941.18
    vatRate?: number          // 19
    vatAmount?: number        // 558.82
    grossAmount?: number      // 3500.00
    priceType?: string        // Pauschalpreis
  }

  // Terminierung
  appointments?: Array<{
    date?: string             // 13.10.2025
    time?: string             // 08:30
  }>

  // Zahlungsbedingungen
  payment: {
    timing?: string           // direkt nach Durchführung vor Ort
    methods?: string[]        // [EC-Karte, Bar]
  }

  // Rohdaten
  rawText: string
  documentType?: string       // Angebot/Rechnung/Auftragsbestätigung
}

// ========== EXTRAKTIONSFUNKTIONEN ==========

// Angebotsnummer extrahieren (AG0159)
function extractOfferNumber(text: string): string | undefined {
  const patterns = [
    /Angebotsnr\.?:?\s*([A-Z]+\d+)/gi,
    /Angebot\s+Nr\.?:?\s*([A-Z]+\d+)/gi,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return undefined
}

// Kundennummer extrahieren (10253)
function extractCustomerNumber(text: string): string | undefined {
  const patterns = [
    /Kundennr\.?:?\s*(\d+)/gi,
    /Kunden[-\s]?Nr\.?:?\s*(\d+)/gi,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return undefined
}

// Datumsangaben extrahieren (DD.MM.YYYY)
function extractDates(text: string): { offerDate?: string; validUntil?: string } {
  const dates: { offerDate?: string; validUntil?: string } = {}

  // Angebotsdatum
  const offerDatePattern = /Datum:?\s*(\d{2}\.\d{2}\.\d{4})/i
  const offerMatch = text.match(offerDatePattern)
  if (offerMatch && offerMatch[1]) {
    dates.offerDate = offerMatch[1]
  }

  // Gültigkeitsdatum
  const validityPatterns = [
    /gültig\s+bis:?\s*(\d{2}\.\d{2}\.\d{4})/gi,
    /Gültigkeit:?\s*(\d{2}\.\d{2}\.\d{4})/gi,
  ]

  for (const pattern of validityPatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      dates.validUntil = match[1]
      break
    }
  }

  return dates
}

// Kundenadresse extrahieren
function extractCustomerData(text: string): ParsedRuempelOffer['customer'] {
  const customer: ParsedRuempelOffer['customer'] = {}

  // Anrede
  const salutationMatch = text.match(/Sehr\s+geehrte[rn]?\s+(Frau|Herr|Firma)/i)
  if (salutationMatch) {
    customer.salutation = salutationMatch[1]
  }

  // Name - Suche nach "Herr/Frau [Vorname] [Nachname]" Pattern
  const namePatterns = [
    /Herr\s+([A-ZÄÖÜ][a-zäöüß]+)\s+([A-ZÄÖÜ][a-zäöüß-]+)/i,
    /Frau\s+([A-ZÄÖÜ][a-zäöüß]+)\s+([A-ZÄÖÜ][a-zäöüß-]+)/i,
  ]

  for (const pattern of namePatterns) {
    const match = text.match(pattern)
    if (match) {
      customer.firstName = match[1]
      customer.lastName = match[2]
      break
    }
  }

  // Straße mit Hausnummer (Arminstraße 13, Birkenkopfstraße 18B, etc.)
  const streetPattern = /([A-ZÄÖÜ][a-zäöüßA-Z]+(?:straße|str\.|weg|platz|allee|ring|gasse))\s+(\d+[A-Z]?)/i
  const streetMatch = text.match(streetPattern)
  if (streetMatch) {
    customer.street = `${streetMatch[1]} ${streetMatch[2]}`
  }

  // PLZ und Ort (32756 Detmold)
  const addressPattern = /(\d{5})\s+([A-ZÄÖÜ][a-zäöüß\s-]+?)(?=\s+Angebot|$|\n)/
  const addressMatch = text.match(addressPattern)
  if (addressMatch) {
    customer.zipCode = addressMatch[1]
    customer.city = addressMatch[2].trim()
  }

  // Vollständige Adresse zusammensetzen
  if (customer.street || customer.zipCode || customer.city) {
    customer.fullAddress = [
      customer.street,
      customer.zipCode && customer.city ? `${customer.zipCode} ${customer.city}` : ''
    ].filter(Boolean).join(', ')
  }

  return customer
}

// Leistungsdetails extrahieren
function extractServiceDetails(text: string): ParsedRuempelOffer['service'] {
  const service: ParsedRuempelOffer['service'] = {}

  // Leistungstyp
  const serviceTypePatterns = [
    /Hausauflösung[^\n]*/gi,
    /Entrümpelung[^\n]*/gi,
    /Umzug[^\n]*/gi,
  ]

  for (const pattern of serviceTypePatterns) {
    const match = text.match(pattern)
    if (match) {
      service.type = match[0].trim()
      break
    }
  }

  // Objektgröße
  const sizePattern = /ca\.\s*(\d+)\s*(?:qm|m²|Quadratmeter)/i
  const sizeMatch = text.match(sizePattern)
  if (sizeMatch) {
    service.objectSize = `ca. ${sizeMatch[1]} qm`
  }

  // Räume/Bereiche
  const rooms: string[] = []
  const roomPatterns = [
    /Dachboden/gi,
    /Erdgeschoss|EG/gi,
    /Obergeschoss|OG/gi,
    /\d+\.\s*OG/gi,
    /Keller(?:geschoss)?/gi,
    /Schuppen/gi,
    /Garage/gi,
    /\d+x\s+Garage/gi,
  ]

  for (const pattern of roomPatterns) {
    const matches = text.match(pattern)
    if (matches) {
      matches.forEach(match => {
        if (!rooms.includes(match)) {
          rooms.push(match)
        }
      })
    }
  }

  if (rooms.length > 0) {
    service.rooms = rooms
  }

  // Ausnahmen/Besonderheiten
  const exceptions: string[] = []
  const exceptionPatterns = [
    /Küche\s+verbleibt/gi,
    /Lampen\s+bleiben/gi,
    /Gardinen\s+bleiben/gi,
    /Ausnahme[^\n]*/gi,
  ]

  for (const pattern of exceptionPatterns) {
    const matches = text.match(pattern)
    if (matches) {
      matches.forEach(match => exceptions.push(match.trim()))
    }
  }

  if (exceptions.length > 0) {
    service.exceptions = exceptions
  }

  // Übergabezustand
  if (text.match(/besenrein/i)) {
    service.condition = 'besenrein'
  }

  return service
}

// Preise extrahieren (mit deutscher Formatierung)
function extractPricing(text: string): ParsedRuempelOffer['pricing'] {
  const pricing: ParsedRuempelOffer['pricing'] = {}

  // Bruttobetrag (wichtigster Wert) - Verschiedene Patterns
  const grossPatterns = [
    /Gesamtbetrag\*?\s*(\d{1,3}(?:\.\d{3})*,\d{2})\s*€?/gi,
    /Gesamt\s*€?\s*(\d{1,3}(?:\.\d{3})*,\d{2})/gi,
    /Pauschal\s+(\d{1,3}(?:\.\d{3})*,\d{2})\s+(\d{1,3}(?:\.\d{3})*,\d{2})/gi, // "1 Pauschal 1.264,00 1.264,00"
  ]

  for (const pattern of grossPatterns) {
    const matches = text.matchAll(pattern)
    for (const match of matches) {
      // Bei "Pauschal" Pattern nimm den zweiten Wert (Gesamt)
      const priceStr = match[2] || match[1]
      if (priceStr) {
        const cleanPrice = priceStr.replace(/\./g, '').replace(',', '.')
        const price = parseFloat(cleanPrice)
        if (!isNaN(price) && price > 0) {
          pricing.grossAmount = price
          break
        }
      }
    }
    if (pricing.grossAmount) break
  }

  // MwSt-Extraktion
  const vatPattern = /USt\s*(\d+)\s*%\s*\((\d{1,3}(?:\.\d{3})*,\d{2})\s*€\)/i
  const vatMatch = text.match(vatPattern)
  if (vatMatch) {
    pricing.vatRate = parseInt(vatMatch[1])
    const cleanVat = vatMatch[2].replace(/\./g, '').replace(',', '.')
    pricing.vatAmount = parseFloat(cleanVat)
  }

  // Nettobetrag berechnen oder extrahieren
  if (pricing.grossAmount && pricing.vatAmount) {
    pricing.netAmount = pricing.grossAmount - pricing.vatAmount
  } else {
    const netPattern = /Netto:?\s*(\d{1,3}(?:\.\d{3})*,\d{2})\s*€/gi
    const netMatch = text.match(netPattern)
    if (netMatch && netMatch[1]) {
      const cleanNet = netMatch[1].replace(/\./g, '').replace(',', '.')
      pricing.netAmount = parseFloat(cleanNet)
    }
  }

  // Preistyp
  if (text.match(/Pauschal(?:preis)?/i)) {
    pricing.priceType = 'Pauschalpreis'
  } else if (text.match(/Festpreis/i)) {
    pricing.priceType = 'Festpreis'
  }

  return pricing
}

// Termine extrahieren
function extractAppointments(text: string): ParsedRuempelOffer['appointments'] {
  const appointments: Array<{ date?: string; time?: string }> = []

  // Muster: "13.10.2025 oder 14.10.2025" mit Uhrzeit "8:30 Uhr"
  const datePattern = /(\d{2}\.\d{2}\.\d{4})/g
  const timePattern = /(\d{1,2}:\d{2})\s*Uhr/i

  const dates = text.match(datePattern) || []
  const timeMatch = text.match(timePattern)
  const time = timeMatch ? timeMatch[1] : undefined

  dates.forEach(date => {
    appointments.push({ date, time })
  })

  return appointments.length > 0 ? appointments : undefined
}

// Zahlungsbedingungen extrahieren
function extractPayment(text: string): ParsedRuempelOffer['payment'] {
  const payment: ParsedRuempelOffer['payment'] = {}

  // Zahlungszeitpunkt
  if (text.match(/direkt nach Durchführung/i) || text.match(/vor Ort/i)) {
    payment.timing = 'direkt nach Durchführung vor Ort'
  } else if (text.match(/sofort/i)) {
    payment.timing = 'sofort'
  } else if (text.match(/\d+\s*Tage/i)) {
    const daysMatch = text.match(/(\d+)\s*Tage/i)
    if (daysMatch) {
      payment.timing = `${daysMatch[1]} Tage`
    }
  }

  // Zahlungsarten
  const methods: string[] = []
  if (text.match(/EC[-\s]?Karte/i)) methods.push('EC-Karte')
  if (text.match(/bar(?:zahlung)?/i)) methods.push('Bar')
  if (text.match(/Überweisung/i)) methods.push('Überweisung')
  if (text.match(/PayPal/i)) methods.push('PayPal')

  if (methods.length > 0) {
    payment.methods = methods
  }

  return payment
}

// Dokumenttyp identifizieren
function identifyDocumentType(text: string): string {
  if (text.match(/Angebot/i)) return 'Angebot'
  if (text.match(/Rechnung/i)) return 'Rechnung'
  if (text.match(/Auftragsbestätigung/i)) return 'Auftragsbestätigung'
  return 'Unbekannt'
}

// ========== HAUPTPARSER-FUNKTION ==========

async function parseRuempelPDF(pdfBase64: string): Promise<ParsedRuempelOffer> {
  try {
    // PDF zu Uint8Array konvertieren
    const pdfData = Uint8Array.from(atob(pdfBase64), c => c.charCodeAt(0))

    // Text extrahieren (vereinfacht - in Produktion pdf.js verwenden)
    const textDecoder = new TextDecoder('utf-8', { fatal: false })
    let rawText = textDecoder.decode(pdfData)

    // PDF-Metadaten und Null-Bytes entfernen
    rawText = rawText.replace(/\/[A-Z][a-zA-Z]+/g, ' ')
    rawText = rawText.replace(/[<>]/g, ' ')
    rawText = rawText.replace(/\u0000/g, '') // WICHTIG: Null-Bytes entfernen
    rawText = rawText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '') // Alle Control-Characters
    rawText = rawText.replace(/\s+/g, ' ')
    rawText = rawText.trim()

    console.log('📄 Extracted text (first 1000 chars):', rawText.substring(0, 1000))

    // Daten extrahieren
    const offerNumber = extractOfferNumber(rawText)
    const customerNumber = extractCustomerNumber(rawText)
    const dates = extractDates(rawText)
    const customer = extractCustomerData(rawText)
    const service = extractServiceDetails(rawText)
    const pricing = extractPricing(rawText)
    const appointments = extractAppointments(rawText)
    const payment = extractPayment(rawText)
    const documentType = identifyDocumentType(rawText)

    const result: ParsedRuempelOffer = {
      offerNumber,
      customerNumber,
      offerDate: dates.offerDate,
      validUntil: dates.validUntil,
      customer,
      service,
      pricing,
      appointments,
      payment,
      rawText: rawText.substring(0, 3000), // Erste 3000 Zeichen
      documentType,
    }

    console.log('✅ Parsed Rümpel Schmiede offer:', {
      offerNumber: result.offerNumber,
      customerNumber: result.customerNumber,
      customerName: `${result.customer.firstName} ${result.customer.lastName}`,
      grossAmount: result.pricing.grossAmount,
      documentType: result.documentType,
    })

    return result
  } catch (error) {
    console.error('❌ Error parsing Rümpel Schmiede PDF:', error)
    throw new Error(`PDF parsing failed: ${error.message}`)
  }
}

// ========== SUPABASE EDGE FUNCTION ==========

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

    console.log('📄 Parsing Rümpel Schmiede PDF...')
    console.log(`Customer ID: ${customerId || 'Not provided'}`)

    // Parse PDF
    const parsedData = await parseRuempelPDF(pdfBase64)

    console.log('✅ PDF parsed successfully!')

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
    console.error('❌ Error in parse-pdf-ruempel function:', error)
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

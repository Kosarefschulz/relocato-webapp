import { OpenAIService } from './openaiService';

export interface ImageAnalysisResult {
  type: 'customer_note' | 'calendar_entry' | 'measurement' | 'contact' | 'unknown';
  extractedData: {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    date?: string;
    volume?: number;
    rooms?: number;
    area?: number;
    notes?: string;
    items?: string[];
    measurements?: { item: string; dimensions: string }[];
  };
  confidence: number;
  rawText: string;
  suggestions: string[];
}

export class AIVisionService {
  private openai: OpenAIService;

  constructor(apiKey: string) {
    this.openai = new OpenAIService({
      apiKey,
      model: 'gpt-4-vision-preview',
      maxTokens: 4000
    });
  }

  async analyzeImage(imageBase64: string): Promise<ImageAnalysisResult> {
    try {
      const systemPrompt = `Du bist ein Experte für die Analyse von Umzugsunterlagen. Analysiere das Bild und extrahiere alle relevanten Informationen für ein Umzugsunternehmen.

Identifiziere den Typ des Dokuments:
- customer_note: Handschriftliche Notizen mit Kundendaten
- calendar_entry: Kalendereinträge oder Terminnotizen
- measurement: Raumlisten, Inventarlisten oder Volumenberechnungen
- contact: Visitenkarten oder Kontaktdaten
- unknown: Sonstiges

Extrahiere ALLE sichtbaren Informationen:
- Namen, Telefonnummern (formatiere deutsche Nummern mit +49)
- E-Mail-Adressen
- Adressen (Von/Nach)
- Termine und Daten
- Raumgrößen, Volumen, Quadratmeter
- Inventarlisten
- Besondere Hinweise oder Notizen

Gib die Daten strukturiert zurück.`;

      const userPrompt = `Analysiere dieses Bild und extrahiere alle Informationen die für ein Umzugsunternehmen relevant sein könnten.`;

      const response = await this.openai.generateText(
        userPrompt,
        systemPrompt,
        [{
          type: 'image_url',
          image_url: {
            url: `data:image/jpeg;base64,${imageBase64}`
          }
        }]
      );

      // Parse die Antwort
      const result = this.parseAnalysisResponse(response);
      return result;
    } catch (error) {
      console.error('Fehler bei Bildanalyse:', error);
      throw error;
    }
  }

  private parseAnalysisResponse(response: string): ImageAnalysisResult {
    // Extrahiere Daten aus der KI-Antwort
    const result: ImageAnalysisResult = {
      type: 'unknown',
      extractedData: {},
      confidence: 0.8,
      rawText: response,
      suggestions: []
    };

    // Typ erkennen
    if (response.toLowerCase().includes('kalender') || response.toLowerCase().includes('termin')) {
      result.type = 'calendar_entry';
    } else if (response.toLowerCase().includes('visitenkarte') || response.toLowerCase().includes('kontakt')) {
      result.type = 'contact';
    } else if (response.toLowerCase().includes('raum') || response.toLowerCase().includes('inventar') || response.toLowerCase().includes('m³')) {
      result.type = 'measurement';
    } else if (response.toLowerCase().includes('kunde') || response.toLowerCase().includes('notiz')) {
      result.type = 'customer_note';
    }

    // Name extrahieren
    const nameMatch = response.match(/Name:?\s*([A-Za-zÄÖÜäöüß\s]+?)(?:\n|,|;|$)/i);
    if (nameMatch) {
      result.extractedData.name = nameMatch[1].trim();
    }

    // Telefon extrahieren
    const phoneMatch = response.match(/(?:Tel|Telefon|Handy|Mobil):?\s*([\d\s\-\+\(\)\/]+)/i);
    if (phoneMatch) {
      let phone = phoneMatch[1].trim();
      // Formatiere deutsche Nummern
      if (!phone.startsWith('+') && phone.match(/^0/)) {
        phone = '+49 ' + phone.substring(1);
      }
      result.extractedData.phone = phone;
    }

    // E-Mail extrahieren
    const emailMatch = response.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) {
      result.extractedData.email = emailMatch[1];
    }

    // Adresse extrahieren
    const addressMatch = response.match(/(?:Adresse|Von|Nach):?\s*([^,\n]+(?:,\s*\d{5}\s*[A-Za-zÄÖÜäöüß]+)?)/i);
    if (addressMatch) {
      result.extractedData.address = addressMatch[1].trim();
    }

    // Datum extrahieren
    const dateMatch = response.match(/(\d{1,2}[.\/-]\d{1,2}[.\/-]\d{2,4})/);
    if (dateMatch) {
      result.extractedData.date = dateMatch[1];
    }

    // Volumen extrahieren
    const volumeMatch = response.match(/(\d+)\s*m³/i);
    if (volumeMatch) {
      result.extractedData.volume = parseInt(volumeMatch[1]);
    }

    // Fläche extrahieren
    const areaMatch = response.match(/(\d+)\s*(?:m²|qm)/i);
    if (areaMatch) {
      result.extractedData.area = parseInt(areaMatch[1]);
    }

    // Zimmer extrahieren
    const roomsMatch = response.match(/(\d+)\s*(?:Zimmer|Zi\.)/i);
    if (roomsMatch) {
      result.extractedData.rooms = parseInt(roomsMatch[1]);
    }

    // Vorschläge generieren
    if (result.extractedData.name) {
      result.suggestions.push(`Kunde "${result.extractedData.name}" anlegen oder aktualisieren`);
    }
    if (result.extractedData.date) {
      result.suggestions.push(`Termin für ${result.extractedData.date} eintragen`);
    }
    if (result.extractedData.volume) {
      result.suggestions.push(`Angebot für ${result.extractedData.volume}m³ erstellen`);
    }

    return result;
  }

  async processMultipleImages(images: string[]): Promise<ImageAnalysisResult[]> {
    const results = await Promise.all(
      images.map(image => this.analyzeImage(image))
    );
    return results;
  }
}